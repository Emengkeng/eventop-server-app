import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WebhookService } from './webhook.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [HttpModule, PrismaModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
