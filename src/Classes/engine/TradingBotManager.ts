/**
 * @file TradingBotManager.js
 * @description Runtime engine for executing trades, managing risk, applying strategy logic,
 *              scheduling, recovery, cooldown, profit locking, and statistics tracking.
 *
 * Architecture:
 *   TradingBotManager owns the decision-making loop.
 *   TradingBotExecutor owns network I/O (API persistence + Deriv contract execution).
 *
 * @features
 *   - Static factory: fromFormData(payload) → fully initialised bot instance
 *   - Strategy-specific stake calculation (Martingale, D'Alembert, Reverse, Oscar's Grind, 1-3-2-6, etc.)
 *   - Recovery after loss with configurable risk steps
 *   - Risk management (stop-loss, take-profit, max drawdown, daily limits, emergency stop)
 *   - Schedule-based execution (hourly, daily, weekly, monthly, custom)
 *   - Cooldown periods between trades
 *   - Compound staking
 *   - Volatility filtering
 *   - Market condition checks
 *   - Real-time performance & lifetime statistics tracking
 *   - Event-driven architecture for UI integration
 *   - Contract parameter handling with alternation logic
 *   - Profit locking
 *   - Intelligent trade-type resolution (ALTERNATE, pipe-separated)
 *
 * @usage
 *   const executor = new TradingBotExecutor({ apiBaseUrl, authToken });
 *   const manager  = TradingBotManager.fromFormData(formPayload, executor);
 *   manager.on('trade_executed', (e) => console.log(e));
 *   await manager.start();
 */

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

// ─── Constants ───────────────────────────────────────────────────────────────

const BOT_STATUSES = Object.freeze({
  IDLE: 'IDLE',
  START: 'START',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  STOP: 'STOP',
  ERROR: 'ERROR',
});

