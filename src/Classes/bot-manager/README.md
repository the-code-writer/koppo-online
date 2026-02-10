# Bot Manager & Trading Bot — Developer Guide

> **Two-layer architecture**: `BotManager` handles API persistence & CRUD, while `TradingBot` is the runtime engine that actually executes trades, manages risk, and applies strategy logic.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [File Structure](#file-structure)
- [Quick Start](#quick-start)
- [TradingBot Class](#tradingbot-class)
  - [Creating a Bot from Form Data](#creating-a-bot-from-form-data)
  - [Wiring Up the Trade Executor](#wiring-up-the-trade-executor)
  - [Starting the Bot](#starting-the-bot)
  - [Lifecycle Methods](#lifecycle-methods)
  - [Event System](#event-system)
  - [Serializing Back to API](#serializing-back-to-api)
- [Strategy Stake Calculations](#strategy-stake-calculations)
  - [Martingale](#martingale)
  - [D'Alembert](#dalembert)
  - [Reverse Martingale](#reverse-martingale)
  - [Reverse D'Alembert](#reverse-dalembert)
  - [Oscar's Grind](#oscars-grind)
  - [1-3-2-6 System](#1-3-2-6-system)
  - [Stat Reset Variants](#stat-reset-variants)
  - [Options Variants](#options-variants)
- [Risk Management](#risk-management)
  - [Stop Loss & Take Profit](#stop-loss--take-profit)
  - [Daily / Hourly / Weekly Limits](#daily--hourly--weekly-limits)
  - [Max Drawdown](#max-drawdown)
  - [Emergency Stop](#emergency-stop)
  - [Risk Per Trade](#risk-per-trade)
- [Recovery System](#recovery-system)
- [Schedule System](#schedule-system)
- [Cooldown & Auto-Restart](#cooldown--auto-restart)
- [Contract & Trade Type Handling](#contract--trade-type-handling)
- [BotManager Class (API Layer)](#botmanager-class-api-layer)
  - [CRUD Operations](#crud-operations)
  - [API Endpoints](#api-endpoints)
  - [BotManager Events](#botmanager-events)
- [React Integration](#react-integration)
  - [useTradingBot Hook](#usetradingbot-hook)
  - [Full Page Example](#full-page-example)
- [TypeScript Reference](#typescript-reference)
- [Real-World Scenarios](#real-world-scenarios)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     StrategyForm (UI)                        │
│  User fills in contract, amounts, recovery steps, advanced   │
│  settings, schedule, risk management, strategy params...     │
└──────────────────────┬───────────────────────────────────────┘
                       │ formData (JSON)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                  TradingBot.fromFormData()                    │
│  Parses form data → creates a fully configured bot instance  │
└──────────────────────┬───────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐    ┌───────────────────────────────────┐
│   TradingBot     │    │         BotManager                │
│  (Runtime Engine)│    │       (API Persistence)           │
│                  │    │                                   │
│  • Trade loop    │    │  • createBot() → POST /bots      │
│  • Stake calc    │    │  • loadBot()   → GET /bots/:id   │
│  • Risk mgmt    │    │  • updateBot() → PUT /bots/:id   │
│  • Recovery      │    │  • deleteBot() → DELETE /bots/:id│
│  • Scheduling    │    │  • startBot()  → POST .../start  │
│  • Statistics    │    │  • Performance polling            │
│  • Events        │    │  • Event system                   │
└────────┬─────────┘    └───────────────────────────────────┘
         │
         │ tradeExecutor callback
         ▼
┌──────────────────────────────────────────────────────────────┐
│              Trading API (Deriv / Binary.com)                 │
│  Executes the actual contract: CALL, PUT, ACCU, etc.         │
└──────────────────────────────────────────────────────────────┘
```

**Key insight**: `TradingBot` does NOT call APIs directly. You inject a `tradeExecutor` function that bridges to your actual trading API. This keeps the bot logic pure and testable.

---

## File Structure

```
src/Classes/bot-manager/
├── BotManager.ts          # API layer — CRUD, status, events
├── BotManager.example.ts  # Usage examples for BotManager
├── TradingBot.ts          # Runtime engine — trade loop, strategies, risk
└── README.md              # This file
```

---

## Quick Start

### Minimal Example: Create and Run a Martingale Bot

```typescript
import { TradingBot, TradeResult } from './TradingBot';

// 1. Raw form data from StrategyForm submission
const formData = {
  strategyId: 'martingale',
  contract: {
    id: 'step-123',
    tradeType: 'CALLE|PUTE',
    contractType: 'ALTERNATE',
    prediction: '8',
    predictionRandomize: false,
    market: {
      symbol: 'R_100',
      displayName: 'Volatility 100 (1s) Index',
      shortName: 'Volatility 100',
      market_name: 'synthetic_index',
      type: 'volatility' as const,
    },
    marketRandomize: false,
    multiplier: 3.125,
    delay: 1,
    duration: 1,
    durationUnits: 'ticks',
    allowEquals: false,
    alternateAfter: 9,
  },
  amounts: {
    base_stake: { type: 'fixed', value: 0.35 },
    maximum_stake: { type: 'percentage', value: 0, balancePercentage: 0 },
    take_profit: { type: 'fixed', value: 2 },
    stop_loss: { type: 'fixed', value: 5 },
  },
  recovery_steps: {
    risk_steps: [
      { id: 'rs-1', lossStreak: 3, multiplier: 2, action: 'double' },
      { id: 'rs-2', lossStreak: 5, multiplier: 3, action: 'triple' },
    ],
  },
  advanced_settings: {
    general_settings_section: {
      maximum_number_of_trades: 100,
      maximum_running_time: 3600, // 1 hour in seconds
      cooldown_period: { duration: 30, unit: 'seconds' },
      recovery_type: 'on',
      compound_stake: false,
      auto_restart: true,
    },
    bot_schedule: {
      bot_schedule: {
        id: 'sched-1',
        name: 'Weekday Trading',
        type: 'daily' as const,
        startDate: '2026-02-09T00:00:00Z',
        startTime: '2026-02-09T07:00:00Z',
        endTime: '2026-02-09T17:00:00Z',
        isEnabled: true,
        exclusions: [],
      },
    },
    risk_management_section: {
      max_daily_loss: { type: 'fixed', value: 20 },
      max_daily_profit: { type: 'fixed', value: 50 },
      max_consecutive_losses: 8,
      max_drawdown_percentage: 15,
      risk_per_trade: 2,
      position_sizing: true,
      emergency_stop: true,
    },
    // ... other sections use defaults
    volatility_controls_section: {
      volatility_filter: false,
      min_volatility: null,
      max_volatility: null,
      volatility_adjustment: false,
      pause_on_high_volatility: false,
      volatility_lookback_period: null,
    },
    market_conditions_section: {
      trend_detection: false,
      trend_strength_threshold: null,
      avoid_ranging_market: false,
      market_correlation_check: false,
      time_of_day_filter: false,
      preferred_trading_hours: null,
    },
    recovery_settings_section: {
      progressive_recovery: true,
      recovery_multiplier: 1.5,
      max_recovery_attempts: 5,
      recovery_cooldown: { duration: 60, unit: 'seconds' },
      partial_recovery: false,
      recovery_threshold: null,
      metadata: null,
    },
    martingale_strategy_section: {
      martingale_multiplier: 2,
      martingale_max_steps: 6,
      martingale_reset_on_profit: true,
      martingale_progressive_target: false,
      martingale_safety_net: 10, // 10% of balance max
      metadata: null,
    },
    // ... remaining sections get defaults automatically
  },
  realtimePerformance: {
    totalRuns: 0, numberOfWins: 0, numberOfLosses: 0,
    totalStake: 0, totalPayout: 0,
    startedAt: null, stoppedAt: null,
    currentStake: 0, baseStake: 0, highestStake: 0,
  },
  statistics: {
    lifetimeRuns: 0, lifetimeWins: 0, lifetimeLosses: 0,
    longestWinStreak: 0, longestLossStreak: 0,
    shortestWinStreak: 0, shortestLossStreak: 0,
    totalStake: 0, totalProfit: 0, totalPayout: 0,
    averageWinAmount: 0, averageLossAmount: 0,
    winRate: 0, profitFactor: 0,
    highestStake: 0, highestPayout: 0,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  },
};

// 2. Create the bot
const bot = TradingBot.fromFormData(formData, {
  botName: 'My Martingale V100',
  botDescription: 'Martingale on Volatility 100 with 2x multiplier',
  botTags: ['martingale', 'v100', 'auto'],
  createdBy: 'user-abc-123',
  botCurrency: 'USD',
});

// 3. Inject the trade executor (your bridge to the real trading API)
bot.setTradeExecutor(async (params) => {
  // This is where you call your actual trading API
  // e.g., Deriv WebSocket API, REST endpoint, etc.
  console.log(`Placing trade: ${params.tradeType} on ${params.symbol} @ $${params.amount}`);

  const response = await myTradingAPI.placeTrade({
    symbol: params.symbol,
    contract_type: params.tradeType,
    amount: params.amount,
    duration: params.duration,
    duration_unit: params.durationUnits,
    basis: params.basis,
    currency: params.currency,
  });

  // Return a TradeResult
  return {
    tradeId: response.buy_id,
    contractId: response.contract_id,
    entryTime: new Date().toISOString(),
    exitTime: new Date().toISOString(),
    stake: params.amount,
    payout: response.payout,
    profit: response.profit,
    isWin: response.profit > 0,
    contractType: params.tradeType,
    market: params.symbol,
    duration: params.duration,
    durationUnits: params.durationUnits,
  };
});

// 4. Inject the balance provider
bot.setBalanceProvider(() => {
  return myAccountService.getBalance(); // Returns current account balance
});

// 5. Listen to events
bot.on('trade_won', (e) => console.log(`WIN: ${e.message}`));
bot.on('trade_lost', (e) => console.log(`LOSS: ${e.message}`));
bot.on('stop_loss_triggered', (e) => console.log(`STOP LOSS: ${e.message}`));
bot.on('take_profit_triggered', (e) => console.log(`TAKE PROFIT: ${e.message}`));
bot.on('recovery_triggered', (e) => console.log(`RECOVERY: ${e.message}`));
bot.on('cooldown_started', (e) => console.log(`COOLDOWN: ${e.message}`));
bot.on('emergency_stop', (e) => console.log(`EMERGENCY: ${e.message}`));
bot.on('status_changed', (e) => console.log(`STATUS: ${e.data.from} → ${e.data.to}`));
bot.on('error', (e) => console.error(`ERROR: ${e.message}`));

// 6. Start!
const result = await bot.start();
if (!result.success) {
  console.error('Failed to start:', result.error);
}

// 7. Later — stop the bot
bot.stop();

// 8. Serialize for API persistence
const configForAPI = bot.toJSON();
await fetch('/api/bots', {
  method: 'POST',
  body: JSON.stringify(configForAPI),
});
```

---

## TradingBot Class

### Creating a Bot from Form Data

The `TradingBot.fromFormData()` static factory accepts the raw JSON payload from the StrategyForm and creates a fully initialized bot instance.

```typescript
import { TradingBot } from './TradingBot';

// From form submission handler
const handleFormSubmit = (formData: any) => {
  const bot = TradingBot.fromFormData(formData, {
    botName: 'EUR/USD Scalper',
    botDescription: 'D\'Alembert strategy for forex scalping',
    createdBy: currentUser.uid,
    botCurrency: 'USD',
    botTags: ['dalembert', 'forex', 'scalping'],
  });

  // Validate before doing anything
  const validation = bot.validate();
  if (!validation.isValid) {
    console.error('Validation errors:', validation.errors);
    // Show errors to user
    return;
  }

  // Bot is ready to use
  console.log('Bot ID:', bot.botId);
  console.log('Strategy:', bot.strategyId);
  console.log('Contract:', bot.contract);
  console.log('Status:', bot.status); // 'IDLE'
};
```

You can also construct directly from a `BotConfiguration` object (e.g., loaded from the API):

```typescript
import { TradingBot } from './TradingBot';
import { BotConfiguration } from './BotManager';

// From API response
const savedConfig: BotConfiguration = await api.getBot('bot-123');
const bot = new TradingBot(savedConfig);
```

### Wiring Up the Trade Executor

The `TradingBot` does **not** know how to place trades. You provide a `tradeExecutor` callback that bridges to your trading API. This keeps the bot logic decoupled and testable.

```typescript
// Real-world example with Deriv WebSocket API
bot.setTradeExecutor(async (params) => {
  return new Promise((resolve, reject) => {
    const ws = derivWebSocket; // Your existing WebSocket connection

    // Send buy request
    ws.send(JSON.stringify({
      buy: 1,
      price: params.amount,
      parameters: {
        contract_type: params.tradeType,
        symbol: params.symbol,
        duration: params.duration,
        duration_unit: params.durationUnits[0], // 't' for ticks
        basis: params.basis,
        amount: params.amount,
        currency: params.currency,
      },
    }));

    // Listen for result
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.buy) {
        // Trade placed — now wait for settlement
        waitForSettlement(data.buy.contract_id).then((settlement) => {
          resolve({
            tradeId: data.buy.transaction_id,
            contractId: data.buy.contract_id,
            entryTime: new Date().toISOString(),
            exitTime: settlement.exit_time,
            stake: params.amount,
            payout: settlement.payout || 0,
            profit: settlement.profit,
            isWin: settlement.profit > 0,
            contractType: params.tradeType,
            market: params.symbol,
            duration: params.duration,
            durationUnits: params.durationUnits,
          });
        });
      }

      if (data.error) {
        reject(new Error(data.error.message));
      }
    };
  });
});
```

**For testing / simulation:**

```typescript
// Mock executor for development
bot.setTradeExecutor(async (params) => {
  // Simulate a 55% win rate
  const isWin = Math.random() < 0.55;
  const payout = isWin ? params.amount * 1.85 : 0;
  const profit = payout - params.amount;

  return {
    tradeId: `mock-${Date.now()}`,
    contractId: `contract-${Date.now()}`,
    entryTime: new Date().toISOString(),
    exitTime: new Date(Date.now() + 5000).toISOString(),
    stake: params.amount,
    payout,
    profit,
    isWin,
    contractType: params.tradeType,
    market: params.symbol,
    duration: params.duration,
    durationUnits: params.durationUnits,
  };
});
```

### Starting the Bot

```typescript
const result = await bot.start();

// result.success === true  → bot is running
// result.success === false → check result.error

// What happens on start():
// 1. Validates configuration (strategy, contract, base stake)
// 2. Checks if within scheduled trading hours
// 3. Initializes session state (streaks, counters, balances)
// 4. Starts the trade loop
// 5. Starts schedule monitor (checks every 60s)
// 6. Starts max runtime timer (if configured)
// 7. Starts periodic counter resets (hourly/daily/weekly)
```

### Lifecycle Methods

| Method | From Status | To Status | Description |
|--------|-------------|-----------|-------------|
| `start()` | `IDLE`, `STOP`, `ERROR` | `START` | Begin trading |
| `stop()` | Any | `STOP` | Graceful stop, finalize stats |
| `pause()` | `START` | `PAUSE` | Suspend trade loop, keep state |
| `resume()` | `PAUSE` | `START` | Resume from paused state |
| `emergencyStop(reason)` | Any | `ERROR` | Immediate halt |
| `destroy()` | Any | — | Full cleanup, release all resources |

```typescript
// Pause during volatile market
bot.pause();
// ... wait for conditions to improve ...
bot.resume();

// Emergency stop
bot.emergencyStop('Manual override by user');

// Full cleanup when component unmounts
bot.destroy();
```

### Event System

The bot emits events for every significant action. Use `on()` / `off()` to subscribe.

```typescript
// Subscribe
const onTrade = (event) => {
  console.log(`[${event.timestamp}] ${event.message}`);
  console.log('Data:', event.data);
};
bot.on('trade_executed', onTrade);

// Unsubscribe
bot.off('trade_executed', onTrade);
```

#### All Event Types

| Event | When | Data |
|-------|------|------|
| `status_changed` | Bot status transitions | `{ from, to }` |
| `trade_executed` | Any trade completes | `{ result: TradeResult }` |
| `trade_won` | Trade is profitable | `{ result: TradeResult }` |
| `trade_lost` | Trade is a loss | `{ result: TradeResult }` |
| `stake_updated` | New stake calculated | `{ stake: number }` |
| `recovery_triggered` | Loss streak triggers recovery | `{ lossStreak, recoveryAttempts }` |
| `recovery_step_changed` | Advanced to next recovery step | `{ stepIndex }` |
| `risk_limit_hit` | Any risk limit reached | varies |
| `stop_loss_triggered` | Stop loss amount reached | — |
| `take_profit_triggered` | Take profit target reached | — |
| `cooldown_started` | Cooldown period begins | — |
| `cooldown_ended` | Cooldown period ends | — |
| `schedule_check` | Periodic schedule check | — |
| `schedule_paused` | Outside trading hours | — |
| `schedule_resumed` | Back in trading hours | — |
| `emergency_stop` | Emergency halt | `{ reason }` |
| `max_trades_reached` | Hit max trade count | — |
| `max_runtime_reached` | Hit max runtime | — |
| `volatility_pause` | High volatility detected | — |
| `strategy_reset` | Strategy counters reset | — |
| `error` | Any error | `{ error: string }` |
| `log` | General log message | varies |

#### Real-World Event Dashboard

```typescript
// Build a live dashboard from events
const dashboard = {
  status: 'IDLE',
  trades: 0,
  wins: 0,
  losses: 0,
  profit: 0,
  currentStake: 0,
  logs: [] as string[],
};

bot.on('status_changed', (e) => { dashboard.status = e.data.to; });
bot.on('trade_won', (e) => { dashboard.wins++; dashboard.trades++; dashboard.profit += e.data.result.profit; });
bot.on('trade_lost', (e) => { dashboard.losses++; dashboard.trades++; dashboard.profit += e.data.result.profit; });
bot.on('stake_updated', (e) => { dashboard.currentStake = e.data.stake; });
bot.on('log', (e) => { dashboard.logs.push(`[${e.timestamp}] ${e.message}`); });
bot.on('error', (e) => { dashboard.logs.push(`[ERROR] ${e.message}`); });
```

### Serializing Back to API

```typescript
// Get full BotConfiguration object
const config = bot.toConfig();

// Get JSON-ready payload
const json = bot.toJSON();

// Save to API via BotManager
const botManager = new BotManager('https://api.example.com', authToken);
await botManager.createBot(config);

// Or update an existing bot
await botManager.updateBot(bot.botId, config);
```

### Accessing Bot State

```typescript
// Read-only accessors
bot.botId;              // string
bot.strategyId;         // e.g. 'martingale'
bot.status;             // 'IDLE' | 'START' | 'STOP' | 'PAUSE' | 'RESUME' | 'ERROR'
bot.isActive;           // boolean
bot.contract;           // ContractData
bot.amounts;            // { base_stake, maximum_stake, take_profit, stop_loss }
bot.advancedSettings;   // Full advanced_settings object
bot.generalSettings;    // general_settings_section shortcut
bot.riskManagement;     // risk_management_section shortcut
bot.volatilityControls; // volatility_controls_section shortcut
bot.marketConditions;   // market_conditions_section shortcut
bot.recoverySettings;   // recovery_settings_section shortcut
bot.botSchedule;        // bot_schedule shortcut
bot.performance;        // RealtimePerformance snapshot
bot.stats;              // Statistics snapshot
bot.history;            // ReadonlyArray<TradeResult>
bot.currentSession;     // Session state snapshot (streaks, counters, etc.)
```

---

## Strategy Stake Calculations

Each strategy has its own stake calculation logic. The bot automatically selects the correct calculator based on `strategyId`.

### Martingale

**Logic**: Double (or multiply) the stake after each loss. Reset to base on win.

```
Loss streak: 0 → stake = base_stake (e.g. $0.35)
Loss streak: 1 → stake = base_stake × multiplier^1 (e.g. $0.70)
Loss streak: 2 → stake = base_stake × multiplier^2 (e.g. $1.40)
Loss streak: 3 → stake = base_stake × multiplier^3 (e.g. $2.80)
...capped at martingale_max_steps
```

**Settings used**:
- `martingale_multiplier` — multiplier per loss (default: 2)
- `martingale_max_steps` — max escalation steps (default: 10)
- `martingale_safety_net` — max % of balance per trade
- `martingale_reset_on_profit` — reset step counter on any win

**Example scenario**:
```
Base: $0.35, Multiplier: 2x, Max steps: 6, Safety net: 10%
Balance: $100

Trade 1: LOSS  → next stake = $0.35 × 2^1 = $0.70
Trade 2: LOSS  → next stake = $0.35 × 2^2 = $1.40
Trade 3: LOSS  → next stake = $0.35 × 2^3 = $2.80
Trade 4: WIN   → reset → next stake = $0.35
Trade 5: LOSS  → next stake = $0.70
Trade 6: LOSS  → next stake = $1.40
Trade 7: LOSS  → next stake = $2.80
Trade 8: LOSS  → next stake = $5.60
Trade 9: LOSS  → next stake = $10.00 (capped by safety net: 10% of $100)
```

### D'Alembert

**Logic**: Increase stake by a fixed increment on loss, decrease by a fixed decrement on win.

```
Start at 1 unit.
Loss → units += increment
Win  → units -= decrement (min 1)
Stake = base_stake × units
```

**Settings used**:
- `dalembert_increment` — units to add on loss (threshold value)
- `dalembert_decrement` — units to subtract on win (threshold value)
- `dalembert_max_units` — ceiling for unit count
- `dalembert_reset_threshold` — reset to 1 unit when session profit reaches this
- `dalembert_conservative_mode` — halves the increment

**Example scenario**:
```
Base: $1, Increment: 1, Decrement: 1, Max units: 10

Trade 1: units=1, stake=$1  → LOSS  → units=2
Trade 2: units=2, stake=$2  → LOSS  → units=3
Trade 3: units=3, stake=$3  → WIN   → units=2
Trade 4: units=2, stake=$2  → WIN   → units=1
Trade 5: units=1, stake=$1  → LOSS  → units=2
```

### Reverse Martingale

**Logic**: Increase stake on wins (ride the streak), reset to base on loss.

**Settings used**:
- `reverse_martingale_multiplier` — multiplier per win
- `reverse_martingale_max_wins` — max escalation steps
- `reverse_martingale_profit_lock` — lock X% of profit (reduce risk)
- `reverse_martingale_reset_on_loss` — reset to base on any loss
- `reverse_martingale_aggressive_mode` — 1.5x additional multiplier

**Example scenario**:
```
Base: $1, Multiplier: 2x, Max wins: 4, Profit lock: 50%

Trade 1: stake=$1   → WIN  → next = $1 × 2^1 = $2
Trade 2: stake=$2   → WIN  → next = $1 × 2^2 = $4
Trade 3: stake=$4   → WIN  → next = $1 × 2^3 = $8
Trade 4: stake=$8   → WIN  → max wins reached → reset to $1
Trade 5: stake=$1   → LOSS → stays at $1
```

### Reverse D'Alembert

**Logic**: Opposite of D'Alembert — increase on win, decrease on loss.

**Settings used**:
- `reverse_dalembert_increment` — units to add on win
- `reverse_dalembert_decrement` — units to subtract on loss
- `reverse_dalembert_max_units` — ceiling
- `reverse_dalembert_profit_ceiling` — reset when profit reaches this

### Oscar's Grind

**Logic**: Conservative system targeting 1 unit of profit per session. Increase stake by 1 unit after a win (but never bet more than needed to reach the target). Keep stake the same after a loss.

**Settings used**:
- `oscars_grind_base_unit` — unit size
- `oscars_grind_profit_target` — target profit per session
- `oscars_grind_max_bet_units` — max units per bet
- `oscars_grind_increment_on_win` — increase after win
- `oscars_grind_maintain_stake_on_loss` — keep same stake on loss
- `oscars_grind_reset_on_target` — restart session when target hit
- `oscars_grind_auto_stop_on_target` — stop bot when target hit

**Example scenario**:
```
Unit: $5, Target: $5 (1 unit profit)

Trade 1: 1 unit ($5)  → LOSS  → session: -$5, keep 1 unit
Trade 2: 1 unit ($5)  → LOSS  → session: -$10, keep 1 unit
Trade 3: 1 unit ($5)  → WIN   → session: -$5, increase to 2 units
Trade 4: 2 units ($10) → WIN  → session: +$5 → TARGET HIT → reset
```

### 1-3-2-6 System

**Logic**: Follow a fixed betting sequence (1-3-2-6 units). Advance on win, reset on loss.

**Settings used**:
- `system_1326_base_unit` — unit size
- `system_1326_sequence` — the sequence string (default: "1-3-2-6")
- `system_1326_reset_on_loss` — reset to step 0 on loss
- `system_1326_max_cycles` — max complete cycles before stopping
- `system_1326_stop_on_cycle_complete` — stop after one full cycle
- `system_1326_partial_profit_lock` — reduce bets at step 2+ to lock profit
- `system_1326_loss_recovery` — stay at current step on loss (retry)

**Example scenario**:
```
Unit: $10, Sequence: 1-3-2-6

Trade 1: step 0 → 1 unit ($10)  → WIN  → advance to step 1
Trade 2: step 1 → 3 units ($30) → WIN  → advance to step 2
Trade 3: step 2 → 2 units ($20) → WIN  → advance to step 3
Trade 4: step 3 → 6 units ($60) → WIN  → cycle complete → reset
Trade 5: step 0 → 1 unit ($10)  → LOSS → stays at step 0
```

### Stat Reset Variants

Each base strategy has a "on stat reset" variant that periodically resets counters:

- **Martingale on Stat Reset** — resets martingale step after N trades, with optional multiplier adjustment
- **D'Alembert on Stat Reset** — resets units after N trades, adaptive increment based on win rate
- **Reverse Martingale on Stat Reset** — resets after N consecutive wins or at profit target
- **Reverse D'Alembert on Stat Reset** — dynamic reset based on win rate threshold

```typescript
// Example: D'Alembert resets every 20 trades and adapts increment
advanced_settings: {
  dalembert_reset_strategy_section: {
    dalembert_reset_frequency: 20,        // Reset every 20 trades
    dalembert_reset_on_target: true,       // Also reset when take profit hit
    dalembert_adaptive_increment: true,    // Adjust based on win rate
    dalembert_session_profit_lock: true,   // Lock profit on reset
  }
}
```

### Options Variants

Options strategies (`OPTIONS_MARTINGALE`, `OPTIONS_DALEMBERT`, `OPTIONS_REVERSE_MARTINGALE`, `OPTIONS_OSCARS_GRIND`, `OPTIONS_1326_SYSTEM`) use the same stake calculation as their base strategy but may have additional contract-specific settings (contract type, duration, prediction mode).

---

## Risk Management

The bot performs **10+ pre-trade checks** before every single trade. If any check fails, the trade is blocked and the appropriate action is taken (stop, cooldown, or wait).

### Stop Loss & Take Profit

```typescript
// Threshold values can be fixed or percentage-based
amounts: {
  take_profit: { type: 'fixed', value: 50 },      // Stop after $50 profit
  stop_loss: { type: 'percentage', value: 0, balancePercentage: 10 }, // Stop after 10% balance loss
}
```

**How it works**:
- After every trade, the bot checks `sessionProfit` against take profit and stop loss
- If triggered, the bot emits the event and calls `stop()`
- Percentage-based values are resolved against the current account balance

### Daily / Hourly / Weekly Limits

```typescript
risk_management_section: {
  max_daily_loss: { type: 'fixed', value: 20 },   // Max $20 loss per day
  max_daily_profit: { type: 'fixed', value: 100 }, // Stop after $100 daily profit
}
```

The bot maintains separate counters for hourly, daily, and weekly profit/loss. These counters reset automatically on their respective intervals.

### Max Drawdown

```typescript
risk_management_section: {
  max_drawdown_percentage: 15, // Stop if balance drops 15% from peak
}
```

The bot tracks `peakBalance` (highest balance seen) and calculates drawdown as:
```
drawdown = (peakBalance - currentBalance) / peakBalance × 100
```

### Emergency Stop

```typescript
risk_management_section: {
  emergency_stop: true, // Enable emergency stop
}
```

When enabled, the bot will immediately halt if the session loss exceeds 20x the base stake. This is a safety net for catastrophic scenarios.

### Risk Per Trade

```typescript
risk_management_section: {
  risk_per_trade: 2, // Max 2% of balance per trade
}
```

The bot caps the calculated stake so it never exceeds this percentage of the current balance, regardless of what the strategy calculation produces.

---

## Recovery System

The recovery system activates when the bot enters a loss streak. It uses the **risk steps** configured in the form.

### How Recovery Works

1. **Loss occurs** → bot checks if recovery is enabled (`recovery_type: 'on'`)
2. **Risk steps are evaluated** — each step has a `multiplier` that scales the base stake
3. **Progressive recovery** — if enabled, the bot advances through risk steps on consecutive losses
4. **Max recovery attempts** — after N failed recovery attempts, the bot enters recovery cooldown
5. **Recovery cooldown** — bot pauses for a configured duration, then resets and optionally auto-restarts

```typescript
// Recovery configuration
recovery_steps: {
  risk_steps: [
    { id: 'rs-1', lossStreak: 3, multiplier: 1.5, action: 'increase' },
    { id: 'rs-2', lossStreak: 5, multiplier: 2.0, action: 'double' },
    { id: 'rs-3', lossStreak: 8, multiplier: 3.0, action: 'triple' },
  ],
},
advanced_settings: {
  general_settings_section: {
    recovery_type: 'on',
  },
  recovery_settings_section: {
    progressive_recovery: true,
    recovery_multiplier: 1.5,       // Additional multiplier on top of step
    max_recovery_attempts: 5,
    recovery_cooldown: { duration: 60, unit: 'seconds' },
    partial_recovery: false,
    recovery_threshold: { type: 'fixed', value: 10 },
  },
}
```

**Example flow**:
```
Trade 1: LOSS (streak: 1) — no recovery yet
Trade 2: LOSS (streak: 2) — no recovery yet
Trade 3: LOSS (streak: 3) — RECOVERY TRIGGERED, step 0 (1.5x)
  → stake = base × 1.5 × recovery_multiplier(1.5) = base × 2.25
Trade 4: LOSS (streak: 4) — progressive → step 1 (2.0x)
  → stake = base × 2.0 × 1.5 = base × 3.0
Trade 5: WIN — exit recovery, reset to base
```

---

## Schedule System

The bot can be configured to only trade during specific time windows.

### Schedule Types

| Type | Description |
|------|-------------|
| `daily` | Trade every day within start/end time |
| `weekly` | Trade on specific days of the week |
| `monthly` | Trade on a specific day of the month |
| `hourly` | Trade every hour |
| `custom` | Custom schedule |

### Schedule Configuration

```typescript
bot_schedule: {
  bot_schedule: {
    id: 'sched-1',
    name: 'Weekday London Session',
    type: 'weekly',
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    startTime: '2026-01-01T08:00:00Z',  // 8 AM
    endTime: '2026-01-01T16:00:00Z',    // 4 PM
    daysOfWeek: [1, 2, 3, 4, 5],        // Mon-Fri
    isEnabled: true,
    exclusions: [
      { id: 'exc-1', date: '2026-12-25T00:00:00Z', reason: 'Christmas' },
      { id: 'exc-2', date: '2026-01-01T00:00:00Z', reason: 'New Year' },
    ],
  },
}
```

### How It Works

1. On `start()`, the bot checks `isWithinSchedule()`
2. If outside schedule, the bot stays in `IDLE` and starts a **schedule monitor** (checks every 60s)
3. When the schedule window opens, the bot auto-starts
4. When the schedule window closes, the bot auto-pauses
5. Exclusion dates are checked — if today matches an exclusion, trading is blocked

```typescript
// You can also check the schedule manually
if (bot.isWithinSchedule()) {
  console.log('Bot is within trading hours');
} else {
  console.log('Outside trading hours');
}
```

---

## Cooldown & Auto-Restart

### Cooldown

Cooldown activates when:
- Max consecutive losses are reached
- Recovery attempts are exhausted
- Any risk limit triggers a cooldown instead of a full stop

```typescript
general_settings_section: {
  cooldown_period: { duration: 30, unit: 'seconds' },
  auto_restart: true, // Restart after cooldown ends
}
```

### Auto-Restart

When `auto_restart` is `true`:
1. After cooldown ends, the bot resets consecutive loss/win counters
2. Recovery state is cleared
3. Trade loop resumes automatically

When `auto_restart` is `false`:
1. After cooldown ends, the bot calls `stop()`

---

## Contract & Trade Type Handling

### ALTERNATE Trade Types

When `contractType` is `'ALTERNATE'` and `tradeType` contains a pipe (e.g., `'CALLE|PUTE'`):

```
alternateAfter: 9

Trades 1-9:  CALLE
Trades 10-18: PUTE
Trades 19-27: CALLE
...
```

The bot maintains an internal `alternateCounter` and `currentTradeType` to handle this.

### Contract Parameters

The bot reads these from the `contract` field:

| Field | Usage |
|-------|-------|
| `market.symbol` | Trading instrument (e.g., `R_100`) |
| `tradeType` | Contract direction (e.g., `CALLE`, `PUTE`, `CALLE\|PUTE`) |
| `contractType` | `ALTERNATE` or fixed |
| `duration` | Contract duration |
| `durationUnits` | `ticks`, `seconds`, `minutes`, etc. |
| `delay` | Seconds between trades |
| `prediction` | Digit prediction (for digit contracts) |
| `multiplier` | Contract multiplier |
| `allowEquals` | Allow equal outcomes |
| `alternateAfter` | Switch trade type after N trades |

---

## BotManager Class (API Layer)

The `BotManager` handles server-side persistence and remote bot control.

### CRUD Operations

```typescript
import { BotManager } from './BotManager';

const manager = new BotManager('https://api.koppo.app', authToken);

// Create
const createResult = await manager.createBot(bot.toConfig());

// Read
const loadResult = await manager.loadBot('bot-123');

// Update
const updateResult = await manager.updateBot('bot-123', { botName: 'New Name' });

// Delete
const deleteResult = await manager.deleteBot('bot-123');

// List
const listResult = await manager.getBots(1, 20);
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/bots` | Create bot |
| `GET` | `/bots/:id` | Get bot |
| `PUT` | `/bots/:id` | Update bot |
| `DELETE` | `/bots/:id` | Delete bot |
| `GET` | `/bots?page=1&limit=10` | List bots |
| `POST` | `/bots/:id/start` | Start bot |
| `POST` | `/bots/:id/stop` | Stop bot |
| `POST` | `/bots/:id/pause` | Pause bot |
| `POST` | `/bots/:id/resume` | Resume bot |
| `GET` | `/bots/:id/performance` | Get performance |
| `GET` | `/bots/:id/statistics` | Get statistics |

### BotManager Events

```typescript
manager.addEventListener('status_changed', (event) => { /* ... */ });
manager.addEventListener('performance_updated', (event) => { /* ... */ });
manager.addEventListener('error_occurred', (event) => { /* ... */ });
manager.addEventListener('configuration_updated', (event) => { /* ... */ });
manager.addEventListener('bot_created', (event) => { /* ... */ });
manager.addEventListener('bot_deleted', (event) => { /* ... */ });
```

---

## React Integration

### useTradingBot Hook

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { TradingBot, TradingBotEvent, TradeResult } from '../Classes/bot-manager/TradingBot';
import { BotConfiguration } from '../Classes/bot-manager/BotManager';

interface UseTradingBotReturn {
  bot: TradingBot | null;
  status: string;
  performance: TradingBot['performance'] | null;
  stats: TradingBot['stats'] | null;
  session: TradingBot['currentSession'] | null;
  history: TradeResult[];
  logs: TradingBotEvent[];
  isRunning: boolean;
  createFromFormData: (formData: any, meta?: any) => TradingBot;
  start: () => Promise<{ success: boolean; error?: string }>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  destroy: () => void;
}

export function useTradingBot(
  tradeExecutor: TradingBot['setTradeExecutor'] extends (e: infer E) => void ? E : never,
  balanceProvider: () => number,
): UseTradingBotReturn {
  const botRef = useRef<TradingBot | null>(null);
  const [status, setStatus] = useState('IDLE');
  const [performance, setPerformance] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [history, setHistory] = useState<TradeResult[]>([]);
  const [logs, setLogs] = useState<TradingBotEvent[]>([]);

  const wireEvents = useCallback((bot: TradingBot) => {
    bot.on('status_changed', (e) => setStatus(e.data.to));
    bot.on('trade_won', () => {
      setPerformance(bot.performance);
      setStats(bot.stats);
      setSession(bot.currentSession);
      setHistory([...bot.history]);
    });
    bot.on('trade_lost', () => {
      setPerformance(bot.performance);
      setStats(bot.stats);
      setSession(bot.currentSession);
      setHistory([...bot.history]);
    });
    bot.on('log', (e) => setLogs((prev) => [...prev.slice(-99), e]));
    bot.on('error', (e) => setLogs((prev) => [...prev.slice(-99), e]));
  }, []);

  const createFromFormData = useCallback((formData: any, meta?: any) => {
    if (botRef.current) botRef.current.destroy();

    const bot = TradingBot.fromFormData(formData, meta);
    bot.setTradeExecutor(tradeExecutor);
    bot.setBalanceProvider(balanceProvider);
    wireEvents(bot);
    botRef.current = bot;

    setStatus(bot.status);
    setPerformance(bot.performance);
    setStats(bot.stats);

    return bot;
  }, [tradeExecutor, balanceProvider, wireEvents]);

  const start = useCallback(async () => {
    if (!botRef.current) return { success: false, error: 'No bot created' };
    return botRef.current.start();
  }, []);

  const stop = useCallback(() => botRef.current?.stop(), []);
  const pause = useCallback(() => botRef.current?.pause(), []);
  const resume = useCallback(() => botRef.current?.resume(), []);
  const destroy = useCallback(() => {
    botRef.current?.destroy();
    botRef.current = null;
  }, []);

  useEffect(() => {
    return () => { botRef.current?.destroy(); };
  }, []);

  return {
    bot: botRef.current,
    status,
    performance,
    stats,
    session,
    history,
    logs,
    isRunning: status === 'START',
    createFromFormData,
    start,
    stop,
    pause,
    resume,
    destroy,
  };
}
```

### Full Page Example

```tsx
import React, { useState } from 'react';
import { useTradingBot } from '../hooks/useTradingBot';

const BotDashboard: React.FC<{ formData: any }> = ({ formData }) => {
  const {
    bot, status, performance, stats, session, history, logs,
    isRunning, createFromFormData, start, stop, pause, resume,
  } = useTradingBot(
    // Trade executor
    async (params) => {
      const res = await derivAPI.buy(params);
      return {
        tradeId: res.buy_id,
        contractId: res.contract_id,
        entryTime: new Date().toISOString(),
        exitTime: res.exit_time,
        stake: params.amount,
        payout: res.payout,
        profit: res.profit,
        isWin: res.profit > 0,
        contractType: params.tradeType,
        market: params.symbol,
        duration: params.duration,
        durationUnits: params.durationUnits,
      };
    },
    // Balance provider
    () => accountBalance,
  );

  const handleCreate = () => {
    createFromFormData(formData, {
      botName: 'Dashboard Bot',
      createdBy: currentUser.uid,
    });
  };

  return (
    <div>
      <h1>Bot: {bot?.botName || 'Not created'}</h1>
      <p>Status: <strong>{status}</strong></p>

      <div>
        <button onClick={handleCreate}>Create Bot</button>
        <button onClick={start} disabled={isRunning}>Start</button>
        <button onClick={pause} disabled={!isRunning}>Pause</button>
        <button onClick={resume} disabled={status !== 'PAUSE'}>Resume</button>
        <button onClick={stop}>Stop</button>
      </div>

      {performance && (
        <div>
          <h2>Performance</h2>
          <p>Trades: {performance.totalRuns}</p>
          <p>Wins: {performance.numberOfWins}</p>
          <p>Losses: {performance.numberOfLosses}</p>
          <p>Total Stake: ${performance.totalStake.toFixed(2)}</p>
          <p>Total Payout: ${performance.totalPayout.toFixed(2)}</p>
          <p>Current Stake: ${performance.currentStake.toFixed(2)}</p>
        </div>
      )}

      {session && (
        <div>
          <h2>Session</h2>
          <p>Profit: ${session.sessionProfit.toFixed(2)}</p>
          <p>Win Streak: {session.consecutiveWins}</p>
          <p>Loss Streak: {session.consecutiveLosses}</p>
          <p>In Recovery: {session.isInRecovery ? 'Yes' : 'No'}</p>
          <p>In Cooldown: {session.isInCooldown ? 'Yes' : 'No'}</p>
        </div>
      )}

      {stats && (
        <div>
          <h2>Lifetime Stats</h2>
          <p>Win Rate: {stats.winRate.toFixed(1)}%</p>
          <p>Profit Factor: {stats.profitFactor.toFixed(2)}</p>
          <p>Longest Win Streak: {stats.longestWinStreak}</p>
          <p>Longest Loss Streak: {stats.longestLossStreak}</p>
        </div>
      )}

      <div>
        <h2>Trade History ({history.length})</h2>
        <table>
          <thead>
            <tr><th>Time</th><th>Type</th><th>Stake</th><th>Profit</th><th>Result</th></tr>
          </thead>
          <tbody>
            {history.slice(-20).reverse().map((t) => (
              <tr key={t.tradeId}>
                <td>{new Date(t.entryTime).toLocaleTimeString()}</td>
                <td>{t.contractType}</td>
                <td>${t.stake.toFixed(2)}</td>
                <td style={{ color: t.isWin ? 'green' : 'red' }}>
                  ${t.profit.toFixed(2)}
                </td>
                <td>{t.isWin ? 'WIN' : 'LOSS'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2>Logs</h2>
        <pre style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
          {logs.map((l, i) => (
            <div key={i}>[{l.type}] {l.message}</div>
          ))}
        </pre>
      </div>
    </div>
  );
};
```

---

## TypeScript Reference

### Exported from `TradingBot.ts`

| Type | Description |
|------|-------------|
| `TradingBot` | The main bot class |
| `ThresholdValue` | `{ type: 'fixed' \| 'percentage', value: number, balancePercentage?: number }` |
| `TradeResult` | Result of a single trade execution |
| `TradingBotEventType` | Union of all event type strings |
| `TradingBotEvent` | Event object emitted by the bot |
| `TradingBotEventListener` | `(event: TradingBotEvent) => void` |
| `TradeExecutor` | Function signature for the trade execution callback |

### Exported from `BotManager.ts`

| Type | Description |
|------|-------------|
| `BotManager` | API management class |
| `BotConfiguration` | Full bot configuration interface |
| `BotStatus` | `'STOP' \| 'START' \| 'PAUSE' \| 'RESUME' \| 'ERROR' \| 'IDLE'` |
| `RealtimePerformance` | Performance metrics interface |
| `Statistics` | Lifetime statistics interface |
| `ApiResponse<T>` | API response wrapper |
| `BotEvent` | BotManager event interface |
| `BotEventType` | BotManager event type union |

---

## Real-World Scenarios

### Scenario 1: User Creates a Bot from the Strategy Form

```typescript
// In StrategyForm onSubmit handler
const onSubmit = async (formData: any) => {
  // 1. Create bot instance
  const bot = TradingBot.fromFormData(formData, {
    botName: formData.botName,
    createdBy: auth.currentUser.uid,
    botCurrency: 'USD',
  });

  // 2. Validate
  const v = bot.validate();
  if (!v.isValid) {
    toast.error(v.errors.join('\n'));
    return;
  }

  // 3. Save to API
  const manager = new BotManager(API_URL, authToken);
  const result = await manager.createBot(bot.toConfig());
  if (!result.success) {
    toast.error(result.error);
    return;
  }

  // 4. Navigate to bot dashboard
  navigate(`/bots/${bot.botId}`);
};
```

### Scenario 2: Loading and Running a Saved Bot

```typescript
// On bot dashboard page load
const manager = new BotManager(API_URL, authToken);
const { data: config } = await manager.loadBot(botId);

const bot = new TradingBot(config);
bot.setTradeExecutor(derivTradeExecutor);
bot.setBalanceProvider(() => accountStore.balance);

// Wire up UI
bot.on('trade_won', () => updateUI());
bot.on('trade_lost', () => updateUI());
bot.on('status_changed', (e) => setStatus(e.data.to));

// User clicks "Start"
await bot.start();

// User clicks "Stop"
bot.stop();

// Persist updated stats
await manager.updateBot(botId, bot.toConfig());
```

### Scenario 3: Bot Hits Stop Loss and Auto-Restarts After Cooldown

```
Timeline:
  00:00 - Bot starts with base stake $0.35
  00:01 - Trade 1: LOSS (-$0.35)
  00:02 - Trade 2: LOSS (-$0.70) [martingale 2x]
  00:03 - Trade 3: LOSS (-$1.40)
  00:04 - Trade 4: LOSS (-$2.80)
  00:05 - Trade 5: LOSS (-$5.60) → stop_loss_triggered ($5 limit)
  00:05 - Bot stops

  If auto_restart + cooldown configured:
  00:05 - cooldown_started (30 seconds)
  00:35 - cooldown_ended
  00:35 - Bot auto-restarts, counters reset
  00:36 - Trade 6: base stake $0.35 (fresh start)
```

### Scenario 4: Schedule-Based Trading

```
Schedule: Daily, 07:00 - 17:00 UTC, Mon-Fri

  06:55 - User starts bot → bot checks schedule → OUTSIDE hours
         → bot enters IDLE, starts schedule monitor
  07:00 - Schedule monitor detects window open → bot auto-starts
  12:30 - Bot is trading normally
  17:00 - Schedule monitor detects window close → bot auto-pauses
  17:01 - Bot is in PAUSE state, no trades
  Next day 07:00 - Bot auto-resumes
```

### Scenario 5: Recovery with Progressive Risk Steps

```
Risk steps: [1.5x at 3 losses, 2x at 5 losses, 3x at 8 losses]
Recovery multiplier: 1.5x
Max recovery attempts: 5

  Trade 1-2: LOSS, LOSS (no recovery yet)
  Trade 3: LOSS → recovery_triggered (step 0: 1.5x × 1.5 = 2.25x base)
  Trade 4: LOSS → recovery_step_changed (step 1: 2.0x × 1.5 = 3.0x base)
  Trade 5: WIN → exit recovery, back to base
  Trade 6: LOSS
  Trade 7-8: LOSS, LOSS → recovery_triggered again
  ...after 5 failed recovery attempts:
  → recovery cooldown (60s)
  → after cooldown: reset and auto-restart
```

---

## Best Practices

1. **Always call `validate()` before `start()`** — catches missing contract, market, or stake config
2. **Always set `tradeExecutor` and `balanceProvider`** — the bot won't start without an executor
3. **Use events for UI updates** — don't poll the bot state, subscribe to events
4. **Call `destroy()` on unmount** — clears all timers and listeners, prevents memory leaks
5. **Persist with `toConfig()`** — serialize the bot state to save progress to the API
6. **Use the mock executor for testing** — simulate trades without real money
7. **Set reasonable risk limits** — always configure stop loss, max drawdown, and emergency stop
8. **Test schedule logic** — use `isWithinSchedule()` to verify before going live
9. **Monitor the `error` event** — catch and log all errors for debugging
10. **Use `log` events for debugging** — the bot emits detailed logs for every decision

---

## Troubleshooting

### Bot won't start

```typescript
const result = await bot.start();
if (!result.success) {
  console.error(result.error);
  // Common errors:
  // - "Trade executor not set. Call setTradeExecutor() first."
  // - "Strategy ID is required"
  // - "Market selection is required"
  // - "Base stake must be greater than 0"
}
```

### Bot starts but doesn't trade

Check:
- Is the bot within schedule? → `bot.isWithinSchedule()`
- Is the bot in cooldown? → `bot.currentSession.isInCooldown`
- Has max trades been reached? → `bot.currentSession.totalTradesThisSession`
- Listen to `log` events for detailed diagnostics

### Stake seems wrong

```typescript
bot.on('stake_updated', (e) => {
  console.log('Calculated stake:', e.data.stake);
  console.log('Session state:', bot.currentSession);
  // Check: consecutiveLosses, consecutiveWins, martingaleStep, dalembertUnits
});
```

### Events not firing

Make sure you subscribe **before** calling `start()`:
```typescript
bot.on('trade_won', handler);  // Subscribe first
await bot.start();              // Then start
```

### Memory leaks

Always clean up:
```typescript
// In React
useEffect(() => {
  return () => bot.destroy();
}, []);

// Or manually
bot.destroy(); // Clears all timers, listeners, history
```
