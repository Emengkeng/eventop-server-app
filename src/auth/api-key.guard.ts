import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing API key');
    }

    const apiKey = authHeader.substring(7);

    try {
      const { merchantWallet, environment } =
        await this.apiKeysService.validateApiKey(apiKey);

      request.merchant = {
        walletAddress: merchantWallet,
        environment,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired API key');
    }
  }
}
