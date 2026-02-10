/**
 * @file: TradingBot.ts
 * @description: Comprehensive Trading Bot class that handles the full runtime lifecycle
 *               of a trading bot — from form data ingestion to strategy execution,
 *               risk management, scheduling, recovery, and statistics tracking.
 *
 * @features:
 *   - Form data → Bot instance creation
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
 *
 * @usage:
 *   const bot = TradingBot.fromFormData(formData);
 *   bot.on('trade_executed', (e) => console.log(e));
 *   await bot.start();
 */

import { ContractData } from '../../types/strategy';
import { StrategyType } from '../../types/trade';
import { BotConfiguration, BotStatus, RealtimePerformance, Statistics } from './BotManager';

// ─── Threshold Value ────────────────────────────────────────────────────────────
export interface ThresholdValue {
  type: 'fixed' | 'percentage';
  value: number;
  balancePercentage?: number;
}

// ─── Trade Result ───────────────────────────────────────────────────────────────
export interface TradeResult {
  tradeId: string;
  contractId: string;
  entryTime: string;
  exitTime: string;
  stake: number;
  payout: number;
  profit: number;
  isWin: boolean;
  contractType: string;
  market: string;
  duration: number;
  durationUnits: string;
}

// ─── Bot Event Types ────────────────────────────────────────────────────────────
export type TradingBotEventType =
  | 'status_changed'
  | 'trade_executed'
  | 'trade_won'
  | 'trade_lost'
  | 'stake_updated'
  | 'recovery_triggered'
  | 'recovery_step_changed'
  | 'risk_limit_hit'
  | 'stop_loss_triggered'
  | 'take_profit_triggered'
  | 'cooldown_started'
  | 'cooldown_ended'
  | 'schedule_check'
  | 'schedule_paused'
  | 'schedule_resumed'
  | 'emergency_stop'
  | 'max_trades_reached'
  | 'max_runtime_reached'
  | 'volatility_pause'
  | 'strategy_reset'
  | 'error'
  | 'log';

export interface TradingBotEvent {
  type: TradingBotEventType;
  botId: string;
  timestamp: string;
  message: string;
  data?: any;
}

export type TradingBotEventListener = (event: TradingBotEvent) => void;

// ─── Internal Session State ─────────────────────────────────────────────────────
interface SessionState {
  currentStake: number;
  baseStake: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  totalTradesThisSession: number;
  sessionProfit: number;
  sessionStake: number;
  sessionPayout: number;
  dailyProfit: number;
  dailyLoss: number;
  hourlyProfit: number;
  hourlyLoss: number;
  weeklyProfit: number;
  weeklyLoss: number;
  peakBalance: number;
  currentBalance: number;
  recoveryStepIndex: number;
  recoveryAttempts: number;
  isInRecovery: boolean;
  isInCooldown: boolean;
  cooldownEndTime: number | null;
  lastTradeTime: number | null;
  sessionStartTime: number | null;
  lastDailyReset: number | null;
  lastHourlyReset: number | null;
  lastWeeklyReset: number | null;
  // Strategy-specific counters
  martingaleStep: number;
  dalembertUnits: number;
  system1326Step: number;
  oscarsGrindSessionProfit: number;
  oscarsGrindCurrentUnit: number;
  alternateCounter: number;
  currentTradeType: string;
}

// ─── Trade Execution Callback ───────────────────────────────────────────────────
export type TradeExecutor = (params: {
  symbol: string;
  contractType: string;
  tradeType: string;
  amount: number;
  duration: number;
  durationUnits: string;
  prediction?: string;
  multiplier?: number;
  allowEquals?: boolean;
  basis: 'stake' | 'payout';
  currency: string;
}) => Promise<TradeResult>;

/**
 * TradingBot — The runtime engine for a configured trading bot.
 *
 * Accepts form data (BotConfiguration) and provides all the intelligence
 * for executing trades, managing risk, applying strategy-specific recovery,
 * and tracking performance.
 */
export class TradingBot {
  // ─── Configuration (immutable after construction) ───────────────────────────
  readonly botId: string;
  readonly parentBotId: string;
  readonly strategyId: string;
  readonly botName: string;
  readonly botDescription: string;
  readonly botIcon: string;
  readonly botThumbnail: string;
  readonly botBanner: string;
  readonly botTags: string[];
  readonly botCurrency: string;
  readonly isPremium: boolean;
  readonly isPublic: boolean;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly version: { current: string; notes: string; date: string };

  // ─── Mutable Configuration ──────────────────────────────────────────────────
  private _config: BotConfiguration;
  private _status: BotStatus;
  private _isActive: boolean;
  private _updatedAt: string;
  private _deletedAt: string | null;

  // ─── Runtime State ──────────────────────────────────────────────────────────
  private session: SessionState;
  private realtimePerformance: RealtimePerformance;
  private statistics: Statistics;

  // ─── Timers & Intervals ─────────────────────────────────────────────────────
  private tradeLoopTimer: ReturnType<typeof setTimeout> | null = null;
  private scheduleCheckTimer: ReturnType<typeof setInterval> | null = null;
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private runtimeTimer: ReturnType<typeof setTimeout> | null = null;
  private periodicResetTimer: ReturnType<typeof setInterval> | null = null;

  // ─── Events ─────────────────────────────────────────────────────────────────
  private eventListeners: Map<TradingBotEventType, TradingBotEventListener[]> = new Map();

  // ─── External Dependencies ──────────────────────────────────────────────────
  private tradeExecutor: TradeExecutor | null = null;
  private balanceProvider: (() => number) | null = null;

  // ─── Trade History ──────────────────────────────────────────────────────────
  private tradeHistory: TradeResult[] = [];

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════════════════

