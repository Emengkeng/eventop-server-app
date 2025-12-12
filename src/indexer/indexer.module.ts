import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { EventParserService } from './event-parser.service';
import { SolanaService } from './solana.service';
import { WebhookService } from '../webhook/webhook.service';
import { CheckoutService } from '../checkout/checkout.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [
    IndexerService,
    EventParserService,
    SolanaService,
    WebhookService,
    CheckoutService,
  ],
  exports: [IndexerService, SolanaService],
})
export class IndexerModule {}
