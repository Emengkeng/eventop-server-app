import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UTApi } from 'uploadthing/server';
import * as crypto from 'crypto';

@Injectable()
export class UploadService {
  private utapi: UTApi;

  constructor(private prisma: PrismaService) {
    // Initialize UTApi with token from environment
    this.utapi = new UTApi({
      token: process.env.UPLOADTHING_TOKEN,
    });
  }

  /**
   * Extract file key from UploadThing URL
   * Format: https://utfs.io/f/{fileKey}
   */
  private extractFileKeyFromUrl(url: string): string | null {
    const match = url.match(/\/f\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  /**
   * Delete old logo file from UploadThing
   */
  private async deleteOldLogo(oldLogoUrl: string): Promise<void> {
    try {
      const fileKey = this.extractFileKeyFromUrl(oldLogoUrl);
      if (fileKey) {
        await this.utapi.deleteFiles(fileKey);
        console.log(`Deleted old logo: ${fileKey}`);
      }
    } catch (error) {
      console.error('Error deleting old logo:', error);
    }
  }

  /**
   * Upload merchant logo with proper file management
   */
  async uploadMerchantLogo(
    merchantWallet: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { walletAddress: merchantWallet },
      select: { logoUrl: true },
    });

    if (!merchant) {
      throw new BadRequestException('Merchant not found');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
      );
    }

    // Validate file size (4MB max)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 4MB');
    }

    try {
      const timestamp = Date.now();
      const randomHash = crypto.randomBytes(6).toString('hex');
      const extension = file.originalname.split('.').pop() || 'jpg';
      const uniqueFilename = `${merchantWallet}_logo_${timestamp}_${randomHash}.${extension}`;

      const fileBlob = new File([new Uint8Array(file.buffer)], uniqueFilename, {
        type: file.mimetype,
      });

      const uploadResult = await this.utapi.uploadFiles(fileBlob);

      if (uploadResult.error) {
        console.error('UploadThing error:', uploadResult.error);
        throw new BadRequestException(
          uploadResult.error.message || 'Upload failed',
        );
      }

      if (!uploadResult.data) {
        throw new BadRequestException('Upload failed - no data returned');
      }

      const newLogoUrl = uploadResult.data.ufsUrl;
      const fileKey = uploadResult.data.key;

      if (merchant.logoUrl) {
        await this.deleteOldLogo(merchant.logoUrl);
      }

      await this.prisma.merchant.update({
        where: { walletAddress: merchantWallet },
        data: { logoUrl: newLogoUrl },
      });

      return {
        url: newLogoUrl,
        key: fileKey,
      };
    } catch (error) {
      console.error('Error uploading logo:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to upload logo. Please try again.');
    }
  }

  /**
   * Delete merchant logo
   */
  async deleteMerchantLogo(merchantWallet: string): Promise<void> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { walletAddress: merchantWallet },
      select: { logoUrl: true },
    });

    if (!merchant) {
      throw new BadRequestException('Merchant not found');
    }

    if (!merchant.logoUrl) {
      throw new BadRequestException('No logo to delete');
    }

    await this.deleteOldLogo(merchant.logoUrl);

    await this.prisma.merchant.update({
      where: { walletAddress: merchantWallet },
      data: { logoUrl: null },
    });
  }
}