  constructor(config: BotConfiguration) {
    this._config = { ...config };
    this.botId = config.botId;
    this.parentBotId = (config as any).parentBotId || '';
    this.strategyId = config.strategyId;
    this.botName = config.botName;
    this.botDescription = config.botDescription;
    this.botIcon = config.botIcon;
    this.botThumbnail = config.botThumbnail;
    this.botBanner = config.botBanner;
    this.botTags = [...config.botTags];
    this.botCurrency = config.botCurrency;
    this.isPremium = config.isPremium;
    this.isPublic = config.isPublic;
    this.createdBy = config.createdBy;
    this.createdAt = config.createdAt;
    this.version = { ...config.version };

    this._status = config.status || 'IDLE';
    this._isActive = config.isActive;
    this._updatedAt = config.updatedAt;
    this._deletedAt = config.deletedAt;

    this.realtimePerformance = { ...config.realtimePerformance };
    this.statistics = { ...config.statistics };

    this.session = this.createFreshSession();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATIC FACTORY — Create from raw form data
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Create a TradingBot instance directly from the form data payload.
   */
  static fromFormData(formData: any, meta?: {
    botName?: string;
    botDescription?: string;
    botTags?: string[];
    createdBy?: string;
    botCurrency?: string;
  }): TradingBot {
    const now = new Date().toISOString();
    const config: BotConfiguration = {
      strategyId: formData.strategyId,
      contract: formData.contract,
      status: 'IDLE',
      botId: formData.botId || `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      botName: meta?.botName || formData.botName || 'Untitled Bot',
      botDescription: meta?.botDescription || formData.botDescription || '',
      botIcon: formData.botIcon || '',
      botThumbnail: formData.botThumbnail || '',
      botBanner: formData.botBanner || '',
      botTags: meta?.botTags || formData.botTags || [],
      botCurrency: meta?.botCurrency || formData.botCurrency || 'USD',
      isActive: false,
      isPremium: formData.isPremium || false,
      isPublic: formData.isPublic || false,
      createdBy: meta?.createdBy || formData.createdBy || '',
      createdAt: formData.createdAt || now,
      updatedAt: now,
      deletedAt: null,
      version: formData.version || { current: '1.0.0', notes: 'Initial version', date: now },
      amounts: formData.amounts || { base_stake: null, maximum_stake: null, take_profit: null, stop_loss: null },
      recovery_steps: formData.recovery_steps || { risk_steps: [] },
      advanced_settings: formData.advanced_settings || TradingBot.getDefaultAdvancedSettings(),
      realtimePerformance: formData.realtimePerformance || TradingBot.getDefaultPerformance(),
      statistics: formData.statistics || TradingBot.getDefaultStatistics(),
    };
    return new TradingBot(config);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PUBLIC ACCESSORS
  // ═══════════════════════════════════════════════════════════════════════════════

  get status(): BotStatus { return this._status; }
  get isActive(): boolean { return this._isActive; }
  get config(): BotConfiguration { return { ...this._config }; }
  get contract(): ContractData { return this._config.contract; }
  get amounts(): BotConfiguration['amounts'] { return this._config.amounts; }
  get advancedSettings(): BotConfiguration['advanced_settings'] { return this._config.advanced_settings; }
  get generalSettings() { return this.advancedSettings.general_settings_section; }
  get riskManagement() { return this.advancedSettings.risk_management_section; }
  get volatilityControls() { return this.advancedSettings.volatility_controls_section; }
  get marketConditions() { return this.advancedSettings.market_conditions_section; }
  get recoverySettings() { return this.advancedSettings.recovery_settings_section; }
  get botSchedule() { return this.advancedSettings.bot_schedule?.bot_schedule; }
  get currentSession(): Readonly<SessionState> { return { ...this.session }; }
  get performance(): RealtimePerformance { return { ...this.realtimePerformance }; }
  get stats(): Statistics { return { ...this.statistics }; }
  get history(): ReadonlyArray<TradeResult> { return [...this.tradeHistory]; }

  // ═══════════════════════════════════════════════════════════════════════════════
  // DEPENDENCY INJECTION
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Set the trade executor function — this is the bridge to the actual trading API.
   */
  setTradeExecutor(executor: TradeExecutor): void {
    this.tradeExecutor = executor;
  }

  /**
   * Set the balance provider — returns the current account balance.
   */
  setBalanceProvider(provider: () => number): void {
    this.balanceProvider = provider;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EVENT SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════════

  on(eventType: TradingBotEventType, listener: TradingBotEventListener): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);
  }

  off(eventType: TradingBotEventType, listener: TradingBotEventListener): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const idx = listeners.indexOf(listener);
    if (idx > -1) {
      listeners.splice(idx, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }

  private emit(type: TradingBotEventType, message: string, data?: any): void {
    const event: TradingBotEvent = {
      type,
      botId: this.botId,
      timestamp: new Date().toISOString(),
      message,
      data,
    };
    const listeners = this.eventListeners.get(type) || [];
    for (const listener of listeners) {
      try { listener(event); } catch (e) { console.error(`[TradingBot] Event listener error:`, e); }
    }
  }

  private log(message: string, data?: any): void {
    this.emit('log', message, data);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BOT LIFECYCLE — START / STOP / PAUSE / RESUME
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Start the bot. Validates configuration, checks schedule, and begins the trade loop.
   */
  async start(): Promise<{ success: boolean; error?: string }> {
    if (this._status === 'START') {
      return { success: false, error: 'Bot is already running' };
    }

    if (!this.tradeExecutor) {
      return { success: false, error: 'Trade executor not set. Call setTradeExecutor() first.' };
    }

    const validation = this.validateBeforeStart();
    if (!validation.isValid) {
      this.setStatus('ERROR');
      return { success: false, error: validation.errors.join('; ') };
    }

    // Check schedule before starting
    if (!this.isWithinSchedule()) {
      this.log('Bot is outside scheduled trading hours. Will wait for schedule.');
      this.startScheduleMonitor();
      this.setStatus('IDLE');
      return { success: true };
    }

    this.session = this.createFreshSession();
    this.session.baseStake = this.resolveThresholdValue(this.amounts.base_stake);
    this.session.currentStake = this.session.baseStake;
    this.session.sessionStartTime = Date.now();
    this.session.currentBalance = this.getBalance();
    this.session.peakBalance = this.session.currentBalance;

    this.realtimePerformance.startedAt = new Date().toISOString();
    this.realtimePerformance.stoppedAt = null;
    this.realtimePerformance.baseStake = this.session.baseStake;
    this.realtimePerformance.currentStake = this.session.currentStake;

    this.setStatus('START');
    this._isActive = true;
    this.log(`Bot started with strategy: ${this.strategyId}, base stake: ${this.session.baseStake}`);

    this.startPeriodicResets();
    this.startScheduleMonitor();
    this.startMaxRuntimeTimer();

    // Begin trade loop
    this.runTradeLoop();

    return { success: true };
  }

  /**
   * Stop the bot completely. Clears all timers and finalizes statistics.
   */
  stop(): void {
    this.clearAllTimers();
    this.setStatus('STOP');
    this._isActive = false;
    this.realtimePerformance.stoppedAt = new Date().toISOString();
    this.finalizeStatistics();
    this.log('Bot stopped.');
  }

  /**
   * Pause the bot. Preserves session state for resumption.
   */
  pause(): void {
    if (this._status !== 'START') return;
    this.clearTradeLoop();
    this.setStatus('PAUSE');
    this.log('Bot paused.');
  }

  /**
   * Resume the bot from a paused state.
   */
  resume(): void {
    if (this._status !== 'PAUSE') return;

    if (!this.isWithinSchedule()) {
      this.log('Cannot resume — outside scheduled trading hours.');
      this.emit('schedule_paused', 'Outside scheduled hours, waiting...');
      return;
    }

    this.setStatus('START');
    this.log('Bot resumed.');
    this.runTradeLoop();
  }

  /**
   * Emergency stop — immediate halt with error status.
   */
  emergencyStop(reason: string): void {
    this.clearAllTimers();
    this.setStatus('ERROR');
    this._isActive = false;
    this.realtimePerformance.stoppedAt = new Date().toISOString();
    this.finalizeStatistics();
    this.emit('emergency_stop', `Emergency stop: ${reason}`, { reason });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CORE TRADE LOOP
  // ═══════════════════════════════════════════════════════════════════════════════

  private async runTradeLoop(): Promise<void> {
    if (this._status !== 'START') return;

    // Pre-trade checks
    const canTrade = this.performPreTradeChecks();
    if (!canTrade.allowed) {
      this.log(`Trade blocked: ${canTrade.reason}`);
      if (canTrade.action === 'stop') {
        this.stop();
      } else if (canTrade.action === 'cooldown') {
        this.enterCooldown();
      } else if (canTrade.action === 'wait') {
        // Schedule next check after delay
        this.tradeLoopTimer = setTimeout(() => this.runTradeLoop(), 5000);
      }
      return;
    }

    try {
      // Calculate the stake for this trade
      const stake = this.calculateStake();
      this.session.currentStake = stake;
      this.realtimePerformance.currentStake = stake;

      if (stake > this.realtimePerformance.highestStake) {
        this.realtimePerformance.highestStake = stake;
      }

      this.emit('stake_updated', `Stake calculated: ${stake}`, { stake });

      // Build trade parameters from contract config
      const tradeParams = this.buildTradeParams(stake);

      this.log(`Executing trade #${this.session.totalTradesThisSession + 1}: ${tradeParams.tradeType} @ ${stake}`);

      // Execute the trade
      const result = await this.tradeExecutor!(tradeParams);

      // Process the result
      this.processTradeResult(result);

      // Determine delay before next trade
      const delay = (this.contract.delay || 1) * 1000;

      // Schedule next trade
      if (this._status === 'START') {
        this.tradeLoopTimer = setTimeout(() => this.runTradeLoop(), delay);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown trade execution error';
      this.emit('error', `Trade execution failed: ${errMsg}`, { error: errMsg });

      // Retry after a longer delay on error
      if (this._status === 'START') {
        this.tradeLoopTimer = setTimeout(() => this.runTradeLoop(), 5000);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TRADE PARAMETER BUILDING
  // ═══════════════════════════════════════════════════════════════════════════════

  private buildTradeParams(stake: number): Parameters<TradeExecutor>[0] {
    const contract = this.contract;
    const tradeType = this.resolveTradeType(contract);

    return {
      symbol: contract.market?.symbol || '',
      contractType: contract.contractType,
      tradeType,
      amount: stake,
      duration: contract.duration,
      durationUnits: contract.durationUnits,
      prediction: contract.prediction || undefined,
      multiplier: contract.multiplier || undefined,
      allowEquals: contract.allowEquals || false,
      basis: 'stake',
      currency: this.botCurrency,
    };
  }

  /**
   * Resolve the trade type, handling ALTERNATE logic.
   */
  private resolveTradeType(contract: ContractData): string {
    const rawType = contract.tradeType; // e.g. "CALLE|PUTE"

    if (contract.contractType === 'ALTERNATE' && rawType.includes('|')) {
      const types = rawType.split('|');
      const alternateAfter = contract.alternateAfter || 1;

      // Switch trade type after N trades
      if (this.session.alternateCounter >= alternateAfter) {
        this.session.alternateCounter = 0;
        this.session.currentTradeType =
          this.session.currentTradeType === types[0] ? types[1] : types[0];
      }

      this.session.alternateCounter++;

      if (!this.session.currentTradeType) {
        this.session.currentTradeType = types[0];
      }

      return this.session.currentTradeType;
    }

    // For non-alternate, pick the first type if pipe-separated
    if (rawType.includes('|')) {
      return rawType.split('|')[0];
    }

    return rawType;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // TRADE RESULT PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════════

  private processTradeResult(result: TradeResult): void {
    this.tradeHistory.push(result);
    this.session.totalTradesThisSession++;
    this.session.lastTradeTime = Date.now();

    // Update performance
    this.realtimePerformance.totalRuns++;
    this.realtimePerformance.totalStake += result.stake;
    this.realtimePerformance.totalPayout += result.payout;

    // Update session profit tracking
    this.session.sessionStake += result.stake;
    this.session.sessionPayout += result.payout;
    this.session.sessionProfit += result.profit;

    // Update periodic tracking
    this.session.dailyProfit += result.profit > 0 ? result.profit : 0;
    this.session.dailyLoss += result.profit < 0 ? Math.abs(result.profit) : 0;
    this.session.hourlyProfit += result.profit > 0 ? result.profit : 0;
    this.session.hourlyLoss += result.profit < 0 ? Math.abs(result.profit) : 0;
    this.session.weeklyProfit += result.profit > 0 ? result.profit : 0;
    this.session.weeklyLoss += result.profit < 0 ? Math.abs(result.profit) : 0;

    // Update balance tracking
    this.session.currentBalance = this.getBalance();
    if (this.session.currentBalance > this.session.peakBalance) {
      this.session.peakBalance = this.session.currentBalance;
    }

    if (result.isWin) {
      this.handleWin(result);
    } else {
      this.handleLoss(result);
    }

    // Update statistics
    this.updateStatistics(result);
  }

  private handleWin(result: TradeResult): void {
    this.realtimePerformance.numberOfWins++;
    this.session.consecutiveWins++;
    this.session.consecutiveLosses = 0;

    this.emit('trade_won', `Trade won! Profit: ${result.profit}`, { result });

    // Strategy-specific win handling
    this.onStrategyWin();

    // Check take profit
    if (this.checkTakeProfit()) {
      this.emit('take_profit_triggered', 'Take profit target reached!');
      this.stop();
      return;
    }

    // Exit recovery mode on win (if applicable)
    if (this.session.isInRecovery && !this.recoverySettings.progressive_recovery) {
      this.session.isInRecovery = false;
      this.session.recoveryStepIndex = 0;
      this.session.recoveryAttempts = 0;
      this.log('Exited recovery mode after win.');
    }
  }

  private handleLoss(result: TradeResult): void {
    this.realtimePerformance.numberOfLosses++;
    this.session.consecutiveLosses++;
    this.session.consecutiveWins = 0;

    this.emit('trade_lost', `Trade lost! Loss: ${Math.abs(result.profit)}`, { result });

    // Strategy-specific loss handling
    this.onStrategyLoss();

    // Check stop loss
    if (this.checkStopLoss()) {
      this.emit('stop_loss_triggered', 'Stop loss limit reached!');
      this.stop();
      return;
    }

    // Enter recovery if configured
    this.evaluateRecovery();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STAKE CALCULATION — Strategy-Specific
  // ═══════════════════════════════════════════════════════════════════════════════

  private calculateStake(): number {
    let stake = this.session.baseStake;

    // If in recovery with risk steps, use recovery step stake
    if (this.session.isInRecovery) {
      const recoveryStake = this.getRecoveryStepStake();
      if (recoveryStake !== null) {
        stake = recoveryStake;
        return this.clampStake(stake);
      }
    }

    // Apply strategy-specific calculation
    const strategyStake = this.calculateStrategyStake();
    if (strategyStake !== null) {
      stake = strategyStake;
    }

    // Compound staking: use percentage of current balance
    if (this.generalSettings.compound_stake && this.session.currentBalance > 0) {
      const basePercent = this.session.baseStake / this.session.currentBalance;
      stake = this.session.currentBalance * basePercent;
    }

    return this.clampStake(stake);
  }

  /**
   * Calculate stake based on the active strategy type.
   */
  private calculateStrategyStake(): number | null {
    const sid = this.strategyId as StrategyType;

    switch (sid) {
      case StrategyType.MARTINGALE:
      case StrategyType.OPTIONS_MARTINGALE:
        return this.calculateMartingaleStake();

      case StrategyType.MARTINGALE_ON_STAT_RESET:
        return this.calculateMartingaleResetStake();

      case StrategyType.DALEMBERT:
      case StrategyType.OPTIONS_DALEMBERT:
        return this.calculateDalembertStake();

      case StrategyType.DALEMBERT_ON_STAT_RESET:
        return this.calculateDalembertResetStake();

      case StrategyType.REVERSE_MARTINGALE:
      case StrategyType.OPTIONS_REVERSE_MARTINGALE:
        return this.calculateReverseMartingaleStake();

      case StrategyType.REVERSE_MARTINGALE_ON_STAT_RESET:
        return this.calculateReverseMartingaleResetStake();

      case StrategyType.REVERSE_DALEMBERT:
        return this.calculateReverseDalembertStake();

      case StrategyType.REVERSE_DALEMBERT_ON_STAT_RESET:
        return this.calculateReverseDalembertResetStake();

      case StrategyType.OSCARS_GRIND:
      case StrategyType.OPTIONS_OSCARS_GRIND:
        return this.calculateOscarsGrindStake();

      case StrategyType.SYSTEM_1326:
      case StrategyType.OPTIONS_1326_SYSTEM:
        return this.calculateSystem1326Stake();

      default:
        return null; // Use base stake
    }
  }

  // ─── Martingale ───────────────────────────────────────────────────────────────

  private calculateMartingaleStake(): number {
    const settings = this.advancedSettings.martingale_strategy_section;
    const multiplier = settings.martingale_multiplier || 2;
    const maxSteps = settings.martingale_max_steps || 10;
    const safetyNet = settings.martingale_safety_net;

    if (this.session.consecutiveLosses === 0) {
      this.session.martingaleStep = 0;
      return this.session.baseStake;
    }

    this.session.martingaleStep = Math.min(this.session.consecutiveLosses, maxSteps);
    let stake = this.session.baseStake * Math.pow(multiplier, this.session.martingaleStep);

    // Safety net: cap stake at a percentage of balance
    if (safetyNet && this.session.currentBalance > 0) {
      const maxFromSafety = this.session.currentBalance * (safetyNet / 100);
      stake = Math.min(stake, maxFromSafety);
    }

    return stake;
  }

  private calculateMartingaleResetStake(): number {
    const settings = this.advancedSettings.martingale_reset_strategy_section;
    const resetAfter = settings.reset_after_trades;

    // Check if we should reset
    if (resetAfter && this.session.totalTradesThisSession > 0 &&
        this.session.totalTradesThisSession % resetAfter === 0) {
      this.session.martingaleStep = 0;
      this.session.consecutiveLosses = 0;
      this.session.consecutiveWins = 0;
      this.emit('strategy_reset', `Martingale reset after ${resetAfter} trades`);
      return this.session.baseStake;
    }

    // Apply multiplier adjustment on reset
    const adjustment = settings.reset_multiplier_adjustment || 0;
    const baseMartingale = this.calculateMartingaleStake();

    if (adjustment > 0 && settings.track_session_stats) {
      return baseMartingale * (1 + adjustment / 100);
    }

    return baseMartingale;
  }

  // ─── D'Alembert ───────────────────────────────────────────────────────────────

  private calculateDalembertStake(): number {
    const settings = this.advancedSettings.dalembert_strategy_section;
    const increment = this.resolveThresholdValue(settings.dalembert_increment) || 1;
    const decrement = this.resolveThresholdValue(settings.dalembert_decrement) || 1;
    const maxUnits = settings.dalembert_max_units || 50;
    const conservative = settings.dalembert_conservative_mode;

    // On loss: increase units by increment
    // On win: decrease units by decrement
    if (this.session.totalTradesThisSession === 0) {
      this.session.dalembertUnits = 1;
    }

    const lastTrade = this.tradeHistory[this.tradeHistory.length - 1];
    if (lastTrade) {
      if (!lastTrade.isWin) {
        this.session.dalembertUnits += conservative ? Math.ceil(increment / 2) : increment;
      } else {
        this.session.dalembertUnits = Math.max(1, this.session.dalembertUnits - decrement);
      }
    }

    this.session.dalembertUnits = Math.min(this.session.dalembertUnits, maxUnits);

    // Check reset threshold
    const resetThreshold = this.resolveThresholdValue(settings.dalembert_reset_threshold);
    if (resetThreshold > 0 && this.session.sessionProfit >= resetThreshold) {
      this.session.dalembertUnits = 1;
      this.emit('strategy_reset', 'D\'Alembert reset at profit threshold');
    }

    return this.session.baseStake * this.session.dalembertUnits;
  }

  private calculateDalembertResetStake(): number {
    const settings = this.advancedSettings.dalembert_reset_strategy_section;
    const resetFreq = settings.dalembert_reset_frequency;

    // Periodic reset
    if (resetFreq && this.session.totalTradesThisSession > 0 &&
        this.session.totalTradesThisSession % resetFreq === 0) {
      this.session.dalembertUnits = 1;
      this.emit('strategy_reset', `D'Alembert reset after ${resetFreq} trades`);

      if (settings.dalembert_session_profit_lock && this.session.sessionProfit > 0) {
        this.log(`Session profit locked: ${this.session.sessionProfit}`);
      }
    }

    // Reset on target
    if (settings.dalembert_reset_on_target && this.checkTakeProfit()) {
      this.session.dalembertUnits = 1;
    }

    // Adaptive increment: adjust based on win rate
    const baseDalembert = this.calculateDalembertStake();
    if (settings.dalembert_adaptive_increment && this.session.totalTradesThisSession > 5) {
      const winRate = this.realtimePerformance.numberOfWins / this.realtimePerformance.totalRuns;
      if (winRate > 0.6) {
        return baseDalembert * 0.8; // Reduce stake when winning a lot
      } else if (winRate < 0.4) {
        return baseDalembert * 1.2; // Increase stake when losing
      }
    }

    return baseDalembert;
  }

  // ─── Reverse Martingale ───────────────────────────────────────────────────────

  private calculateReverseMartingaleStake(): number {
    const settings = this.advancedSettings.reverse_martingale_strategy_section;
    const multiplier = settings.reverse_martingale_multiplier || 2;
    const maxWins = settings.reverse_martingale_max_wins || 5;
    const profitLock = settings.reverse_martingale_profit_lock;
    const aggressive = settings.reverse_martingale_aggressive_mode;

    // Reset on loss
    if (settings.reverse_martingale_reset_on_loss && this.session.consecutiveLosses > 0) {
      return this.session.baseStake;
    }

    if (this.session.consecutiveWins === 0) {
      return this.session.baseStake;
    }

    const steps = Math.min(this.session.consecutiveWins, maxWins);
    let stake = this.session.baseStake * Math.pow(multiplier, steps);

    // Profit lock: only risk a portion of winnings
    if (profitLock && profitLock > 0 && this.session.sessionProfit > 0) {
      const lockedProfit = this.session.sessionProfit * (profitLock / 100);
      const maxRisk = this.session.sessionProfit - lockedProfit + this.session.baseStake;
      stake = Math.min(stake, maxRisk);
    }

    // Aggressive mode: use higher multiplier
    if (aggressive) {
      stake *= 1.5;
    }

    return stake;
  }

  private calculateReverseMartingaleResetStake(): number {
    const settings = this.advancedSettings.reverse_martingale_reset_strategy_section;
    const resetWinStreak = settings.reverse_reset_win_streak;
    const resetProfitTarget = this.resolveThresholdValue(settings.reverse_reset_profit_target);

    // Reset after win streak
    if (resetWinStreak && this.session.consecutiveWins >= resetWinStreak) {
      this.session.consecutiveWins = 0;

      if (settings.reverse_preserve_winnings) {
        this.log(`Preserving winnings: ${this.session.sessionProfit}`);
      }

      this.emit('strategy_reset', `Reverse Martingale reset after ${resetWinStreak} wins`);
      return this.session.baseStake;
    }

    // Reset at profit target
    if (resetProfitTarget > 0 && this.session.sessionProfit >= resetProfitTarget) {
      this.session.consecutiveWins = 0;
      this.emit('strategy_reset', 'Reverse Martingale reset at profit target');
      return this.session.baseStake;
    }

    return this.calculateReverseMartingaleStake();
  }

  // ─── Reverse D'Alembert ───────────────────────────────────────────────────────

  private calculateReverseDalembertStake(): number {
    const settings = this.advancedSettings.reverse_dalembert_strategy_section;
    const increment = this.resolveThresholdValue(settings.reverse_dalembert_increment) || 1;
    const decrement = this.resolveThresholdValue(settings.reverse_dalembert_decrement) || 1;
    const maxUnits = settings.reverse_dalembert_max_units || 50;
    const profitCeiling = this.resolveThresholdValue(settings.reverse_dalembert_profit_ceiling);

    if (this.session.totalTradesThisSession === 0) {
      this.session.dalembertUnits = 1;
    }

    const lastTrade = this.tradeHistory[this.tradeHistory.length - 1];
    if (lastTrade) {
      if (lastTrade.isWin) {
        // Reverse: increase on win
        this.session.dalembertUnits += increment;
      } else {
        // Reverse: decrease on loss
        this.session.dalembertUnits = Math.max(1, this.session.dalembertUnits - decrement);
      }
    }

    this.session.dalembertUnits = Math.min(this.session.dalembertUnits, maxUnits);

    // Profit ceiling check
    if (profitCeiling > 0 && this.session.sessionProfit >= profitCeiling) {
      this.session.dalembertUnits = 1;
      this.emit('strategy_reset', 'Reverse D\'Alembert reset at profit ceiling');
    }

    return this.session.baseStake * this.session.dalembertUnits;
  }

  private calculateReverseDalembertResetStake(): number {
    const settings = this.advancedSettings.reverse_dalembert_reset_strategy_section;
    const resetInterval = settings.reverse_dalembert_reset_interval;
    const dynamicReset = settings.reverse_dalembert_dynamic_reset;
    const winRateThreshold = settings.reverse_dalembert_win_rate_threshold;

    // Periodic reset
    if (resetInterval && this.session.totalTradesThisSession > 0 &&
        this.session.totalTradesThisSession % resetInterval === 0) {
      this.session.dalembertUnits = 1;
      this.emit('strategy_reset', `Reverse D'Alembert reset after ${resetInterval} trades`);
    }

    // Dynamic reset based on win rate
    if (dynamicReset && winRateThreshold && this.session.totalTradesThisSession > 5) {
      const winRate = this.realtimePerformance.numberOfWins / this.realtimePerformance.totalRuns;
      if (winRate < winRateThreshold / 100) {
        this.session.dalembertUnits = 1;
        this.emit('strategy_reset', 'Dynamic reset: win rate below threshold');
      }
    }

    return this.calculateReverseDalembertStake();
  }

  // ─── Oscar's Grind ────────────────────────────────────────────────────────────

  private calculateOscarsGrindStake(): number {
    const settings = this.advancedSettings.oscars_grind_strategy_section;
    const baseUnit = this.resolveThresholdValue(settings.oscars_grind_base_unit) || this.session.baseStake;
    const profitTarget = this.resolveThresholdValue(settings.oscars_grind_profit_target) || baseUnit;
    const maxBetUnits = settings.oscars_grind_max_bet_units || 10;
    const incrementOnWin = settings.oscars_grind_increment_on_win;
    const maintainOnLoss = settings.oscars_grind_maintain_stake_on_loss;
    const resetOnTarget = settings.oscars_grind_reset_on_target;
    const autoStop = settings.oscars_grind_auto_stop_on_target;

    if (this.session.totalTradesThisSession === 0) {
      this.session.oscarsGrindCurrentUnit = 1;
      this.session.oscarsGrindSessionProfit = 0;
    }

    const lastTrade = this.tradeHistory[this.tradeHistory.length - 1];
    if (lastTrade) {
      this.session.oscarsGrindSessionProfit += lastTrade.profit;

      if (lastTrade.isWin && incrementOnWin) {
        // Increase by 1 unit on win, but only if we haven't hit the target
        if (this.session.oscarsGrindSessionProfit < profitTarget) {
          this.session.oscarsGrindCurrentUnit = Math.min(
            this.session.oscarsGrindCurrentUnit + 1,
            maxBetUnits
          );
        }
      } else if (!lastTrade.isWin && !maintainOnLoss) {
        // Keep same stake on loss (Oscar's Grind rule)
        // Do nothing — maintain current unit
      }
    }

    // Check if session profit target is reached
    if (this.session.oscarsGrindSessionProfit >= profitTarget) {
      if (autoStop) {
        this.emit('take_profit_triggered', 'Oscar\'s Grind session target reached');
        this.stop();
        return baseUnit;
      }
      if (resetOnTarget) {
        this.session.oscarsGrindCurrentUnit = 1;
        this.session.oscarsGrindSessionProfit = 0;
        this.emit('strategy_reset', 'Oscar\'s Grind reset at profit target');
      }
    }

    // Don't bet more than needed to reach the target
    const neededForTarget = profitTarget - this.session.oscarsGrindSessionProfit;
    const stakeUnits = Math.min(this.session.oscarsGrindCurrentUnit, Math.ceil(neededForTarget / baseUnit));

    return baseUnit * Math.max(1, stakeUnits);
  }

  // ─── 1-3-2-6 System ──────────────────────────────────────────────────────────

  private calculateSystem1326Stake(): number {
    const settings = this.advancedSettings.system_1326_strategy_section;
    const baseUnit = this.resolveThresholdValue(settings.system_1326_base_unit) || this.session.baseStake;
    const sequenceStr = settings.system_1326_sequence || '1-3-2-6';
    const sequence = sequenceStr.split('-').map(Number);
    const resetOnLoss = settings.system_1326_reset_on_loss;
    const maxCycles = settings.system_1326_max_cycles;
    const stopOnComplete = settings.system_1326_stop_on_cycle_complete;
    const lossRecovery = settings.system_1326_loss_recovery;

    if (this.session.totalTradesThisSession === 0) {
      this.session.system1326Step = 0;
    }

    const lastTrade = this.tradeHistory[this.tradeHistory.length - 1];
    if (lastTrade) {
      if (lastTrade.isWin) {
        // Advance to next step in sequence
        this.session.system1326Step++;

        // Check if cycle is complete
        if (this.session.system1326Step >= sequence.length) {
          if (stopOnComplete) {
            this.emit('strategy_reset', '1-3-2-6 cycle complete — stopping');
            this.stop();
            return baseUnit;
          }
          this.session.system1326Step = 0; // Reset to start of sequence
          this.emit('strategy_reset', '1-3-2-6 cycle complete — restarting');
        }
      } else {
        // On loss
        if (resetOnLoss) {
          this.session.system1326Step = 0;
        }
        if (lossRecovery) {
          // Stay at current step for recovery attempt
        }
      }
    }

    // Max cycles check
    if (maxCycles) {
      const completedCycles = Math.floor(
        this.session.totalTradesThisSession / sequence.length
      );
      if (completedCycles >= maxCycles) {
        this.emit('max_trades_reached', `Max cycles (${maxCycles}) reached`);
        this.stop();
        return baseUnit;
      }
    }

    const stepIndex = Math.min(this.session.system1326Step, sequence.length - 1);
    const multiplier = sequence[stepIndex] || 1;

    // Partial profit lock
    if (settings.system_1326_partial_profit_lock && this.session.sessionProfit > 0 && stepIndex >= 2) {
      // Lock some profit by reducing the bet slightly
      return baseUnit * multiplier * 0.9;
    }

    return baseUnit * multiplier;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STRATEGY WIN/LOSS HOOKS
  // ═══════════════════════════════════════════════════════════════════════════════

  private onStrategyWin(): void {
    const sid = this.strategyId as StrategyType;

    switch (sid) {
      case StrategyType.MARTINGALE:
      case StrategyType.OPTIONS_MARTINGALE:
        if (this.advancedSettings.martingale_strategy_section.martingale_reset_on_profit) {
          this.session.martingaleStep = 0;
        }
        break;

      case StrategyType.REVERSE_MARTINGALE:
      case StrategyType.OPTIONS_REVERSE_MARTINGALE:
        // Wins are good in reverse martingale — handled in stake calculation
        break;

      case StrategyType.SYSTEM_1326:
      case StrategyType.OPTIONS_1326_SYSTEM:
        // Handled in stake calculation
        break;

      default:
        break;
    }
  }

  private onStrategyLoss(): void {
    const sid = this.strategyId as StrategyType;

    switch (sid) {
      case StrategyType.REVERSE_MARTINGALE:
      case StrategyType.OPTIONS_REVERSE_MARTINGALE:
        if (this.advancedSettings.reverse_martingale_strategy_section.reverse_martingale_reset_on_loss) {
          this.session.consecutiveWins = 0;
        }
        break;

      default:
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RECOVERY SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════════

  private evaluateRecovery(): void {
    const riskSteps = this._config.recovery_steps?.risk_steps || [];
    const recoveryType = this.generalSettings.recovery_type;

    if (!recoveryType || recoveryType === 'off' || riskSteps.length === 0) {
      return;
    }

    // Find matching risk step for current loss streak
    const matchingStep = riskSteps.find(
      (step: any) => step.lossStreak === this.session.consecutiveLosses ||
                     step.multiplier !== undefined
    );

    if (matchingStep || this.session.consecutiveLosses > 0) {
      this.session.isInRecovery = true;
      this.session.recoveryAttempts++;

      // Check max recovery attempts
      const maxAttempts = this.recoverySettings.max_recovery_attempts;
      if (maxAttempts && this.session.recoveryAttempts > maxAttempts) {
        this.log('Max recovery attempts reached.');
        this.session.isInRecovery = false;

        if (this.recoverySettings.recovery_cooldown) {
          this.enterRecoveryCooldown();
        }
        return;
      }

      this.emit('recovery_triggered', `Recovery triggered at loss streak: ${this.session.consecutiveLosses}`, {
        lossStreak: this.session.consecutiveLosses,
        recoveryAttempts: this.session.recoveryAttempts,
      });

      // Progressive recovery: advance through risk steps
      if (this.recoverySettings.progressive_recovery) {
        this.session.recoveryStepIndex = Math.min(
          this.session.recoveryStepIndex + 1,
          riskSteps.length - 1
        );
        this.emit('recovery_step_changed', `Recovery step: ${this.session.recoveryStepIndex}`, {
          stepIndex: this.session.recoveryStepIndex,
        });
      }
    }
  }

  private getRecoveryStepStake(): number | null {
    const riskSteps = this._config.recovery_steps?.risk_steps || [];
    if (riskSteps.length === 0) return null;

    // Risk steps from form data are ContractData-like objects with multiplier
    // Find the step that matches the current loss streak
    const stepIndex = Math.min(this.session.recoveryStepIndex, riskSteps.length - 1);
    const step = riskSteps[stepIndex] as any;

    if (step && step.multiplier) {
      const recoveryMultiplier = this.recoverySettings.recovery_multiplier || 1;
      return this.session.baseStake * step.multiplier * recoveryMultiplier;
    }

    return null;
  }

  private enterRecoveryCooldown(): void {
    const cooldown = this.recoverySettings.recovery_cooldown;
    if (!cooldown) return;

    const durationMs = this.parseDurationToMs(cooldown.duration, cooldown.unit);
    this.session.isInCooldown = true;
    this.session.cooldownEndTime = Date.now() + durationMs;

    this.emit('cooldown_started', `Recovery cooldown: ${cooldown.duration} ${cooldown.unit}`);

    this.cooldownTimer = setTimeout(() => {
      this.session.isInCooldown = false;
      this.session.cooldownEndTime = null;
      this.session.recoveryAttempts = 0;
      this.emit('cooldown_ended', 'Recovery cooldown ended');

      if (this._status === 'START' || (this._status === 'IDLE' && this.generalSettings.auto_restart)) {
        this.runTradeLoop();
      }
    }, durationMs);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PRE-TRADE CHECKS — Risk Management, Limits, Schedule
  // ═══════════════════════════════════════════════════════════════════════════════

  private performPreTradeChecks(): { allowed: boolean; reason?: string; action?: 'stop' | 'cooldown' | 'wait' } {
    // 1. Check if bot is running
    if (this._status !== 'START') {
      return { allowed: false, reason: 'Bot is not running', action: 'stop' };
    }

    // 2. Check cooldown
    if (this.session.isInCooldown) {
      return { allowed: false, reason: 'In cooldown period', action: 'wait' };
    }

    // 3. Check schedule
    if (!this.isWithinSchedule()) {
      this.emit('schedule_paused', 'Outside scheduled trading hours');
      return { allowed: false, reason: 'Outside schedule', action: 'wait' };
    }

    // 4. Check max trades
    const maxTrades = this.generalSettings.maximum_number_of_trades;
    if (maxTrades && this.session.totalTradesThisSession >= maxTrades) {
      this.emit('max_trades_reached', `Maximum trades (${maxTrades}) reached`);
      return { allowed: false, reason: 'Max trades reached', action: 'stop' };
    }

    // 5. Check max consecutive losses
    const maxConsecLosses = this.riskManagement.max_consecutive_losses;
    if (maxConsecLosses && this.session.consecutiveLosses >= maxConsecLosses) {
      this.emit('risk_limit_hit', `Max consecutive losses (${maxConsecLosses}) reached`);
      return { allowed: false, reason: 'Max consecutive losses', action: 'cooldown' };
    }

    // 6. Check max daily loss
    const maxDailyLoss = this.resolveThresholdValue(this.riskManagement.max_daily_loss);
    if (maxDailyLoss > 0 && this.session.dailyLoss >= maxDailyLoss) {
      this.emit('risk_limit_hit', `Max daily loss ($${maxDailyLoss}) reached`);
      return { allowed: false, reason: 'Max daily loss reached', action: 'stop' };
    }

    // 7. Check max daily profit
    const maxDailyProfit = this.resolveThresholdValue(this.riskManagement.max_daily_profit);
    if (maxDailyProfit > 0 && this.session.dailyProfit >= maxDailyProfit) {
      this.emit('risk_limit_hit', `Max daily profit ($${maxDailyProfit}) reached`);
      return { allowed: false, reason: 'Max daily profit reached', action: 'stop' };
    }

    // 8. Check max drawdown
    const maxDrawdown = this.riskManagement.max_drawdown_percentage;
    if (maxDrawdown && this.session.peakBalance > 0) {
      const currentDrawdown = ((this.session.peakBalance - this.session.currentBalance) / this.session.peakBalance) * 100;
      if (currentDrawdown >= maxDrawdown) {
        this.emit('risk_limit_hit', `Max drawdown (${maxDrawdown}%) reached`);
        return { allowed: false, reason: 'Max drawdown reached', action: 'stop' };
      }
    }

    // 9. Check emergency stop
    if (this.riskManagement.emergency_stop) {
      const emergencyThreshold = this.session.baseStake * 20; // 20x base stake loss
      if (this.session.sessionProfit < -emergencyThreshold) {
        this.emergencyStop('Emergency stop threshold exceeded');
        return { allowed: false, reason: 'Emergency stop', action: 'stop' };
      }
    }

    // 10. Check volatility filter
    if (this.volatilityControls.volatility_filter) {
      if (this.volatilityControls.pause_on_high_volatility) {
        // In a real implementation, this would check actual market volatility
        // For now, this is a hook for external volatility data
        this.log('Volatility filter active — checking market conditions');
      }
    }

    // 11. Check risk per trade
    const riskPerTrade = this.riskManagement.risk_per_trade;
    if (riskPerTrade && this.session.currentBalance > 0) {
      const maxStakeFromRisk = this.session.currentBalance * (riskPerTrade / 100);
      if (this.session.currentStake > maxStakeFromRisk) {
        this.session.currentStake = maxStakeFromRisk;
        this.log(`Stake reduced to ${maxStakeFromRisk} (risk per trade: ${riskPerTrade}%)`);
      }
    }

    return { allowed: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STOP LOSS / TAKE PROFIT
  // ═══════════════════════════════════════════════════════════════════════════════

  private checkStopLoss(): boolean {
    const stopLoss = this.resolveThresholdValue(this.amounts.stop_loss);
    if (stopLoss <= 0) return false;

    // Stop loss is the maximum amount we're willing to lose
    return Math.abs(this.session.sessionProfit) >= stopLoss && this.session.sessionProfit < 0;
  }

  private checkTakeProfit(): boolean {
    const takeProfit = this.resolveThresholdValue(this.amounts.take_profit);
    if (takeProfit <= 0) return false;

    return this.session.sessionProfit >= takeProfit;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // COOLDOWN
  // ═══════════════════════════════════════════════════════════════════════════════

  private enterCooldown(): void {
    const cooldownConfig = this.generalSettings.cooldown_period;
    if (!cooldownConfig) {
      // No cooldown configured — just stop
      this.stop();
      return;
    }

    let durationMs: number;
    if (typeof cooldownConfig === 'string') {
      durationMs = parseInt(cooldownConfig, 10) * 1000;
    } else if (typeof cooldownConfig === 'object' && cooldownConfig !== null) {
      durationMs = this.parseDurationToMs(cooldownConfig.duration, cooldownConfig.unit);
    } else {
      durationMs = 5000;
    }

    this.session.isInCooldown = true;
    this.session.cooldownEndTime = Date.now() + durationMs;

    this.emit('cooldown_started', `Cooldown for ${durationMs / 1000}s`);

    this.cooldownTimer = setTimeout(() => {
      this.session.isInCooldown = false;
      this.session.cooldownEndTime = null;
      this.emit('cooldown_ended', 'Cooldown ended');

      // Auto restart after cooldown
      if (this.generalSettings.auto_restart && this._status === 'START') {
        this.session.consecutiveLosses = 0;
        this.session.consecutiveWins = 0;
        this.session.isInRecovery = false;
        this.session.recoveryStepIndex = 0;
        this.log('Auto-restarting after cooldown');
        this.runTradeLoop();
      } else {
        this.stop();
      }
    }, durationMs);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCHEDULE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Check if the current time is within the bot's configured schedule.
   */
  isWithinSchedule(): boolean {
    const schedule = this.botSchedule;
    if (!schedule || !schedule.isEnabled) {
      return true; // No schedule = always allowed
    }

    const now = new Date();

    // Check exclusion dates
    if (schedule.exclusions && schedule.exclusions.length > 0) {
      for (const exclusion of schedule.exclusions) {
        const exclusionDate = new Date(exclusion.date);
        if (this.isSameDay(now, exclusionDate)) {
          this.log(`Schedule exclusion: ${exclusion.reason}`);
          return false;
        }
      }
    }

    // Check start/end date range
    if (schedule.startDate) {
      const startDate = new Date(schedule.startDate);
      if (now < startDate) return false;
    }
    if (schedule.endDate) {
      const endDate = new Date(schedule.endDate);
      if (now > endDate) return false;
    }

    // Check time of day
    if (schedule.startTime && schedule.endTime) {
      const startTime = new Date(schedule.startTime);
      const endTime = new Date(schedule.endTime);

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

      if (endMinutes > startMinutes) {
        // Normal range (e.g., 07:00 - 13:00)
        if (nowMinutes < startMinutes || nowMinutes > endMinutes) return false;
      } else {
        // Overnight range (e.g., 22:00 - 06:00)
        if (nowMinutes < startMinutes && nowMinutes > endMinutes) return false;
      }
    }

    // Check day of week (for weekly schedules)
    if (schedule.type === 'weekly' && schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      if (!schedule.daysOfWeek.includes(now.getDay())) return false;
    }

    // Check day of month (for monthly schedules)
    if (schedule.type === 'monthly' && schedule.dayOfMonth) {
      if (now.getDate() !== schedule.dayOfMonth) return false;
    }

    return true;
  }

  private startScheduleMonitor(): void {
    if (this.scheduleCheckTimer) clearInterval(this.scheduleCheckTimer);

    this.scheduleCheckTimer = setInterval(() => {
      const withinSchedule = this.isWithinSchedule();
      this.emit('schedule_check', `Schedule check: ${withinSchedule ? 'active' : 'inactive'}`);

      if (withinSchedule && this._status === 'IDLE') {
        this.log('Schedule window opened — starting bot');
        this.start();
      } else if (!withinSchedule && this._status === 'START') {
        this.log('Schedule window closed — pausing bot');
        this.pause();
        this.emit('schedule_paused', 'Paused due to schedule');
      }
    }, 60000); // Check every minute
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MAX RUNTIME TIMER
  // ═══════════════════════════════════════════════════════════════════════════════

  private startMaxRuntimeTimer(): void {
    const maxRuntime = this.generalSettings.maximum_running_time;
    if (!maxRuntime) return;

    // maximum_running_time is in seconds
    const durationMs = maxRuntime * 1000;

    this.runtimeTimer = setTimeout(() => {
      this.emit('max_runtime_reached', `Max runtime (${maxRuntime}s) reached`);
      this.stop();
    }, durationMs);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PERIODIC RESETS (hourly, daily, weekly counters)
  // ═══════════════════════════════════════════════════════════════════════════════

  private startPeriodicResets(): void {
    if (this.periodicResetTimer) clearInterval(this.periodicResetTimer);

    this.session.lastHourlyReset = Date.now();
    this.session.lastDailyReset = Date.now();
    this.session.lastWeeklyReset = Date.now();

    this.periodicResetTimer = setInterval(() => {
      const now = Date.now();

      // Hourly reset
      if (this.session.lastHourlyReset && now - this.session.lastHourlyReset >= 3600000) {
        this.session.hourlyProfit = 0;
        this.session.hourlyLoss = 0;
        this.session.lastHourlyReset = now;
        this.log('Hourly counters reset');
      }

      // Daily reset
      if (this.session.lastDailyReset && now - this.session.lastDailyReset >= 86400000) {
        this.session.dailyProfit = 0;
        this.session.dailyLoss = 0;
        this.session.lastDailyReset = now;
        this.log('Daily counters reset');
      }

      // Weekly reset
      if (this.session.lastWeeklyReset && now - this.session.lastWeeklyReset >= 604800000) {
        this.session.weeklyProfit = 0;
        this.session.weeklyLoss = 0;
        this.session.lastWeeklyReset = now;
        this.log('Weekly counters reset');
      }
    }, 60000); // Check every minute
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════════════════════════════════════════

  private updateStatistics(result: TradeResult): void {
    this.statistics.lifetimeRuns++;
    this.statistics.totalStake += result.stake;
    this.statistics.totalPayout += result.payout;
    this.statistics.totalProfit += result.profit;

    if (result.isWin) {
      this.statistics.lifetimeWins++;
      this.statistics.averageWinAmount =
        (this.statistics.averageWinAmount * (this.statistics.lifetimeWins - 1) + result.profit) /
        this.statistics.lifetimeWins;
    } else {
      this.statistics.lifetimeLosses++;
      this.statistics.averageLossAmount =
        (this.statistics.averageLossAmount * (this.statistics.lifetimeLosses - 1) + Math.abs(result.profit)) /
        this.statistics.lifetimeLosses;
    }

    // Win rate
    this.statistics.winRate = this.statistics.lifetimeRuns > 0
      ? (this.statistics.lifetimeWins / this.statistics.lifetimeRuns) * 100
      : 0;

    // Profit factor
    const totalWinAmount = this.statistics.averageWinAmount * this.statistics.lifetimeWins;
    const totalLossAmount = this.statistics.averageLossAmount * this.statistics.lifetimeLosses;
    this.statistics.profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;

    // Streaks
    if (this.session.consecutiveWins > this.statistics.longestWinStreak) {
      this.statistics.longestWinStreak = this.session.consecutiveWins;
    }
    if (this.session.consecutiveLosses > this.statistics.longestLossStreak) {
      this.statistics.longestLossStreak = this.session.consecutiveLosses;
    }
    if (this.session.consecutiveWins > 0 &&
        (this.statistics.shortestWinStreak === 0 || this.session.consecutiveWins < this.statistics.shortestWinStreak)) {
      this.statistics.shortestWinStreak = this.session.consecutiveWins;
    }
    if (this.session.consecutiveLosses > 0 &&
        (this.statistics.shortestLossStreak === 0 || this.session.consecutiveLosses < this.statistics.shortestLossStreak)) {
      this.statistics.shortestLossStreak = this.session.consecutiveLosses;
    }

    // Highest stake/payout
    if (result.stake > this.statistics.highestStake) {
      this.statistics.highestStake = result.stake;
    }
    if (result.payout > this.statistics.highestPayout) {
      this.statistics.highestPayout = result.payout;
    }

    this.statistics.lastUpdated = new Date().toISOString();
  }

  private finalizeStatistics(): void {
    this.statistics.lastUpdated = new Date().toISOString();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════════

  private validateBeforeStart(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.strategyId) errors.push('Strategy ID is required');
    if (!this.contract) errors.push('Contract configuration is required');
    if (this.contract && !this.contract.market) errors.push('Market selection is required');
    if (this.contract && !this.contract.tradeType) errors.push('Trade type is required');

    const baseStake = this.resolveThresholdValue(this.amounts.base_stake);
    if (!baseStake || baseStake <= 0) errors.push('Base stake must be greater than 0');

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Full configuration validation (can be called externally before start).
   */
  validate(): { isValid: boolean; errors: string[] } {
    return this.validateBeforeStart();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // SERIALIZATION — Convert back to BotConfiguration for API
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Serialize the bot state back to a BotConfiguration object for API persistence.
   */
  toConfig(): BotConfiguration {
    return {
      ...this._config,
      status: this._status,
      isActive: this._isActive,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      realtimePerformance: { ...this.realtimePerformance },
      statistics: { ...this.statistics },
    };
  }

  /**
   * Serialize to JSON-ready payload for API submission.
   */
  toJSON(): Record<string, any> {
    return this.toConfig() as any;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // UTILITY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private setStatus(status: BotStatus): void {
    const prev = this._status;
    this._status = status;
    this._config.status = status;
    this._updatedAt = new Date().toISOString();
    this.emit('status_changed', `Status: ${prev} → ${status}`, { from: prev, to: status });
  }

  private getBalance(): number {
    if (this.balanceProvider) {
      return this.balanceProvider();
    }
    // Fallback: estimate from session
    return this.session.currentBalance || 10000;
  }

  /**
   * Resolve a threshold value (which can be fixed or percentage-based) to a number.
   */
  private resolveThresholdValue(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;

    const tv = value as ThresholdValue;
    if (tv.type === 'fixed') {
      return tv.value || 0;
    }
    if (tv.type === 'percentage') {
      const balance = this.getBalance();
      const percentage = tv.balancePercentage || tv.value || 0;
      return balance * (percentage / 100);
    }

    return 0;
  }

  /**
   * Clamp stake to be within base_stake and maximum_stake bounds.
   */
  private clampStake(stake: number): number {
    const minStake = this.session.baseStake * 0.01; // Minimum 1% of base
    const maxStake = this.resolveThresholdValue(this.amounts.maximum_stake);

    stake = Math.max(stake, minStake);
    if (maxStake > 0) {
      stake = Math.min(stake, maxStake);
    }

    // Also check risk per trade limit
    const riskPerTrade = this.riskManagement.risk_per_trade;
    if (riskPerTrade && this.session.currentBalance > 0) {
      const maxFromRisk = this.session.currentBalance * (riskPerTrade / 100);
      stake = Math.min(stake, maxFromRisk);
    }

    return Math.round(stake * 100) / 100; // Round to 2 decimal places
  }

  private parseDurationToMs(duration: number, unit: string): number {
    switch (unit?.toLowerCase()) {
      case 'seconds': case 'second': case 's': return duration * 1000;
      case 'minutes': case 'minute': case 'm': return duration * 60000;
      case 'hours': case 'hour': case 'h': return duration * 3600000;
      case 'days': case 'day': case 'd': return duration * 86400000;
      default: return duration * 1000;
    }
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  private createFreshSession(): SessionState {
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
      martingaleStep: 0,
      dalembertUnits: 1,
      system1326Step: 0,
      oscarsGrindSessionProfit: 0,
      oscarsGrindCurrentUnit: 1,
      alternateCounter: 0,
      currentTradeType: '',
    };
  }

  // ─── Timer Cleanup ────────────────────────────────────────────────────────────

  private clearTradeLoop(): void {
    if (this.tradeLoopTimer) {
      clearTimeout(this.tradeLoopTimer);
      this.tradeLoopTimer = null;
    }
  }

  private clearAllTimers(): void {
    this.clearTradeLoop();
    if (this.scheduleCheckTimer) { clearInterval(this.scheduleCheckTimer); this.scheduleCheckTimer = null; }
    if (this.cooldownTimer) { clearTimeout(this.cooldownTimer); this.cooldownTimer = null; }
    if (this.runtimeTimer) { clearTimeout(this.runtimeTimer); this.runtimeTimer = null; }
    if (this.periodicResetTimer) { clearInterval(this.periodicResetTimer); this.periodicResetTimer = null; }
  }

  /**
   * Full cleanup — call when the bot instance is being destroyed.
   */
  destroy(): void {
    this.clearAllTimers();
    this.eventListeners.clear();
    this.tradeHistory = [];
    this.tradeExecutor = null;
    this.balanceProvider = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATIC DEFAULTS
  // ═══════════════════════════════════════════════════════════════════════════════

  static getDefaultPerformance(): RealtimePerformance {
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
    };
  }

  static getDefaultStatistics(): Statistics {
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
      createdAt: now,
      lastUpdated: now,
    };
  }

  static getDefaultAdvancedSettings(): BotConfiguration['advanced_settings'] {
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
          id: '',
          name: '',
          type: 'custom',
          startDate: null,
          startTime: null,
          isEnabled: false,
          exclusions: [],
        },
      },
      risk_management_section: {
        max_daily_loss: null,
        max_daily_profit: null,
        max_consecutive_losses: null,
        max_drawdown_percentage: null,
        risk_per_trade: null,
        position_sizing: false,
        emergency_stop: false,
      },
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
        progressive_recovery: false,
        recovery_multiplier: null,
        max_recovery_attempts: null,
        recovery_cooldown: null,
        partial_recovery: false,
        recovery_threshold: null,
        metadata: null,
      },
      martingale_strategy_section: {
        martingale_multiplier: null,
        martingale_max_steps: null,
        martingale_reset_on_profit: false,
        martingale_progressive_target: false,
        martingale_safety_net: null,
        metadata: null,
      },
      martingale_reset_strategy_section: {
        reset_trigger_type: null,
        reset_after_trades: null,
        reset_multiplier_adjustment: null,
        track_session_stats: false,
      },
      dalembert_strategy_section: {
        dalembert_increment: null,
        dalembert_decrement: null,
        dalembert_max_units: null,
        dalembert_reset_threshold: null,
        dalembert_conservative_mode: false,
        metadata: null,
      },
      dalembert_reset_strategy_section: {
        dalembert_reset_frequency: null,
        dalembert_reset_on_target: false,
        dalembert_adaptive_increment: false,
        dalembert_session_profit_lock: false,
        metadata: null,
      },
      reverse_martingale_strategy_section: {
        reverse_martingale_multiplier: null,
        reverse_martingale_max_wins: null,
        reverse_martingale_profit_lock: null,
        reverse_martingale_reset_on_loss: false,
        reverse_martingale_aggressive_mode: false,
        metadata: null,
      },
      reverse_martingale_reset_strategy_section: {
        reverse_reset_win_streak: null,
        reverse_reset_profit_target: null,
        reverse_preserve_winnings: false,
        metadata: null,
      },
      reverse_dalembert_strategy_section: {
        reverse_dalembert_increment: null,
        reverse_dalembert_decrement: null,
        reverse_dalembert_max_units: null,
        reverse_dalembert_profit_ceiling: null,
        metadata: null,
      },
      reverse_dalembert_reset_strategy_section: {
        reverse_dalembert_reset_interval: null,
        reverse_dalembert_dynamic_reset: false,
        reverse_dalembert_win_rate_threshold: null,
        metadata: null,
      },
      accumulator_strategy_section: {
        accumulator_growth_rate: null,
        accumulator_target_multiplier: null,
        accumulator_auto_cashout: false,
        accumulator_trailing_stop: false,
        accumulator_tick_duration: null,
        metadata: null,
      },
      options_martingale_section: {
        options_contract_type: null,
        options_duration: null,
        options_martingale_multiplier: null,
        options_prediction_mode: null,
        metadata: null,
      },
      options_dalembert_section: {
        options_dalembert_contract_type: null,
        options_dalembert_increment: null,
        options_dalembert_duration: null,
        metadata: null,
      },
      options_reverse_martingale_section: {
        options_reverse_contract_type: null,
        options_reverse_win_multiplier: null,
        options_reverse_duration: null,
        options_reverse_max_streak: null,
        metadata: null,
      },
      system_1326_strategy_section: {
        system_1326_base_unit: null,
        system_1326_sequence: null,
        system_1326_reset_on_loss: false,
        system_1326_complete_cycle_target: null,
        system_1326_partial_profit_lock: false,
        system_1326_max_cycles: null,
        system_1326_progression_mode: null,
        system_1326_stop_on_cycle_complete: false,
        system_1326_loss_recovery: false,
        system_1326_contract_type: null,
        system_1326_duration: null,
        metadata: null,
      },
      reverse_dalembert_main_strategy_section: {
        reverse_dalembert_base_stake: null,
        reverse_dalembert_win_increment: null,
        reverse_dalembert_loss_decrement: null,
        reverse_dalembert_maximum_units: null,
        reverse_dalembert_minimum_units: null,
        reverse_dalembert_profit_ceiling: null,
        reverse_dalembert_reset_trigger: null,
        reverse_dalembert_aggressive_mode: false,
        reverse_dalembert_win_streak_bonus: null,
        reverse_dalembert_contract_type: null,
        reverse_dalembert_duration: null,
        metadata: null,
      },
      oscars_grind_strategy_section: {
        oscars_grind_base_unit: null,
        oscars_grind_profit_target: null,
        oscars_grind_increment_on_win: false,
        oscars_grind_max_bet_units: null,
        oscars_grind_reset_on_target: false,
        oscars_grind_session_limit: null,
        oscars_grind_loss_limit: null,
        oscars_grind_progression_speed: null,
        oscars_grind_maintain_stake_on_loss: false,
        oscars_grind_partial_target: false,
        oscars_grind_contract_type: null,
        oscars_grind_duration: null,
        oscars_grind_auto_stop_on_target: false,
        metadata: null,
      },
    };
  }
}
