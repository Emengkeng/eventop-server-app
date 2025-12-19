import { Module } from '@nestjs/common';
import { MerchantController } from './merchant.controller';
import { MerchantPublicController } from './merchant-public.controller';
import { MerchantService } from './merchant.service';

@Module({
  controllers: [MerchantController, MerchantPublicController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
