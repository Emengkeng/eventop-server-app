import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SolanaPaymentService } from '../scheduler/solana-payment.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SolanaPaymentService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
