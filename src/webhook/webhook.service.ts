import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { firstValueFrom } from 'rxjs';

export interface WebhookPayload {
  event: string;
  timestamp: number;
  data: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async sendWebhook(merchantWallet: string, payload: WebhookPayload) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        merchantWallet,
        isActive: true,
        events: {
          has: payload.event,
        },
      },
    });

    if (endpoints.length === 0) {
      this.logger.warn(
        `No active webhook endpoints for merchant: ${merchantWallet}, event: ${payload.event}`,
      );
      return;
    }

    await Promise.all(
      endpoints.map((endpoint) =>
        this.deliverWebhook(merchantWallet, endpoint, payload),
      ),
    );
  }

  private async deliverWebhook(
    merchantWallet: string,
    endpoint: any,
    payload: WebhookPayload,
  ) {
    const startTime = Date.now();
    const logId = crypto.randomUUID();

    const webhookLog = await this.prisma.webhookLog.create({
      data: {
        id: logId,
        merchantWallet,
        event: payload.event,
        payload: payload as any,
        webhookUrl: endpoint.url,
        status: 'pending',
      },
    });

    try {
      const signature = this.generateSignature(payload, endpoint.secret);

      const response = await firstValueFrom(
        this.httpService.post(endpoint.url, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Timestamp': payload.timestamp.toString(),
            'X-Webhook-Id': logId,
          },
          timeout: 10000,
          validateStatus: (status) => status < 500, // Don't throw on 4xx
        }),
      );

      const deliveryTime = Date.now() - startTime;
      const isSuccess = response.status >= 200 && response.status < 300;

      await this.prisma.webhookLog.update({
        where: { id: logId },
        data: {
          status: isSuccess ? 'success' : 'failed',
          responseStatus: response.status,
          responseBody: JSON.stringify(response.data).substring(0, 1000),
          deliveryTime,
          deliveredAt: new Date(),
        },
      });

      await this.prisma.webhookEndpoint.update({
        where: { id: endpoint.id },
        data: {
          lastSuccess: isSuccess ? new Date() : endpoint.lastSuccess,
          lastFailure: !isSuccess ? new Date() : endpoint.lastFailure,
          totalSuccess: isSuccess ? { increment: 1 } : endpoint.totalSuccess,
          totalFailure: !isSuccess ? { increment: 1 } : endpoint.totalFailure,
        },
      });

      if (isSuccess) {
        this.logger.log(
          `✅ Webhook delivered to ${merchantWallet}: ${payload.event} (${deliveryTime}ms)`,
        );
      } else {
        this.logger.warn(
          `  Webhook returned ${response.status} for ${merchantWallet}: ${payload.event}`,
        );
      }
    } catch (error) {
      const deliveryTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.webhookLog.update({
        where: { id: logId },
        data: {
          status: 'failed',
          errorMessage: errorMessage.substring(0, 500),
          deliveryTime,
          deliveredAt: new Date(),
        },
      });

      await this.prisma.webhookEndpoint.update({
        where: { id: endpoint.id },
        data: {
          lastFailure: new Date(),
          totalFailure: { increment: 1 },
        },
      });

      this.logger.error(
        `   Webhook failed for ${merchantWallet}: ${errorMessage}`,
      );

      if (webhookLog.retryCount < 3) {
        await this.scheduleRetry(logId, merchantWallet, endpoint, payload);
      }
    }
  }

  private async scheduleRetry(
    logId: string,
    merchantWallet: string,
    endpoint: any,
    payload: WebhookPayload,
  ) {
    // Exponential backoff: 1min, 5min, 30min
    const delays = [60000, 300000, 1800000];
    const currentRetry = await this.prisma.webhookLog.findUnique({
      where: { id: logId },
      select: { retryCount: true },
    });

    if (currentRetry && currentRetry.retryCount < delays.length) {
      const delay = delays[currentRetry.retryCount];

      setTimeout(async () => {
        await this.prisma.webhookLog.update({
          where: { id: logId },
          data: { retryCount: { increment: 1 } },
        });

        await this.deliverWebhook(merchantWallet, endpoint, payload);
      }, delay);

      this.logger.log(
        `🔄 Scheduled retry ${currentRetry.retryCount + 1} for webhook ${logId} in ${delay / 1000}s`,
      );
    }
  }

  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  async notifySubscriptionCreated(data: {
    merchantWallet: string;
    sessionId: string;
    subscriptionId: string;
    customer: {
      email: string;
      customerId?: string;
      walletAddress: string;
    };
    plan: {
      planId: string;
      planName: string;
      amount: number;
      interval: number;
    };
    metadata: {
      userId?: string;
      source: string;
    };
  }) {
    await this.sendWebhook(data.merchantWallet, {
      event: 'subscription.created',
      timestamp: Date.now(),
      data: {
        sessionId: data.sessionId,
        subscriptionId: data.subscriptionId,
        customer: {
          email: data.customer.email,
          customerId: data.customer.customerId,
          walletAddress: data.customer.walletAddress,
        },
        plan: {
          planId: data.plan.planId,
          planName: data.plan.planName,
          amount: data.plan.amount,
          interval: data.plan.interval,
        },
        metadata: {
          userId: data.metadata.userId,
          source: data.metadata.source,
        },
      },
    });
  }

  async notifyPaymentExecuted(data: {
    subscriptionPda: string;
    customer: {
      email: string;
      customerId?: string;
      walletAddress: string;
    };
    userWallet: string;
    merchantWallet: string;
    amount: string;
    paymentNumber: number;
    nextPaymentDate: Date;
  }) {
    await this.sendWebhook(data.merchantWallet, {
      event: 'subscription.payment_succeeded',
      timestamp: Date.now(),
      data: {
        subscription_id: data.subscriptionPda,
        customer: {
          email: data.customer.email,
          customerId: data.customer.customerId,
          walletAddress: data.customer.walletAddress,
        },
        userWallet: data.userWallet,
        amount: data.amount,
        paymentNumber: data.paymentNumber,
        nextPaymentDate: data.nextPaymentDate,
      },
    });
  }

  async notifySubscriptionCancelled(data: {
    merchantWallet: string;
    subscriptionId: string;
    customer: {
      email?: string;
      customerId?: string;
      walletAddress: string;
    };
    paymentsMade: number;
  }) {
    await this.sendWebhook(data.merchantWallet, {
      event: 'subscription.cancelled',
      timestamp: Date.now(),
      data: {
        id: data.subscriptionId,
        customer: data.customer,
        paymentsMade: data.paymentsMade,
        cancelledAt: new Date().toISOString(),
      },
    });
  }

  async notifyPaymentFailed(data: {
    subscriptionPda: string;
    customer: {
      email: string;
      walletAddress: string;
    };
    userWallet: string;
    merchantWallet: string;
    amountRequired: string;
    balanceAvailable: string;
    failureCount: number;
  }) {
    await this.sendWebhook(data.merchantWallet, {
      event: 'subscription.payment_failed',
      timestamp: Date.now(),
      data: {
        subscription_id: data.subscriptionPda,
        customer: {
          email: data.customer.email,
          walletAddress: data.customer.walletAddress,
        },
        user_wallet: data.userWallet,
        amount_required: data.amountRequired,
        balance_available: data.balanceAvailable,
        failure_count: data.failureCount,
      },
    });
  }
}
