import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { PrismaModule } from './prisma/prisma.module';
import { IndexerModule } from './indexer/indexer.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { MerchantModule } from './merchant/merchant.module';
import { WebhookModule } from './webhook/webhook.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { PlansModule } from './plans/plan.module';
import { CheckoutModule } from './checkout/checkout.module';
import { ApiKeyModule } from './api-keys/api-key.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ScheduleModule.forRoot(),
    IndexerModule,
    SubscriptionModule,
    MerchantModule,
    WebhookModule,
    AnalyticsModule,
    AuthModule,
    RateLimitModule,
    HttpModule,
    PlansModule,
    CheckoutModule,
    ApiKeyModule,
    UploadModule,
  ],
})
export class AppModule {}
