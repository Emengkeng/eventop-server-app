import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/client';

interface PlansFilter {
  search?: string;
  category?: string;
  active?: boolean;
}

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async getPlans(filters: PlansFilter = {}) {
    const where: Prisma.MerchantPlanWhereInput = {};

    // Apply active filter
    if (filters.active !== undefined) {
      where.isActive = filters.active;
    }

    // Apply category filter
    if (filters.category) {
      where.category = filters.category;
    }

    // Apply search filter
    if (filters.search) {
      where.OR = [
        { planName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { merchantWallet: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const plans = await this.prisma.merchantPlan.findMany({
      where,
      orderBy: [{ totalSubscribers: 'desc' }, { createdAt: 'desc' }],
      take: 50, // Limit to 50 plans for mobile app
    });

    return plans;
  }

  async getPlanDetail(planPda: string) {
    const plan = await this.prisma.merchantPlan.findUnique({
      where: { planPda },
      include: {
        merchant: {
          select: {
            walletAddress: true,
            companyName: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // Get recent subscribers count (last 30 days)
    const recentSubscribers = await this.prisma.subscription.count({
      where: {
        merchantPlanPda: planPda,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      ...plan,
      recentSubscribers,
    };
  }

  async getMerchantPlans(merchantWallet: string) {
    const plans = await this.prisma.merchantPlan.findMany({
      where: { merchantWallet },
      orderBy: { createdAt: 'desc' },
    });

    return plans;
  }

  async getPopularPlans(limit: number = 10) {
    return this.prisma.merchantPlan.findMany({
      where: { isActive: true },
      orderBy: [{ totalSubscribers: 'desc' }, { totalRevenue: 'desc' }],
      take: limit,
    });
  }

  async getNewPlans(limit: number = 10) {
    return this.prisma.merchantPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPlansByCategory(category: string) {
    return this.prisma.merchantPlan.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: { totalSubscribers: 'desc' },
    });
  }
}
