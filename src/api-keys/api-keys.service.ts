import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async createApiKey(
    merchantWallet: string,
    environment: 'devnet' | 'mainnet',
    name: string,
  ) {
    const prefix = environment === 'devnet' ? 'sk_test_' : 'sk_live_';
    const randomPart = crypto.randomBytes(32).toString('hex');
    const key = `${prefix}${randomPart}`;

    const apiKey = await this.prisma.apiKey.create({
      data: {
        merchantWallet,
        key,
        name,
        environment,
      },
    });

    return {
      id: apiKey.id,
      key: apiKey.key, // Show key only once
      name: apiKey.name,
      environment: apiKey.environment,
      createdAt: apiKey.createdAt,
    };
  }

  async validateApiKey(key: string): Promise<{
    merchantWallet: string;
    environment: string;
  }> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key, isActive: true },
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key expired');
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      merchantWallet: apiKey.merchantWallet,
      environment: apiKey.environment,
    };
  }

  async listApiKeys(merchantWallet: string) {
    return this.prisma.apiKey.findMany({
      where: { merchantWallet },
      select: {
        id: true,
        name: true,
        environment: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        key: false, // Never return full key in list
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeApiKey(id: string, merchantWallet: string) {
    await this.prisma.apiKey.update({
      where: { id, merchantWallet },
      data: { isActive: false },
    });

    return { success: true };
  }
}
