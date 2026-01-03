/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { Program, BN, EventParser, Event } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import {
  ProgramEvent,
  SubscriptionWalletCreatedEvent,
  YieldEnabledEvent,
  WalletDepositEvent,
  WalletWithdrawalEvent,
  SubscriptionCreatedEvent,
  PaymentExecutedEvent,
  SubscriptionCancelledEvent,
  YieldClaimedEvent,
  MerchantPlanRegisteredEvent,
  EmergencyModeChangedEvent,
  VaultRebalancedEvent,
  YieldDepositEvent,
  YieldDisabledEvent,
  YieldVaultInitializedEvent,
  YieldWithdrawalEvent,
} from '../types';

@Injectable()
export class EventParserService {
  private eventParser: EventParser | null = null;

  /**
   * Initialize with your Anchor program
   */
  setProgram(program: Program): void {
    this.eventParser = new EventParser(program.programId, program.coder);
  }

  /**
   * Parse transaction logs and extract typed events
   */
  parseTransactionLogs(logs: string[]): ProgramEvent[] {
    const events: ProgramEvent[] = [];

    if (!this.eventParser) {
      console.warn('EventParser not initialized. Call setProgram() first.');
      return events;
    }

    try {
      // Use Anchor's event parser to extract events from logs
      const parsedEvents = this.eventParser.parseLogs(logs);

      for (const event of parsedEvents) {
        const typedEvent = this.mapAnchorEventToTyped(event);
        if (typedEvent) {
          events.push(typedEvent);
        }
      }
    } catch (error) {
      console.error('Error parsing transaction logs:', error);
    }

    return events;
  }

  /**
   * Map Anchor event to our typed event structure
   */
  private mapAnchorEventToTyped(event: Event): ProgramEvent | null {
    try {
      switch (event.name) {
        case 'subscriptionWalletCreated':
          return {
            name: 'SubscriptionWalletCreated',
            data: this.parseSubscriptionWalletCreated(event.data),
          };

        case 'yieldEnabled':
          return {
            name: 'YieldEnabled',
            data: this.parseYieldEnabled(event.data),
          };
        case 'yieldDisabled':
          return {
            name: 'YieldDisabled',
            data: this.parseYieldDisabled(event.data),
          };
        case 'yieldDeposit':
          return {
            name: 'YieldDeposit',
            data: this.parseYieldDeposit(event.data),
          };

        case 'yieldWithdrawal':
          return {
            name: 'YieldWithdrawal',
            data: this.parseYieldWithdrawal(event.data),
          };

        case 'yieldVaultInitialized':
          return {
            name: 'YieldVaultInitialized',
            data: this.parseYieldVaultInitialized(event.data),
          };

        case 'vaultRebalanced':
          return {
            name: 'VaultRebalanced',
            data: this.parseVaultRebalanced(event.data),
          };

        case 'emergencyModeChanged':
          return {
            name: 'EmergencyModeChanged',
            data: this.parseEmergencyModeChanged(event.data),
          };

        case 'walletDeposit':
          return {
            name: 'WalletDeposit',
            data: this.parseWalletDeposit(event.data),
          };

        case 'walletWithdrawal':
          return {
            name: 'WalletWithdrawal',
            data: this.parseWalletWithdrawal(event.data),
          };

        case 'subscriptionCreated':
          return {
            name: 'SubscriptionCreated',
            data: this.parseSubscriptionCreated(event.data),
          };

        case 'paymentExecuted':
          return {
            name: 'PaymentExecuted',
            data: this.parsePaymentExecuted(event.data),
          };

        case 'subscriptionCancelled':
          return {
            name: 'SubscriptionCancelled',
            data: this.parseSubscriptionCancelled(event.data),
          };

        case 'yieldClaimed':
          return {
            name: 'YieldClaimed',
            data: this.parseYieldClaimed(event.data),
          };
        case 'merchantPlanRegistered':
          return {
            name: 'MerchantPlanRegistered',
            data: this.parseMerchantPlanRegistered(event.data),
          };

        default:
          console.warn(`Unknown event type: ${event.name}`);
          return null;
      }
    } catch (error) {
      console.error(`Error mapping event ${event.name}:`, error);
      return null;
    }
  }

