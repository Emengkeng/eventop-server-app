import { Module } from '@nestjs/common';
import { PaymentSchedulerService } from './payment-scheduler.service';
import { SolanaPaymentService } from './solana-payment.service';
import { YieldSnapshotService } from './yield-snapshot.service';

@Module({
  providers: [
    PaymentSchedulerService,
    SolanaPaymentService,
    YieldSnapshotService,
  ],
  exports: [PaymentSchedulerService, SolanaPaymentService],
})
export class SchedulerModule {}
