import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SolanaService } from '../indexer/solana.service';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private solanaService: SolanaService,
  ) {}

  async getSubscriptionsByUser(userWallet: string) {
    return this.prisma.subscription.findMany({
      where: { userWallet: userWallet },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscriptionsByMerchant(merchantWallet: string) {
    return this.prisma.subscription.findMany({
      where: { merchantWallet },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscriptionDetail(subscriptionPda: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { subscriptionPda },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const transactions = await this.prisma.transaction.findMany({
      where: { subscriptionPda },
      orderBy: { blockTime: 'desc' },
      take: 50,
    });

    return {
      ...subscription,
      transactions,
    };
  }

  async getWalletByOwner(ownerWallet: string) {
    return this.prisma.subscriptionWallet.findFirst({
      where: { ownerWallet },
    });
  }

  async getWalletBalance(walletPda: string) {
    const wallet = await this.prisma.subscriptionWallet.findUnique({
      where: { walletPda },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getSubscriptionStats(userWallet: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userWallet },
    });

    const activeCount = subscriptions.filter((s) => s.isActive).length;
    const totalSpent = subscriptions.reduce(
      (sum, s) => sum + BigInt(s.totalPaid),
      BigInt(0),
    );

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeCount,
      totalSpent: totalSpent.toString(),
      subscriptions,
    };
  }

  async getUpcomingPayments(userWallet: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userWallet, isActive: true },
    });

    return subscriptions
      .map((sub) => {
        const lastPayment = parseInt(sub.lastPaymentTimestamp);
        const interval = parseInt(sub.paymentInterval);
        const nextPayment = lastPayment + interval;

        return {
          subscriptionPda: sub.subscriptionPda,
          merchantWallet: sub.merchantWallet,
          amount: sub.feeAmount,
          nextPaymentDate: new Date(nextPayment * 1000),
          daysUntil: Math.ceil(
            (nextPayment * 1000 - Date.now()) / (1000 * 60 * 60 * 24),
          ),
        };
      })
      .sort(
        (a, b) => a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime(),
      );
  }

  // ============================================
  // YIELD-RELATED METHODS
  // ============================================

  /**
   * Get yield vault state for a specific mint
   */
  async getYieldVault(mint: string) {
    try {
      const mintPubkey = new PublicKey(mint);

      // Derive vault PDA
      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('yield_vault'), mintPubkey.toBuffer()],
        this.solanaService.getProgramId(),
      );

      // Fetch from on-chain
      const program = this.solanaService.getProgram();
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
      const program = this.solanaService.getProgram();
      if (!program) {
        throw new Error('Program not initialized');
      }

      const walletData =
        await program.account.subscriptionWallet.fetch(walletPubkey);

      // Get vault data to calculate current value
      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('yield_vault'), walletData.mint.toBuffer()],
        this.solanaService.getProgramId(),
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
}
