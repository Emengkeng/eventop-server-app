import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { RateLimitType } from '../common/rate-limit/rate-limit.config';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';

@Controller('plans')
@UseGuards(RateLimitGuard)
@RateLimit(RateLimitType.GENERAL)
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  async getPlans(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('active') active?: string,
  ) {
    return this.plansService.getPlans({
      search,
      category,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });
  }

  @Get(':planPda')
  async getPlanDetail(@Param('planPda') planPda: string) {
    return this.plansService.getPlanDetail(planPda);
  }

  @Get('merchant/:wallet')
  async getMerchantPlans(@Param('wallet') wallet: string) {
    return this.plansService.getMerchantPlans(wallet);
  }
}
