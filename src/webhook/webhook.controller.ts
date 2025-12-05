import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Controller('webhooks')
export class WebhookController {
  constructor(private prisma: PrismaService) {}

  @Post(':merchantWallet/endpoints')
  async createEndpoint(
    @Param('merchantWallet') merchantWallet: string,
    @Body()
    body: {
      url: string;
      events: string[];
      description?: string;
    },
  ) {
    const secret = crypto.randomBytes(32).toString('hex');

    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        merchantWallet,
        url: body.url,
        secret,
        events: body.events,
        description: body.description,
      },
    });

    return {
      ...endpoint,
      secret, // Return secret only on creation
    };
  }

  @Get(':merchantWallet/endpoints')
  async getEndpoints(@Param('merchantWallet') merchantWallet: string) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { merchantWallet },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        description: true,
        lastSuccess: true,
        lastFailure: true,
        totalSuccess: true,
        totalFailure: true,
        createdAt: true,
        updatedAt: true,
        // Don't return secret in list
      },
    });

    return endpoints;
  }

  @Put(':merchantWallet/endpoints/:endpointId')
  async updateEndpoint(
    @Param('merchantWallet') merchantWallet: string,
    @Param('endpointId') endpointId: string,
    @Body()
    body: {
      url?: string;
      events?: string[];
      isActive?: boolean;
      description?: string;
    },
  ) {
    return this.prisma.webhookEndpoint.update({
      where: { id: endpointId, merchantWallet },
      data: body,
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        description: true,
        lastSuccess: true,
        lastFailure: true,
        totalSuccess: true,
        totalFailure: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Post(':merchantWallet/endpoints/:endpointId/regenerate-secret')
  async regenerateSecret(
    @Param('merchantWallet') merchantWallet: string,
    @Param('endpointId') endpointId: string,
  ) {
    const newSecret = crypto.randomBytes(32).toString('hex');

    const endpoint = await this.prisma.webhookEndpoint.update({
      where: { id: endpointId, merchantWallet },
      data: { secret: newSecret },
    });

    return {
      id: endpoint.id,
      secret: newSecret,
    };
  }

  @Delete(':merchantWallet/endpoints/:endpointId')
  async deleteEndpoint(
    @Param('merchantWallet') merchantWallet: string,
    @Param('endpointId') endpointId: string,
  ) {
    await this.prisma.webhookEndpoint.delete({
      where: { id: endpointId, merchantWallet },
    });

    return { success: true };
  }

  @Get(':merchantWallet/logs')
  async getWebhookLogs(
    @Param('merchantWallet') merchantWallet: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('event') event?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { merchantWallet };
    if (event) where.event = event;
    if (status) where.status = status;

    const [logs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip,
      }),
      this.prisma.webhookLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get(':merchantWallet/logs/:logId')
  async getWebhookLog(
    @Param('merchantWallet') merchantWallet: string,
    @Param('logId') logId: string,
  ) {
    return this.prisma.webhookLog.findFirst({
      where: {
        id: logId,
        merchantWallet,
      },
    });
  }

  @Post(':merchantWallet/logs/:logId/retry')
  async retryWebhook(
    @Param('merchantWallet') merchantWallet: string,
    @Param('logId') logId: string,
  ) {
    const log = await this.prisma.webhookLog.findFirst({
      where: { id: logId, merchantWallet },
    });

    if (!log) {
      throw new Error('Webhook log not found');
    }

    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: {
        merchantWallet,
        url: log.webhookUrl,
      },
    });

    if (!endpoint) {
      throw new Error('Webhook endpoint not found');
    }

    //TODO: Import and inject WebhookService properly in real implementation
    // For now, return a message
    return {
      message: 'Retry scheduled',
      logId: log.id,
    };
  }

  @Get(':merchantWallet/stats')
  async getWebhookStats(@Param('merchantWallet') merchantWallet: string) {
    const [total, successful, failed, last24h] = await Promise.all([
      this.prisma.webhookLog.count({ where: { merchantWallet } }),
      this.prisma.webhookLog.count({
        where: { merchantWallet, status: 'success' },
      }),
      this.prisma.webhookLog.count({
        where: { merchantWallet, status: 'failed' },
      }),
      this.prisma.webhookLog.count({
        where: {
          merchantWallet,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const successRate =
      total > 0 ? ((successful / total) * 100).toFixed(2) : '0';

    return {
      total,
      successful,
      failed,
      last24h,
      successRate: parseFloat(successRate),
    };
  }
}
