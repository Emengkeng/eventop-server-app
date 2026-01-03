/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/subscription_protocol.json`.
 */
export type SubscriptionProtocol = {
  address: 'GPVtSfXPiy8y4SkJrMC3VFyKUmGVhMrRbAp2NhiW1Ds2';
  metadata: {
    name: 'subscriptionProtocol';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'cancelSubscriptionWallet';
      docs: ['Cancel subscription'];
      discriminator: [87, 116, 152, 140, 138, 150, 126, 195];
      accounts: [
        {
          name: 'subscriptionState';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                ];
              },
              {
                kind: 'account';
                path: 'subscription_state.user';
                account: 'subscriptionState';
              },
              {
                kind: 'account';
                path: 'subscription_state.merchant';
                account: 'subscriptionState';
              },
              {
                kind: 'account';
                path: 'subscription_state.mint';
                account: 'subscriptionState';
              },
            ];
          };
        },
        {
          name: 'subscriptionWallet';
          writable: true;
        },
        {
          name: 'merchantPlan';
          writable: true;
        },
        {
          name: 'user';
          writable: true;
          signer: true;
          relations: ['subscriptionState'];
        },
      ];
      args: [];
    },
    {
      name: 'createSubscriptionWallet';
      docs: ['Create a Subscription Wallet (Virtual Card) for a user'];
      discriminator: [35, 43, 93, 123, 176, 230, 33, 157];
      accounts: [
        {
          name: 'subscriptionWallet';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                ];
              },
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'account';
                path: 'mint';
              },
            ];
          };
        },
        {
          name: 'mainTokenAccount';
          writable: true;
        },
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'mint';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [];
    },
    {
      name: 'depositToWallet';
      docs: ['Deposit funds into Subscription Wallet'];
      discriminator: [103, 7, 8, 74, 10, 156, 142, 175];
      accounts: [
        {
          name: 'subscriptionWallet';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                ];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.owner';
                account: 'subscriptionWallet';
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'userTokenAccount';
          writable: true;
        },
        {
          name: 'walletTokenAccount';
          writable: true;
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
      ];
    },
    {
      name: 'depositToYield';
      docs: ['Deposit more funds to yield vault (add to existing position)'];
      discriminator: [30, 86, 121, 108, 211, 165, 8, 10];
      accounts: [
        {
          name: 'subscriptionWallet';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                ];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.owner';
                account: 'subscriptionWallet';
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'yieldVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [121, 105, 101, 108, 100, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'owner';
          writable: true;
          signer: true;
          relations: ['subscriptionWallet'];
        },
        {
          name: 'walletTokenAccount';
          writable: true;
        },
        {
          name: 'vaultBuffer';
          writable: true;
        },
        {
          name: 'jupiterLending';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
      ];
    },
    {
      name: 'disableYield';
      docs: ["Disable yield - redeems all shares back to user's wallet"];
      discriminator: [167, 105, 31, 148, 14, 178, 166, 189];
      accounts: [
        {
          name: 'subscriptionWallet';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                ];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.owner';
                account: 'subscriptionWallet';
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'yieldVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [121, 105, 101, 108, 100, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'owner';
          writable: true;
          signer: true;
          relations: ['subscriptionWallet'];
        },
        {
          name: 'walletTokenAccount';
          writable: true;
        },
        {
          name: 'vaultBuffer';
          writable: true;
        },
        {
          name: 'jupiterLending';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [];
    },
    {
      name: 'enableYield';
      docs: ['Enable yield earning - moves funds to pooled vault'];
      discriminator: [196, 201, 147, 154, 193, 54, 141, 13];
      accounts: [
        {
          name: 'subscriptionWallet';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                ];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.owner';
                account: 'subscriptionWallet';
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'yieldVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [121, 105, 101, 108, 100, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'owner';
          writable: true;
          signer: true;
          relations: ['subscriptionWallet'];
        },
        {
          name: 'walletTokenAccount';
          writable: true;
        },
        {
          name: 'vaultBuffer';
          writable: true;
        },
        {
          name: 'jupiterLending';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
      ];
    },
    {
      name: 'executePaymentFromWallet';
      docs: ['Execute payment - with automatic yield redemption if needed'];
      discriminator: [65, 124, 135, 175, 165, 95, 251, 172];
      accounts: [
        {
          name: 'subscriptionState';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                ];
              },
              {
                kind: 'account';
                path: 'subscription_state.user';
                account: 'subscriptionState';
              },
              {
                kind: 'account';
                path: 'subscription_state.merchant';
                account: 'subscriptionState';
              },
              {
                kind: 'account';
                path: 'subscription_state.mint';
                account: 'subscriptionState';
              },
            ];
          };
        },
        {
          name: 'subscriptionWallet';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                ];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.owner';
                account: 'subscriptionWallet';
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'merchantPlan';
        },
        {
          name: 'protocolConfig';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
            ];
          };
        },
        {
          name: 'walletTokenAccount';
          writable: true;
        },
        {
          name: 'merchantTokenAccount';
          writable: true;
        },
        {
          name: 'protocolTreasury';
          writable: true;
        },
        {
          name: 'yieldVault';
          writable: true;
          optional: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [121, 105, 101, 108, 100, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'vaultBuffer';
          writable: true;
          optional: true;
        },
        {
          name: 'jupiterLending';
          optional: true;
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [];
    },
    {
      name: 'initializeProtocol';
      docs: ['Initialize protocol configuration (one-time, by deployer)'];
      discriminator: [188, 233, 252, 106, 134, 146, 202, 91];
      accounts: [
        {
          name: 'protocolConfig';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
            ];
          };
        },
        {
          name: 'authority';
          writable: true;
          signer: true;
        },
        {
          name: 'treasury';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'protocolFeeBps';
          type: 'u16';
        },
      ];
    },
    {
      name: 'initializeYieldVault';
      docs: ['Initialize the global yield vault (one-time setup)'];
      discriminator: [117, 33, 120, 230, 252, 0, 222, 91];
      accounts: [
        {
          name: 'yieldVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [121, 105, 101, 108, 100, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'mint';
              },
            ];
          };
        },
        {
          name: 'authority';
          writable: true;
          signer: true;
        },
        {
          name: 'mint';
        },
        {
          name: 'usdcBuffer';
          docs: ['USDC buffer token account (owned by yield_vault PDA)'];
        },
        {
          name: 'jupiterFtokenAccount';
          docs: ['Jupiter Lend fToken account (owned by yield_vault PDA)'];
        },
        {
          name: 'jupiterLending';
          docs: ['Jupiter Lend lending account'];
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'targetBufferBps';
          type: 'u16';
        },
      ];
    },
    {
      name: 'rebalanceVault';
      docs: [
        'Protocol-level rebalancing: Move funds between buffer and Juplend',
      ];
      discriminator: [222, 228, 121, 242, 30, 212, 201, 145];
      accounts: [
        {
          name: 'yieldVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [121, 105, 101, 108, 100, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'yield_vault.mint';
                account: 'yieldVault';
              },
            ];
          };
        },
        {
          name: 'authority';
          signer: true;
          relations: ['yieldVault'];
        },
        {
          name: 'vaultBuffer';
          writable: true;
        },
        {
          name: 'jupiterFtokenAccount';
          writable: true;
        },
        {
          name: 'mint';
        },
        {
          name: 'fTokenMint';
        },
        {
          name: 'lendingAdmin';
        },
        {
          name: 'lending';
          writable: true;
        },
        {
          name: 'supplyTokenReservesLiquidity';
          writable: true;
        },
        {
          name: 'lendingSupplyPositionOnLiquidity';
          writable: true;
        },
        {
          name: 'rateModel';
        },
        {
          name: 'jupiterVault';
          writable: true;
        },
        {
          name: 'claimAccount';
          writable: true;
        },
        {
          name: 'liquidity';
          writable: true;
        },
        {
          name: 'liquidityProgram';
          writable: true;
        },
        {
          name: 'rewardsRateModel';
        },
        {
          name: 'lendingProgram';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [];
    },
    {
      name: 'registerMerchant';
      docs: ['Register merchant plan'];
      discriminator: [238, 245, 77, 132, 161, 88, 216, 248];
      accounts: [
        {
          name: 'merchantPlan';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  109,
                  101,
                  114,
                  99,
                  104,
                  97,
                  110,
                  116,
                  95,
                  112,
                  108,
                  97,
                  110,
                ];
              },
              {
                kind: 'account';
                path: 'merchant';
              },
              {
                kind: 'account';
                path: 'mint';
              },
              {
                kind: 'arg';
                path: 'planId';
              },
            ];
          };
        },
        {
          name: 'merchant';
          writable: true;
          signer: true;
        },
        {
          name: 'mint';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'planId';
          type: 'string';
        },
        {
          name: 'planName';
          type: 'string';
        },
        {
          name: 'feeAmount';
          type: 'u64';
        },
        {
          name: 'paymentIntervalSeconds';
          type: 'i64';
        },
      ];
    },
    {
      name: 'setEmergencyMode';
      docs: ['Emergency mode: Disable yield operations protocol-wide'];
      discriminator: [79, 138, 190, 94, 0, 162, 205, 253];
      accounts: [
        {
          name: 'yieldVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [121, 105, 101, 108, 100, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'yield_vault.mint';
                account: 'yieldVault';
              },
            ];
          };
        },
        {
          name: 'authority';
          signer: true;
          relations: ['yieldVault'];
        },
        {
          name: 'vaultBuffer';
          writable: true;
        },
        {
          name: 'jupiterFtokenAccount';
          writable: true;
        },
        {
          name: 'fTokenMint';
        },
        {
          name: 'jupiterLending';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [
        {
          name: 'enabled';
          type: 'bool';
        },
      ];
    },
    {
      name: 'subscribeWithWallet';
      docs: ['Subscribe using Subscription Wallet'];
      discriminator: [8, 120, 11, 42, 170, 6, 72, 80];
      accounts: [
        {
          name: 'subscriptionState';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                ];
              },
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'account';
                path: 'merchant_plan.merchant';
                account: 'merchantPlan';
              },
              {
                kind: 'account';
                path: 'merchant_plan.mint';
                account: 'merchantPlan';
              },
            ];
          };
        },
        {
          name: 'sessionTokenTracker';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  101,
                  115,
                  115,
                  105,
                  111,
                  110,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                ];
              },
              {
                kind: 'arg';
                path: 'sessionToken';
              },
            ];
          };
        },
        {
          name: 'subscriptionWallet';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                ];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.owner';
                account: 'subscriptionWallet';
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'merchantPlan';
          writable: true;
        },
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'walletTokenAccount';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
      ];
      args: [
        {
          name: 'sessionToken';
          type: 'string';
        },
      ];
    },
    {
      name: 'updateProtocolFee';
      docs: ['Update protocol fee (admin only)'];
      discriminator: [170, 136, 6, 60, 43, 130, 81, 96];
      accounts: [
        {
          name: 'protocolConfig';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  112,
                  114,
                  111,
                  116,
                  111,
                  99,
                  111,
                  108,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103,
                ];
              },
            ];
          };
        },
        {
          name: 'authority';
          signer: true;
          relations: ['protocolConfig'];
        },
      ];
      args: [
        {
          name: 'newFeeBps';
          type: 'u16';
        },
      ];
    },
    {
      name: 'withdrawFromWallet';
      docs: ['Withdraw idle funds from Subscription Wallet'];
      discriminator: [197, 40, 222, 231, 38, 226, 168, 174];
      accounts: [
        {
          name: 'subscriptionWallet';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                ];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.owner';
                account: 'subscriptionWallet';
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'owner';
          writable: true;
          signer: true;
          relations: ['subscriptionWallet'];
        },
        {
          name: 'userTokenAccount';
          writable: true;
        },
        {
          name: 'walletTokenAccount';
          writable: true;
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        },
      ];
    },
    {
      name: 'withdrawFromYield';
      docs: ['Withdraw from yield position (partial or full)'];
      discriminator: [143, 188, 122, 175, 53, 205, 204, 15];
      accounts: [
        {
          name: 'subscriptionWallet';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [
                  115,
                  117,
                  98,
                  115,
                  99,
                  114,
                  105,
                  112,
                  116,
                  105,
                  111,
                  110,
                  95,
                  119,
                  97,
                  108,
                  108,
                  101,
                  116,
                ];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.owner';
                account: 'subscriptionWallet';
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'yieldVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [121, 105, 101, 108, 100, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'subscription_wallet.mint';
                account: 'subscriptionWallet';
              },
            ];
          };
        },
        {
          name: 'owner';
          writable: true;
          signer: true;
          relations: ['subscriptionWallet'];
        },
        {
          name: 'walletTokenAccount';
          writable: true;
        },
        {
          name: 'vaultBuffer';
          writable: true;
        },
        {
          name: 'jupiterLending';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
      ];
      args: [
        {
          name: 'sharesToRedeem';
          type: 'u64';
        },
      ];
    },
  ];
  accounts: [
    {
      name: 'merchantPlan';
      discriminator: [186, 54, 183, 129, 39, 81, 74, 89];
    },
    {
      name: 'protocolConfig';
      discriminator: [207, 91, 250, 28, 152, 179, 215, 209];
    },
    {
      name: 'sessionTokenTracker';
      discriminator: [24, 255, 212, 49, 240, 180, 89, 97];
    },
    {
      name: 'subscriptionState';
      discriminator: [35, 41, 45, 165, 253, 34, 95, 225];
    },
    {
      name: 'subscriptionWallet';
      discriminator: [255, 81, 65, 25, 250, 57, 38, 118];
    },
    {
      name: 'yieldVault';
      discriminator: [17, 229, 96, 254, 254, 179, 195, 163];
    },
  ];
  events: [
    {
      name: 'emergencyModeChanged';
      discriminator: [20, 161, 39, 32, 151, 62, 192, 67];
    },
    {
      name: 'merchantPlanRegistered';
      discriminator: [82, 211, 85, 158, 114, 80, 148, 147];
    },
    {
      name: 'paymentExecuted';
      discriminator: [153, 165, 141, 18, 246, 20, 204, 227];
    },
    {
      name: 'protocolFeeUpdated';
      discriminator: [172, 56, 83, 113, 219, 69, 69, 105];
    },
    {
      name: 'protocolInitialized';
      discriminator: [173, 122, 168, 254, 9, 118, 76, 132];
    },
    {
      name: 'subscriptionCancelled';
      discriminator: [158, 216, 233, 205, 138, 62, 176, 239];
    },
    {
      name: 'subscriptionCreated';
      discriminator: [215, 63, 169, 25, 179, 200, 180, 105];
    },
    {
      name: 'subscriptionWalletCreated';
      discriminator: [235, 235, 143, 233, 3, 163, 185, 76];
    },
    {
      name: 'vaultRebalanced';
      discriminator: [117, 48, 126, 17, 29, 0, 200, 28];
    },
    {
      name: 'walletDeposit';
      discriminator: [196, 69, 189, 161, 124, 101, 99, 44];
    },
    {
      name: 'walletWithdrawal';
      discriminator: [27, 160, 208, 232, 130, 95, 216, 219];
    },
    {
      name: 'yieldDeposit';
      discriminator: [12, 231, 107, 169, 165, 249, 85, 129];
    },
    {
      name: 'yieldDisabled';
      discriminator: [108, 111, 46, 130, 60, 75, 91, 149];
    },
    {
      name: 'yieldEnabled';
      discriminator: [21, 224, 190, 160, 201, 113, 52, 41];
    },
    {
      name: 'yieldVaultInitialized';
      discriminator: [243, 230, 63, 223, 0, 8, 98, 26];
    },
    {
      name: 'yieldWithdrawal';
      discriminator: [44, 216, 238, 136, 233, 133, 161, 60];
    },
  ];
  errors: [
    {
      code: 6000;
      name: 'subscriptionInactive';
      msg: 'Subscription is not active';
    },
    {
      code: 6001;
      name: 'paymentTooEarly';
      msg: 'Payment interval has not elapsed yet';
    },
    {
      code: 6002;
      name: 'planIdTooLong';
      msg: 'Plan ID exceeds maximum length';
    },
    {
      code: 6003;
      name: 'planNameTooLong';
      msg: 'Plan name exceeds maximum length';
    },
    {
      code: 6004;
      name: 'invalidFeeAmount';
      msg: 'Fee amount must be greater than zero';
    },
    {
      code: 6005;
      name: 'invalidAmount';
      msg: ' Amount must be greater than zero';
    },
    {
      code: 6006;
      name: 'invalidInterval';
      msg: 'Payment interval must be greater than zero';
    },
    {
      code: 6007;
      name: 'planInactive';
      msg: 'Merchant plan is not active';
    },
    {
      code: 6008;
      name: 'invalidMerchantPlan';
      msg: 'Invalid merchant plan reference';
    },
    {
      code: 6009;
      name: 'unauthorizedCancellation';
      msg: 'Only the subscription user can cancel';
    },
    {
      code: 6010;
      name: 'unauthorizedWalletAccess';
      msg: 'Unauthorized access to subscription wallet';
    },
    {
      code: 6011;
      name: 'invalidDepositAmount';
      msg: 'Invalid deposit amount';
    },
    {
      code: 6012;
      name: 'invalidWithdrawAmount';
      msg: 'Invalid withdrawal amount';
    },
    {
      code: 6013;
      name: 'invalidCollateralAccount';
      msg: 'Invalid collateral account';
    },
    {
      code: 6014;
      name: 'invalidJupiterLendAccount';
      msg: 'Invalid Jupiter Lend account';
    },
    {
      code: 6015;
      name: 'insufficientWalletBalance';
      msg: 'Insufficient wallet balance for subscription';
    },
    {
      code: 6016;
      name: 'insufficientCollateral';
      msg: 'Insufficient collateral deposited';
    },
    {
      code: 6017;
      name: 'insufficientFunds';
      msg: 'Insufficient funds in wallet';
    },
    {
      code: 6018;
      name: 'invalidMerchantAccount';
      msg: 'Invalid merchant token account';
    },
    {
      code: 6019;
      name: 'mathOverflow';
      msg: 'Math operation overflow';
    },
    {
      code: 6020;
      name: 'feeTooHigh';
      msg: 'Protocol fee exceeds maximum allowed (10%)';
    },
    {
      code: 6021;
      name: 'unauthorizedProtocolUpdate';
      msg: 'Unauthorized protocol configuration update';
    },
    {
      code: 6022;
      name: 'invalidTreasuryAccount';
      msg: 'Invalid treasury account';
    },
    {
      code: 6023;
      name: 'invalidShareAmount';
      msg: 'Invalid share amount';
    },
    {
      code: 6024;
      name: 'sessionTokenTooLong';
      msg: 'Session token exceeds maximum length (64 characters)';
    },
    {
      code: 6025;
      name: 'sessionTokenRequired';
      msg: 'Session token is required';
    },
    {
      code: 6026;
      name: 'sessionTokenAlreadyUsed';
      msg: 'Session token already used';
    },
    {
      code: 6027;
      name: 'yieldAlreadyEnabled';
      msg: 'Yield is already enabled';
    },
    {
      code: 6028;
      name: 'yieldNotEnabled';
      msg: 'Yield is not enabled';
    },
    {
      code: 6029;
      name: 'invalidBufferRatio';
      msg: 'Invalid buffer ratio (must be <= 50%)';
    },
    {
      code: 6030;
      name: 'yieldAmountTooSmall';
      msg: 'Yield amount too small after buffer calculation';
    },
    {
      code: 6031;
      name: 'noSharesToRedeem';
      msg: 'No shares to redeem';
    },
    {
      code: 6032;
      name: 'insufficientShares';
      msg: 'Insufficient shares';
    },
    {
      code: 6033;
      name: 'emergencyModeEnabled';
      msg: 'Emergency mode is enabled';
    },
    {
      code: 6034;
      name: 'insufficientAvailableBalance';
      msg: 'Insufficient available balance in wallet';
    },
    {
      code: 6035;
      name: 'jupiterLendDepositFailed';
      msg: 'Jupiter Lend deposit failed';
    },
    {
      code: 6036;
      name: 'jupiterLendWithdrawFailed';
      msg: 'Jupiter Lend withdraw failed';
    },
  ];
  types: [
    {
      name: 'emergencyModeChanged';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'enabled';
            type: 'bool';
          },
          {
            name: 'frozenRate';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'merchantPlan';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'merchant';
            type: 'pubkey';
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'planId';
            type: 'string';
          },
          {
            name: 'planName';
            type: 'string';
          },
          {
            name: 'feeAmount';
            type: 'u64';
          },
          {
            name: 'paymentInterval';
            type: 'i64';
          },
          {
            name: 'isActive';
            type: 'bool';
          },
          {
            name: 'totalSubscribers';
            type: 'u32';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'merchantPlanRegistered';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'planPda';
            type: 'pubkey';
          },
        ];
      };
    },
    {
      name: 'paymentExecuted';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'subscriptionPda';
            type: 'pubkey';
          },
          {
            name: 'walletPda';
            type: 'pubkey';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'merchant';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
          {
            name: 'protocolFee';
            type: 'u64';
          },
          {
            name: 'merchantReceived';
            type: 'u64';
          },
          {
            name: 'paymentNumber';
            type: 'u32';
          },
        ];
      };
    },
    {
      name: 'protocolConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'authority';
            type: 'pubkey';
          },
          {
            name: 'treasury';
            type: 'pubkey';
          },
          {
            name: 'protocolFeeBps';
            type: 'u16';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'protocolFeeUpdated';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'oldFeeBps';
            type: 'u16';
          },
          {
            name: 'newFeeBps';
            type: 'u16';
          },
        ];
      };
    },
    {
      name: 'protocolInitialized';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'authority';
            type: 'pubkey';
          },
          {
            name: 'feeBps';
            type: 'u16';
          },
          {
            name: 'treasury';
            type: 'pubkey';
          },
        ];
      };
    },
    {
      name: 'sessionTokenTracker';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'sessionToken';
            type: 'string';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'subscription';
            type: 'pubkey';
          },
          {
            name: 'timestamp';
            type: 'i64';
          },
          {
            name: 'isUsed';
            type: 'bool';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'subscriptionCancelled';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'subscriptionPda';
            type: 'pubkey';
          },
          {
            name: 'walletPda';
            type: 'pubkey';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'merchant';
            type: 'pubkey';
          },
          {
            name: 'paymentsMade';
            type: 'u32';
          },
        ];
      };
    },
    {
      name: 'subscriptionCreated';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'subscriptionPda';
            type: 'pubkey';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'wallet';
            type: 'pubkey';
          },
          {
            name: 'merchant';
            type: 'pubkey';
          },
          {
            name: 'planId';
            type: 'string';
          },
          {
            name: 'sessionToken';
            type: 'string';
          },
        ];
      };
    },
    {
      name: 'subscriptionState';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'subscriptionWallet';
            type: 'pubkey';
          },
          {
            name: 'merchant';
            type: 'pubkey';
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'merchantPlan';
            type: 'pubkey';
          },
          {
            name: 'feeAmount';
            type: 'u64';
          },
          {
            name: 'paymentInterval';
            type: 'i64';
          },
          {
            name: 'lastPaymentTimestamp';
            type: 'i64';
          },
          {
            name: 'totalPaid';
            type: 'u64';
          },
          {
            name: 'paymentCount';
            type: 'u32';
          },
          {
            name: 'isActive';
            type: 'bool';
          },
          {
            name: 'sessionToken';
            type: 'string';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'subscriptionWallet';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'owner';
            type: 'pubkey';
          },
          {
            name: 'mainTokenAccount';
            type: 'pubkey';
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'totalSubscriptions';
            type: 'u32';
          },
          {
            name: 'totalSpent';
            type: 'u64';
          },
          {
            name: 'yieldShares';
            type: 'u64';
          },
          {
            name: 'isYieldEnabled';
            type: 'bool';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'subscriptionWalletCreated';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'walletPda';
            type: 'pubkey';
          },
          {
            name: 'owner';
            type: 'pubkey';
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
        ];
      };
    },
    {
      name: 'vaultRebalanced';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'action';
            type: 'string';
          },
          {
            name: 'amount';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'walletDeposit';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'walletPda';
            type: 'pubkey';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'walletWithdrawal';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'walletPda';
            type: 'pubkey';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'amount';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'yieldDeposit';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'walletPda';
            type: 'pubkey';
          },
          {
            name: 'sharesIssued';
            type: 'u64';
          },
          {
            name: 'usdcAmount';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'yieldDisabled';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'walletPda';
            type: 'pubkey';
          },
          {
            name: 'sharesRedeemed';
            type: 'u64';
          },
          {
            name: 'usdcReceived';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'yieldEnabled';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'walletPda';
            type: 'pubkey';
          },
          {
            name: 'sharesIssued';
            type: 'u64';
          },
          {
            name: 'usdcAmount';
            type: 'u64';
          },
          {
            name: 'bufferAmount';
            type: 'u64';
          },
        ];
      };
    },
    {
      name: 'yieldVault';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'authority';
            type: 'pubkey';
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'usdcBuffer';
            type: 'pubkey';
          },
          {
            name: 'jupiterFtokenAccount';
            type: 'pubkey';
          },
          {
            name: 'jupiterLending';
            type: 'pubkey';
          },
          {
            name: 'totalSharesIssued';
            type: 'u64';
          },
          {
            name: 'totalUsdcDeposited';
            type: 'u64';
          },
          {
            name: 'targetBufferBps';
            type: 'u16';
          },
          {
            name: 'emergencyMode';
            type: 'bool';
          },
          {
            name: 'emergencyExchangeRate';
            type: 'u64';
          },
          {
            name: 'bump';
            type: 'u8';
          },
        ];
      };
    },
    {
      name: 'yieldVaultInitialized';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'vault';
            type: 'pubkey';
          },
          {
            name: 'authority';
            type: 'pubkey';
          },
          {
            name: 'targetBufferBps';
            type: 'u16';
          },
        ];
      };
    },
    {
      name: 'yieldWithdrawal';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'walletPda';
            type: 'pubkey';
          },
          {
            name: 'sharesRedeemed';
            type: 'u64';
          },
          {
            name: 'usdcReceived';
            type: 'u64';
          },
        ];
      };
    },
  ];
};