  // ============================================
  // EVENT PARSERS
  // ============================================

  private parseSubscriptionWalletCreated(
    data: any,
  ): SubscriptionWalletCreatedEvent {
    return {
      walletPda: new PublicKey(data.walletPda),
      owner: new PublicKey(data.owner),
      mint: new PublicKey(data.mint),
    };
  }

  private parseYieldEnabled(data: any): YieldEnabledEvent {
    return {
      walletPda: new PublicKey(data.walletPda),
      strategy: data.strategy,
      vault: new PublicKey(data.vault),
    };
  }

  private parseWalletDeposit(data: any): WalletDepositEvent {
    return {
      walletPda: new PublicKey(data.walletPda),
      user: new PublicKey(data.user),
      amount: new BN(data.amount),
      depositedToYield: data.depositedToYield,
    };
  }

  private parseWalletWithdrawal(data: any): WalletWithdrawalEvent {
    return {
      walletPda: new PublicKey(data.walletPda),
      user: new PublicKey(data.user),
      amount: new BN(data.amount),
    };
  }

  private parseSubscriptionCreated(data: any): SubscriptionCreatedEvent {
    return {
      subscriptionPda: new PublicKey(data.subscriptionPda),
      user: new PublicKey(data.user),
      wallet: new PublicKey(data.wallet),
      merchant: new PublicKey(data.merchant),
      planId: data.planId,
      sessionToken: data.sessionToken,
    };
  }

  private parsePaymentExecuted(data: any): PaymentExecutedEvent {
    return {
      subscriptionPda: new PublicKey(data.subscriptionPda),
      walletPda: new PublicKey(data.walletPda),
      user: new PublicKey(data.user),
      merchant: new PublicKey(data.merchant),
      amount: new BN(data.amount),
      paymentNumber: data.paymentNumber,
    };
  }

  private parseSubscriptionCancelled(data: any): SubscriptionCancelledEvent {
    return {
      subscriptionPda: new PublicKey(data.subscriptionPda),
      walletPda: new PublicKey(data.walletPda),
      user: new PublicKey(data.user),
      merchant: new PublicKey(data.merchant),
      paymentsMade: data.paymentsMade,
    };
  }

  private parseYieldClaimed(data: any): YieldClaimedEvent {
    return {
      walletPda: new PublicKey(data.walletPda),
      user: new PublicKey(data.user),
      amount: new BN(data.amount),
    };
  }

  private parseMerchantPlanRegistered(data: any): MerchantPlanRegisteredEvent {
    return {
      planPda: new PublicKey(data.planPda),
    };
  }

  private parseYieldDisabled(data: any): YieldDisabledEvent {
    return {
      walletPda: new PublicKey(data.walletPda),
      sharesRedeemed: new BN(data.sharesRedeemed),
      usdcReceived: new BN(data.usdcReceived),
    };
  }

  private parseYieldDeposit(data: any): YieldDepositEvent {
    return {
      walletPda: new PublicKey(data.walletPda),
      sharesIssued: new BN(data.sharesIssued),
      usdcAmount: new BN(data.usdcAmount),
    };
  }

  private parseYieldWithdrawal(data: any): YieldWithdrawalEvent {
    return {
      walletPda: new PublicKey(data.walletPda),
      sharesRedeemed: new BN(data.sharesRedeemed),
      usdcReceived: new BN(data.usdcReceived),
    };
  }

  private parseYieldVaultInitialized(data: any): YieldVaultInitializedEvent {
    return {
      vault: new PublicKey(data.vault),
      authority: new PublicKey(data.authority),
      targetBufferBps: data.targetBufferBps,
    };
  }

  private parseVaultRebalanced(data: any): VaultRebalancedEvent {
    return {
      action: data.action,
      amount: new BN(data.amount),
    };
  }

  private parseEmergencyModeChanged(data: any): EmergencyModeChangedEvent {
    return {
      enabled: data.enabled,
      frozenRate: new BN(data.frozenRate),
    };
  }
}
