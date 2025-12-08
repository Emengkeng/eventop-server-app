import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@Controller('checkout')
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

  @Post(':sessionId/complete')
  async completeCheckoutSession(
    @Param('sessionId') sessionId: string,
    @Body()
    body: {
      subscriptionPda: string;
      userWallet: string;
      signature: string;
    },
  ) {
    return this.checkoutService.completeCheckoutSession(sessionId, body);
  }

  @Post(':sessionId/cancel')
  async cancelCheckoutSession(@Param('sessionId') sessionId: string) {
    return this.checkoutService.cancelCheckoutSession(sessionId);
  }
}