const STRATEGY_TYPES = Object.freeze({
  MARTINGALE: 'martingale',
  MARTINGALE_ON_STAT_RESET: 'martingale_reset',
  DALEMBERT: 'dalembert',
  DALEMBERT_ON_STAT_RESET: 'dalembert_reset',
  REVERSE_MARTINGALE: 'reverse_martingale',
  REVERSE_MARTINGALE_ON_STAT_RESET: 'reverse_martingale_reset',
  REVERSE_DALEMBERT: 'reverse_dalembert',
  REVERSE_DALEMBERT_ON_STAT_RESET: 'reverse_dalembert_reset',
  OSCARS_GRIND: 'oscars_grind',
  SYSTEM_1326: 'system_1326',
  ACCUMULATOR: 'accumulator',
  OPTIONS_MARTINGALE: 'options_martingale',
  OPTIONS_DALEMBERT: 'options_dalembert',
  OPTIONS_REVERSE_MARTINGALE: 'options_reverse_martingale',
  OPTIONS_1326_SYSTEM: 'options_1326_system',
  OPTIONS_OSCARS_GRIND: 'options_oscars_grind',
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function parseDurationToMs(duration, unit) {
  if (!duration) return 0;
  switch (String(unit).toLowerCase()) {
    case 'seconds': case 'second': case 's': return duration * 1000;
    case 'minutes': case 'minute': case 'm': return duration * 60000;
    case 'hours': case 'hour': case 'h': return duration * 3600000;
    case 'days': case 'day': case 'd': return duration * 86400000;
    default: return duration * 1000;
  }
}

// ─── Fresh Session State ─────────────────────────────────────────────────────

function createFreshSession() {
  return {
    currentStake: 0,
    baseStake: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    totalTradesThisSession: 0,
    sessionProfit: 0,
    sessionStake: 0,
    sessionPayout: 0,
    dailyProfit: 0,
    dailyLoss: 0,
    hourlyProfit: 0,
    hourlyLoss: 0,
    weeklyProfit: 0,
    weeklyLoss: 0,
    peakBalance: 0,
    currentBalance: 0,
    recoveryStepIndex: 0,
    recoveryAttempts: 0,
    isInRecovery: false,
    isInCooldown: false,
    cooldownEndTime: null,
    lastTradeTime: null,
    sessionStartTime: null,
    lastDailyReset: null,
    lastHourlyReset: null,
    lastWeeklyReset: null,
    // Strategy-specific counters
    martingaleStep: 0,
    dalembertUnits: 1,
    system1326Step: 0,
    oscarsGrindSessionProfit: 0,
    oscarsGrindCurrentUnit: 1,
    alternateCounter: 0,
    currentTradeType: '',
    // Profit locking
    lockedProfit: 0,
    highWaterMark: 0,
  };
}

// ─── Default Structures ──────────────────────────────────────────────────────

function getDefaultPerformance() {
  return {
    totalRuns: 0,
    numberOfWins: 0,
    numberOfLosses: 0,
    totalStake: 0,
    totalPayout: 0,
    startedAt: null,
    stoppedAt: null,
    currentStake: 0,
    baseStake: 0,
    highestStake: 0,
    currentWinStreak: 0,
    currentLossStreak: 0,
  };
}

function getDefaultStatistics() {
  const now = new Date().toISOString();
  return {
    lifetimeRuns: 0,
    lifetimeWins: 0,
    lifetimeLosses: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
    shortestWinStreak: 0,
    shortestLossStreak: 0,
    totalStake: 0,
    totalProfit: 0,
    totalPayout: 0,
    averageWinAmount: 0,
    averageLossAmount: 0,
    winRate: 0,
    profitFactor: 0,
    highestStake: 0,
    highestPayout: 0,
    roi: null,
    sharpeRatio: null,
    maxDrawdown: null,
    createdAt: now,
    lastUpdated: now,
  };
}

function getDefaultAdvancedSettings() {
  return {
    general_settings_section: {
      maximum_number_of_trades: null,
      maximum_running_time: null,
      cooldown_period: null,
      recovery_type: null,
      compound_stake: false,
      auto_restart: false,
    },
    bot_schedule: {
      bot_schedule: {
        id: '', name: '', type: 'custom',
        startDate: null, endDate: null,
        startTime: null, endTime: null,
        daysOfWeek: [], dayOfMonth: null,
        isEnabled: false, exclusions: [],
      },
    },
    risk_management_section: {
      max_daily_loss: null, max_daily_profit: null,
      max_consecutive_losses: null, max_drawdown_percentage: null,
      risk_per_trade: null, position_sizing: false, emergency_stop: false,
    },
    volatility_controls_section: {
      volatility_filter: false, min_volatility: null, max_volatility: null,
      volatility_adjustment: false, pause_on_high_volatility: false,
      volatility_lookback_period: null,
    },
    market_conditions_section: {
      trend_detection: false, trend_strength_threshold: null,
      avoid_ranging_market: false, market_correlation_check: false,
      time_of_day_filter: false, preferred_trading_hours: null,
    },
    recovery_settings_section: {
      progressive_recovery: false, recovery_multiplier: null,
      max_recovery_attempts: null, recovery_cooldown: null,
      partial_recovery: false, recovery_threshold: null, metadata: null,
    },
    martingale_strategy_section: {
      martingale_multiplier: null, martingale_max_steps: null,
      martingale_reset_on_profit: false, martingale_progressive_target: false,
      martingale_safety_net: null, metadata: null,
    },
    martingale_reset_strategy_section: {
      reset_trigger_type: null, reset_after_trades: null,
      reset_multiplier_adjustment: null, track_session_stats: false,
    },
    dalembert_strategy_section: {
      dalembert_increment: null, dalembert_decrement: null,
      dalembert_max_units: null, dalembert_reset_threshold: null,
      dalembert_conservative_mode: false, metadata: null,
    },
    dalembert_reset_strategy_section: {
      dalembert_reset_frequency: null, dalembert_reset_on_target: false,
      dalembert_adaptive_increment: false, dalembert_session_profit_lock: false,
      metadata: null,
    },
    reverse_martingale_strategy_section: {
      reverse_martingale_multiplier: null, reverse_martingale_max_wins: null,
      reverse_martingale_profit_lock: null, reverse_martingale_reset_on_loss: false,
      reverse_martingale_aggressive_mode: false, metadata: null,
    },
    reverse_martingale_reset_strategy_section: {
      reverse_reset_win_streak: null, reverse_reset_profit_target: null,
      reverse_preserve_winnings: false, metadata: null,
    },
    reverse_dalembert_strategy_section: {
      reverse_dalembert_increment: null, reverse_dalembert_decrement: null,
      reverse_dalembert_max_units: null, reverse_dalembert_profit_ceiling: null,
      metadata: null,
    },
    reverse_dalembert_reset_strategy_section: {
      reverse_dalembert_reset_interval: null, reverse_dalembert_dynamic_reset: false,
      reverse_dalembert_win_rate_threshold: null, metadata: null,
    },
    accumulator_strategy_section: {
      accumulator_growth_rate: null, accumulator_target_multiplier: null,
      accumulator_auto_cashout: false, accumulator_trailing_stop: false,
      accumulator_tick_duration: null, metadata: null,
    },
    options_martingale_section: {
      options_contract_type: null, options_duration: null,
      options_martingale_multiplier: null, options_prediction_mode: null,
      metadata: null,
    },
    options_dalembert_section: {
      options_dalembert_contract_type: null, options_dalembert_increment: null,
      options_dalembert_duration: null, metadata: null,
    },
    options_reverse_martingale_section: {
      options_reverse_contract_type: null, options_reverse_win_multiplier: null,
      options_reverse_duration: null, options_reverse_max_streak: null,
      metadata: null,
    },
    system_1326_strategy_section: {
      system_1326_base_unit: null, system_1326_sequence: null,
      system_1326_reset_on_loss: false, system_1326_complete_cycle_target: null,
      system_1326_partial_profit_lock: false, system_1326_max_cycles: null,
      system_1326_progression_mode: null, system_1326_stop_on_cycle_complete: false,
      system_1326_loss_recovery: false, system_1326_contract_type: null,
      system_1326_duration: null, metadata: null,
    },
    reverse_dalembert_main_strategy_section: {
      reverse_dalembert_base_stake: null, reverse_dalembert_win_increment: null,
      reverse_dalembert_loss_decrement: null, reverse_dalembert_maximum_units: null,
      reverse_dalembert_minimum_units: null, reverse_dalembert_profit_ceiling: null,
      reverse_dalembert_reset_trigger: null, reverse_dalembert_aggressive_mode: false,
      reverse_dalembert_win_streak_bonus: null, reverse_dalembert_contract_type: null,
      reverse_dalembert_duration: null, metadata: null,
    },
    oscars_grind_strategy_section: {
      oscars_grind_base_unit: null, oscars_grind_profit_target: null,
      oscars_grind_increment_on_win: false, oscars_grind_max_bet_units: null,
      oscars_grind_reset_on_target: false, oscars_grind_session_limit: null,
      oscars_grind_loss_limit: null, oscars_grind_progression_speed: null,
      oscars_grind_maintain_stake_on_loss: false, oscars_grind_partial_target: false,
      oscars_grind_contract_type: null, oscars_grind_duration: null,
      oscars_grind_auto_stop_on_target: false, metadata: null,
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// TradingBotManager
// ═════════════════════════════════════════════════════════════════════════════

class TradingBotManager extends EventEmitter {

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * @param {Object} config - Full bot configuration (BotConfiguration shape)
   * @param {import('./TradingBotExecutor').TradingBotExecutor} executor - The executor instance
   */
  constructor(config, executor) {
    super();

    if (!executor) throw new Error('TradingBotExecutor instance is required');

    this._executor = executor;
    this._config = { ...config };

    // Immutable identity
    this.botId = config.botId || '';
    this.botUUID = config.botUUID || '';
    this.strategyId = config.strategyId || '';
    this.botName = config.botName || 'Untitled Bot';
    this.botDescription = config.botDescription || '';
    this.botCurrency = config.botAccount?.currency || config.botCurrency || 'USD';
    this.createdBy = config.createdBy || '';

    // Mutable state
    this._status = config.status || BOT_STATUSES.IDLE;
    this._isActive = config.isActive || false;

    // Runtime
    this._session = createFreshSession();
    this._realtimePerformance = { ...(config.realtimePerformance || getDefaultPerformance()) };
    this._statistics = { ...(config.statistics || getDefaultStatistics()) };
    this._tradeHistory = [];

    // Timers
    this._tradeLoopTimer = null;
    this._scheduleCheckTimer = null;
    this._cooldownTimer = null;
    this._runtimeTimer = null;
    this._periodicResetTimer = null;
    this._persistTimer = null;

    // External providers
    this._balanceProvider = null;
    this._volatilityProvider = null;

    // Persist interval (sync performance/stats to API every N trades)
    this._persistEveryNTrades = 5;
    this._tradesSinceLastPersist = 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATIC FACTORY — Create from raw form data
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a fully initialised TradingBotManager from the StrategyForm payload.
   *
   * @param {Object} formData - Raw JSON from the strategy form builder
   * @param {import('./TradingBotExecutor').TradingBotExecutor} executor
   * @param {Object} [meta] - Optional overrides (botName, createdBy, etc.)
   * @returns {TradingBotManager}
   */
  static fromFormData(formData, executor, meta = {}) {
    const now = new Date().toISOString();

    const config = {
      strategyId: formData.strategyId || meta.strategyId || '',
      contract: formData.contract || {},
      status: BOT_STATUSES.IDLE,
      botId: formData.botId || `bot_${Date.now()}_${uuidv4().slice(0, 8)}`,
      botUUID: formData.botUUID || '',
      botName: meta.botName || formData.botName || 'Untitled Bot',
      botDescription: meta.botDescription || formData.botDescription || '',
      botIcon: formData.botIcon || '',
      botThumbnail: formData.botThumbnail || '',
      botBanner: formData.botBanner || '',
      botTags: meta.botTags || formData.botTags || [],
      botAccount: formData.botAccount || {},
      botCurrency: meta.botCurrency || formData.botAccount?.currency || formData.botCurrency || 'USD',
      isActive: false,
      isPremium: formData.isPremium || false,
      isPublic: formData.isPublic || false,
      createdBy: meta.createdBy || formData.createdBy || '',
      createdAt: formData.createdAt || now,
      updatedAt: now,
      deletedAt: null,
      version: formData.version || { current: '1.0.0', notes: 'Initial version', date: now },
      amounts: formData.amounts || {
        base_stake: { type: 'fixed', value: 1 },
        maximum_stake: { type: 'fixed', value: 100 },
        take_profit: { type: 'fixed', value: 10 },
        stop_loss: { type: 'fixed', value: 5 },
      },
      recovery_steps: formData.recovery_steps || { risk_steps: [] },
      advanced_settings: formData.advanced_settings || getDefaultAdvancedSettings(),
      realtimePerformance: getDefaultPerformance(),
      statistics: getDefaultStatistics(),
      metadata: formData.metadata || {},
    };

    return new TradingBotManager(config, executor);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC ACCESSORS
  // ═══════════════════════════════════════════════════════════════════════════

  get status() { return this._status; }
  get isActive() { return this._isActive; }
  get config() { return { ...this._config }; }
  get contract() { return this._config.contract || {}; }
  get amounts() { return this._config.amounts || {}; }
  get advancedSettings() { return this._config.advanced_settings || {}; }
  get generalSettings() { return this.advancedSettings.general_settings_section || {}; }
  get riskManagement() { return this.advancedSettings.risk_management_section || {}; }
  get volatilityControls() { return this.advancedSettings.volatility_controls_section || {}; }
  get marketConditions() { return this.advancedSettings.market_conditions_section || {}; }
  get recoverySettings() { return this.advancedSettings.recovery_settings_section || {}; }
  get botSchedule() { return this.advancedSettings.bot_schedule?.bot_schedule || null; }
  get session() { return { ...this._session }; }
  get performance() { return { ...this._realtimePerformance }; }
  get statistics() { return { ...this._statistics }; }
  get history() { return [...this._tradeHistory]; }
  get executor() { return this._executor; }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPENDENCY INJECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Set a function that returns the current account balance.
   * @param {Function} provider - () => number
   */
  setBalanceProvider(provider) {
    this._balanceProvider = provider;
  }

  /**
   * Set a function that returns current market volatility (0-100).
   * @param {Function} provider - () => number
   */
  setVolatilityProvider(provider) {
    this._volatilityProvider = provider;
  }

  /**
   * Set how often to persist performance/stats to the API (in trades).
   * @param {number} n
   */
  setPersistInterval(n) {
    this._persistEveryNTrades = Math.max(1, n);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BOT LIFECYCLE — START / STOP / PAUSE / RESUME
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Start the bot. Validates configuration, checks schedule, begins trade loop.
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async start() {
    if (this._status === BOT_STATUSES.START) {
      return { success: false, error: 'Bot is already running' };
    }

    const validation = this._validateBeforeStart();
    if (!validation.isValid) {
      this._setStatus(BOT_STATUSES.ERROR);
      return { success: false, error: validation.errors.join('; ') };
    }

    // Check schedule
    if (!this.isWithinSchedule()) {
      this._log('Bot is outside scheduled trading hours. Will wait for schedule.');
      this._startScheduleMonitor();
      this._setStatus(BOT_STATUSES.IDLE);
      return { success: true, message: 'Waiting for schedule window' };
    }

    // Initialise session
    this._session = createFreshSession();
    this._session.baseStake = this._resolveThresholdValue(this.amounts.base_stake);
    this._session.currentStake = this._session.baseStake;
    this._session.sessionStartTime = Date.now();
    this._session.currentBalance = this._getBalance();
    this._session.peakBalance = this._session.currentBalance;
    this._session.highWaterMark = this._session.currentBalance;

    this._realtimePerformance.startedAt = new Date().toISOString();
    this._realtimePerformance.stoppedAt = null;
    this._realtimePerformance.baseStake = this._session.baseStake;
    this._realtimePerformance.currentStake = this._session.currentStake;

    // Start a new session on the executor
    this._executor.startSession();

    this._setStatus(BOT_STATUSES.START);
    this._isActive = true;
    this._log(`Bot started | strategy: ${this.strategyId} | base stake: ${this._session.baseStake}`);

    // Notify API
    this._syncStatusToAPI(BOT_STATUSES.START);

    this._startPeriodicResets();
    this._startScheduleMonitor();
    this._startMaxRuntimeTimer();

    // Begin trade loop
    this._runTradeLoop();

    return { success: true };
  }

  /**
   * Stop the bot completely.
   */
  async stop() {
    this._clearAllTimers();
    this._setStatus(BOT_STATUSES.STOP);
    this._isActive = false;
    this._realtimePerformance.stoppedAt = new Date().toISOString();
    this._finalizeStatistics();
    this._executor.endSession();
    this._log('Bot stopped.');

    // Persist final state
    await this._persistStateToAPI();
    this._syncStatusToAPI(BOT_STATUSES.STOP);
  }

  /**
   * Pause the bot. Preserves session state.
   */
  pause() {
    if (this._status !== BOT_STATUSES.START) return;
    this._clearTradeLoop();
    this._setStatus(BOT_STATUSES.PAUSE);
    this._log('Bot paused.');
    this._syncStatusToAPI(BOT_STATUSES.PAUSE);
  }

  /**
   * Resume from paused state.
   */
  resume() {
    if (this._status !== BOT_STATUSES.PAUSE) return;

    if (!this.isWithinSchedule()) {
      this._log('Cannot resume — outside scheduled trading hours.');
      this.emit('schedule_paused', { message: 'Outside scheduled hours, waiting...' });
      return;
    }

    this._setStatus(BOT_STATUSES.START);
    this._log('Bot resumed.');
    this._syncStatusToAPI(BOT_STATUSES.RESUME);
    this._runTradeLoop();
  }

  /**
   * Emergency stop — immediate halt with error status.
   * @param {string} reason
   */
  async emergencyStop(reason) {
    this._clearAllTimers();
    this._setStatus(BOT_STATUSES.ERROR);
    this._isActive = false;
    this._realtimePerformance.stoppedAt = new Date().toISOString();
    this._finalizeStatistics();
    this._executor.endSession();
    this.emit('emergency_stop', { reason, timestamp: new Date().toISOString() });
    await this._persistStateToAPI();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CORE TRADE LOOP
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  async _runTradeLoop() {
    if (this._status !== BOT_STATUSES.START) return;

    // Pre-trade checks
    const check = this._performPreTradeChecks();
    if (!check.allowed) {
      this._log(`Trade blocked: ${check.reason}`);
      if (check.action === 'stop') {
        await this.stop();
      } else if (check.action === 'cooldown') {
        this._enterCooldown();
      } else if (check.action === 'wait') {
        this._tradeLoopTimer = setTimeout(() => this._runTradeLoop(), 5000);
      }
      return;
    }

    try {
      // Calculate stake
      const stake = this._calculateStake();
      this._session.currentStake = stake;
      this._realtimePerformance.currentStake = stake;
      if (stake > this._realtimePerformance.highestStake) {
        this._realtimePerformance.highestStake = stake;
      }

      this.emit('stake_updated', { stake });

      // Build contract params
      const tradeParams = this._buildContractParams(stake);

      this._log(`Executing trade #${this._session.totalTradesThisSession + 1}: ${tradeParams.contract_type} @ ${stake}`);

      // Execute via the executor
      const userToken = this._config.botAccount?.token || '';
      const result = await this._executor.executeTrade(tradeParams, userToken);

      // Process result
      this._processTradeResult(result);

      // Determine delay before next trade
      const delay = (this.contract.delay || 1) * 1000;

      // Schedule next trade
      if (this._status === BOT_STATUSES.START) {
        this._tradeLoopTimer = setTimeout(() => this._runTradeLoop(), delay);
      }
    } catch (error) {
      const errMsg = error.message || 'Unknown trade execution error';
      this.emit('error', { message: `Trade execution failed: ${errMsg}`, error: errMsg });

      // Retry after longer delay on error
      if (this._status === BOT_STATUSES.START) {
        this._tradeLoopTimer = setTimeout(() => this._runTradeLoop(), 5000);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADE PARAMETER BUILDING
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _buildContractParams(stake) {
    const c = this.contract;
    const tradeType = this._resolveTradeType(c);

    return this._executor.buildContractParams(
      { ...c, contractType: tradeType },
      stake,
      this.botCurrency,
    );
  }

  /**
   * Resolve the trade type, handling ALTERNATE and pipe-separated logic.
   * @private
   */
  _resolveTradeType(contract) {
    const rawType = contract.tradeType || contract.contractType || '';

    if ((contract.contractType === 'ALTERNATE' || rawType.includes('|')) && rawType.includes('|')) {
      const types = rawType.split('|');
      const alternateAfter = contract.alternateAfter || 1;

      if (this._session.alternateCounter >= alternateAfter) {
        this._session.alternateCounter = 0;
        this._session.currentTradeType =
          this._session.currentTradeType === types[0] ? types[1] : types[0];
      }

      this._session.alternateCounter++;

      if (!this._session.currentTradeType) {
        this._session.currentTradeType = types[0];
      }

      return this._session.currentTradeType;
    }

    if (rawType.includes('|')) {
      return rawType.split('|')[0];
    }

    return rawType;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADE RESULT PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _processTradeResult(result) {
    this._tradeHistory.push(result);
    this._session.totalTradesThisSession++;
    this._session.lastTradeTime = Date.now();

    // Update performance
    this._realtimePerformance.totalRuns++;
    this._realtimePerformance.totalStake += result.stake;
    this._realtimePerformance.totalPayout += result.payout;

    // Session tracking
    this._session.sessionStake += result.stake;
    this._session.sessionPayout += result.payout;
    this._session.sessionProfit += result.profit;

    // Periodic tracking
    const profit = result.profit;
    if (profit > 0) {
      this._session.dailyProfit += profit;
      this._session.hourlyProfit += profit;
      this._session.weeklyProfit += profit;
    } else {
      this._session.dailyLoss += Math.abs(profit);
      this._session.hourlyLoss += Math.abs(profit);
      this._session.weeklyLoss += Math.abs(profit);
    }

    // Balance tracking
    this._session.currentBalance = this._getBalance();
    if (this._session.currentBalance > this._session.peakBalance) {
      this._session.peakBalance = this._session.currentBalance;
    }

    if (result.isWin) {
      this._handleWin(result);
    } else {
      this._handleLoss(result);
    }

    // Update statistics
    this._updateStatistics(result);

    // Profit locking
    this._evaluateProfitLock();

    // Periodic API persistence
    this._tradesSinceLastPersist++;
    if (this._tradesSinceLastPersist >= this._persistEveryNTrades) {
      this._tradesSinceLastPersist = 0;
      this._persistStateToAPI().catch(() => {});
    }
  }

  /** @private */
  _handleWin(result) {
    this._realtimePerformance.numberOfWins++;
    this._realtimePerformance.currentWinStreak = (this._realtimePerformance.currentWinStreak || 0) + 1;
    this._realtimePerformance.currentLossStreak = 0;
    this._session.consecutiveWins++;
    this._session.consecutiveLosses = 0;

    this.emit('trade_won', { result, consecutiveWins: this._session.consecutiveWins });

    // Strategy-specific win handling
    this._onStrategyWin();

    // Check take profit
    if (this._checkTakeProfit()) {
      this.emit('take_profit_triggered', { sessionProfit: this._session.sessionProfit });
      this.stop();
      return;
    }

    // Exit recovery on win (if not progressive)
    if (this._session.isInRecovery && !this.recoverySettings.progressive_recovery) {
      this._session.isInRecovery = false;
      this._session.recoveryStepIndex = 0;
      this._session.recoveryAttempts = 0;
      this._log('Exited recovery mode after win.');
    }
  }

  /** @private */
  _handleLoss(result) {
    this._realtimePerformance.numberOfLosses++;
    this._realtimePerformance.currentLossStreak = (this._realtimePerformance.currentLossStreak || 0) + 1;
    this._realtimePerformance.currentWinStreak = 0;
    this._session.consecutiveLosses++;
    this._session.consecutiveWins = 0;

    this.emit('trade_lost', { result, consecutiveLosses: this._session.consecutiveLosses });

    // Strategy-specific loss handling
    this._onStrategyLoss();

    // Check stop loss
    if (this._checkStopLoss()) {
      this.emit('stop_loss_triggered', { sessionProfit: this._session.sessionProfit });
      this.stop();
      return;
    }

    // Enter recovery if configured
    this._evaluateRecovery();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STAKE CALCULATION — Strategy-Specific
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _calculateStake() {
    let stake = this._session.baseStake;

    // Recovery step stake takes priority
    if (this._session.isInRecovery) {
      const recoveryStake = this._getRecoveryStepStake();
      if (recoveryStake !== null) {
        return this._clampStake(recoveryStake);
      }
    }

    // Strategy-specific calculation
    const strategyStake = this._calculateStrategyStake();
    if (strategyStake !== null) {
      stake = strategyStake;
    }

    // Compound staking
    if (this.generalSettings.compound_stake && this._session.currentBalance > 0) {
      const basePercent = this._session.baseStake / (this._session.peakBalance || this._session.currentBalance);
      stake = this._session.currentBalance * basePercent;
    }

    return this._clampStake(stake);
  }

  /** @private */
  _calculateStrategyStake() {
    const sid = (this.strategyId || '').toLowerCase();

    // Map strategy IDs to calculation methods
    if (sid.includes('martingale') && sid.includes('reset')) return this._calcMartingaleResetStake();
    if (sid.includes('martingale') && sid.includes('reverse') && sid.includes('reset')) return this._calcReverseMartingaleResetStake();
    if (sid.includes('reverse') && sid.includes('martingale')) return this._calcReverseMartingaleStake();
    if (sid.includes('martingale') || sid.includes('options_martingale')) return this._calcMartingaleStake();

    if (sid.includes('dalembert') && sid.includes('reverse') && sid.includes('reset')) return this._calcReverseDalembertResetStake();
    if (sid.includes('reverse') && sid.includes('dalembert') && sid.includes('main')) return this._calcReverseDalembertMainStake();
    if (sid.includes('reverse') && sid.includes('dalembert')) return this._calcReverseDalembertStake();
    if (sid.includes('dalembert') && sid.includes('reset')) return this._calcDalembertResetStake();
    if (sid.includes('dalembert') || sid.includes('options_dalembert')) return this._calcDalembertStake();

    if (sid.includes('oscars') || sid.includes('grind')) return this._calcOscarsGrindStake();
    if (sid.includes('1326') || sid.includes('system_1326')) return this._calcSystem1326Stake();
    if (sid.includes('accumulator')) return this._calcAccumulatorStake();

    return null; // Use base stake
  }

  // ─── Martingale ────────────────────────────────────────────────────────────

  /** @private */
  _calcMartingaleStake() {
    const s = this.advancedSettings.martingale_strategy_section || {};
    const multiplier = s.martingale_multiplier || 2;
    const maxSteps = s.martingale_max_steps || 10;
    const safetyNet = s.martingale_safety_net;

    if (this._session.consecutiveLosses === 0) {
      this._session.martingaleStep = 0;
      return this._session.baseStake;
    }

    this._session.martingaleStep = Math.min(this._session.consecutiveLosses, maxSteps);
    let stake = this._session.baseStake * Math.pow(multiplier, this._session.martingaleStep);

    if (safetyNet && this._session.currentBalance > 0) {
      const maxFromSafety = this._session.currentBalance * (safetyNet / 100);
      stake = Math.min(stake, maxFromSafety);
    }

    return stake;
  }

  /** @private */
  _calcMartingaleResetStake() {
    const s = this.advancedSettings.martingale_reset_strategy_section || {};
    const resetAfter = s.reset_after_trades;

    if (resetAfter && this._session.totalTradesThisSession > 0 &&
        this._session.totalTradesThisSession % resetAfter === 0) {
      this._session.martingaleStep = 0;
      this._session.consecutiveLosses = 0;
      this._session.consecutiveWins = 0;
      this.emit('strategy_reset', { message: `Martingale reset after ${resetAfter} trades` });
      return this._session.baseStake;
    }

    const adjustment = s.reset_multiplier_adjustment || 0;
    const baseMartingale = this._calcMartingaleStake();
    if (adjustment > 0 && s.track_session_stats) {
      return baseMartingale * (1 + adjustment / 100);
    }
    return baseMartingale;
  }

  // ─── D'Alembert ────────────────────────────────────────────────────────────

  /** @private */
  _calcDalembertStake() {
    const s = this.advancedSettings.dalembert_strategy_section || {};
    const increment = this._resolveThresholdValue(s.dalembert_increment) || 1;
    const decrement = this._resolveThresholdValue(s.dalembert_decrement) || 1;
    const maxUnits = s.dalembert_max_units || 50;
    const conservative = s.dalembert_conservative_mode;

    if (this._session.totalTradesThisSession === 0) {
      this._session.dalembertUnits = 1;
    }

    const lastTrade = this._tradeHistory[this._tradeHistory.length - 1];
    if (lastTrade) {
      if (!lastTrade.isWin) {
        this._session.dalembertUnits += conservative ? Math.ceil(increment / 2) : increment;
      } else {
        this._session.dalembertUnits = Math.max(1, this._session.dalembertUnits - decrement);
      }
    }

    this._session.dalembertUnits = Math.min(this._session.dalembertUnits, maxUnits);

    const resetThreshold = this._resolveThresholdValue(s.dalembert_reset_threshold);
    if (resetThreshold > 0 && this._session.sessionProfit >= resetThreshold) {
      this._session.dalembertUnits = 1;
      this.emit('strategy_reset', { message: "D'Alembert reset at profit threshold" });
    }

    return this._session.baseStake * this._session.dalembertUnits;
  }

  /** @private */
  _calcDalembertResetStake() {
    const s = this.advancedSettings.dalembert_reset_strategy_section || {};
    const resetFreq = s.dalembert_reset_frequency;

    if (resetFreq && this._session.totalTradesThisSession > 0 &&
        this._session.totalTradesThisSession % resetFreq === 0) {
      this._session.dalembertUnits = 1;
      this.emit('strategy_reset', { message: `D'Alembert reset after ${resetFreq} trades` });

      if (s.dalembert_session_profit_lock && this._session.sessionProfit > 0) {
        this._session.lockedProfit += this._session.sessionProfit;
        this._log(`Session profit locked: ${this._session.sessionProfit}`);
      }
    }

    if (s.dalembert_reset_on_target && this._checkTakeProfit()) {
      this._session.dalembertUnits = 1;
    }

    const baseDalembert = this._calcDalembertStake();

    // Adaptive increment
    if (s.dalembert_adaptive_increment && this._session.totalTradesThisSession > 5) {
      const winRate = this._realtimePerformance.numberOfWins / this._realtimePerformance.totalRuns;
      if (winRate > 0.6) return baseDalembert * 0.8;
      if (winRate < 0.4) return baseDalembert * 1.2;
    }

    return baseDalembert;
  }

  // ─── Reverse Martingale ────────────────────────────────────────────────────

  /** @private */
  _calcReverseMartingaleStake() {
    const s = this.advancedSettings.reverse_martingale_strategy_section || {};
    const multiplier = s.reverse_martingale_multiplier || 2;
    const maxWins = s.reverse_martingale_max_wins || 5;
    const profitLock = s.reverse_martingale_profit_lock;
    const aggressive = s.reverse_martingale_aggressive_mode;

    if (s.reverse_martingale_reset_on_loss && this._session.consecutiveLosses > 0) {
      return this._session.baseStake;
    }

    if (this._session.consecutiveWins === 0) return this._session.baseStake;

    const steps = Math.min(this._session.consecutiveWins, maxWins);
    let stake = this._session.baseStake * Math.pow(multiplier, steps);

    if (profitLock && profitLock > 0 && this._session.sessionProfit > 0) {
      const locked = this._session.sessionProfit * (profitLock / 100);
      const maxRisk = this._session.sessionProfit - locked + this._session.baseStake;
      stake = Math.min(stake, maxRisk);
    }

    if (aggressive) stake *= 1.5;

    return stake;
  }

  /** @private */
  _calcReverseMartingaleResetStake() {
    const s = this.advancedSettings.reverse_martingale_reset_strategy_section || {};
    const resetWinStreak = s.reverse_reset_win_streak;
    const resetProfitTarget = this._resolveThresholdValue(s.reverse_reset_profit_target);

    if (resetWinStreak && this._session.consecutiveWins >= resetWinStreak) {
      this._session.consecutiveWins = 0;
      if (s.reverse_preserve_winnings) {
        this._session.lockedProfit += this._session.sessionProfit;
      }
      this.emit('strategy_reset', { message: `Reverse Martingale reset after ${resetWinStreak} wins` });
      return this._session.baseStake;
    }

    if (resetProfitTarget > 0 && this._session.sessionProfit >= resetProfitTarget) {
      this._session.consecutiveWins = 0;
      this.emit('strategy_reset', { message: 'Reverse Martingale reset at profit target' });
      return this._session.baseStake;
    }

    return this._calcReverseMartingaleStake();
  }

  // ─── Reverse D'Alembert ────────────────────────────────────────────────────

  /** @private */
  _calcReverseDalembertStake() {
    const s = this.advancedSettings.reverse_dalembert_strategy_section || {};
    const increment = this._resolveThresholdValue(s.reverse_dalembert_increment) || 1;
    const decrement = this._resolveThresholdValue(s.reverse_dalembert_decrement) || 1;
    const maxUnits = s.reverse_dalembert_max_units || 50;
    const profitCeiling = this._resolveThresholdValue(s.reverse_dalembert_profit_ceiling);

    if (this._session.totalTradesThisSession === 0) this._session.dalembertUnits = 1;

    const lastTrade = this._tradeHistory[this._tradeHistory.length - 1];
    if (lastTrade) {
      if (lastTrade.isWin) {
        this._session.dalembertUnits += increment;
      } else {
        this._session.dalembertUnits = Math.max(1, this._session.dalembertUnits - decrement);
      }
    }

    this._session.dalembertUnits = Math.min(this._session.dalembertUnits, maxUnits);

    if (profitCeiling > 0 && this._session.sessionProfit >= profitCeiling) {
      this._session.dalembertUnits = 1;
      this.emit('strategy_reset', { message: "Reverse D'Alembert reset at profit ceiling" });
    }

    return this._session.baseStake * this._session.dalembertUnits;
  }

  /** @private */
  _calcReverseDalembertResetStake() {
    const s = this.advancedSettings.reverse_dalembert_reset_strategy_section || {};
    const resetInterval = s.reverse_dalembert_reset_interval;
    const dynamicReset = s.reverse_dalembert_dynamic_reset;
    const winRateThreshold = s.reverse_dalembert_win_rate_threshold;

    if (resetInterval && this._session.totalTradesThisSession > 0 &&
        this._session.totalTradesThisSession % resetInterval === 0) {
      this._session.dalembertUnits = 1;
      this.emit('strategy_reset', { message: `Reverse D'Alembert reset after ${resetInterval} trades` });
    }

    if (dynamicReset && winRateThreshold && this._session.totalTradesThisSession > 5) {
      const winRate = this._realtimePerformance.numberOfWins / this._realtimePerformance.totalRuns;
      if (winRate < winRateThreshold / 100) {
        this._session.dalembertUnits = 1;
        this.emit('strategy_reset', { message: 'Dynamic reset: win rate below threshold' });
      }
    }

    return this._calcReverseDalembertStake();
  }

  /** @private */
  _calcReverseDalembertMainStake() {
    const s = this.advancedSettings.reverse_dalembert_main_strategy_section || {};
    const baseStake = this._resolveThresholdValue(s.reverse_dalembert_base_stake) || this._session.baseStake;
    const winIncrement = this._resolveThresholdValue(s.reverse_dalembert_win_increment) || 1;
    const lossDecrement = this._resolveThresholdValue(s.reverse_dalembert_loss_decrement) || 1;
    const maxUnits = s.reverse_dalembert_maximum_units || 50;
    const minUnits = s.reverse_dalembert_minimum_units || 1;
    const profitCeiling = this._resolveThresholdValue(s.reverse_dalembert_profit_ceiling);
    const aggressive = s.reverse_dalembert_aggressive_mode;
    const winStreakBonus = s.reverse_dalembert_win_streak_bonus;

    if (this._session.totalTradesThisSession === 0) this._session.dalembertUnits = 1;

    const lastTrade = this._tradeHistory[this._tradeHistory.length - 1];
    if (lastTrade) {
      if (lastTrade.isWin) {
        this._session.dalembertUnits += winIncrement;
        if (winStreakBonus && this._session.consecutiveWins >= 3) {
          this._session.dalembertUnits += winStreakBonus;
        }
      } else {
        this._session.dalembertUnits = Math.max(minUnits, this._session.dalembertUnits - lossDecrement);
      }
    }

    this._session.dalembertUnits = Math.min(this._session.dalembertUnits, maxUnits);
    this._session.dalembertUnits = Math.max(this._session.dalembertUnits, minUnits);

    if (profitCeiling > 0 && this._session.sessionProfit >= profitCeiling) {
      this._session.dalembertUnits = 1;
      this.emit('strategy_reset', { message: 'Reverse D\'Alembert Main reset at profit ceiling' });
    }

    let stake = baseStake * this._session.dalembertUnits;
    if (aggressive) stake *= 1.3;

    return stake;
  }

  // ─── Oscar's Grind ─────────────────────────────────────────────────────────

  /** @private */
  _calcOscarsGrindStake() {
    const s = this.advancedSettings.oscars_grind_strategy_section || {};
    const baseUnit = this._resolveThresholdValue(s.oscars_grind_base_unit) || this._session.baseStake;
    const profitTarget = this._resolveThresholdValue(s.oscars_grind_profit_target) || baseUnit;
    const maxBetUnits = s.oscars_grind_max_bet_units || 10;
    const incrementOnWin = s.oscars_grind_increment_on_win;
    const maintainOnLoss = s.oscars_grind_maintain_stake_on_loss;
    const resetOnTarget = s.oscars_grind_reset_on_target;
    const autoStop = s.oscars_grind_auto_stop_on_target;

    if (this._session.totalTradesThisSession === 0) {
      this._session.oscarsGrindCurrentUnit = 1;
      this._session.oscarsGrindSessionProfit = 0;
    }

    const lastTrade = this._tradeHistory[this._tradeHistory.length - 1];
    if (lastTrade) {
      this._session.oscarsGrindSessionProfit += lastTrade.profit;

      if (lastTrade.isWin && incrementOnWin) {
        if (this._session.oscarsGrindSessionProfit < profitTarget) {
          this._session.oscarsGrindCurrentUnit = Math.min(
            this._session.oscarsGrindCurrentUnit + 1, maxBetUnits
          );
        }
      }
      // On loss: maintain current unit (Oscar's Grind rule)
    }

    if (this._session.oscarsGrindSessionProfit >= profitTarget) {
      if (autoStop) {
        this.emit('take_profit_triggered', { message: "Oscar's Grind session target reached" });
        this.stop();
        return baseUnit;
      }
      if (resetOnTarget) {
        this._session.oscarsGrindCurrentUnit = 1;
        this._session.oscarsGrindSessionProfit = 0;
        this.emit('strategy_reset', { message: "Oscar's Grind reset at profit target" });
      }
    }

    const neededForTarget = profitTarget - this._session.oscarsGrindSessionProfit;
    const stakeUnits = Math.min(this._session.oscarsGrindCurrentUnit, Math.ceil(neededForTarget / baseUnit));

    return baseUnit * Math.max(1, stakeUnits);
  }

  // ─── 1-3-2-6 System ────────────────────────────────────────────────────────

  /** @private */
  _calcSystem1326Stake() {
    const s = this.advancedSettings.system_1326_strategy_section || {};
    const baseUnit = this._resolveThresholdValue(s.system_1326_base_unit) || this._session.baseStake;
    const sequenceStr = s.system_1326_sequence || '1-3-2-6';
    const sequence = sequenceStr.split('-').map(Number);
    const resetOnLoss = s.system_1326_reset_on_loss;
    const maxCycles = s.system_1326_max_cycles;
    const stopOnComplete = s.system_1326_stop_on_cycle_complete;
    const lossRecovery = s.system_1326_loss_recovery;

    if (this._session.totalTradesThisSession === 0) {
      this._session.system1326Step = 0;
    }

    const lastTrade = this._tradeHistory[this._tradeHistory.length - 1];
    if (lastTrade) {
      if (lastTrade.isWin) {
        this._session.system1326Step++;
        if (this._session.system1326Step >= sequence.length) {
          if (stopOnComplete) {
            this.emit('strategy_reset', { message: '1-3-2-6 cycle complete — stopping' });
            this.stop();
            return baseUnit;
          }
          this._session.system1326Step = 0;
          this.emit('strategy_reset', { message: '1-3-2-6 cycle complete — restarting' });
        }
      } else {
        if (resetOnLoss) this._session.system1326Step = 0;
        // lossRecovery: stay at current step
      }
    }

    if (maxCycles) {
      const completedCycles = Math.floor(this._session.totalTradesThisSession / sequence.length);
      if (completedCycles >= maxCycles) {
        this.emit('max_trades_reached', { message: `Max cycles (${maxCycles}) reached` });
        this.stop();
        return baseUnit;
      }
    }

    const stepIndex = Math.min(this._session.system1326Step, sequence.length - 1);
    const multiplier = sequence[stepIndex] || 1;

    if (s.system_1326_partial_profit_lock && this._session.sessionProfit > 0 && stepIndex >= 2) {
      return baseUnit * multiplier * 0.9;
    }

    return baseUnit * multiplier;
  }

  // ─── Accumulator ───────────────────────────────────────────────────────────

  /** @private */
  _calcAccumulatorStake() {
    const s = this.advancedSettings.accumulator_strategy_section || {};
    const growthRate = s.accumulator_growth_rate || 0.01;
    const targetMultiplier = s.accumulator_target_multiplier || 10;

    // Accumulator uses base stake with growth
    let stake = this._session.baseStake;

    if (this._session.consecutiveWins > 0) {
      stake = this._session.baseStake * (1 + growthRate * this._session.consecutiveWins);
    }

    // Auto cashout at target
    if (s.accumulator_auto_cashout && this._session.sessionProfit >= this._session.baseStake * targetMultiplier) {
      this.emit('take_profit_triggered', { message: 'Accumulator target multiplier reached' });
      this.stop();
      return this._session.baseStake;
    }

    return stake;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STRATEGY WIN/LOSS HOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _onStrategyWin() {
    const sid = (this.strategyId || '').toLowerCase();

    if (sid.includes('martingale') && !sid.includes('reverse')) {
      const s = this.advancedSettings.martingale_strategy_section || {};
      if (s.martingale_reset_on_profit) {
        this._session.martingaleStep = 0;
      }
    }
  }

  /** @private */
  _onStrategyLoss() {
    const sid = (this.strategyId || '').toLowerCase();

    if (sid.includes('reverse') && sid.includes('martingale')) {
      const s = this.advancedSettings.reverse_martingale_strategy_section || {};
      if (s.reverse_martingale_reset_on_loss) {
        this._session.consecutiveWins = 0;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOVERY SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _evaluateRecovery() {
    const riskSteps = this._config.recovery_steps?.risk_steps || [];
    const recoveryType = this.generalSettings.recovery_type;

    if (!recoveryType || recoveryType === 'off' || riskSteps.length === 0) return;

    if (this._session.consecutiveLosses > 0) {
      this._session.isInRecovery = true;
      this._session.recoveryAttempts++;

      const maxAttempts = this.recoverySettings.max_recovery_attempts;
      if (maxAttempts && this._session.recoveryAttempts > maxAttempts) {
        this._log('Max recovery attempts reached.');
        this._session.isInRecovery = false;
        if (this.recoverySettings.recovery_cooldown) {
          this._enterRecoveryCooldown();
        }
        return;
      }

      this.emit('recovery_triggered', {
        lossStreak: this._session.consecutiveLosses,
        recoveryAttempts: this._session.recoveryAttempts,
      });

      if (this.recoverySettings.progressive_recovery) {
        this._session.recoveryStepIndex = Math.min(
          this._session.recoveryStepIndex + 1, riskSteps.length - 1
        );
        this.emit('recovery_step_changed', { stepIndex: this._session.recoveryStepIndex });
      }
    }
  }

  /** @private */
  _getRecoveryStepStake() {
    const riskSteps = this._config.recovery_steps?.risk_steps || [];
    if (riskSteps.length === 0) return null;

    const stepIndex = Math.min(this._session.recoveryStepIndex, riskSteps.length - 1);
    const step = riskSteps[stepIndex];

    if (step && step.multiplier) {
      const recoveryMultiplier = this.recoverySettings.recovery_multiplier || 1;
      return this._session.baseStake * step.multiplier * recoveryMultiplier;
    }

    return null;
  }

  /** @private */
  _enterRecoveryCooldown() {
    const cooldown = this.recoverySettings.recovery_cooldown;
    if (!cooldown) return;

    const durationMs = parseDurationToMs(cooldown.duration, cooldown.unit);
    this._session.isInCooldown = true;
    this._session.cooldownEndTime = Date.now() + durationMs;

    this.emit('cooldown_started', { duration: cooldown.duration, unit: cooldown.unit, type: 'recovery' });

    this._cooldownTimer = setTimeout(() => {
      this._session.isInCooldown = false;
      this._session.cooldownEndTime = null;
      this._session.recoveryAttempts = 0;
      this.emit('cooldown_ended', { type: 'recovery' });

      if (this._status === BOT_STATUSES.START || (this._status === BOT_STATUSES.IDLE && this.generalSettings.auto_restart)) {
        this._runTradeLoop();
      }
    }, durationMs);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRE-TRADE CHECKS — Risk Management, Limits, Schedule
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _performPreTradeChecks() {
    // 1. Bot running?
    if (this._status !== BOT_STATUSES.START) {
      return { allowed: false, reason: 'Bot is not running', action: 'stop' };
    }

    // 2. Cooldown?
    if (this._session.isInCooldown) {
      return { allowed: false, reason: 'In cooldown period', action: 'wait' };
    }

    // 3. Schedule?
    if (!this.isWithinSchedule()) {
      this.emit('schedule_paused', { message: 'Outside scheduled trading hours' });
      return { allowed: false, reason: 'Outside schedule', action: 'wait' };
    }

    // 4. Max trades?
    const maxTrades = this.generalSettings.maximum_number_of_trades;
    if (maxTrades && this._session.totalTradesThisSession >= maxTrades) {
      this.emit('max_trades_reached', { maxTrades });
      return { allowed: false, reason: 'Max trades reached', action: 'stop' };
    }

    // 5. Max consecutive losses?
    const maxConsecLosses = this.riskManagement.max_consecutive_losses;
    if (maxConsecLosses && this._session.consecutiveLosses >= maxConsecLosses) {
      this.emit('risk_limit_hit', { type: 'max_consecutive_losses', value: maxConsecLosses });
      return { allowed: false, reason: 'Max consecutive losses', action: 'cooldown' };
    }

    // 6. Max daily loss?
    const maxDailyLoss = this._resolveThresholdValue(this.riskManagement.max_daily_loss);
    if (maxDailyLoss > 0 && this._session.dailyLoss >= maxDailyLoss) {
      this.emit('risk_limit_hit', { type: 'max_daily_loss', value: maxDailyLoss });
      return { allowed: false, reason: 'Max daily loss reached', action: 'stop' };
    }

    // 7. Max daily profit?
    const maxDailyProfit = this._resolveThresholdValue(this.riskManagement.max_daily_profit);
    if (maxDailyProfit > 0 && this._session.dailyProfit >= maxDailyProfit) {
      this.emit('risk_limit_hit', { type: 'max_daily_profit', value: maxDailyProfit });
      return { allowed: false, reason: 'Max daily profit reached', action: 'stop' };
    }

    // 8. Max drawdown?
    const maxDrawdown = this.riskManagement.max_drawdown_percentage;
    if (maxDrawdown && this._session.peakBalance > 0) {
      const currentDrawdown = ((this._session.peakBalance - this._session.currentBalance) / this._session.peakBalance) * 100;
      if (currentDrawdown >= maxDrawdown) {
        this.emit('risk_limit_hit', { type: 'max_drawdown', value: maxDrawdown, current: currentDrawdown });
        return { allowed: false, reason: 'Max drawdown reached', action: 'stop' };
      }
    }

    // 9. Emergency stop?
    if (this.riskManagement.emergency_stop) {
      const emergencyThreshold = this._session.baseStake * 20;
      if (this._session.sessionProfit < -emergencyThreshold) {
        this.emergencyStop('Emergency stop threshold exceeded');
        return { allowed: false, reason: 'Emergency stop', action: 'stop' };
      }
    }

    // 10. Volatility filter?
    if (this.volatilityControls.volatility_filter && this._volatilityProvider) {
      const volatility = this._volatilityProvider();
      const minVol = this.volatilityControls.min_volatility;
      const maxVol = this.volatilityControls.max_volatility;

      if (minVol !== null && volatility < minVol) {
        this.emit('volatility_pause', { volatility, min: minVol });
        return { allowed: false, reason: 'Volatility too low', action: 'wait' };
      }
      if (maxVol !== null && volatility > maxVol) {
        if (this.volatilityControls.pause_on_high_volatility) {
          this.emit('volatility_pause', { volatility, max: maxVol });
          return { allowed: false, reason: 'Volatility too high', action: 'wait' };
        }
      }
    }

    // 11. Risk per trade?
    const riskPerTrade = this._resolveThresholdValue(this.riskManagement.risk_per_trade);
    if (riskPerTrade > 0 && this._session.currentBalance > 0) {
      const maxStakeFromRisk = this._session.currentBalance * (riskPerTrade / 100);
      if (this._session.currentStake > maxStakeFromRisk) {
        this._session.currentStake = maxStakeFromRisk;
      }
    }

    return { allowed: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STOP LOSS / TAKE PROFIT
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _checkStopLoss() {
    const stopLoss = this._resolveThresholdValue(this.amounts.stop_loss);
    if (stopLoss <= 0) return false;
    return Math.abs(this._session.sessionProfit) >= stopLoss && this._session.sessionProfit < 0;
  }

  /** @private */
  _checkTakeProfit() {
    const takeProfit = this._resolveThresholdValue(this.amounts.take_profit);
    if (takeProfit <= 0) return false;
    return this._session.sessionProfit >= takeProfit;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFIT LOCKING
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _evaluateProfitLock() {
    if (this._session.sessionProfit <= 0) return;

    // High water mark tracking
    if (this._session.sessionProfit > this._session.highWaterMark) {
      this._session.highWaterMark = this._session.sessionProfit;
    }

    // Lock a percentage of profits above the high water mark
    const profitLockPercent = this.advancedSettings.reverse_martingale_strategy_section?.reverse_martingale_profit_lock;
    if (profitLockPercent && profitLockPercent > 0) {
      const lockable = this._session.sessionProfit - this._session.lockedProfit;
      if (lockable > 0) {
        const newLock = lockable * (profitLockPercent / 100);
        this._session.lockedProfit += newLock;
        this.emit('profit_locked', {
          locked: newLock,
          totalLocked: this._session.lockedProfit,
          sessionProfit: this._session.sessionProfit,
        });
      }
    }

    // If session profit drops below locked amount, stop to protect
    if (this._session.lockedProfit > 0 && this._session.sessionProfit < this._session.lockedProfit * 0.5) {
      this.emit('profit_protection_triggered', {
        lockedProfit: this._session.lockedProfit,
        currentProfit: this._session.sessionProfit,
      });
      this.stop();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COOLDOWN
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _enterCooldown() {
    const cooldownConfig = this.generalSettings.cooldown_period;
    if (!cooldownConfig) {
      this.stop();
      return;
    }

    let durationMs;
    if (typeof cooldownConfig === 'string') {
      durationMs = parseInt(cooldownConfig, 10) * 1000;
    } else if (typeof cooldownConfig === 'object' && cooldownConfig !== null) {
      durationMs = parseDurationToMs(cooldownConfig.duration, cooldownConfig.unit);
    } else {
      durationMs = 5000;
    }

    this._session.isInCooldown = true;
    this._session.cooldownEndTime = Date.now() + durationMs;

    this.emit('cooldown_started', { durationMs, type: 'general' });

    this._cooldownTimer = setTimeout(() => {
      this._session.isInCooldown = false;
      this._session.cooldownEndTime = null;
      this.emit('cooldown_ended', { type: 'general' });

      if (this.generalSettings.auto_restart && this._status === BOT_STATUSES.START) {
        this._session.consecutiveLosses = 0;
        this._session.consecutiveWins = 0;
        this._session.isInRecovery = false;
        this._session.recoveryStepIndex = 0;
        this._log('Auto-restarting after cooldown');
        this._runTradeLoop();
      } else {
        this.stop();
      }
    }, durationMs);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Check if the current time is within the bot's configured schedule.
   * @returns {boolean}
   */
  isWithinSchedule() {
    const schedule = this.botSchedule;
    if (!schedule || !schedule.isEnabled) return true;

    const now = new Date();

    // Exclusion dates
    if (schedule.exclusions && schedule.exclusions.length > 0) {
      for (const exclusion of schedule.exclusions) {
        const exclusionDate = new Date(exclusion.date);
        if (isSameDay(now, exclusionDate)) {
          this._log(`Schedule exclusion: ${exclusion.reason}`);
          return false;
        }
      }
    }

    // Date range
    if (schedule.startDate && now < new Date(schedule.startDate)) return false;
    if (schedule.endDate && now > new Date(schedule.endDate)) return false;

    // Time of day
    if (schedule.startTime && schedule.endTime) {
      const startTime = new Date(schedule.startTime);
      const endTime = new Date(schedule.endTime);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

      if (endMinutes > startMinutes) {
        if (nowMinutes < startMinutes || nowMinutes > endMinutes) return false;
      } else {
        if (nowMinutes < startMinutes && nowMinutes > endMinutes) return false;
      }
    }

    // Day of week (weekly)
    if (schedule.type === 'weekly' && schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      if (!schedule.daysOfWeek.includes(now.getDay())) return false;
    }

    // Day of month (monthly)
    if (schedule.type === 'monthly' && schedule.dayOfMonth) {
      if (now.getDate() !== schedule.dayOfMonth) return false;
    }

    return true;
  }

  /** @private */
  _startScheduleMonitor() {
    if (this._scheduleCheckTimer) clearInterval(this._scheduleCheckTimer);

    this._scheduleCheckTimer = setInterval(() => {
      const withinSchedule = this.isWithinSchedule();
      this.emit('schedule_check', { withinSchedule });

      if (withinSchedule && this._status === BOT_STATUSES.IDLE) {
        this._log('Schedule window opened — starting bot');
        this.start();
      } else if (!withinSchedule && this._status === BOT_STATUSES.START) {
        this._log('Schedule window closed — pausing bot');
        this.pause();
        this.emit('schedule_paused', { message: 'Paused due to schedule' });
      }
    }, 60000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAX RUNTIME TIMER
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _startMaxRuntimeTimer() {
    const maxRuntime = this.generalSettings.maximum_running_time;
    if (!maxRuntime) return;

    const durationMs = maxRuntime * 1000;
    this._runtimeTimer = setTimeout(() => {
      this.emit('max_runtime_reached', { maxRuntime });
      this.stop();
    }, durationMs);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERIODIC RESETS (hourly, daily, weekly counters)
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _startPeriodicResets() {
    if (this._periodicResetTimer) clearInterval(this._periodicResetTimer);

    this._session.lastHourlyReset = Date.now();
    this._session.lastDailyReset = Date.now();
    this._session.lastWeeklyReset = Date.now();

    this._periodicResetTimer = setInterval(() => {
      const now = Date.now();

      if (this._session.lastHourlyReset && now - this._session.lastHourlyReset >= 3600000) {
        this._session.hourlyProfit = 0;
        this._session.hourlyLoss = 0;
        this._session.lastHourlyReset = now;
      }

      if (this._session.lastDailyReset && now - this._session.lastDailyReset >= 86400000) {
        this._session.dailyProfit = 0;
        this._session.dailyLoss = 0;
        this._session.lastDailyReset = now;
      }

      if (this._session.lastWeeklyReset && now - this._session.lastWeeklyReset >= 604800000) {
        this._session.weeklyProfit = 0;
        this._session.weeklyLoss = 0;
        this._session.lastWeeklyReset = now;
      }
    }, 60000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _updateStatistics(result) {
    const s = this._statistics;
    s.lifetimeRuns++;
    s.totalStake += result.stake;
    s.totalPayout += result.payout;
    s.totalProfit += result.profit;

    if (result.isWin) {
      s.lifetimeWins++;
      s.averageWinAmount = (s.averageWinAmount * (s.lifetimeWins - 1) + result.profit) / s.lifetimeWins;
    } else {
      s.lifetimeLosses++;
      s.averageLossAmount = (s.averageLossAmount * (s.lifetimeLosses - 1) + Math.abs(result.profit)) / s.lifetimeLosses;
    }

    // Win rate
    s.winRate = s.lifetimeRuns > 0 ? (s.lifetimeWins / s.lifetimeRuns) * 100 : 0;

    // Profit factor
    const totalWinAmount = s.averageWinAmount * s.lifetimeWins;
    const totalLossAmount = s.averageLossAmount * s.lifetimeLosses;
    s.profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;

    // Streaks
    if (this._session.consecutiveWins > s.longestWinStreak) s.longestWinStreak = this._session.consecutiveWins;
    if (this._session.consecutiveLosses > s.longestLossStreak) s.longestLossStreak = this._session.consecutiveLosses;
    if (this._session.consecutiveWins > 0 && (s.shortestWinStreak === 0 || this._session.consecutiveWins < s.shortestWinStreak)) {
      s.shortestWinStreak = this._session.consecutiveWins;
    }
    if (this._session.consecutiveLosses > 0 && (s.shortestLossStreak === 0 || this._session.consecutiveLosses < s.shortestLossStreak)) {
      s.shortestLossStreak = this._session.consecutiveLosses;
    }

    // Highest stake/payout
    if (result.stake > s.highestStake) s.highestStake = result.stake;
    if (result.payout > s.highestPayout) s.highestPayout = result.payout;

    // ROI
    s.roi = s.totalStake > 0 ? (s.totalProfit / s.totalStake) * 100 : null;

    // Max drawdown
    if (this._session.peakBalance > 0) {
      const drawdown = ((this._session.peakBalance - this._session.currentBalance) / this._session.peakBalance) * 100;
      if (s.maxDrawdown === null || drawdown > s.maxDrawdown) {
        s.maxDrawdown = drawdown;
      }
    }

    s.lastUpdated = new Date().toISOString();
  }

  /** @private */
  _finalizeStatistics() {
    this._statistics.lastUpdated = new Date().toISOString();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _validateBeforeStart() {
    const errors = [];

    if (!this.strategyId) errors.push('Strategy ID is required');
    if (!this.contract || Object.keys(this.contract).length === 0) errors.push('Contract configuration is required');
    if (this.contract && !this.contract.market && !this.contract.symbol) errors.push('Market selection is required');
    if (this.contract && !this.contract.tradeType && !this.contract.contractType) errors.push('Trade type is required');

    const baseStake = this._resolveThresholdValue(this.amounts.base_stake);
    if (!baseStake || baseStake <= 0) errors.push('Base stake must be greater than 0');

    if (!this._config.botAccount?.token) errors.push('Deriv account token is required');

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Public validation — call before start to check readiness.
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validate() {
    return this._validateBeforeStart();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SERIALIZATION — Convert back to config for API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Serialize the bot state back to a configuration object for API persistence.
   * @returns {Object}
   */
  toConfig() {
    return {
      ...this._config,
      status: this._status,
      isActive: this._isActive,
      updatedAt: new Date().toISOString(),
      realtimePerformance: { ...this._realtimePerformance },
      statistics: { ...this._statistics },
    };
  }

  toJSON() {
    return this.toConfig();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // API PERSISTENCE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  async _persistStateToAPI() {
    const uuid = this.botUUID || this.botId;
    if (!uuid) return;

    try {
      await Promise.all([
        this._executor.updateRealtimePerformance(uuid, this._realtimePerformance),
        this._executor.updateStatistics(uuid, this._statistics),
      ]);
    } catch (err) {
      this.emit('persist_error', { error: err.message });
    }
  }

  /** @private */
  async _syncStatusToAPI(status) {
    const uuid = this.botUUID || this.botId;
    if (!uuid) return;

    try {
      await this._executor.updateBotStatus(uuid, status);
    } catch (err) {
      this.emit('persist_error', { error: err.message, context: 'status_sync' });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /** @private */
  _setStatus(status) {
    const prev = this._status;
    this._status = status;
    this._config.status = status;
    this.emit('status_changed', { from: prev, to: status });
  }

  /** @private */
  _getBalance() {
    if (this._balanceProvider) return this._balanceProvider();
    return this._session.currentBalance || 10000;
  }

  /**
   * Resolve a threshold value (fixed number, string, or { type, value, balancePercentage }).
   * @private
   */
  _resolveThresholdValue(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;

    if (typeof value === 'object') {
      if (value.type === 'fixed') return value.value || 0;
      if (value.type === 'percentage') {
        const balance = this._getBalance();
        const percentage = value.balancePercentage || value.value || 0;
        return balance * (percentage / 100);
      }
      if (value.type === 'dynamic') {
        // Dynamic: use value as base, adjust by win rate
        const base = value.value || 0;
        if (this._realtimePerformance.totalRuns > 5) {
          const winRate = this._realtimePerformance.numberOfWins / this._realtimePerformance.totalRuns;
          return base * (0.5 + winRate); // Scale between 50%-150% of base
        }
        return base;
      }
      return value.value || 0;
    }

    return 0;
  }

  /**
   * Clamp stake to be within base_stake minimum and maximum_stake bounds.
   * @private
   */
  _clampStake(stake) {
    const minStake = this._session.baseStake * 0.01;
    const maxStake = this._resolveThresholdValue(this.amounts.maximum_stake);

    stake = Math.max(stake, minStake);
    if (maxStake > 0) stake = Math.min(stake, maxStake);

    // Risk per trade limit
    const riskPerTrade = this._resolveThresholdValue(this.riskManagement.risk_per_trade);
    if (riskPerTrade > 0 && this._session.currentBalance > 0) {
      const maxFromRisk = this._session.currentBalance * (riskPerTrade / 100);
      stake = Math.min(stake, maxFromRisk);
    }

    // Locked profit protection: never risk more than unlocked funds
    if (this._session.lockedProfit > 0) {
      const unlockedFunds = this._session.currentBalance - this._session.lockedProfit;
      if (unlockedFunds > 0) {
        stake = Math.min(stake, unlockedFunds * 0.5); // Max 50% of unlocked funds
      }
    }

    return roundToTwo(Math.max(stake, 0.01));
  }

  /** @private */
  _log(message) {
    this.emit('log', { message, botId: this.botId, timestamp: new Date().toISOString() });
  }

  // ─── Timer Cleanup ─────────────────────────────────────────────────────────

  /** @private */
  _clearTradeLoop() {
    if (this._tradeLoopTimer) { clearTimeout(this._tradeLoopTimer); this._tradeLoopTimer = null; }
  }

  /** @private */
  _clearAllTimers() {
    this._clearTradeLoop();
    if (this._scheduleCheckTimer) { clearInterval(this._scheduleCheckTimer); this._scheduleCheckTimer = null; }
    if (this._cooldownTimer) { clearTimeout(this._cooldownTimer); this._cooldownTimer = null; }
    if (this._runtimeTimer) { clearTimeout(this._runtimeTimer); this._runtimeTimer = null; }
    if (this._periodicResetTimer) { clearInterval(this._periodicResetTimer); this._periodicResetTimer = null; }
    if (this._persistTimer) { clearTimeout(this._persistTimer); this._persistTimer = null; }
  }

  /**
   * Full cleanup — call when the bot instance is being destroyed.
   */
  destroy() {
    this._clearAllTimers();
    this.removeAllListeners();
    this._tradeHistory = [];
    this._executor = null;
    this._balanceProvider = null;
    this._volatilityProvider = null;
  }
}

export {
  TradingBotManager,
  BOT_STATUSES,
  STRATEGY_TYPES,
  getDefaultPerformance,
  getDefaultStatistics,
  getDefaultAdvancedSettings,
  createFreshSession,
};
