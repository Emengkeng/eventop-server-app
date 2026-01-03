/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { PAYER_SECRET_KEY } from '../config';
import localidl from '../idl/subscription_protocol.json';
import type { SubscriptionProtocol } from '../types/subscription_protocol';
import { PrismaService } from '../prisma/prisma.service';

interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
}

@Injectable()
export class SolanaPaymentService {
  private readonly logger = new Logger(SolanaPaymentService.name);
  private connection: Connection;
  private program: Program<SubscriptionProtocol> | null = null;
  private payerKeypair: Keypair;
  private readonly USDC_MINT = new PublicKey(
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  );
  private readonly PROGRAM_ID = new PublicKey(
    'GPVtSfXPiy8y4SkJrMC3VFyKUmGVhMrRbAp2NhiW1Ds2',
  );

  constructor(private prisma: PrismaService) {
    const rpcUrl =
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });

    try {
      const secretKey = JSON.parse(PAYER_SECRET_KEY || '[]') as number[];
      if (secretKey.length !== 64) {
        throw new Error('Invalid secret key length');
      }
      this.payerKeypair = Keypair.fromSecretKey(new Uint8Array(secretKey));

      this.logger.log(
        `Payment service initialized with payer: ${this.payerKeypair.publicKey.toString()}`,
      );

      this.initializeProgram().catch((error) => {
        this.logger.error('Failed to initialize program:', error);
      });
    } catch (error) {
      this.logger.error('Failed to initialize payer keypair:', error);
      throw error;
    }
  }

  private async initializeProgram(): Promise<void> {
    try {
      const wallet = new Wallet(this.payerKeypair);
      const provider = new AnchorProvider(this.connection, wallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      });

      await provider.connection.getVersion();
      // Use the local IDL instead of fetching
      this.program = new Program(localidl as SubscriptionProtocol, provider);

      this.logger.log(`Program loaded: ${this.PROGRAM_ID.toString()}`);
    } catch (error) {
      this.logger.error('Program initialization failed:', error);
      throw error;
    }
  }

  getProgram(): Program<SubscriptionProtocol> | null {
    return this.program;
  }

  getProgramId(): PublicKey {
    return this.PROGRAM_ID;
  }

  getConnection(): Connection {
    if (!this.connection) {
      throw new Error('Connection not initialized');
    }
    return this.connection;
  }

  /**
   * Execute payment for a subscription
   */
  async executePayment(
    subscriptionPda: string,
    subscriptionWalletPda: string,
    merchantWallet: string,
  ): Promise<PaymentResult> {
    try {
      if (!this.program) {
        throw new Error('Program not initialized');
      }

      if (!subscriptionPda || !subscriptionWalletPda || !merchantWallet) {
        throw new Error('Missing required parameters');
      }

      const subscriptionPubkey = new PublicKey(subscriptionPda);
      const walletPubkey = new PublicKey(subscriptionWalletPda);
      const merchantPubkey = new PublicKey(merchantWallet);

      // Fetch subscription account data
      const subscriptionAccount =
        await this.program.account.subscriptionState.fetch(subscriptionPubkey);

      // Security check: Verify merchant matches
      if (subscriptionAccount.merchant.toString() !== merchantWallet) {
        throw new Error(
          `Merchant mismatch: subscription merchant ${subscriptionAccount.merchant.toString()} != ${merchantWallet}`,
        );
      }

      // Get wallet token account (owned by subscription wallet PDA)
      const walletTokenAccount = await getAssociatedTokenAddress(
        this.USDC_MINT,
        walletPubkey,
        true, // allowOwnerOffCurve = true for PDA
      );

      // Get merchant token account
      const merchantTokenAccount = await getAssociatedTokenAddress(
        this.USDC_MINT,
        merchantPubkey,
      );

      // Get merchant plan PDA from subscription account
      const merchantPlanPda = subscriptionAccount.merchantPlan;

      // Derive protocol config PDA
      const [protocolConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('protocol_config')],
        this.PROGRAM_ID,
      );

      // Fetch protocol config to get treasury address
      const protocolConfig =
        await this.program.account.protocolConfig.fetch(protocolConfigPda);

      // Get protocol treasury token account
      const protocolTreasuryTokenAccount = await getAssociatedTokenAddress(
        this.USDC_MINT,
        protocolConfig.treasury,
      );

      // Build transaction - UPDATED ACCOUNTS
      const tx = await this.program.methods
        .executePaymentFromWallet()
        .accounts({
          // subscriptionState: subscriptionPubkey,
          // subscriptionWallet: walletPubkey,
          merchantPlan: merchantPlanPda,
          // protocolConfig: protocolConfigPda,
          walletTokenAccount: walletTokenAccount,
          merchantTokenAccount: merchantTokenAccount,
          protocolTreasury: protocolTreasuryTokenAccount,
          // yieldVault: null,
          vaultBuffer: null,
          jupiterLending: null,
        })
        .transaction();

      // Add recent blockhash and fee payer
      const { blockhash, lastValidBlockHeight } =
        await this.connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = this.payerKeypair.publicKey;

      // Send and confirm transaction with retries
      const signature = await this.sendTransactionWithRetry(tx);

      this.logger.log(`Payment executed: ${signature}`);

      return {
        success: true,
        signature,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Payment execution failed:', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send transaction with retry logic
   */
  private async sendTransactionWithRetry(
    tx: Transaction,
    maxRetries: number = 3,
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const signature = await sendAndConfirmTransaction(
          this.connection,
          tx,
          [this.payerKeypair],
          {
            commitment: 'confirmed',
            skipPreflight: false,
            maxRetries: 0,
          },
        );

        return signature;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Transaction attempt ${attempt}/${maxRetries} failed: ${lastError.message}`,
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));

          const { blockhash, lastValidBlockHeight } =
            await this.connection.getLatestBlockhash('confirmed');
          tx.recentBlockhash = blockhash;
          tx.lastValidBlockHeight = lastValidBlockHeight;
        }
      }
    }

    throw lastError || new Error('Transaction failed after retries');
  }

  /**
   * Verify subscription is valid and active
   */
  async verifySubscription(subscriptionPda: string): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    try {
      if (!this.program) {
        throw new Error('Program not initialized');
      }

      const subscriptionPubkey = new PublicKey(subscriptionPda);

      //     CORRECT: Use program.account to fetch
      const subscriptionAccount =
        await this.program.account.subscriptionState.fetch(subscriptionPubkey);

      if (!subscriptionAccount.isActive) {
        return { isValid: false, error: 'Subscription is not active' };
      }

      // Check if payment is due
      const currentTime = Math.floor(Date.now() / 1000);
      const lastPaymentTime =
        subscriptionAccount.lastPaymentTimestamp.toNumber();
      const interval = subscriptionAccount.paymentInterval.toNumber();
      const timeSinceLastPayment = currentTime - lastPaymentTime;

      if (timeSinceLastPayment < interval) {
        return {
          isValid: false,
          error: 'Payment not due yet',
        };
      }

      return { isValid: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { isValid: false, error: errorMessage };
    }
  }

  /**
   * Get subscription details
   */
  async getSubscriptionDetails(subscriptionPda: string): Promise<{
    merchant: string;
    merchantPlan: string;
    feeAmount: string;
    lastPaymentTimestamp: string;
    paymentInterval: string;
    isActive: boolean;
  } | null> {
    try {
      if (!this.program) {
        throw new Error('Program not initialized');
      }

      const subscriptionPubkey = new PublicKey(subscriptionPda);

      //     CORRECT: Use program.account to fetch
      const account =
        await this.program.account.subscriptionState.fetch(subscriptionPubkey);

      return {
        merchant: account.merchant.toString(),
        merchantPlan: account.merchantPlan.toString(),
        feeAmount: account.feeAmount.toString(),
        lastPaymentTimestamp: account.lastPaymentTimestamp.toString(),
        paymentInterval: account.paymentInterval.toString(),
        isActive: account.isActive,
      };
    } catch (error) {
      this.logger.error('Failed to fetch subscription details:', error);
      return null;
    }
  }

  /**
   * Get subscription wallet details
   */
  async getSubscriptionWalletDetails(walletPda: string): Promise<{
    owner: string;
    mint: string;
    totalSubscriptions: number;
    totalSpent: string;
    isYieldEnabled: boolean;
  } | null> {
    try {
      if (!this.program) {
        throw new Error('Program not initialized');
      }

      const walletPubkey = new PublicKey(walletPda);

      //     CORRECT: Use program.account to fetch wallet data
      const wallet =
        await this.program.account.subscriptionWallet.fetch(walletPubkey);

      return {
        owner: wallet.owner.toString(),
        mint: wallet.mint.toString(),
        totalSubscriptions: wallet.totalSubscriptions,
        totalSpent: wallet.totalSpent.toString(),
        isYieldEnabled: wallet.isYieldEnabled,
      };
    } catch (error) {
      this.logger.error('Failed to fetch wallet details:', error);
      return null;
    }
  }

  /**
   * Get merchant plan details
   */
  async getMerchantPlanDetails(merchantPlanPda: string): Promise<{
    merchant: string;
    planId: string;
    planName: string;
    feeAmount: string;
    paymentInterval: string;
    isActive: boolean;
    totalSubscribers: number;
  } | null> {
    try {
      if (!this.program) {
        throw new Error('Program not initialized');
      }

      const planPubkey = new PublicKey(merchantPlanPda);

      //     CORRECT: Use program.account to fetch merchant plan data
      const plan = await this.program.account.merchantPlan.fetch(planPubkey);

      return {
        merchant: plan.merchant.toString(),
        planId: plan.planId,
        planName: plan.planName,
        feeAmount: plan.feeAmount.toString(),
        paymentInterval: plan.paymentInterval.toString(),
        isActive: plan.isActive,
        totalSubscribers: plan.totalSubscribers,
      };
    } catch (error) {
      this.logger.error('Failed to fetch merchant plan details:', error);
      return null;
    }
  }

  /**
   * Get yield vault state for a specific mint
   */
  async getYieldVault(mint: string) {
    try {
      const mintPubkey = new PublicKey(mint);

      // Derive vault PDA
      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('yield_vault'), mintPubkey.toBuffer()],
        this.getProgramId(),
      );

      // Fetch from on-chain
      const program = this.getProgram();
      if (!program) {
        throw new Error('Program not initialized');
      }

      const vaultData = await program.account.yieldVault.fetch(vaultPDA);

      // Get latest APY from database
      const latestSnapshot = await this.prisma.yieldVaultSnapshot.findFirst({
        where: { vaultPda: vaultPDA.toBase58() },
        orderBy: { timestamp: 'desc' },
      });

      const totalShares = vaultData.totalSharesIssued.toNumber();
      const totalValue = vaultData.totalUsdcDeposited.toNumber() / 1_000_000;
      const exchangeRate = totalShares > 0 ? totalValue / totalShares : 1;

      return {
        vaultPda: vaultPDA.toBase58(),
        mint: mint,
        totalShares: totalShares.toString(),
        totalValue: totalValue.toFixed(6),
        exchangeRate: exchangeRate.toFixed(10),
        annualRate: latestSnapshot?.apy ? parseFloat(latestSnapshot.apy) : 6.2,
        bufferRatio: vaultData.targetBufferBps / 100,
        emergencyMode: vaultData.emergencyMode,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new NotFoundException('Yield vault not found');
    }
  }

  /**
   * Get user's yield position and earnings history
   */
  async getUserYieldData(walletPda: string) {
    try {
      const walletPubkey = new PublicKey(walletPda);

      // Fetch wallet data from on-chain
      const program = this.getProgram();
      if (!program) {
        throw new Error('Program not initialized');
      }

      const walletData =
        await program.account.subscriptionWallet.fetch(walletPubkey);

      // Get vault data to calculate current value
      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('yield_vault'), walletData.mint.toBuffer()],
        this.getProgramId(),
      );

      const vaultData = await program.account.yieldVault.fetch(vaultPDA);

      // Calculate current value
      const userShares = walletData.yieldShares.toNumber();
      const totalShares = vaultData.totalSharesIssued.toNumber();
      const totalValue = vaultData.totalUsdcDeposited.toNumber() / 1_000_000;
      const currentValue =
        totalShares > 0 ? (userShares / totalShares) * totalValue : 0;

      // Get earnings history from database
      const history = await this.prisma.yieldHistory.findMany({
        where: { walletPda },
        orderBy: { date: 'desc' },
        take: 30,
      });

      // Calculate monthly earnings (last 30 days)
      const monthlyEarnings = history.reduce(
        (sum, row) => sum + parseFloat(row.dailyEarnings),
        0,
      );

      // Get first deposit to calculate total earnings
      const firstDeposit = await this.prisma.yieldHistory.findFirst({
        where: { walletPda },
        orderBy: { date: 'asc' },
      });

      const depositedAmount = firstDeposit
        ? parseFloat(firstDeposit.valueInUsdc)
        : currentValue;
      const totalEarnings = Math.max(0, currentValue - depositedAmount);

      return {
        walletPda,
        userWallet: walletData.owner.toBase58(),
        isEnabled: walletData.isYieldEnabled,
        shares: userShares.toString(),
        currentValue: currentValue.toFixed(6),
        depositedAmount: depositedAmount.toFixed(6),
        totalEarnings: totalEarnings.toFixed(6),
        monthlyEarnings: monthlyEarnings.toFixed(6),
        dailyEarnings: history.slice(0, 7).map((row) => ({
          date: row.date.toISOString().split('T')[0],
          amount: parseFloat(row.dailyEarnings).toFixed(6),
        })),
      };
    } catch (error) {
      throw new NotFoundException('User yield data not found');
    }
  }

  /**
   * Get current APY
   */
  async getYieldAPY() {
    const latestSnapshot = await this.prisma.yieldVaultSnapshot.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latestSnapshot) {
      return {
        currentApy: 6.2,
        source: 'default',
        updated: new Date().toISOString(),
      };
    }

    return {
      currentApy: parseFloat(latestSnapshot.apy),
      source: 'calculated',
      updated: latestSnapshot.timestamp.toISOString(),
    };
  }

  /**
   * Get earnings history for a specific period
   */
  async getEarningsHistory(
    walletPda: string,
    startDate?: string,
    endDate?: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
  ) {
    const where: any = { walletPda };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const history = await this.prisma.yieldHistory.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Group by period if needed
    if (period === 'weekly' || period === 'monthly') {
      // TODO: Implement grouping logic
      // For now, return daily data
    }

    return history.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      sharesHeld: row.sharesHeld,
      valueInUsdc: row.valueInUsdc,
      dailyEarnings: row.dailyEarnings,
    }));
  }

  async getVaultPda(walletPda: string): Promise<string> {
    if (!this.program) {
      throw new Error('Program not initialized');
    }

    const walletPubkey = new PublicKey(walletPda);
    const walletData =
      await this.program.account.subscriptionWallet.fetch(walletPubkey);

    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('yield_vault'), walletData.mint.toBuffer()],
      this.getProgramId(),
    );
    return vaultPDA.toString();
  }
}
