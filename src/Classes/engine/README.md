# TradingBot Engine

> **Two-layer runtime architecture for automated Deriv trading.**

The engine is composed of two classes that work together:

| Class | Role | Extends |
|---|---|---|
| **`TradingBotExecutor`** | Network I/O — API persistence, CRUD, Deriv contract execution | `EventEmitter` |
| **`TradingBotManager`** | Decision-making — strategy logic, risk management, scheduling, trade loop | `EventEmitter` |

The **Manager** never touches the network directly; the **Executor** has no strategy logic.  
Together they form a clean separation of concerns that is easy to test, extend, and debug.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Architecture Overview](#2-architecture-overview)
3. [TradingBotExecutor — API & Execution Layer](#3-tradingbotexecutor--api--execution-layer)
   - [Constructor Options](#31-constructor-options)
   - [Bot CRUD Methods](#32-bot-crud-methods)
   - [Field-Specific API Updates](#33-field-specific-api-updates)
   - [Trade Execution](#34-trade-execution)
   - [Contract Parameter Building](#35-contract-parameter-building)
   - [Executor Events](#36-executor-events)
4. [TradingBotManager — Runtime Engine](#4-tradingbotmanager--runtime-engine)
   - [Static Factory: `fromFormData()`](#41-static-factory-fromformdata)
   - [BotConfig Shape](#42-botconfig-shape)
   - [Deriv Account Object](#43-deriv-account-object)
   - [Contract Data & Custom Overrides](#44-contract-data--custom-overrides)
   - [Amounts Configuration](#45-amounts-configuration)
   - [Advanced Settings](#46-advanced-settings)
   - [Recovery Steps](#47-recovery-steps)
   - [Bot Schedule](#48-bot-schedule)
   - [Lifecycle Methods](#49-lifecycle-methods)
   - [Dependency Injection](#410-dependency-injection)
   - [Manager Events](#411-manager-events)
   - [Serialization](#412-serialization)
5. [Supported Strategies](#5-supported-strategies)
6. [Risk Management](#6-risk-management)
7. [Profit Locking](#7-profit-locking)
8. [ContractParams — Deriv API Shape](#8-contractparams--deriv-api-shape)
9. [Full Usage Examples](#9-full-usage-examples)
   - [Example 1: Martingale on Volatility 100](#91-example-1-martingale-on-volatility-100)
   - [Example 2: D'Alembert with Schedule & Risk Limits](#92-example-2-dalembert-with-schedule--risk-limits)
   - [Example 3: Oscar's Grind with Profit Locking](#93-example-3-oscars-grind-with-profit-locking)
   - [Example 4: 1-3-2-6 System with Recovery Steps](#94-example-4-1-3-2-6-system-with-recovery-steps)
   - [Example 5: Reverse Martingale with Custom Contract Overrides](#95-example-5-reverse-martingale-with-custom-contract-overrides)
10. [Event Reference](#10-event-reference)
11. [Error Handling](#11-error-handling)
12. [Cleanup & Destruction](#12-cleanup--destruction)

---

## 1. Quick Start

```ts
import {
  TradingBotManager,
  TradingBotExecutor,
  BOT_STATUSES,
  STRATEGY_TYPES,
} from './engine';

// ── Step 1: Create the Executor (network layer) ─────────────────────────
const executor = new TradingBotExecutor({
  apiBaseUrl: 'https://api.koppo.io/api/v1',
  authToken: 'eyJhbGciOiJIUzI1NiIs...',
  derivEndpointDomain: 'green.derivws.com',
  derivAppId: '12345',
  derivLang: 'EN',
  connectionTimeout: 15000,
  maxRetryAttempts: 3,
  minStake: 0.35,
  maxStake: 50000,
});

// ── Step 2: Define the bot configuration (from your StrategyForm) ───────
const formPayload = {
  strategyId: 'martingale',
  botName: 'V100 Martingale Bot',
  botDescription: 'Digit Differs on Volatility 100 with 2x Martingale',
  botAccount: {
    token: 'a1-xYzAbCdEfGhIjK',       // Deriv API token
    account: 'CR1234567',               // Deriv login ID
    currency: 'USD',                    // Account currency
  },
  contract: {
    tradeType: 'DIGITDIFF',
    contractType: 'DIGITDIFF',
    prediction: '5',
    market: { symbol: 'R_100', displayName: 'Volatility 100 Index', shortName: 'V100' },
    duration: 1,
    durationUnits: 't',                 // t = ticks, s = seconds, m = minutes
    delay: 1,                           // seconds between trades
  },
  amounts: {
    base_stake:    { type: 'fixed', value: 1.00 },
    maximum_stake: { type: 'fixed', value: 50.00 },
    take_profit:   { type: 'fixed', value: 10.00 },
    stop_loss:     { type: 'fixed', value: 5.00 },
  },
  advanced_settings: {
    general_settings_section: {
      maximum_number_of_trades: 100,
      cooldown_period: { duration: 30, unit: 'seconds' },
      auto_restart: true,
    },
    risk_management_section: {
      max_consecutive_losses: 5,
      max_daily_loss: { type: 'fixed', value: 20 },
      emergency_stop: true,
    },
    martingale_strategy_section: {
      martingale_multiplier: 2,
      martingale_max_steps: 6,
      martingale_reset_on_profit: true,
      martingale_safety_net: 10,        // max 10% of balance per trade
    },
  },
  recovery_steps: {
    risk_steps: [
      { id: '1', lossStreak: 3, multiplier: 1.5, action: 'increase' },
      { id: '2', lossStreak: 5, multiplier: 2.0, action: 'increase' },
      { id: '3', lossStreak: 7, multiplier: 0.5, action: 'decrease' },
    ],
  },
};

// ── Step 3: Create the Manager (intelligence layer) ─────────────────────
const manager = TradingBotManager.fromFormData(formPayload, executor, {
  botName: 'V100 Martingale Bot',
  createdBy: 'user_abc123',
  botCurrency: 'USD',
});

// ── Step 4: Wire up events ──────────────────────────────────────────────
manager.on('trade_won',             (e) => console.log('✅ WIN',  e.result.profit));
manager.on('trade_lost',            (e) => console.log('❌ LOSS', e.result.profit));
manager.on('stop_loss_triggered',   ()  => console.log('🛑 Stop loss hit'));
manager.on('take_profit_triggered', ()  => console.log('🎯 Take profit hit'));
manager.on('emergency_stop',        (e) => console.log('🚨 Emergency:', e.reason));
manager.on('status_changed',        (e) => console.log(`Status: ${e.from} → ${e.to}`));
manager.on('error',                 (e) => console.error('Error:', e.message));
manager.on('log',                   (e) => console.log(`[LOG] ${e.message}`));

// ── Step 5: Provide account balance ─────────────────────────────────────
let accountBalance = 1000;
manager.setBalanceProvider(() => accountBalance);

// ── Step 6: Optionally persist to API first ─────────────────────────────
const savedBot = await executor.createBot(manager.toConfig());
console.log('Bot saved:', savedBot.botUUID);

// ── Step 7: Start the bot ───────────────────────────────────────────────
const result = await manager.start();
if (!result.success) {
  console.error('Failed to start:', result.error);
}

// ── Step 8: Control the bot ─────────────────────────────────────────────
// manager.pause();
// manager.resume();
// await manager.stop();
// await manager.emergencyStop('Manual emergency');
```

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TradingBotManager                            │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ Strategy Logic │  │ Risk Manager │  │ Schedule / Cooldown     │  │
│  │ (12 strategies)│  │ (SL/TP/DD)   │  │ (hourly/daily/weekly)   │  │
│  └───────┬───────┘  └──────┬───────┘  └────────────┬────────────┘  │
│          │                 │                        │               │
│          └─────────────────┼────────────────────────┘               │
│                            │                                        │
│                    ┌───────▼───────┐                                │
│                    │  Trade Loop   │                                │
│                    │  (async loop) │                                │
│                    └───────┬───────┘                                │
│                            │                                        │
│  Events ◄──────────────────┤                                        │
│  (20+ types)               │                                        │
└────────────────────────────┼────────────────────────────────────────┘
                             │  executeTrade(params, token)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       TradingBotExecutor                            │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────────┐  │
│  │ Bot CRUD     │  │ Deriv API     │  │ Trade Persistence       │  │
│  │ (REST API)   │  │ (WebSocket)   │  │ (BotContractTrade API)  │  │
│  └──────────────┘  └───────────────┘  └─────────────────────────┘  │
│                                                                     │
│  Features:                                                          │
│  • Retry logic (exponential backoff + jitter)                       │
│  • Contract validation                                              │
│  • Trade result normalisation (triple-check safe profit)            │
│  • Async trade record persistence                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. TradingBotExecutor — API & Execution Layer

### 3.1 Constructor Options

```ts
interface ExecutorOptions {
  apiBaseUrl: string;            // e.g. 'https://api.koppo.io/api/v1'
  authToken?: string;            // JWT bearer token
  derivEndpointDomain?: string;  // e.g. 'green.derivws.com'
  derivAppId?: string;           // e.g. '12345'
  derivLang?: string;            // default: 'EN'
  connectionTimeout?: number;    // default: 15000 (ms)
  maxRetryAttempts?: number;     // default: 3
  retryDelayBase?: number;       // default: 1000 (ms)
  minStake?: number;             // default: 0.35
  maxStake?: number;             // default: 50000
}
```

### 3.2 Bot CRUD Methods

| Method | Returns | Description |
|---|---|---|
| `createBot(payload)` | `Promise<BotRecord>` | Create a new bot on the API |
| `loadBot(botUUID)` | `Promise<BotRecord>` | Load an existing bot by UUID |
| `updateBot(botUUID, updates)` | `Promise<BotRecord>` | Partial update |
| `deleteBot(botUUID)` | `Promise<BotRecord>` | Soft-delete |
| `cloneBot(botUUID)` | `Promise<BotRecord>` | Clone with reset stats |
| `listBots(params?)` | `Promise<PaginatedList>` | List with filters |

### 3.3 Field-Specific API Updates

| Method | Description |
|---|---|
| `updateBotStatus(uuid, status)` | Trigger start/stop/pause/resume via API |
| `updateAmounts(uuid, amounts)` | Update stake/TP/SL amounts |
| `updateRealtimePerformance(uuid, perf)` | Sync realtime metrics |
| `updateStatistics(uuid, stats)` | Sync lifetime statistics |
| `updateAdvancedSettings(uuid, settings)` | Update strategy settings |

### 3.4 Trade Execution

```ts
// Execute a single trade with retry logic
const result = await executor.executeTrade(contractParams, userAccountToken);
```

The executor:
1. Validates `contractParams` (required fields, amount bounds)
2. Connects to Deriv WebSocket API
3. Authenticates with the user token
4. Creates and purchases the contract
5. Waits for settlement (`is_sold`)
6. Normalises the result into a standard `TradeResult`
7. Persists the trade record to `BotContractTrade` API (async, fire-and-forget)
8. Returns the `TradeResult`

On failure, it retries up to `maxRetryAttempts` times with exponential backoff + jitter.

### 3.5 Contract Parameter Building

```ts
// Build Deriv-compatible params from bot config + calculated stake
const params = executor.buildContractParams(
  contractConfig,  // bot's contract data
  stake,           // calculated by the Manager
  'USD',           // currency
  { barrier: '3' } // optional overrides for any field
);
```

**Output shape** (sent to Deriv API):

```ts
{
  amount: 1.50,
  basis: 'stake',
  contract_type: 'DIGITDIFF',
  currency: 'USD',
  symbol: 'R_100',
  duration: 1,
  duration_unit: 't',
  barrier: '5',          // from prediction
  multiplier: undefined, // only for multiplier contracts
}
```

### 3.6 Executor Events

| Event | Payload | When |
|---|---|---|
| `bot_created` | `{ botId, data }` | After successful `createBot()` |
| `bot_loaded` | `{ botId, data }` | After successful `loadBot()` |
| `bot_updated` | `{ botId, data }` | After successful `updateBot()` |
| `bot_deleted` | `{ botId }` | After successful `deleteBot()` |
| `bot_cloned` | `{ originalId, cloneData }` | After successful `cloneBot()` |
| `session_started` | `{ sessionId }` | When `startSession()` is called |
| `session_ended` | `{ sessionId, trades }` | When `endSession()` is called |
| `trade_attempt` | `{ attempt, maxAttempts, params }` | Before each purchase attempt |
| `trade_executed` | `{ result, attempt }` | After successful trade |
| `trade_error` | `{ attempt, maxAttempts, error }` | After a failed attempt |
| `trade_all_attempts_failed` | `{ error, params }` | All retries exhausted |
| `trade_validation_failed` | `{ errors, params }` | Contract params invalid |
| `trade_persist_error` | `{ error, tradeData }` | Trade record save failed |
| `contract_update` | `{ status, payout, bid_price }` | Deriv contract status change |

---

## 4. TradingBotManager — Runtime Engine

### 4.1 Static Factory: `fromFormData()`

The recommended way to create a Manager instance:

```ts
const manager = TradingBotManager.fromFormData(
  formPayload,  // Raw JSON from the StrategyForm builder
  executor,     // TradingBotExecutor instance
  {             // Optional meta overrides
    botName: 'My Bot',
    botDescription: 'Description',
    botTags: ['martingale', 'v100'],
    createdBy: 'user-uuid',
    botCurrency: 'USD',
    strategyId: 'martingale',
  }
);
```

You can also construct directly:

```ts
const manager = new TradingBotManager(fullConfig, executor);
```

### 4.2 BotConfig Shape

The full configuration object accepted by the constructor and produced by `fromFormData()`:

```ts
interface BotConfig {
  // ── Identity ──────────────────────────────────────────────────────
  botId: string;                    // Auto-generated if not provided
  botUUID: string;                  // Set by API after creation
  strategyId: string;               // e.g. 'martingale', 'dalembert', 'oscars_grind'
  botName: string;
  botDescription: string;
  botIcon: string;
  botThumbnail: string;
  botBanner: string;
  botTags: string[];
  botCurrency: string;              // e.g. 'USD'
  createdBy: string;                // User UUID

  // ── Flags ─────────────────────────────────────────────────────────
  isActive: boolean;
  isPremium: boolean;
  isPublic: boolean;
  status: 'IDLE' | 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'ERROR';

  // ── Timestamps ────────────────────────────────────────────────────
  createdAt: string;                // ISO 8601
  updatedAt: string;
  deletedAt: string | null;

  // ── Version ───────────────────────────────────────────────────────
  version: {
    current: string;                // e.g. '1.0.0'
    notes: string;
    date: string;
  };

  // ── Core Trading Config ───────────────────────────────────────────
  botAccount: BotDerivAccount;      // Deriv account credentials
  contract: BotContractData;        // What to trade
  amounts: BotAmounts;              // How much to trade
  recovery_steps: { risk_steps: BotRiskStep[] };
  advanced_settings: BotAdvancedSettings;

  // ── Runtime (managed internally) ──────────────────────────────────
  realtimePerformance: BotRealtimePerformance;
  statistics: BotStatistics;
  metadata: Record<string, unknown>;
}
```

### 4.3 Deriv Account Object

```ts
interface BotDerivAccount {
  token: string;      // Deriv API token (e.g. 'a1-xYzAbCdEfGhIjK')
  account: string;    // Deriv login ID (e.g. 'CR1234567')
  currency: string;   // Account currency (e.g. 'USD')
}
```

**Example:**

```ts
const botAccount = {
  token: 'a1-xYzAbCdEfGhIjK',
  account: 'CR1234567',
  currency: 'USD',
};
```

> **Security:** The token is only used by the Executor when purchasing contracts. It is never logged or exposed in events. The API middleware masks tokens for non-owner access.

### 4.4 Contract Data & Custom Overrides

```ts
interface BotContractData {
  tradeType: string;            // e.g. 'DIGITDIFF', 'CALLE', 'PUTE', 'CALLE|PUTE'
  contractType: string;         // e.g. 'DIGITDIFF', 'CALL', 'PUT', 'ALTERNATE'
  prediction: string;           // e.g. '5' (digit prediction), '' for rise/fall
  predictionRandomize?: boolean;
  market: {
    symbol: string;             // e.g. 'R_100', '1HZ100V', 'R_50'
    displayName: string;        // e.g. 'Volatility 100 Index'
    shortName: string;          // e.g. 'V100'
    market_name?: string;
    type?: string;
    isClosed?: boolean;
  } | null;
  marketRandomize?: boolean;
  multiplier?: number;          // For multiplier contracts
  delay?: number;               // Seconds between trades (default: 1)
  duration: number;             // Contract duration value
  durationUnits: string;        // 't' | 's' | 'm' | 'h' | 'd'
  allowEquals?: boolean;
  alternateAfter?: number;      // Switch trade type every N trades (for ALTERNATE)
}
```

**Example — Digit Differs on V100:**

```ts
const contract = {
  tradeType: 'DIGITDIFF',
  contractType: 'DIGITDIFF',
  prediction: '5',
  market: { symbol: 'R_100', displayName: 'Volatility 100 Index', shortName: 'V100' },
  duration: 1,
  durationUnits: 't',
  delay: 1,
};
```

**Example — Alternating Rise/Fall:**

```ts
const contract = {
  tradeType: 'CALLE|PUTE',       // Pipe-separated = alternate between these
  contractType: 'ALTERNATE',
  prediction: '',
  market: { symbol: 'R_100', displayName: 'Volatility 100 Index', shortName: 'V100' },
  duration: 5,
  durationUnits: 't',
  delay: 2,
  alternateAfter: 1,             // Switch every 1 trade
};
```

**Custom Overrides via `buildContractParams()`:**

The Executor's `buildContractParams()` accepts a 4th argument for overrides:

```ts
// Override the barrier (prediction) and duration at execution time
const params = executor.buildContractParams(
  manager.contract,
  calculatedStake,
  'USD',
  {
    barrier: '7',          // Override prediction from '5' to '7'
    duration: 3,           // Override duration from 1 to 3
    duration_unit: 's',    // Override from ticks to seconds
  }
);
```

This is useful for:
- Dynamic prediction changes based on market analysis
- Adjusting duration based on volatility
- Switching symbols mid-session

### 4.5 Amounts Configuration

Each amount field supports three types:

```ts
interface BotAmountConfig {
  type: 'fixed' | 'percentage' | 'dynamic';
  value: number;
  min?: number;
  max?: number;
  balancePercentage?: number;  // Used when type = 'percentage'
}
```

| Type | Behaviour |
|---|---|
| `fixed` | Uses `value` directly (e.g. `{ type: 'fixed', value: 1.50 }` → $1.50) |
| `percentage` | Calculates from current balance (e.g. `{ type: 'percentage', value: 2 }` → 2% of balance) |
| `dynamic` | Scales `value` by win rate: `value × (0.5 + winRate)` — ranges from 50% to 150% of base |

**Example:**

```ts
const amounts = {
  base_stake:    { type: 'fixed', value: 1.00 },
  maximum_stake: { type: 'percentage', value: 5 },   // 5% of balance
  take_profit:   { type: 'fixed', value: 15.00 },
  stop_loss:     { type: 'dynamic', value: 10.00 },  // 10 × (0.5 + winRate)
};
```

### 4.6 Advanced Settings

The `advanced_settings` object contains **21 sections**, each controlling a different aspect of the bot:

| Section | Purpose |
|---|---|
| `general_settings_section` | Max trades, max runtime, cooldown, compound stake, auto-restart |
| `bot_schedule` | Schedule-based execution (hourly/daily/weekly/monthly/custom) |
| `risk_management_section` | Daily loss/profit limits, max consecutive losses, drawdown, emergency stop |
| `volatility_controls_section` | Volatility filter, min/max volatility, pause on high volatility |
| `market_conditions_section` | Trend detection, ranging market avoidance, time-of-day filter |
| `recovery_settings_section` | Progressive recovery, max attempts, recovery cooldown |
| `martingale_strategy_section` | Multiplier, max steps, safety net, reset on profit |
| `martingale_reset_strategy_section` | Reset frequency, multiplier adjustment |
| `dalembert_strategy_section` | Increment/decrement, max units, conservative mode |
| `dalembert_reset_strategy_section` | Reset frequency, adaptive increment, session profit lock |
| `reverse_martingale_strategy_section` | Multiplier, max wins, profit lock, aggressive mode |
| `reverse_martingale_reset_strategy_section` | Win streak reset, profit target reset |
| `reverse_dalembert_strategy_section` | Increment/decrement, profit ceiling |
| `reverse_dalembert_reset_strategy_section` | Reset interval, dynamic reset, win rate threshold |
| `reverse_dalembert_main_strategy_section` | Full reverse D'Alembert with min/max units, streak bonus |
| `accumulator_strategy_section` | Growth rate, target multiplier, auto-cashout, trailing stop |
| `options_martingale_section` | Options-specific martingale settings |
| `options_dalembert_section` | Options-specific D'Alembert settings |
| `options_reverse_martingale_section` | Options-specific reverse martingale settings |
| `system_1326_strategy_section` | Sequence, cycle targets, partial profit lock, loss recovery |
| `oscars_grind_strategy_section` | Base unit, profit target, increment on win, auto-stop |

### 4.7 Recovery Steps

Recovery steps define how the bot adjusts its stake after consecutive losses:

```ts
const recovery_steps = {
  risk_steps: [
    { id: '1', lossStreak: 2, multiplier: 1.2, action: 'increase' },
    { id: '2', lossStreak: 4, multiplier: 1.5, action: 'increase' },
    { id: '3', lossStreak: 6, multiplier: 2.0, action: 'increase' },
    { id: '4', lossStreak: 8, multiplier: 0.5, action: 'decrease' }, // Safety: reduce
  ],
};
```

When `progressive_recovery` is enabled in `recovery_settings_section`, the bot advances through steps sequentially. Otherwise, it matches the current loss streak to the closest step.

### 4.8 Bot Schedule

```ts
const schedule = {
  bot_schedule: {
    id: 'sched_1',
    name: 'Weekday Trading Hours',
    type: 'weekly',                    // 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    startTime: '2025-01-01T08:00:00Z', // 08:00 UTC
    endTime: '2025-01-01T16:00:00Z',   // 16:00 UTC
    daysOfWeek: [1, 2, 3, 4, 5],       // Mon–Fri (0=Sun, 6=Sat)
    isEnabled: true,
    exclusions: [
      { id: 'exc_1', date: '2025-12-25', reason: 'Christmas — markets closed' },
      { id: 'exc_2', date: '2025-01-01', reason: 'New Year' },
    ],
  },
};
```

The Manager checks the schedule every 60 seconds. If the bot is running outside the schedule window, it auto-pauses. When the window opens again, it auto-resumes.

### 4.9 Lifecycle Methods

| Method | Description |
|---|---|
| `await manager.start()` | Validate config → check schedule → init session → begin trade loop |
| `manager.pause()` | Pause the trade loop (preserves session state) |
| `manager.resume()` | Resume from paused state (re-checks schedule) |
| `await manager.stop()` | Stop completely, finalize stats, persist to API |
| `await manager.emergencyStop(reason)` | Immediate halt with ERROR status |
| `manager.validate()` | Check config readiness without starting |

### 4.10 Dependency Injection

```ts
// Required: provide current account balance
manager.setBalanceProvider(() => myDerivAccountBalance);

// Optional: provide current market volatility (0-100)
manager.setVolatilityProvider(() => currentVolatilityIndex);

// Optional: how often to sync stats to API (default: every 5 trades)
manager.setPersistInterval(10);
```

### 4.11 Manager Events

| Event | Payload | When |
|---|---|---|
| `status_changed` | `{ from, to }` | Bot status transitions |
| `trade_won` | `{ result, consecutiveWins }` | Trade settled as win |
| `trade_lost` | `{ result, consecutiveLosses }` | Trade settled as loss |
| `stake_updated` | `{ stake }` | New stake calculated |
| `strategy_reset` | `{ message }` | Strategy counters reset |
| `recovery_triggered` | `{ lossStreak, recoveryAttempts }` | Entered recovery mode |
| `recovery_step_changed` | `{ stepIndex }` | Advanced to next recovery step |
| `stop_loss_triggered` | `{ sessionProfit }` | Stop loss limit reached |
| `take_profit_triggered` | `{ sessionProfit }` or `{ message }` | Take profit target reached |
| `cooldown_started` | `{ durationMs, type }` | Cooldown period began |
| `cooldown_ended` | `{ type }` | Cooldown period ended |
| `schedule_check` | `{ withinSchedule }` | Periodic schedule check |
| `schedule_paused` | `{ message }` | Paused due to schedule |
| `max_trades_reached` | `{ maxTrades }` | Trade limit hit |
| `max_runtime_reached` | `{ maxRuntime }` | Runtime limit hit |
| `risk_limit_hit` | `{ type, value, current? }` | Any risk limit triggered |
| `emergency_stop` | `{ reason, timestamp }` | Emergency stop activated |
| `volatility_pause` | `{ volatility, min?, max? }` | Volatility outside bounds |
| `profit_locked` | `{ locked, totalLocked, sessionProfit }` | Profit portion locked |
| `profit_protection_triggered` | `{ lockedProfit, currentProfit }` | Profit dropped below lock |
| `persist_error` | `{ error, context? }` | API persistence failed |
| `error` | `{ message, error }` | Trade execution error |
| `log` | `{ message, botId, timestamp }` | General log message |

### 4.12 Serialization

```ts
// Get the full config object (for API persistence)
const config = manager.toConfig();

// Same as toConfig() — used by JSON.stringify()
const json = manager.toJSON();

// Persist to API
await executor.updateBot(manager.botUUID, config);
```

---

## 5. Supported Strategies

| Strategy ID | Stake on Win | Stake on Loss | Key Settings |
|---|---|---|---|
| `martingale` | Reset to base | Multiply by N | `martingale_multiplier`, `martingale_max_steps`, `martingale_safety_net` |
| `martingale_reset` | Reset to base | Multiply + periodic reset | `reset_after_trades`, `reset_multiplier_adjustment` |
| `dalembert` | Decrease by N units | Increase by N units | `dalembert_increment`, `dalembert_decrement`, `dalembert_max_units` |
| `dalembert_reset` | Decrease + periodic reset | Increase + adaptive | `dalembert_reset_frequency`, `dalembert_adaptive_increment` |
| `reverse_martingale` | Multiply by N | Reset to base | `reverse_martingale_multiplier`, `reverse_martingale_max_wins` |
| `reverse_martingale_reset` | Multiply + win streak reset | Reset to base | `reverse_reset_win_streak`, `reverse_reset_profit_target` |
| `reverse_dalembert` | Increase by N units | Decrease by N units | `reverse_dalembert_increment`, `reverse_dalembert_profit_ceiling` |
| `reverse_dalembert_reset` | Increase + periodic reset | Decrease + dynamic | `reverse_dalembert_reset_interval`, `reverse_dalembert_win_rate_threshold` |
| `oscars_grind` | Increase by 1 unit (if below target) | Maintain current | `oscars_grind_profit_target`, `oscars_grind_max_bet_units` |
| `system_1326` | Advance in 1-3-2-6 sequence | Reset to step 1 | `system_1326_sequence`, `system_1326_max_cycles` |
| `accumulator` | Grow by rate × streak | Reset to base | `accumulator_growth_rate`, `accumulator_target_multiplier` |
| `options_martingale` | Reset to base | Multiply (options) | `options_martingale_multiplier`, `options_prediction_mode` |

---

## 6. Risk Management

The Manager performs **11 pre-trade checks** before every trade:

1. **Bot running?** — Status must be `START`
2. **Cooldown active?** — Wait if in cooldown
3. **Within schedule?** — Wait if outside trading hours
4. **Max trades?** — Stop if `maximum_number_of_trades` reached
5. **Max consecutive losses?** — Enter cooldown if `max_consecutive_losses` reached
6. **Max daily loss?** — Stop if `max_daily_loss` reached
7. **Max daily profit?** — Stop if `max_daily_profit` reached (lock in gains)
8. **Max drawdown?** — Stop if `max_drawdown_percentage` from peak balance
9. **Emergency stop?** — Stop if loss exceeds 20× base stake
10. **Volatility filter?** — Wait if volatility outside min/max bounds
11. **Risk per trade?** — Cap stake at `risk_per_trade` % of balance

---

## 7. Profit Locking

The Manager tracks a **high water mark** for session profit. When configured (via `reverse_martingale_profit_lock`), it locks a percentage of profits:

```
Session profit: $15.00
Profit lock: 30%
Locked amount: $4.50
```

If the session profit drops below **50% of the locked amount**, the bot automatically stops to protect gains. Additionally, the `_clampStake()` method ensures the bot never risks more than 50% of unlocked funds.

---

## 8. ContractParams — Deriv API Shape

This is the final object sent to the Deriv API by the Executor:

```ts
interface ContractParams {
  amount: number;              // Stake amount (e.g. 1.50)
  basis: 'stake' | 'payout';  // Always 'stake' in this engine
  contract_type: string;       // e.g. 'DIGITDIFF', 'CALL', 'PUT', 'DIGITOVER'
  currency: string;            // e.g. 'USD'
  symbol: string;              // e.g. 'R_100', '1HZ100V'
  duration: number;            // e.g. 1, 5, 15
  duration_unit: string;       // 't' | 's' | 'm' | 'h' | 'd'
  barrier?: string;            // Prediction/barrier (e.g. '5')
  multiplier?: number;         // For multiplier contracts
}
```

---

## 9. Full Usage Examples

### 9.1 Example 1: Martingale on Volatility 100

```ts
const executor = new TradingBotExecutor({
  apiBaseUrl: 'https://api.koppo.io/api/v1',
  authToken: 'jwt-token-here',
  derivEndpointDomain: 'green.derivws.com',
  derivAppId: '12345',
});

const manager = TradingBotManager.fromFormData({
  strategyId: 'martingale',
  botAccount: { token: 'a1-xYzToken', account: 'CR123', currency: 'USD' },
  contract: {
    tradeType: 'DIGITDIFF',
    contractType: 'DIGITDIFF',
    prediction: '5',
    market: { symbol: 'R_100', displayName: 'Volatility 100 Index', shortName: 'V100' },
    duration: 1,
    durationUnits: 't',
    delay: 1,
  },
  amounts: {
    base_stake: { type: 'fixed', value: 0.50 },
    maximum_stake: { type: 'fixed', value: 25 },
    take_profit: { type: 'fixed', value: 5 },
    stop_loss: { type: 'fixed', value: 3 },
  },
  advanced_settings: {
    general_settings_section: { maximum_number_of_trades: 50, auto_restart: false },
    martingale_strategy_section: {
      martingale_multiplier: 2,
      martingale_max_steps: 5,
      martingale_reset_on_profit: true,
      martingale_safety_net: 15,
    },
  },
}, executor, { botName: 'V100 Martingale', createdBy: 'user_001' });

manager.setBalanceProvider(() => 500);
manager.on('trade_won', (e) => console.log(`WIN +${e.result.profit}`));
manager.on('trade_lost', (e) => console.log(`LOSS ${e.result.profit}`));
manager.on('stop_loss_triggered', () => console.log('Stop loss hit — bot stopped'));

await manager.start();
```

### 9.2 Example 2: D'Alembert with Schedule & Risk Limits

```ts
const manager = TradingBotManager.fromFormData({
  strategyId: 'dalembert',
  botAccount: { token: 'a1-myToken', account: 'CR456', currency: 'USD' },
  contract: {
    tradeType: 'DIGITOVER',
    contractType: 'DIGITOVER',
    prediction: '3',
    market: { symbol: 'R_50', displayName: 'Volatility 50 Index', shortName: 'V50' },
    duration: 5,
    durationUnits: 't',
    delay: 2,
  },
  amounts: {
    base_stake: { type: 'fixed', value: 1 },
    maximum_stake: { type: 'percentage', value: 5 },
    take_profit: { type: 'fixed', value: 20 },
    stop_loss: { type: 'fixed', value: 10 },
  },
  advanced_settings: {
    general_settings_section: {
      maximum_number_of_trades: 200,
      maximum_running_time: 3600,  // 1 hour max
      cooldown_period: { duration: 60, unit: 'seconds' },
      auto_restart: true,
    },
    bot_schedule: {
      bot_schedule: {
        id: 'sched_1', name: 'Weekday Hours', type: 'weekly',
        startTime: '2025-01-01T09:00:00Z',
        endTime: '2025-01-01T17:00:00Z',
        daysOfWeek: [1, 2, 3, 4, 5],
        isEnabled: true,
      },
    },
    risk_management_section: {
      max_consecutive_losses: 8,
      max_daily_loss: { type: 'fixed', value: 30 },
      max_daily_profit: { type: 'fixed', value: 50 },
      max_drawdown_percentage: 15,
      emergency_stop: true,
    },
    dalembert_strategy_section: {
      dalembert_increment: { type: 'fixed', value: 1 },
      dalembert_decrement: { type: 'fixed', value: 1 },
      dalembert_max_units: 20,
      dalembert_conservative_mode: true,
    },
  },
}, executor, { botName: 'V50 D\'Alembert Scheduled', createdBy: 'user_002' });

manager.setBalanceProvider(() => 1000);
manager.on('schedule_paused', (e) => console.log('Paused:', e.message));
manager.on('risk_limit_hit', (e) => console.log('Risk limit:', e.type, e.value));

await manager.start();
```

### 9.3 Example 3: Oscar's Grind with Profit Locking

```ts
const manager = TradingBotManager.fromFormData({
  strategyId: 'oscars_grind',
  botAccount: { token: 'a1-grindToken', account: 'CR789', currency: 'USD' },
  contract: {
    tradeType: 'CALLE',
    contractType: 'CALL',
    prediction: '',
    market: { symbol: '1HZ100V', displayName: 'Volatility 100 (1s) Index', shortName: 'V100 1s' },
    duration: 15,
    durationUnits: 's',
    delay: 2,
  },
  amounts: {
    base_stake: { type: 'fixed', value: 2 },
    maximum_stake: { type: 'fixed', value: 20 },
    take_profit: { type: 'fixed', value: 10 },
    stop_loss: { type: 'fixed', value: 8 },
  },
  advanced_settings: {
    oscars_grind_strategy_section: {
      oscars_grind_base_unit: { type: 'fixed', value: 2 },
      oscars_grind_profit_target: { type: 'fixed', value: 4 },
      oscars_grind_increment_on_win: true,
      oscars_grind_max_bet_units: 5,
      oscars_grind_reset_on_target: true,
      oscars_grind_auto_stop_on_target: false,
      oscars_grind_maintain_stake_on_loss: true,
    },
    // Enable profit locking via reverse martingale section
    reverse_martingale_strategy_section: {
      reverse_martingale_profit_lock: 40,  // Lock 40% of profits
    },
  },
}, executor, { botName: 'Oscar\'s Grind + Profit Lock', createdBy: 'user_003' });

manager.setBalanceProvider(() => 750);
manager.on('profit_locked', (e) => console.log(`Locked $${e.locked} (total: $${e.totalLocked})`));
manager.on('profit_protection_triggered', (e) => console.log('Profit protection! Stopping.'));

await manager.start();
```

### 9.4 Example 4: 1-3-2-6 System with Recovery Steps

```ts
const manager = TradingBotManager.fromFormData({
  strategyId: 'system_1326',
  botAccount: { token: 'a1-1326Token', account: 'CR321', currency: 'USD' },
  contract: {
    tradeType: 'DIGITEVEN',
    contractType: 'DIGITEVEN',
    prediction: '',
    market: { symbol: 'R_75', displayName: 'Volatility 75 Index', shortName: 'V75' },
    duration: 1,
    durationUnits: 't',
    delay: 1,
  },
  amounts: {
    base_stake: { type: 'fixed', value: 1 },
    maximum_stake: { type: 'fixed', value: 30 },
    take_profit: { type: 'fixed', value: 12 },
    stop_loss: { type: 'fixed', value: 6 },
  },
  recovery_steps: {
    risk_steps: [
      { id: '1', lossStreak: 3, multiplier: 1.5, action: 'increase' },
      { id: '2', lossStreak: 5, multiplier: 2.0, action: 'increase' },
      { id: '3', lossStreak: 7, multiplier: 0.5, action: 'decrease' },
    ],
  },
  advanced_settings: {
    general_settings_section: {
      recovery_type: 'system_1326',
      auto_restart: true,
      cooldown_period: { duration: 45, unit: 'seconds' },
    },
    recovery_settings_section: {
      progressive_recovery: true,
      recovery_multiplier: 1.2,
      max_recovery_attempts: 5,
      recovery_cooldown: { duration: 2, unit: 'minutes' },
    },
    system_1326_strategy_section: {
      system_1326_sequence: '1-3-2-6',
      system_1326_reset_on_loss: true,
      system_1326_max_cycles: 10,
      system_1326_partial_profit_lock: true,
      system_1326_stop_on_cycle_complete: false,
      system_1326_loss_recovery: true,
    },
  },
}, executor, { botName: '1-3-2-6 with Recovery', createdBy: 'user_004' });

manager.setBalanceProvider(() => 500);
manager.on('recovery_triggered', (e) => console.log(`Recovery! Streak: ${e.lossStreak}`));
manager.on('recovery_step_changed', (e) => console.log(`Recovery step: ${e.stepIndex}`));
manager.on('strategy_reset', (e) => console.log(`Reset: ${e.message}`));

await manager.start();
```

### 9.5 Example 5: Reverse Martingale with Custom Contract Overrides

This example shows how to override contract parameters at runtime:

```ts
const executor = new TradingBotExecutor({
  apiBaseUrl: 'https://api.koppo.io/api/v1',
  authToken: 'jwt-token',
  derivEndpointDomain: 'green.derivws.com',
  derivAppId: '12345',
});

const manager = TradingBotManager.fromFormData({
  strategyId: 'reverse_martingale',
  botAccount: { token: 'a1-revToken', account: 'CR555', currency: 'USD' },
  contract: {
    tradeType: 'CALLE|PUTE',
    contractType: 'ALTERNATE',
    prediction: '',
    market: { symbol: 'R_100', displayName: 'Volatility 100 Index', shortName: 'V100' },
    duration: 5,
    durationUnits: 't',
    delay: 3,
    alternateAfter: 2,  // Switch between CALL and PUT every 2 trades
  },
  amounts: {
    base_stake: { type: 'fixed', value: 1 },
    maximum_stake: { type: 'fixed', value: 50 },
    take_profit: { type: 'percentage', value: 5 },  // 5% of balance
    stop_loss: { type: 'percentage', value: 3 },     // 3% of balance
  },
  advanced_settings: {
    reverse_martingale_strategy_section: {
      reverse_martingale_multiplier: 1.5,
      reverse_martingale_max_wins: 4,
      reverse_martingale_profit_lock: 25,
      reverse_martingale_reset_on_loss: true,
      reverse_martingale_aggressive_mode: false,
    },
    risk_management_section: {
      max_consecutive_losses: 6,
      risk_per_trade: { type: 'fixed', value: 2 },  // Max 2% per trade
      position_sizing: true,
    },
    volatility_controls_section: {
      volatility_filter: true,
      min_volatility: 10,
      max_volatility: 80,
      pause_on_high_volatility: true,
    },
  },
}, executor, { botName: 'Reverse Martingale Alternating', createdBy: 'user_005' });

// Provide balance and volatility
manager.setBalanceProvider(() => 2000);
manager.setVolatilityProvider(() => {
  // In production, fetch from market data API
  return 45; // Current volatility index
});

// Listen for alternation
manager.on('log', (e) => {
  if (e.message.includes('Executing trade')) console.log(e.message);
});
manager.on('volatility_pause', (e) => console.log(`Volatility ${e.volatility} — pausing`));

await manager.start();
```

---

## 10. Event Reference

### Subscribing to Events

```ts
// Subscribe
manager.on('trade_won', handler);

// Unsubscribe
manager.off('trade_won', handler);
// or
manager.removeListener('trade_won', handler);

// One-time listener
manager.once('take_profit_triggered', () => {
  console.log('Target reached!');
});
```

### Combining Manager + Executor Events

```ts
// Executor events (network-level)
executor.on('trade_attempt', (e) => {
  console.log(`Attempt ${e.attempt}/${e.maxAttempts}`);
});

executor.on('trade_all_attempts_failed', (e) => {
  console.error('All attempts failed:', e.error);
});

// Manager events (logic-level)
manager.on('trade_won', (e) => updateUI('win', e.result));
manager.on('trade_lost', (e) => updateUI('loss', e.result));
manager.on('status_changed', (e) => updateStatusBadge(e.to));
```

---

## 11. Error Handling

```ts
// Validation errors (before start)
const validation = manager.validate();
if (!validation.isValid) {
  console.error('Config errors:', validation.errors);
  // e.g. ['Strategy ID is required', 'Base stake must be greater than 0']
}

// Start errors
const result = await manager.start();
if (!result.success) {
  console.error('Start failed:', result.error);
}

// Runtime errors (via events)
manager.on('error', (e) => {
  console.error(`[${e.message}]`);
  // Bot will auto-retry after 5s delay
});

// Executor-level errors
executor.on('trade_validation_failed', (e) => {
  console.error('Invalid params:', e.errors);
});

// API persistence errors (non-fatal)
manager.on('persist_error', (e) => {
  console.warn('Failed to sync to API:', e.error);
});
```

---

## 12. Cleanup & Destruction

```ts
// Stop the bot gracefully
await manager.stop();

// Destroy the manager (clears all timers, listeners, history)
manager.destroy();

// Destroy the executor (clears all state)
executor.destroy();
```

Always call `destroy()` when you're done with an instance to prevent memory leaks from lingering timers and event listeners.

---

## File Structure

```
src/modules/TradingBot/engine/
├── index.js                  # Entry point — exports everything
├── TradingBotManager.js      # Runtime engine (80KB, ~1950 lines)
├── TradingBotExecutor.js     # API + Deriv execution (26KB, ~690 lines)
├── example-usage.ts          # Full TypeScript usage example
└── README.md                 # This file
```

---

*Built for the Koppo Trading Platform. Powered by the Deriv API.*
