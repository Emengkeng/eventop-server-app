import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { RateLimitType } from '../common/rate-limit/rate-limit.config';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';

@Controller('checkout')
@RateLimit(RateLimitType.GENERAL)
export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  @Post('create')
  @UseGuards(ApiKeyGuard)
  async createCheckoutSession(
    @Request() req,
    @Body()
    body: {
      planId: string;
      customerEmail: string;
      customerId?: string;
      successUrl: string;
      cancelUrl?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.checkoutService.createCheckoutSession({
      merchantWallet: req.merchant.walletAddress,
      ...body,
    });
  }

  @Get(':sessionId')
  async getCheckoutSession(@Param('sessionId') sessionId: string) {
    return this.checkoutService.getCheckoutSession(sessionId);
  }

  /**
   * SECURE ENDPOINT: Complete checkout session
   *
   * This endpoint requires proof that:
   * 1. The user owns the wallet (walletSignature)
   * 2. The transaction actually happened (signature verification)
   * 3. The subscription is real and correct (on-chain verification)
   */
  @Post(':sessionId/complete')
  @RateLimit(RateLimitType.STRICT) // Stricter rate limiting
  async completeCheckoutSession(
    @Param('sessionId') sessionId: string,
    @Body()
    body: {
      subscriptionPda: string;
      userWallet: string;
      signature: string;
      message: string;
      walletSignature: string;
    },
  ) {
    // Validate all required fields
    if (
      !body.subscriptionPda ||
      !body.userWallet ||
      !body.signature ||
      !body.message ||
      !body.walletSignature
    ) {
      throw new BadRequestException(
        'Missing required fields: subscriptionPda, userWallet, signature, message, walletSignature',
      );
    }

    return this.checkoutService.completeCheckoutSession(sessionId, body);
  }

  @Post(':sessionId/cancel')
  async cancelCheckoutSession(@Param('sessionId') sessionId: string) {
    return this.checkoutService.cancelCheckoutSession(sessionId);
  }
}
