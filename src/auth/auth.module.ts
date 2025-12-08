import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrivyAuthMiddleware } from './privy-auth.middleware';
import { PrivyAuthGuard } from './privy-auth.guard';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Module({
  imports: [ConfigModule],
  providers: [PrivyAuthMiddleware, PrivyAuthGuard, ApiKeyGuard, ApiKeysService],
  exports: [PrivyAuthMiddleware, PrivyAuthGuard, ApiKeyGuard, ApiKeysService],
})
export class AuthModule {}
