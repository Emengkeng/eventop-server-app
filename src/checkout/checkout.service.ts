import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(private prisma: PrismaService) {}

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
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
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
   * LIGHTWEIGHT COMPLETION ENDPOINT
   *
   * This endpoint now ONLY links the session to a subscription PDA.
   * All verification happens in the indexer.
   *
   * Benefits:
   * - Instant feedback to client
   * - No duplicate verification
   * - Works as a "hint" for the indexer
   * - If indexer already processed, just returns existing data
   */
  async completeCheckoutSession(sessionId: string) {
    // ============================================
    // BASIC VALIDATION ONLY
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

    if (session.expiresAt < new Date()) {
      throw new BadRequestException('Session expired');
    }

    // If already completed, return existing data
    if (session.status === 'completed') {
      this.logger.log(`Session ${sessionId} already completed`);
      return {
        sessionId: session.sessionId,
        status: session.status,
        subscriptionPda: session.subscriptionPda,
        successUrl: session.successUrl,
        message: 'Session already completed',
      };
    }

    return {
      sessionId: session.sessionId,
      status: 'pending_verification',
      subscriptionPda: session.subscriptionPda,
      successUrl: session.successUrl,
      message: 'Subscription submitted. Verification in progress.',
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

  /**
   * Called by indexer to try to auto-link a subscription to a checkout session
   */
  async tryLinkSubscriptionToSession(params: {
    subscriptionPda: string;
    userWallet: string;
    merchantWallet: string;
    planPda: string;
  }): Promise<{ linked: boolean; sessionId?: string }> {
    try {
      // Look for a matching pending session
      const session = await this.prisma.checkoutSession.findFirst({
        where: {
          merchantWallet: params.merchantWallet,
          planPda: params.planPda,
          status: {
            in: ['pending', 'pending_verification'],
          },
          expiresAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000), // Within last 30 min
          },
        },
        orderBy: {
          createdAt: 'desc', // Get most recent
        },
      });

      if (!session) {
        this.logger.log(
          `No matching session found for subscription ${params.subscriptionPda}`,
        );
        return { linked: false };
      }

      // Check if user identity matches (if available)
      const userIdentity = await this.prisma.userIdentity.findUnique({
        where: { walletAddress: params.userWallet },
      });

      // If we have user identity and session email, they should match
      if (userIdentity && userIdentity.email !== session.customerEmail) {
        this.logger.warn(
          `Email mismatch: Session ${session.sessionId} has ${session.customerEmail}, user has ${userIdentity.email}`,
        );
        // Don't auto-link if emails don't match
        return { linked: false };
      }

      // Link the session
      await this.prisma.checkoutSession.update({
        where: { sessionId: session.sessionId },
        data: {
          status: 'completed',
          subscriptionPda: params.subscriptionPda,
          userWallet: params.userWallet,
          completedAt: new Date(),
        },
      });

      this.logger.log(
        `✅ Auto-linked session ${session.sessionId} to subscription ${params.subscriptionPda}`,
      );

      return { linked: true, sessionId: session.sessionId };
    } catch (error) {
      this.logger.error('Error linking subscription to session:', error);
      return { linked: false };
    }
  }
}
