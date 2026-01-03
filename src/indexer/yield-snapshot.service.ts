import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SolanaService } from './solana.service';
import { PublicKey } from '@solana/web3.js';

@Injectable()
export class YieldSnapshotService {
  private readonly logger = new Logger(YieldSnapshotService.name);

  constructor(
    private prisma: PrismaService,
    private solanaService: SolanaService,
  ) {}

  /**
   * Daily earnings snapshot - runs at midnight UTC
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async snapshotDailyEarnings(): Promise<void> {
    this.logger.log('📸 Running daily earnings snapshot...');

    try {
      // Get all wallets with yield enabled
      const wallets = await this.prisma.subscriptionWallet.findMany({
        where: { isYieldEnabled: true },
      });

      if (wallets.length === 0) {
        this.logger.log('No wallets with yield enabled');
        return;
      }

      const program = this.solanaService.getProgram();
      if (!program) {
        throw new Error('Program not initialized');
      }

      // Process each wallet
      for (const wallet of wallets) {
        try {
          const walletPubkey = new PublicKey(wallet.walletPda);
          const walletData =
            await program.account.subscriptionWallet.fetch(walletPubkey);

          if (!walletData.isYieldEnabled) continue;

          // Get vault data
          const [vaultPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('yield_vault'), walletData.mint.toBuffer()],
            this.solanaService.getProgramId(),
          );

          const vaultData = await program.account.yieldVault.fetch(vaultPDA);

          const userShares = walletData.yieldShares.toNumber();
          const totalShares = vaultData.totalSharesIssued.toNumber();
          const totalValue =
            vaultData.totalUsdcDeposited.toNumber() / 1_000_000;
          const currentValue =
            totalShares > 0 ? (userShares / totalShares) * totalValue : 0;

          // Get yesterday's value
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          const previousRecord = await this.prisma.yieldHistory.findFirst({
            where: {
              walletPda: wallet.walletPda,
              date: yesterday,
            },
          });

          const prevValue = previousRecord
            ? parseFloat(previousRecord.valueInUsdc)
            : currentValue;
          const dailyEarnings = currentValue - prevValue;

          // Insert today's snapshot
          await this.prisma.yieldHistory.upsert({
            where: {
              walletPda_date: {
                walletPda: wallet.walletPda,
                date: new Date(),
              },
            },
            create: {
              walletPda: wallet.walletPda,
              userWallet: wallet.ownerWallet,
              date: new Date(),
              sharesHeld: userShares.toString(),
              valueInUsdc: currentValue.toFixed(6),
              dailyEarnings: dailyEarnings.toFixed(6),
            },
            update: {
              valueInUsdc: currentValue.toFixed(6),
              dailyEarnings: dailyEarnings.toFixed(6),
            },
          });
        } catch (error) {
          this.logger.error(
            `Error processing wallet ${wallet.walletPda}:`,
            error,
          );
        }
      }

      this.logger.log(
        ` Daily earnings snapshot complete (${wallets.length} wallets)`,
      );
    } catch (error) {
      this.logger.error('Error in daily snapshot:', error);
    }
  }

  /**
   * Hourly vault snapshot
   */
  @Cron(CronExpression.EVERY_HOUR)
  async snapshotVaultState(): Promise<void> {
    this.logger.log('📸 Running hourly vault snapshot...');

    try {
      const program = this.solanaService.getProgram();
      if (!program) {
        throw new Error('Program not initialized');
      }

      // Get USDC mint
      const usdcMint = new PublicKey(
        '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      );

      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('yield_vault'), usdcMint.toBuffer()],
        this.solanaService.getProgramId(),
      );

      const vaultData = await program.account.yieldVault.fetch(vaultPDA);

      const totalShares = vaultData.totalSharesIssued.toNumber();
      const totalValue = vaultData.totalUsdcDeposited.toNumber() / 1_000_000;
      const exchangeRate = totalShares > 0 ? totalValue / totalShares : 1;

      // Calculate APY (simplified)
      const previousSnapshot = await this.prisma.yieldVaultSnapshot.findFirst({
        where: { vaultPda: vaultPDA.toBase58() },
        orderBy: { timestamp: 'desc' },
      });

      let apy = 6.2; // Default
      if (previousSnapshot) {
        const prevValue = parseFloat(previousSnapshot.totalValue);
        const hoursDiff =
          (Date.now() - previousSnapshot.timestamp.getTime()) /
          (1000 * 60 * 60);

        if (hoursDiff > 0 && prevValue > 0) {
          const growth = (totalValue - prevValue) / prevValue;
          apy = (growth / hoursDiff) * 8760 * 100; // Annualize
        }
      }

      // Get buffer amount
      const connection = this.solanaService.getConnection();
      const bufferAccount = await connection.getTokenAccountBalance(
        vaultData.usdcBuffer,
      );
      const bufferAmount = parseFloat(
        bufferAccount.value.uiAmountString || '0',
      );

      await this.prisma.yieldVaultSnapshot.create({
        data: {
          vaultPda: vaultPDA.toBase58(),
          mint: usdcMint.toBase58(),
          timestamp: new Date(),
          totalShares: totalShares.toString(),
          totalValue: totalValue.toFixed(6),
          exchangeRate: exchangeRate.toFixed(10),
          apy: apy.toFixed(2),
          bufferAmount: bufferAmount.toFixed(6),
        },
      });

      this.logger.log(' Hourly vault snapshot complete');
    } catch (error) {
      this.logger.error('Error in hourly snapshot:', error);
    }
  }
}
