import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class CheckoutService {
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

  async completeCheckoutSession(
    sessionId: string,
    data: {
      subscriptionPda: string;
      userWallet: string;
      signature: string;
    },
  ) {
    const session = await this.prisma.checkoutSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (session.status !== 'pending') {
      throw new BadRequestException('Session already completed or cancelled');
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException('Session expired');
    }

    const updatedSession = await this.prisma.checkoutSession.update({
      where: { sessionId },
      data: {
        status: 'completed',
        subscriptionPda: data.subscriptionPda,
        userWallet: data.userWallet,
        signature: data.signature,
        completedAt: new Date(),
      },
    });

    await this.prisma.userIdentity.upsert({
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

    //TODO: Validate that payement was actually executed on-chain
    // TODO: Send webhook to merchant
    // await this.webhookService.notifySubscriptionCreated(...)

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
