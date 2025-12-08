import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { APIKEY_ENVIRONMENTS } from '../config';

@Controller('api-keys')
@UseGuards(ApiKeyGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post()
  async createApiKey(@Request() req, @Body() body: { name: string }) {
    const environments = APIKEY_ENVIRONMENTS || 'devnet';
    return this.apiKeysService.createApiKey(
      req.merchant.walletAddress,
      environments,
      body.name,
    );
  }

  @Get()
  async listApiKeys(@Request() req) {
    return this.apiKeysService.listApiKeys(req.merchant.walletAddress);
  }

  @Delete(':id')
  async revokeApiKey(@Request() req, @Param('id') id: string) {
    return this.apiKeysService.revokeApiKey(id, req.merchant.walletAddress);
  }
}
