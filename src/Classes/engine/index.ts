/**
 * @file engine/index.js
 * @description Entry point for the TradingBot Engine — exports TradingBotManager,
 *              TradingBotExecutor, and shared constants/utilities.
 *
 * Two-layer architecture:
 *   TradingBotManager  — Runtime engine (strategy, risk, scheduling, trade loop)
 *   TradingBotExecutor — API persistence & CRUD + Deriv contract execution
 *
 * @usage
 *   const {
 *     TradingBotManager,
 *     TradingBotExecutor,
 *     BOT_STATUSES,
 *     STRATEGY_TYPES,
 *   } = require('./engine');
 *
 *   // 1. Create executor (handles network I/O)
 *   const executor = new TradingBotExecutor({
 *     apiBaseUrl: 'https://api.example.com/api/v1',
 *     authToken: 'jwt-token',
 *     derivEndpointDomain: 'ws.derivws.com',
 *     derivAppId: '12345',
 *   });
 *
 *   // 2. Create manager from form data (handles all intelligence)
 *   const manager = TradingBotManager.fromFormData(formPayload, executor, {
 *     botName: 'My Martingale Bot',
 *     createdBy: 'user-uuid',
 *   });
 *
 *   // 3. Optionally persist to API first
 *   await executor.createBot(manager.toConfig());
 *
 *   // 4. Wire up events
 *   manager.on('trade_won', (e) => console.log('WIN', e));
 *   manager.on('trade_lost', (e) => console.log('LOSS', e));
 *   manager.on('stop_loss_triggered', () => console.log('STOP LOSS'));
 *   manager.on('error', (e) => console.error(e));
 *
 *   // 5. Provide balance (optional — defaults to 10000)
 *   manager.setBalanceProvider(() => accountBalance);
 *
 *   // 6. Start
 *   const result = await manager.start();
 *   if (!result.success) console.error(result.error);
 */

import {
  TradingBotManager,
  STRATEGY_TYPES,
  getDefaultPerformance,
  getDefaultStatistics,
  getDefaultAdvancedSettings,
  createFreshSession,
} from './TradingBotManager';

import {
  TradingBotExecutor,
  BOT_STATUSES,
} from './TradingBotExecutor';

// Merge (they're identical, just re-export one canonical copy)
//const BOT_STATUSES = { ...MANAGER_STATUSES, ...EXECUTOR_STATUSES };

export {
  // Core classes
  TradingBotManager,
  TradingBotExecutor,

  // Constants
  BOT_STATUSES,
  STRATEGY_TYPES,

  // Utility factories
  getDefaultPerformance,
  getDefaultStatistics,
  getDefaultAdvancedSettings,
  createFreshSession,
};
