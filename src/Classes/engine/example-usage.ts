/**
 * @file example-usage.ts
 * @description Complete TypeScript usage examples for the TradingBot Engine.
 *
 * Demonstrates:
 *   1. Creating a TradingBotExecutor with full Deriv API configuration
 *   2. Defining BotConfig, DerivAccountObject, and ContractData
 *   3. Using custom ContractParams overrides
 *   4. Running a bot in a trade loop with event handling
 *   5. Multiple strategy configurations (Martingale, D'Alembert, Oscar's Grind, 1-3-2-6, Reverse Martingale)
 *   6. Lifecycle management (start, pause, resume, stop)
 *   7. Persisting to the API and loading from it
 *
 * NOTE: This file is for reference only. It uses the JS engine classes with
 *       TypeScript interfaces layered on top for documentation clarity.
 */

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

// In a real project you'd import from the engine entry point:
// const { TradingBotManager, TradingBotExecutor, BOT_STATUSES, STRATEGY_TYPES } = require('./index');

// For this example we use TS-style imports for clarity:
import {
  TradingBotManager,
  TradingBotExecutor,
  BOT_STATUSES,
  STRATEGY_TYPES,
} from './index';

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS (mirrors the JS runtime shapes)
// ─────────────────────────────────────────────────────────────────────────────

/** Deriv account credentials — required for trade execution. */
interface BotDerivAccount {
  token: string;      // Deriv API token (e.g. 'a1-xYzAbCdEfGhIjK')
  account: string;    // Deriv login ID (e.g. 'CR1234567')
  currency: string;   // Account currency (e.g. 'USD')
}

/** Market information for the contract. */
interface BotMarketInfo {
  symbol: string;         // e.g. 'R_100', '1HZ100V', 'R_50'
  displayName: string;    // e.g. 'Volatility 100 Index'
  shortName: string;      // e.g. 'V100'
  market_name?: string;
  type?: string;
  isClosed?: boolean;
}

/** Contract configuration — defines WHAT to trade. */
interface BotContractData {
  tradeType: string;              // e.g. 'DIGITDIFF', 'CALLE', 'PUTE', 'CALLE|PUTE'
  contractType: string;           // e.g. 'DIGITDIFF', 'CALL', 'PUT', 'ALTERNATE'
  prediction: string;             // e.g. '5' for digit prediction, '' for rise/fall
  predictionRandomize?: boolean;
  market: BotMarketInfo | null;
  marketRandomize?: boolean;
  multiplier?: number;            // For multiplier contracts
  delay?: number;                 // Seconds between trades (default: 1)
  duration: number;               // Contract duration value
  durationUnits: string;          // 't' | 's' | 'm' | 'h' | 'd'
  allowEquals?: boolean;
  alternateAfter?: number | null; // Switch trade type every N trades
}

/** Amount configuration — supports fixed, percentage, and dynamic types. */
interface BotAmountConfig {
  type: 'fixed' | 'percentage' | 'dynamic';
  value: number;
  min?: number | null;
  max?: number | null;
  balancePercentage?: number;
}

/** All four amount fields for the bot. */
interface BotAmounts {
  base_stake: BotAmountConfig;
  maximum_stake: BotAmountConfig;
  take_profit: BotAmountConfig;
  stop_loss: BotAmountConfig;
}

/** A single recovery step — adjusts stake after N consecutive losses. */
interface BotRiskStep {
  id: string;
  lossStreak: number;
  multiplier: number;
  action: string;   // 'increase' | 'decrease' | 'reset'
}

/** Schedule exclusion date. */
interface BotScheduleExclusion {
  id: string;
  date: string;     // ISO date string
  reason: string;
}

/** Bot trading schedule. */
interface BotSchedule {
  id: string;
  name: string;
  type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  daysOfWeek?: number[];        // 0=Sun, 1=Mon, ..., 6=Sat
  dayOfMonth?: number | null;
  isEnabled: boolean;
  exclusions?: BotScheduleExclusion[];
}

