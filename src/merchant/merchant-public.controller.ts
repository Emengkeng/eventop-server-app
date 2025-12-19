import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { RateLimitType } from '../common/rate-limit/rate-limit.config';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import { UseGuards } from '@nestjs/common';

@Controller('merchants/public')
@UseGuards(RateLimitGuard)
@RateLimit(RateLimitType.GENERAL)
export class MerchantPublicController {
  constructor(private merchantService: MerchantService) {}

  @Get(':wallet/info')
  async getPublicInfo(@Param('wallet') wallet: string) {
    return this.merchantService.getPublicInfo(wallet);
  }

  @Post('info/batch')
  async getBatchPublicInfo(@Body() data: { walletAddresses: string[] }) {
    return this.merchantService.getBatchPublicInfo(data.walletAddresses);
  }
}
