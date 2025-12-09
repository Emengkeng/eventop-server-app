import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SolanaPaymentService } from '../scheduler/solana-payment.service';
import { WebhookService } from '../webhook/webhook.service';
import { Connection, PublicKey } from '@solana/web3.js';
import * as crypto from 'crypto';
import * as bs58 from 'bs58';
import * as nacl from 'tweetnacl';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private connection: Connection;

  constructor(
    private prisma: PrismaService,
    private solanaPaymentService: SolanaPaymentService,
    private webhookService: WebhookService,
  ) {
    const rpcUrl =
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async createCheckoutSession(params: {
    merchantWallet: string;
    planId: string;
    customerEmail: string;
    customerId?: string;
    successUrl: string;
    cancelUrl?: string;
    metadata?: Record<string, any>;
  }) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { walletAddress: params.merchantWallet },
    });

    if (!merchant) {
      throw new BadRequestException('Merchant not found');
    }

    const plan = await this.prisma.merchantPlan.findFirst({
      where: {
        merchantWallet: params.merchantWallet,
        planId: params.planId,
        isActive: true,
      },
    });

    if (!plan) {
      throw new BadRequestException('Plan not found or inactive');
    }

    const sessionId = `session_${crypto.randomBytes(16).toString('hex')}`;

    const session = await this.prisma.checkoutSession.create({
      data: {
        sessionId,
        merchantWallet: params.merchantWallet,
        planPda: plan.planPda,
        planId: params.planId,
        customerEmail: params.customerEmail,
        customerId: params.customerId,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        metadata: params.metadata || {},
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const checkoutBaseUrl =
      process.env.CHECKOUT_BASE_URL || 'https://checkout.eventop.xyz';

    return {
      sessionId: session.sessionId,
      url: `${checkoutBaseUrl}/${session.sessionId}`,
      expiresAt: session.expiresAt,
    };
  }

  async getCheckoutSession(sessionId: string) {
    const session = await this.prisma.checkoutSession.findUnique({
      where: { sessionId },
      include: {
        merchant: {
          select: {
            walletAddress: true,
            companyName: true,
            logoUrl: true,
          },
        },
        plan: {
          select: {
            planPda: true,
            planId: true,
            planName: true,
            feeAmount: true,
            paymentInterval: true,
            description: true,
          },
        },
      },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException('Session expired');
    }

    return {
      sessionId: session.sessionId,
      status: session.status,
      merchant: session.merchant,
      plan: session.plan,
      customerEmail: session.customerEmail,
      customerId: session.customerId,
      successUrl: session.successUrl,
      cancelUrl: session.cancelUrl,
      metadata: session.metadata,
      expiresAt: session.expiresAt,
      subscriptionPda: session.subscriptionPda,
    };
  }

  /**
   * SECURE CHECKOUT COMPLETION
   *
   * This is the critical security endpoint. It must verify:
   * 1. Transaction is real and succeeded on Solana
   * 2. Subscription account exists on-chain with correct data
   * 3. No duplicate usage of subscription PDA
   * 4. Wallet ownership proof (signature verification)
   */
  async completeCheckoutSession(
    sessionId: string,
    data: {
      subscriptionPda: string;
      userWallet: string;
      signature: string;
      message: string; // Format: "eventop-checkout:{sessionId}:{timestamp}"
      walletSignature: string; // User's wallet signature of the message
    },
  ) {
    // ============================================
    // PHASE 1: SESSION VALIDATION
    // ============================================
    const session = await this.prisma.checkoutSession.findUnique({
      where: { sessionId },
      include: {
        plan: true,
        merchant: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (session.status !== 'pending') {
      throw new BadRequestException(
        `Session already processed with status: ${session.status}`,
      );
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException('Session expired');
    }

    // ============================================
    // PHASE 2: WALLET OWNERSHIP VERIFICATION
    // ============================================
    try {
      // Parse and verify message format
      const [prefix, msgSessionId, timestampStr] = data.message.split(':');

      if (prefix !== 'eventop-checkout' || msgSessionId !== sessionId) {
        throw new BadRequestException(
          'Invalid message format or session ID mismatch',
        );
      }

      // Verify message is recent (within 5 minutes)
      const timestamp = parseInt(timestampStr);
      if (isNaN(timestamp) || Date.now() - timestamp > 5 * 60 * 1000) {
        throw new BadRequestException('Message expired or invalid');
      }

      // Verify wallet signature
      const messageBytes = new TextEncoder().encode(data.message);
      const signatureBytes = bs58.decode(data.walletSignature);
      const publicKey = new PublicKey(data.userWallet);

      const isValidSignature = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes(),
      );

      if (!isValidSignature) {
        throw new BadRequestException(
          'Invalid wallet signature - wallet ownership not proven',
        );
      }

      this.logger.log(`✓ Wallet ownership verified: ${data.userWallet}`);
    } catch (error) {
      this.logger.error('Wallet signature verification failed:', error);
      throw new BadRequestException(
        `Wallet verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // ============================================
    // PHASE 3: TRANSACTION VERIFICATION
    // ============================================
    try {
      const txInfo = await this.connection.getTransaction(data.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });

      if (!txInfo) {
        throw new BadRequestException('Transaction not found on blockchain');
      }

      // Verify transaction succeeded
      if (txInfo.meta?.err) {
        throw new BadRequestException('Transaction failed on-chain');
      }

      // Verify transaction is recent (within 10 minutes)
      if (txInfo.blockTime) {
        const txAge = Date.now() - txInfo.blockTime * 1000;
        if (txAge > 10 * 60 * 1000) {
          throw new BadRequestException('Transaction too old');
        }
      }

      // Verify the transaction involves the correct wallet
      const accountKeys = txInfo.transaction.message.getAccountKeys();
      const involvedAddresses = accountKeys.staticAccountKeys.map((key) =>
        key.toString(),
      );

      if (!involvedAddresses.includes(data.userWallet)) {
        throw new BadRequestException(
          'Transaction does not involve the claimed user wallet',
        );
      }

      this.logger.log(`✓ Transaction verified: ${data.signature}`);
    } catch (error) {
      this.logger.error('Transaction verification failed:', error);
      throw new BadRequestException(
        `Transaction verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // ============================================
    // PHASE 4: ON-CHAIN SUBSCRIPTION VERIFICATION
    // ============================================
    try {
      const subscriptionDetails =
        await this.solanaPaymentService.getSubscriptionDetails(
          data.subscriptionPda,
        );

      if (!subscriptionDetails) {
        throw new BadRequestException('Subscription not found on blockchain');
      }

      // CRITICAL: Verify merchant matches
      if (subscriptionDetails.merchant !== session.merchantWallet) {
        this.logger.error(
          `SECURITY ALERT: Merchant mismatch! Expected: ${session.merchantWallet}, Got: ${subscriptionDetails.merchant}`,
        );
        throw new BadRequestException('Security violation: merchant mismatch');
      }

      // CRITICAL: Verify plan matches
      if (subscriptionDetails.merchantPlan !== session.planPda) {
        this.logger.error(
          `SECURITY ALERT: Plan mismatch! Expected: ${session.planPda}, Got: ${subscriptionDetails.merchantPlan}`,
        );
        throw new BadRequestException('Security violation: plan mismatch');
      }

      // Verify subscription is active
      if (!subscriptionDetails.isActive) {
        throw new BadRequestException('Subscription is not active');
      }

      // Verify fee amount matches
      // if (subscriptionDetails.feeAmount !== session.plan.feeAmount) {
      //   this.logger.error(
      //     `SECURITY ALERT: Fee mismatch! Expected: ${session.plan.feeAmount}, Got: ${subscriptionDetails.feeAmount}`,
      //   );
      //   throw new BadRequestException(
      //     'Security violation: fee amount mismatch',
      //   );
      // }

      this.logger.log(
        `✓ Subscription verified on-chain: ${data.subscriptionPda}`,
      );
    } catch (error) {
      this.logger.error('Subscription verification failed:', error);
      throw new BadRequestException(
        `Subscription verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // ============================================
    // PHASE 5: DUPLICATE PREVENTION
    // ============================================
    const existingSession = await this.prisma.checkoutSession.findFirst({
      where: {
        subscriptionPda: data.subscriptionPda,
        status: 'completed',
      },
    });

    if (existingSession) {
      this.logger.error(
        `SECURITY ALERT: Duplicate subscription PDA usage! PDA: ${data.subscriptionPda}, Previous session: ${existingSession.sessionId}`,
      );
      throw new BadRequestException('This subscription has already been used');
    }

    // Check if this transaction signature was already used
    const existingTx = await this.prisma.checkoutSession.findFirst({
      where: {
        signature: data.signature,
        status: 'completed',
      },
    });

    if (existingTx) {
      this.logger.error(
        `SECURITY ALERT: Duplicate transaction signature! Sig: ${data.signature}`,
      );
      throw new BadRequestException('This transaction has already been used');
    }

    // ============================================
    // PHASE 6: COMPLETE SESSION (All Checks Passed)
    // ============================================
    const updatedSession = await this.prisma.$transaction(async (tx) => {
      // Update session
      const updated = await tx.checkoutSession.update({
        where: { sessionId },
        data: {
          status: 'completed',
          subscriptionPda: data.subscriptionPda,
          userWallet: data.userWallet,
          signature: data.signature,
          completedAt: new Date(),
        },
      });

      // Create user identity
      await tx.userIdentity.upsert({
        where: { walletAddress: data.userWallet },
        create: {
          walletAddress: data.userWallet,
          email: session.customerEmail,
          source: 'checkout',
          emailVerified: false,
        },
        update: {
          email: session.customerEmail,
        },
      });

      // ============================================
      // UPDATE SUBSCRIPTION WITH CUSTOMER DATA
      // Indexer already created the subscription from on-chain event
      // We just enrich it with customer email/ID from checkout session
      // ============================================
      await tx.subscription.update({
        where: { subscriptionPda: data.subscriptionPda },
        data: {
          customerEmail: session.customerEmail,
          customerId: session.customerId,
        },
      });

      return updated;
    });

    this.logger.log(
      `✅ CHECKOUT COMPLETED SECURELY: Session ${sessionId}, Subscription ${data.subscriptionPda}`,
    );

    const dataForWebhook = {
      merchantWallet: session.merchantWallet,
      sessionId: updatedSession.sessionId,
      subscriptionId: data.subscriptionPda,
      customer: {
        email: session.customerEmail,
        customerId: session.customerId || undefined,
        walletAddress: data.userWallet,
      },
      plan: {
        planId: session.planId,
        planName: session.plan.planName,
        amount: parseFloat(session.plan.feeAmount),
        interval: parseFloat(session.plan.paymentInterval),
      },
      metadata: {
        userId: session.customerId || undefined,
        source: 'checkout',
      },
    };
    await this.webhookService.notifySubscriptionCreated(dataForWebhook);

    return {
      sessionId: updatedSession.sessionId,
      status: updatedSession.status,
      subscriptionPda: updatedSession.subscriptionPda,
      successUrl: updatedSession.successUrl,
    };
  }

  async cancelCheckoutSession(sessionId: string) {
    const session = await this.prisma.checkoutSession.update({
      where: { sessionId },
      data: {
        status: 'cancelled',
      },
    });

    return {
      sessionId: session.sessionId,
      status: session.status,
      cancelUrl: session.cancelUrl,
    };
  }
}