/** Cooldown period configuration. */
interface CooldownPeriod {
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

/** Deriv API ContractParams — the final shape sent to the Deriv WebSocket API. */
interface ContractParams {
  amount: number;
  basis: 'stake' | 'payout';
  contract_type: string;
  currency: string;
  symbol: string;
  duration: number;
  duration_unit: string;
  barrier?: string;
  multiplier?: number;
}

/** Normalised trade result returned by the Executor. */
interface TradeResult {
  tradeId: string;
  sessionId: string;
  contractId: string;
  botId: string;
  botUUID: string;
  strategyId: string;
  userAccountUUID: string;
  entryTime: number | null;
  exitTime: number | null;
  purchaseTime: number | null;
  entrySpotValue: number | null;
  exitSpotValue: number | null;
  stake: number;
  payout: number;
  profit: number;
  profitPercentage: number;
  isWin: boolean;
  status: string;
  symbol: string;
  symbolFull: string;
  contractType: string;
  duration: number;
  durationUnits: string;
  currency: string;
  longcode: string;
  timestamp: string;
}

/** Executor constructor options. */
interface ExecutorOptions {
  apiBaseUrl: string;
  authToken?: string;
  derivEndpointDomain?: string;
  derivAppId?: string;
  derivLang?: string;
  connectionTimeout?: number;
  maxRetryAttempts?: number;
  retryDelayBase?: number;
  minStake?: number;
  maxStake?: number;
}

/** The full BotConfig shape accepted by TradingBotManager. */
interface BotConfig {
  strategyId: string;
  botName: string;
  botDescription?: string;
  botIcon?: string;
  botThumbnail?: string;
  botBanner?: string;
  botTags?: string[];
  botAccount: BotDerivAccount;
  botCurrency?: string;
  contract: BotContractData;
  amounts: BotAmounts;
  recovery_steps?: { risk_steps: BotRiskStep[] };
  advanced_settings?: Record<string, any>;
  isPremium?: boolean;
  isPublic?: boolean;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION OBJECTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  1. DERIV ACCOUNT OBJECT                                                │
 * │  Your Deriv API credentials. The token is used to authenticate          │
 * │  with the Deriv WebSocket API for contract purchases.                   │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
const derivAccount: BotDerivAccount = {
  token: 'a1-xYzAbCdEfGhIjKlMnOpQr',   // Your Deriv API token
  account: 'CR1234567',                   // Your Deriv login ID
  currency: 'USD',                        // Account currency
};

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  2. EXECUTOR OPTIONS                                                    │
 * │  Configuration for the network/API layer.                               │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
const executorOptions: ExecutorOptions = {
  apiBaseUrl: 'https://api.koppo.io/api/v1',
  authToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzAwMSJ9.abc',
  derivEndpointDomain: 'green.derivws.com',
  derivAppId: '12345',
  derivLang: 'EN',
  connectionTimeout: 15000,   // 15 seconds
  maxRetryAttempts: 3,        // Retry failed trades up to 3 times
  retryDelayBase: 1000,       // 1 second base delay (doubles each retry)
  minStake: 0.35,             // Deriv minimum stake
  maxStake: 50000,            // Deriv maximum stake
};

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  3. CONTRACT DATA                                                       │
 * │  Defines WHAT to trade — market, contract type, duration, prediction.   │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
const contractData: BotContractData = {
  tradeType: 'DIGITDIFF',
  contractType: 'DIGITDIFF',
  prediction: '5',
  market: {
    symbol: 'R_100',
    displayName: 'Volatility 100 Index',
    shortName: 'V100',
    market_name: 'synthetic_index',
    type: 'volatility',
    isClosed: false,
  },
  duration: 1,
  durationUnits: 't',       // ticks
  delay: 1,                 // 1 second between trades
  allowEquals: false,
  alternateAfter: null,
};

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  4. AMOUNTS CONFIGURATION                                               │
 * │  Defines HOW MUCH to trade — base stake, max stake, TP, SL.            │
 * │                                                                         │
 * │  Types:                                                                 │
 * │    'fixed'      → uses value directly ($1.00)                           │
 * │    'percentage'  → calculates from balance (2% of $1000 = $20)          │
 * │    'dynamic'     → scales by win rate: value × (0.5 + winRate)          │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
const amounts: BotAmounts = {
  base_stake:    { type: 'fixed', value: 1.00 },
  maximum_stake: { type: 'fixed', value: 50.00 },
  take_profit:   { type: 'fixed', value: 10.00 },
  stop_loss:     { type: 'fixed', value: 5.00 },
};

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  5. RECOVERY STEPS                                                      │
 * │  Define how the bot adjusts stake after consecutive losses.             │
 * │  Each step maps a loss streak count to a stake multiplier.              │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
const recoverySteps: { risk_steps: BotRiskStep[] } = {
  risk_steps: [
    { id: 'rs_1', lossStreak: 2, multiplier: 1.2, action: 'increase' },
    { id: 'rs_2', lossStreak: 4, multiplier: 1.5, action: 'increase' },
    { id: 'rs_3', lossStreak: 6, multiplier: 2.0, action: 'increase' },
    { id: 'rs_4', lossStreak: 8, multiplier: 0.5, action: 'decrease' },  // Safety net
  ],
};

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  6. BOT SCHEDULE                                                        │
 * │  Optional schedule for automated trading windows.                       │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
const botSchedule: BotSchedule = {
  id: 'sched_main',
  name: 'Weekday Trading Hours',
  type: 'weekly',
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-12-31T23:59:59Z',
  startTime: '2025-01-01T08:00:00Z',   // 08:00 UTC
  endTime: '2025-01-01T18:00:00Z',     // 18:00 UTC
  daysOfWeek: [1, 2, 3, 4, 5],         // Monday through Friday
  isEnabled: true,
  exclusions: [
    { id: 'exc_1', date: '2025-12-25', reason: 'Christmas — markets closed' },
    { id: 'exc_2', date: '2025-01-01', reason: 'New Year\'s Day' },
  ],
};

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  7. CUSTOM CONTRACT PARAMS OVERRIDES                                    │
 * │  Override any field in the ContractParams at execution time.            │
 * │  Useful for dynamic prediction, duration, or symbol changes.            │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
const customContractOverrides: Partial<ContractParams> = {
  barrier: '7',            // Override prediction from '5' to '7'
  duration: 3,             // Override duration from 1 to 3
  duration_unit: 's',      // Override from ticks to seconds
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 1: FULL MARTINGALE BOT — Complete Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

async function runMartingaleBot(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXAMPLE 1: Martingale Bot on Volatility 100');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ── Step 1: Create the Executor ──────────────────────────────────────
  const executor = new TradingBotExecutor(executorOptions);

  // ── Step 2: Build the full BotConfig ─────────────────────────────────
  const botConfig: BotConfig = {
    strategyId: STRATEGY_TYPES.MARTINGALE,
    botName: 'V100 Martingale Bot',
    botDescription: 'Digit Differs on Volatility 100 with 2x Martingale progression',
    botTags: ['martingale', 'v100', 'digit-differs', 'automated'],
    botAccount: derivAccount,
    contract: contractData,
    amounts: amounts,
    recovery_steps: recoverySteps,
    advanced_settings: {
      // ── General Settings ──────────────────────────────────────────
      general_settings_section: {
        maximum_number_of_trades: 100,
        maximum_running_time: 1800,                // 30 minutes max
        cooldown_period: { duration: 30, unit: 'seconds' } as CooldownPeriod,
        recovery_type: 'martingale',
        compound_stake: false,
        auto_restart: true,
      },

      // ── Schedule ──────────────────────────────────────────────────
      bot_schedule: {
        bot_schedule: botSchedule,
      },

      // ── Risk Management ───────────────────────────────────────────
      risk_management_section: {
        max_daily_loss: { type: 'fixed', value: 20 } as BotAmountConfig,
        max_daily_profit: { type: 'fixed', value: 30 } as BotAmountConfig,
        max_consecutive_losses: 6,
        max_drawdown_percentage: 10,
        risk_per_trade: { type: 'fixed', value: 3 } as BotAmountConfig,  // Max 3% per trade
        position_sizing: true,
        emergency_stop: true,
      },

      // ── Volatility Controls ───────────────────────────────────────
      volatility_controls_section: {
        volatility_filter: false,
        min_volatility: null,
        max_volatility: null,
        pause_on_high_volatility: false,
      },

      // ── Martingale Strategy ───────────────────────────────────────
      martingale_strategy_section: {
        martingale_multiplier: 2,
        martingale_max_steps: 6,
        martingale_reset_on_profit: true,
        martingale_progressive_target: false,
        martingale_safety_net: 10,                 // Max 10% of balance per trade
      },

      // ── Recovery Settings ─────────────────────────────────────────
      recovery_settings_section: {
        progressive_recovery: true,
        recovery_multiplier: 1.0,
        max_recovery_attempts: 5,
        recovery_cooldown: { duration: 1, unit: 'minutes' } as CooldownPeriod,
        partial_recovery: false,
      },
    },
    createdBy: 'user_example_001',
    metadata: {
      source: 'example-usage.ts',
      environment: 'development',
    },
  };

  // ── Step 3: Create the Manager from the config ───────────────────────
  const manager = TradingBotManager.fromFormData(botConfig, executor, {
    botName: botConfig.botName,
    createdBy: botConfig.createdBy,
    botCurrency: derivAccount.currency,
  });

  // ── Step 4: Validate before starting ─────────────────────────────────
  const validation = manager.validate();
  if (!validation.isValid) {
    console.error('Validation failed:', validation.errors);
    return;
  }
  console.log('Config validated successfully.');

  // ── Step 5: Set up balance provider ──────────────────────────────────
  let accountBalance = 1000.00;
  manager.setBalanceProvider(() => accountBalance);

  // ── Step 6: Wire up ALL events ───────────────────────────────────────

  // Status changes
  manager.on('status_changed', (e: { from: string; to: string }) => {
    console.log(`[STATUS] ${e.from} → ${e.to}`);
  });

  // Trade results
  manager.on('trade_won', (e: { result: TradeResult; consecutiveWins: number }) => {
    accountBalance += e.result.profit;
    console.log(`[WIN]  +$${e.result.profit.toFixed(2)} | Streak: ${e.consecutiveWins} | Balance: $${accountBalance.toFixed(2)}`);
  });

  manager.on('trade_lost', (e: { result: TradeResult; consecutiveLosses: number }) => {
    accountBalance += e.result.profit; // profit is negative on loss
    console.log(`[LOSS] -$${Math.abs(e.result.profit).toFixed(2)} | Streak: ${e.consecutiveLosses} | Balance: $${accountBalance.toFixed(2)}`);
  });

  // Stake updates
  manager.on('stake_updated', (e: { stake: number }) => {
    console.log(`[STAKE] Next stake: $${e.stake.toFixed(2)}`);
  });

  // Strategy resets
  manager.on('strategy_reset', (e: { message: string }) => {
    console.log(`[RESET] ${e.message}`);
  });

  // Recovery
  manager.on('recovery_triggered', (e: { lossStreak: number; recoveryAttempts: number }) => {
    console.log(`[RECOVERY] Triggered at loss streak ${e.lossStreak} (attempt ${e.recoveryAttempts})`);
  });

  manager.on('recovery_step_changed', (e: { stepIndex: number }) => {
    console.log(`[RECOVERY] Advanced to step ${e.stepIndex}`);
  });

  // Risk limits
  manager.on('stop_loss_triggered', (e: { sessionProfit: number }) => {
    console.log(`[STOP LOSS] Session profit: $${e.sessionProfit.toFixed(2)}`);
  });

  manager.on('take_profit_triggered', (e: { sessionProfit?: number; message?: string }) => {
    console.log(`[TAKE PROFIT] ${e.message || `Session profit: $${e.sessionProfit?.toFixed(2)}`}`);
  });

  manager.on('risk_limit_hit', (e: { type: string; value: number }) => {
    console.log(`[RISK] ${e.type}: ${e.value}`);
  });

  manager.on('emergency_stop', (e: { reason: string }) => {
    console.log(`[EMERGENCY] ${e.reason}`);
  });

  // Cooldown
  manager.on('cooldown_started', (e: { durationMs?: number; type: string }) => {
    console.log(`[COOLDOWN] Started (${e.type}) — ${(e.durationMs || 0) / 1000}s`);
  });

  manager.on('cooldown_ended', (e: { type: string }) => {
    console.log(`[COOLDOWN] Ended (${e.type})`);
  });

  // Schedule
  manager.on('schedule_paused', (e: { message: string }) => {
    console.log(`[SCHEDULE] ${e.message}`);
  });

  // Profit locking
  manager.on('profit_locked', (e: { locked: number; totalLocked: number; sessionProfit: number }) => {
    console.log(`[PROFIT LOCK] Locked $${e.locked.toFixed(2)} (total: $${e.totalLocked.toFixed(2)})`);
  });

  manager.on('profit_protection_triggered', (e: { lockedProfit: number; currentProfit: number }) => {
    console.log(`[PROTECTION] Profit dropped below lock! Locked: $${e.lockedProfit.toFixed(2)}, Current: $${e.currentProfit.toFixed(2)}`);
  });

  // Errors
  manager.on('error', (e: { message: string }) => {
    console.error(`[ERROR] ${e.message}`);
  });

  manager.on('persist_error', (e: { error: string }) => {
    console.warn(`[PERSIST] ${e.error}`);
  });

  // General logs
  manager.on('log', (e: { message: string; timestamp: string }) => {
    console.log(`[LOG ${e.timestamp}] ${e.message}`);
  });

  // Executor-level events
  executor.on('trade_attempt', (e: { attempt: number; maxAttempts: number }) => {
    console.log(`  [EXEC] Attempt ${e.attempt}/${e.maxAttempts}`);
  });

  executor.on('trade_all_attempts_failed', (e: { error: string }) => {
    console.error(`  [EXEC] All attempts failed: ${e.error}`);
  });

  executor.on('session_started', (e: { sessionId: string }) => {
    console.log(`  [EXEC] Session started: ${e.sessionId}`);
  });

  executor.on('session_ended', (e: { sessionId: string; trades: number }) => {
    console.log(`  [EXEC] Session ended: ${e.sessionId} (${e.trades} trades)`);
  });

  // ── Step 7: Optionally persist the bot to the API ────────────────────
  try {
    const savedBot = await executor.createBot(manager.toConfig());
    console.log(`Bot persisted to API: ${savedBot.botUUID || savedBot.botId}`);
  } catch (err: any) {
    console.warn(`API persistence skipped: ${err.message}`);
  }

  // ── Step 8: Start the bot ────────────────────────────────────────────
  const startResult = await manager.start();
  if (!startResult.success) {
    console.error('Failed to start:', startResult.error);
    return;
  }

  console.log('Bot is running! Press Ctrl+C to stop.\n');

  // ── Step 9: Graceful shutdown on SIGINT ──────────────────────────────
  process.on('SIGINT', async () => {
    console.log('\nStopping bot...');
    await manager.stop();

    // Print final stats
    const stats = manager.statistics;
    const perf = manager.performance;
    console.log('\n── Final Statistics ──────────────────────────────────');
    console.log(`  Total Trades:    ${stats.lifetimeRuns}`);
    console.log(`  Wins:            ${stats.lifetimeWins}`);
    console.log(`  Losses:          ${stats.lifetimeLosses}`);
    console.log(`  Win Rate:        ${stats.winRate.toFixed(1)}%`);
    console.log(`  Total Profit:    $${stats.totalProfit.toFixed(2)}`);
    console.log(`  Profit Factor:   ${stats.profitFactor.toFixed(2)}`);
    console.log(`  Highest Stake:   $${perf.highestStake.toFixed(2)}`);
    console.log(`  Longest Win:     ${stats.longestWinStreak}`);
    console.log(`  Longest Loss:    ${stats.longestLossStreak}`);
    console.log(`  Final Balance:   $${accountBalance.toFixed(2)}`);
    console.log('─────────────────────────────────────────────────────\n');

    manager.destroy();
    executor.destroy();
    process.exit(0);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 2: D'ALEMBERT WITH CUSTOM CONTRACT OVERRIDES
// ─────────────────────────────────────────────────────────────────────────────

async function runDalembertWithOverrides(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXAMPLE 2: D\'Alembert with Custom Contract Overrides');
  console.log('═══════════════════════════════════════════════════════════\n');

  const executor = new TradingBotExecutor(executorOptions);

  // Use a different contract: Digit Over on V50 with custom overrides
  const dalembertContract: BotContractData = {
    tradeType: 'DIGITOVER',
    contractType: 'DIGITOVER',
    prediction: '3',
    market: {
      symbol: 'R_50',
      displayName: 'Volatility 50 Index',
      shortName: 'V50',
    },
    duration: 5,
    durationUnits: 't',
    delay: 2,
  };

  const manager = TradingBotManager.fromFormData({
    strategyId: STRATEGY_TYPES.DALEMBERT,
    botAccount: derivAccount,
    contract: dalembertContract,
    amounts: {
      base_stake:    { type: 'fixed', value: 1.50 },
      maximum_stake: { type: 'percentage', value: 5 },   // 5% of balance
      take_profit:   { type: 'fixed', value: 15.00 },
      stop_loss:     { type: 'dynamic', value: 8.00 },   // Scales by win rate
    },
    advanced_settings: {
      general_settings_section: {
        maximum_number_of_trades: 150,
        cooldown_period: { duration: 45, unit: 'seconds' },
        auto_restart: true,
      },
      risk_management_section: {
        max_consecutive_losses: 8,
        max_daily_loss: { type: 'fixed', value: 25 },
        max_drawdown_percentage: 12,
        emergency_stop: true,
      },
      dalembert_strategy_section: {
        dalembert_increment: { type: 'fixed', value: 1 },
        dalembert_decrement: { type: 'fixed', value: 1 },
        dalembert_max_units: 15,
        dalembert_reset_threshold: { type: 'fixed', value: 10 },
        dalembert_conservative_mode: true,
      },
    },
  }, executor, {
    botName: 'V50 D\'Alembert + Overrides',
    createdBy: 'user_example_002',
  });

  let balance = 800;
  manager.setBalanceProvider(() => balance);

  // ── Demonstrate custom contract overrides ─────────────────────────────
  // The Manager's internal _buildContractParams calls executor.buildContractParams.
  // To use custom overrides, you can manually build params and call executeTrade:

  console.log('Building contract params with custom overrides...');
  const baseParams = executor.buildContractParams(
    dalembertContract,
    1.50,
    derivAccount.currency,
  );
  console.log('Base params:', baseParams);

  const overriddenParams = executor.buildContractParams(
    dalembertContract,
    1.50,
    derivAccount.currency,
    customContractOverrides,  // Override barrier, duration, duration_unit
  );
  console.log('Overridden params:', overriddenParams);
  // Output: { amount: 1.5, basis: 'stake', contract_type: 'DIGITOVER', currency: 'USD',
  //           symbol: 'R_50', duration: 3, duration_unit: 's', barrier: '7' }

  // ── Validate the overridden params ────────────────────────────────────
  const validation = executor.validateContractParams(overriddenParams);
  console.log('Validation:', validation);
  // Output: { valid: true, errors: [] }

  // ── Start the bot normally (uses default contract params) ─────────────
  manager.on('trade_won', (e: any) => {
    balance += e.result.profit;
    console.log(`WIN +$${e.result.profit.toFixed(2)} | Balance: $${balance.toFixed(2)}`);
  });
  manager.on('trade_lost', (e: any) => {
    balance += e.result.profit;
    console.log(`LOSS -$${Math.abs(e.result.profit).toFixed(2)} | Balance: $${balance.toFixed(2)}`);
  });

  await manager.start();

  // Stop after 30 seconds for demo purposes
  setTimeout(async () => {
    await manager.stop();
    console.log(`\nD'Alembert bot stopped. Final balance: $${balance.toFixed(2)}`);
    manager.destroy();
    executor.destroy();
  }, 30000);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 3: LOAD EXISTING BOT FROM API & RESUME
// ─────────────────────────────────────────────────────────────────────────────

async function loadAndResumeBot(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXAMPLE 3: Load Existing Bot from API & Resume');
  console.log('═══════════════════════════════════════════════════════════\n');

  const executor = new TradingBotExecutor(executorOptions);

  // ── Load an existing bot by UUID ─────────────────────────────────────
  const botUUID = 'abc123-def456-ghi789';
  try {
    const botData = await executor.loadBot(botUUID);
    console.log(`Loaded bot: ${botData.botName} (${botData.status})`);

    // ── Create a Manager from the loaded config ────────────────────────
    const manager = new TradingBotManager(botData, executor);

    // ── Inject dependencies ────────────────────────────────────────────
    manager.setBalanceProvider(() => 1500);

    // ── Wire events ────────────────────────────────────────────────────
    manager.on('status_changed', (e: any) => console.log(`Status: ${e.from} → ${e.to}`));
    manager.on('trade_won', (e: any) => console.log(`WIN +$${e.result.profit.toFixed(2)}`));
    manager.on('trade_lost', (e: any) => console.log(`LOSS -$${Math.abs(e.result.profit).toFixed(2)}`));

    // ── Resume if it was paused, or start fresh ────────────────────────
    if (botData.status === BOT_STATUSES.PAUSE) {
      manager.resume();
      console.log('Bot resumed from paused state.');
    } else {
      const result = await manager.start();
      console.log(result.success ? 'Bot started.' : `Start failed: ${result.error}`);
    }

    // ── Pause after 20 seconds, then resume after 10 more ──────────────
    setTimeout(() => {
      console.log('\nPausing bot...');
      manager.pause();

      setTimeout(() => {
        console.log('Resuming bot...');
        manager.resume();

        // Stop after 15 more seconds
        setTimeout(async () => {
          await manager.stop();
          console.log('Bot stopped. Final stats:', manager.statistics);
          manager.destroy();
          executor.destroy();
        }, 15000);
      }, 10000);
    }, 20000);

  } catch (err: any) {
    console.error(`Failed to load bot: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 4: ALTERNATING RISE/FALL WITH REVERSE MARTINGALE
// ─────────────────────────────────────────────────────────────────────────────

async function runAlternatingReverseMartingale(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXAMPLE 4: Alternating Rise/Fall + Reverse Martingale');
  console.log('═══════════════════════════════════════════════════════════\n');

  const executor = new TradingBotExecutor(executorOptions);

  const manager = TradingBotManager.fromFormData({
    strategyId: STRATEGY_TYPES.REVERSE_MARTINGALE,
    botAccount: derivAccount,
    contract: {
      tradeType: 'CALLE|PUTE',           // Alternate between CALL and PUT
      contractType: 'ALTERNATE',
      prediction: '',
      market: {
        symbol: 'R_100',
        displayName: 'Volatility 100 Index',
        shortName: 'V100',
      },
      duration: 5,
      durationUnits: 't',
      delay: 3,
      alternateAfter: 2,                 // Switch every 2 trades
    },
    amounts: {
      base_stake:    { type: 'fixed', value: 1.00 },
      maximum_stake: { type: 'fixed', value: 30.00 },
      take_profit:   { type: 'percentage', value: 3 },   // 3% of balance
      stop_loss:     { type: 'percentage', value: 2 },    // 2% of balance
    },
    advanced_settings: {
      general_settings_section: {
        maximum_number_of_trades: 80,
        auto_restart: false,
      },
      reverse_martingale_strategy_section: {
        reverse_martingale_multiplier: 1.5,
        reverse_martingale_max_wins: 4,
        reverse_martingale_profit_lock: 30,   // Lock 30% of profits
        reverse_martingale_reset_on_loss: true,
        reverse_martingale_aggressive_mode: false,
      },
      risk_management_section: {
        max_consecutive_losses: 5,
        risk_per_trade: { type: 'fixed', value: 2 },
        emergency_stop: true,
      },
      volatility_controls_section: {
        volatility_filter: true,
        min_volatility: 15,
        max_volatility: 85,
        pause_on_high_volatility: true,
      },
    },
  }, executor, {
    botName: 'Alternating Reverse Martingale',
    createdBy: 'user_example_004',
  });

  let balance = 2000;
  manager.setBalanceProvider(() => balance);

  // Provide a mock volatility provider
  manager.setVolatilityProvider(() => {
    // In production: fetch from Deriv tick stream or market data API
    return 40 + Math.random() * 30;  // Random 40-70
  });

  manager.on('trade_won', (e: any) => {
    balance += e.result.profit;
    console.log(`WIN  +$${e.result.profit.toFixed(2)} | Wins: ${e.consecutiveWins} | Bal: $${balance.toFixed(2)}`);
  });
  manager.on('trade_lost', (e: any) => {
    balance += e.result.profit;
    console.log(`LOSS -$${Math.abs(e.result.profit).toFixed(2)} | Losses: ${e.consecutiveLosses} | Bal: $${balance.toFixed(2)}`);
  });
  manager.on('profit_locked', (e: any) => {
    console.log(`LOCKED $${e.locked.toFixed(2)} (total locked: $${e.totalLocked.toFixed(2)})`);
  });
  manager.on('volatility_pause', (e: any) => {
    console.log(`VOLATILITY ${e.volatility.toFixed(1)} — outside bounds, waiting...`);
  });

  await manager.start();
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 5: 1-3-2-6 SYSTEM WITH FULL RECOVERY & SCHEDULE
// ─────────────────────────────────────────────────────────────────────────────

async function run1326WithRecovery(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXAMPLE 5: 1-3-2-6 System with Recovery & Schedule');
  console.log('═══════════════════════════════════════════════════════════\n');

  const executor = new TradingBotExecutor(executorOptions);

  const manager = TradingBotManager.fromFormData({
    strategyId: STRATEGY_TYPES.SYSTEM_1326,
    botAccount: derivAccount,
    contract: {
      tradeType: 'DIGITEVEN',
      contractType: 'DIGITEVEN',
      prediction: '',
      market: {
        symbol: 'R_75',
        displayName: 'Volatility 75 Index',
        shortName: 'V75',
      },
      duration: 1,
      durationUnits: 't',
      delay: 1,
    },
    amounts: {
      base_stake:    { type: 'fixed', value: 0.50 },
      maximum_stake: { type: 'fixed', value: 20.00 },
      take_profit:   { type: 'fixed', value: 8.00 },
      stop_loss:     { type: 'fixed', value: 4.00 },
    },
    recovery_steps: {
      risk_steps: [
        { id: 'r1', lossStreak: 3, multiplier: 1.3, action: 'increase' },
        { id: 'r2', lossStreak: 5, multiplier: 1.8, action: 'increase' },
        { id: 'r3', lossStreak: 7, multiplier: 0.5, action: 'decrease' },
      ],
    },
    advanced_settings: {
      general_settings_section: {
        maximum_number_of_trades: 200,
        maximum_running_time: 7200,   // 2 hours
        cooldown_period: { duration: 30, unit: 'seconds' },
        recovery_type: 'system_1326',
        auto_restart: true,
      },
      bot_schedule: {
        bot_schedule: {
          id: 'sched_1326',
          name: 'Morning Session',
          type: 'daily',
          startTime: '2025-01-01T06:00:00Z',
          endTime: '2025-01-01T12:00:00Z',
          isEnabled: true,
          exclusions: [],
        },
      },
      risk_management_section: {
        max_consecutive_losses: 10,
        max_daily_loss: { type: 'fixed', value: 15 },
        max_drawdown_percentage: 8,
        emergency_stop: true,
      },
      recovery_settings_section: {
        progressive_recovery: true,
        recovery_multiplier: 1.2,
        max_recovery_attempts: 4,
        recovery_cooldown: { duration: 90, unit: 'seconds' },
      },
      system_1326_strategy_section: {
        system_1326_sequence: '1-3-2-6',
        system_1326_reset_on_loss: true,
        system_1326_max_cycles: 15,
        system_1326_partial_profit_lock: true,
        system_1326_stop_on_cycle_complete: false,
        system_1326_loss_recovery: true,
      },
    },
  }, executor, {
    botName: '1-3-2-6 Recovery Bot',
    createdBy: 'user_example_005',
  });

  let balance = 500;
  manager.setBalanceProvider(() => balance);

  // Comprehensive event logging
  const events = [
    'trade_won', 'trade_lost', 'strategy_reset', 'recovery_triggered',
    'recovery_step_changed', 'cooldown_started', 'cooldown_ended',
    'stop_loss_triggered', 'take_profit_triggered', 'max_trades_reached',
    'schedule_paused', 'risk_limit_hit',
  ];

  for (const event of events) {
    manager.on(event, (data: any) => {
      if (event === 'trade_won') {
        balance += data.result.profit;
        console.log(`[${event}] +$${data.result.profit.toFixed(2)} | Bal: $${balance.toFixed(2)}`);
      } else if (event === 'trade_lost') {
        balance += data.result.profit;
        console.log(`[${event}] -$${Math.abs(data.result.profit).toFixed(2)} | Bal: $${balance.toFixed(2)}`);
      } else {
        console.log(`[${event}]`, JSON.stringify(data));
      }
    });
  }

  await manager.start();
}

// ─────────────────────────────────────────────────────────────────────────────
// EXAMPLE 6: MANUAL TRADE EXECUTION (Using Executor Directly)
// ─────────────────────────────────────────────────────────────────────────────

async function runManualTrade(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  EXAMPLE 6: Manual Trade Execution via Executor');
  console.log('═══════════════════════════════════════════════════════════\n');

  const executor = new TradingBotExecutor(executorOptions);

  // ── Build contract params manually ───────────────────────────────────
  const params: ContractParams = executor.buildContractParams(
    {
      contractType: 'DIGITDIFF',
      market: { symbol: 'R_100' },
      prediction: '5',
      duration: 1,
      durationUnits: 't',
    },
    1.00,       // stake
    'USD',      // currency
  );

  console.log('Contract params:', params);

  // ── Validate ─────────────────────────────────────────────────────────
  const validation = executor.validateContractParams(params);
  if (!validation.valid) {
    console.error('Invalid params:', validation.errors);
    return;
  }

  // ── Start a session ──────────────────────────────────────────────────
  const sessionId = executor.startSession();
  console.log('Session:', sessionId);

  // ── Execute a single trade ───────────────────────────────────────────
  try {
    const result: TradeResult = await executor.executeTrade(params, derivAccount.token);
    console.log(`Trade result: ${result.isWin ? 'WIN' : 'LOSS'} | Profit: $${result.profit.toFixed(2)}`);
  } catch (err: any) {
    console.error('Trade failed:', err.message);
  }

  // ── Execute with custom overrides ────────────────────────────────────
  const overriddenParams = executor.buildContractParams(
    {
      contractType: 'DIGITDIFF',
      market: { symbol: 'R_100' },
      prediction: '5',
      duration: 1,
      durationUnits: 't',
    },
    2.00,
    'USD',
    { barrier: '7', duration: 3, duration_unit: 's' },  // Custom overrides
  );

  console.log('Overridden params:', overriddenParams);

  try {
    const result2: TradeResult = await executor.executeTrade(overriddenParams, derivAccount.token);
    console.log(`Trade 2 result: ${result2.isWin ? 'WIN' : 'LOSS'} | Profit: $${result2.profit.toFixed(2)}`);
  } catch (err: any) {
    console.error('Trade 2 failed:', err.message);
  }

  // ── End session ──────────────────────────────────────────────────────
  executor.endSession();
  console.log('Session ended. Trade history:', executor.tradeHistory.length, 'trades');

  executor.destroy();
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — Run the examples
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        TradingBot Engine — Usage Examples                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Uncomment the example you want to run:

  await runMartingaleBot();
  // await runDalembertWithOverrides();
  // await loadAndResumeBot();
  // await runAlternatingReverseMartingale();
  // await run1326WithRecovery();
  // await runManualTrade();
}

main().catch(console.error);
