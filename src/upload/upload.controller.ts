import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { PrivyAuthGuard } from '../auth/privy-auth.guard';
import { RateLimitGuard } from '../common/rate-limit/rate-limit.guard';
import { RateLimitType } from '../common/rate-limit/rate-limit.config';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';

@Controller('upload')
@UseGuards(PrivyAuthGuard, RateLimitGuard)
@RateLimit(RateLimitType.STRICT)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post('merchant/:wallet/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 4 * 1024 * 1024, // 4MB
      },
    }),
  )
  async uploadLogo(
    @Param('wallet') wallet: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadService.uploadMerchantLogo(wallet, file);
  }

  @Delete('merchant/:wallet/logo')
  async deleteLogo(@Param('wallet') wallet: string) {
    await this.uploadService.deleteMerchantLogo(wallet);
    return { message: 'Logo deleted successfully' };
  }
}
