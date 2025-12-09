import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { WebhookService } from '../webhook/webhook.service';
import { SolanaPaymentService } from '../scheduler/solana-payment.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [CheckoutController],
  providers: [
    CheckoutService,
    ApiKeysService,
    WebhookService,
    SolanaPaymentService,
  ],
  exports: [CheckoutService],
})
export class CheckoutModule {}
