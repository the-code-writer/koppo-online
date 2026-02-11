// ─────────────────────────────────────────────────────────────────────────────
// TradingBot API Service — Strict Type-Safe Client
// Consumes all /trading-bots endpoints via the shared apiService (Axios)
// ─────────────────────────────────────────────────────────────────────────────

import { apiService } from './api'; // adjust import path as needed

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum BotStatus {
  STOP = 'STOP',
  START = 'START',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  ERROR = 'ERROR',
  IDLE = 'IDLE',
}

export enum AmountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  DYNAMIC = 'dynamic',
}

export enum ScheduleType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum DurationUnit {
  TICKS = 't',
  SECONDS = 's',
  MINUTES = 'm',
  HOURS = 'h',
  DAYS = 'd',
}

export enum CooldownUnit {
  SECONDS = 'seconds',
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days',
}

export enum RecoveryType {
  MARTINGALE = 'martingale',
  DALEMBERT = 'dalembert',
  REVERSE_MARTINGALE = 'reverse_martingale',
  REVERSE_DALEMBERT = 'reverse_dalembert',
  OSCARS_GRIND = 'oscars_grind',
  SYSTEM_1326 = 'system_1326',
  ACCUMULATOR = 'accumulator',
  CUSTOM = 'custom',
}

export enum SortField {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  BOT_NAME = 'botName',
  STATUS = 'status',
  LIFETIME_RUNS = 'statistics.lifetimeRuns',
  WIN_RATE = 'statistics.winRate',
  TOTAL_PROFIT = 'statistics.totalProfit',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface BotAmountConfig {
  type: AmountType;
  value: number;
  min?: number | null;
  max?: number | null;
}

export interface BotAmounts {
  base_stake: BotAmountConfig;
  maximum_stake: BotAmountConfig;
  take_profit: BotAmountConfig;
  stop_loss: BotAmountConfig;
}

export interface BotMarketInfo {
  symbol: string;
  displayName: string;
  shortName: string;
  market_name: string;
  type: string;
  isClosed: boolean;
}

export interface BotContractData {
  id?: string;
  tradeType: string;
  contractType: string;
  prediction: string;
  predictionRandomize?: boolean;
  market?: BotMarketInfo | null;
  marketRandomize?: boolean;
  multiplier?: number;
  delay?: number;
  duration: number;
  durationUnits: DurationUnit;
  allowEquals?: boolean;
  alternateAfter?: number | null;
}

export interface BotDerivAccount {
  token: string;
  account: string;
  currency: string;
}

export interface BotScheduleExclusion {
  id?: string;
  date: string;
  reason: string;
}

export interface BotSchedule {
  id?: string;
  name: string;
  type: ScheduleType;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  daysOfWeek?: number[];
  dayOfMonth?: number | null;
  isEnabled: boolean;
  exclusions?: BotScheduleExclusion[];
}

export interface BotRiskStep {
  id?: string;
  lossStreak: number;
  multiplier: number;
  action: string;
}

export interface BotRecoverySteps {
  risk_steps: BotRiskStep[];
}

export interface CooldownPeriod {
  duration: number;
  unit: CooldownUnit;
}

export interface BotVersion {
  current: string;
  notes: string;
  date: string;
}

// ─── Realtime Performance ────────────────────────────────────────────────────

export interface BotRealtimePerformance {
  totalRuns: number;
  numberOfWins: number;
  numberOfLosses: number;
  totalStake: number;
  totalPayout: number;
  startedAt: string | null;
  stoppedAt: string | null;
  currentStake: number;
  baseStake: number;
  highestStake: number;
  currentWinStreak: number;
  currentLossStreak: number;
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface BotStatistics {
  lifetimeRuns: number;
  lifetimeWins: number;
  lifetimeLosses: number;
  longestWinStreak: number;
  longestLossStreak: number;
  shortestWinStreak: number;
  shortestLossStreak: number;
  totalStake: number;
  totalProfit: number;
  totalPayout: number;
  averageWinAmount: number;
  averageLossAmount: number;
  winRate: number;
  profitFactor: number;
  highestStake: number;
  highestPayout: number;
  roi: number | null;
  sharpeRatio: number | null;
  maxDrawdown: number | null;
  createdAt: string;
  lastUpdated: string;
}

// ─── Advanced Settings ───────────────────────────────────────────────────────

export interface GeneralSettingsSection {
  maximum_number_of_trades?: number | null;
  maximum_running_time?: number | null;
  cooldown_period?: CooldownPeriod | null;
  recovery_type?: RecoveryType | string | null;
  compound_stake?: boolean;
  auto_restart?: boolean;
}

export interface BotScheduleSection {
  bot_schedule?: BotSchedule;
}

export interface RiskManagementSection {
  max_daily_loss?: BotAmountConfig;
  max_daily_profit?: BotAmountConfig;
  max_consecutive_losses?: number | null;
  max_drawdown_percentage?: number | null;
  risk_per_trade?: BotAmountConfig;
  position_sizing?: boolean;
  emergency_stop?: boolean;
}

export interface VolatilityControlsSection {
  volatility_filter?: boolean;
  min_volatility?: number | null;
  max_volatility?: number | null;
  volatility_adjustment?: boolean;
  pause_on_high_volatility?: boolean;
  volatility_lookback_period?: number | null;
}

export interface MarketConditionsSection {
  trend_detection?: boolean;
  trend_strength_threshold?: number | null;
  avoid_ranging_market?: boolean;
  market_correlation_check?: boolean;
  time_of_day_filter?: boolean;
  preferred_trading_hours?: string | null;
}

export interface RecoverySettingsSection {
  progressive_recovery?: boolean;
  recovery_multiplier?: number | null;
  max_recovery_attempts?: number | null;
  recovery_cooldown?: CooldownPeriod | null;
  partial_recovery?: boolean;
  recovery_threshold?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface MartingaleStrategySection {
  martingale_multiplier?: number | null;
  martingale_max_steps?: number | null;
  martingale_reset_on_profit?: boolean;
  martingale_progressive_target?: boolean;
  martingale_safety_net?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface MartingaleResetStrategySection {
  reset_trigger_type?: string | null;
  reset_after_trades?: number | null;
  reset_multiplier_adjustment?: number | null;
  track_session_stats?: boolean;
}

export interface DalembertStrategySection {
  dalembert_increment?: BotAmountConfig | null;
  dalembert_decrement?: BotAmountConfig | null;
  dalembert_max_units?: number | null;
  dalembert_reset_threshold?: BotAmountConfig | null;
  dalembert_conservative_mode?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface DalembertResetStrategySection {
  dalembert_reset_frequency?: number | null;
  dalembert_reset_on_target?: boolean;
  dalembert_adaptive_increment?: boolean;
  dalembert_session_profit_lock?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface ReverseMartingaleStrategySection {
  reverse_martingale_multiplier?: number | null;
  reverse_martingale_max_wins?: number | null;
  reverse_martingale_profit_lock?: number | null;
  reverse_martingale_reset_on_loss?: boolean;
  reverse_martingale_aggressive_mode?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface ReverseMartingaleResetStrategySection {
  reverse_reset_win_streak?: number | null;
  reverse_reset_profit_target?: Record<string, unknown> | null;
  reverse_preserve_winnings?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface ReverseDalembertStrategySection {
  reverse_dalembert_increment?: Record<string, unknown> | null;
  reverse_dalembert_decrement?: Record<string, unknown> | null;
  reverse_dalembert_max_units?: number | null;
  reverse_dalembert_profit_ceiling?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface ReverseDalembertResetStrategySection {
  reverse_dalembert_reset_interval?: number | null;
  reverse_dalembert_dynamic_reset?: boolean;
  reverse_dalembert_win_rate_threshold?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface AccumulatorStrategySection {
  accumulator_growth_rate?: number | null;
  accumulator_target_multiplier?: number | null;
  accumulator_auto_cashout?: boolean;
  accumulator_trailing_stop?: boolean;
  accumulator_tick_duration?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface OptionsMartingaleSection {
  options_contract_type?: string | null;
  options_duration?: number | null;
  options_martingale_multiplier?: number | null;
  options_prediction_mode?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface OptionsDalembertSection {
  options_dalembert_contract_type?: string | null;
  options_dalembert_increment?: Record<string, unknown> | null;
  options_dalembert_duration?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface OptionsReverseMartingaleSection {
  options_reverse_contract_type?: string | null;
  options_reverse_win_multiplier?: number | null;
  options_reverse_duration?: number | null;
  options_reverse_max_streak?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface System1326StrategySection {
  system_1326_base_unit?: Record<string, unknown> | null;
  system_1326_sequence?: string | null;
  system_1326_reset_on_loss?: boolean;
  system_1326_complete_cycle_target?: Record<string, unknown> | null;
  system_1326_partial_profit_lock?: boolean;
  system_1326_max_cycles?: number | null;
  system_1326_progression_mode?: string | null;
  system_1326_stop_on_cycle_complete?: boolean;
  system_1326_loss_recovery?: boolean;
  system_1326_contract_type?: string | null;
  system_1326_duration?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface ReverseDalembertMainStrategySection {
  reverse_dalembert_base_stake?: Record<string, unknown> | null;
  reverse_dalembert_win_increment?: Record<string, unknown> | null;
  reverse_dalembert_loss_decrement?: Record<string, unknown> | null;
  reverse_dalembert_maximum_units?: number | null;
  reverse_dalembert_minimum_units?: number | null;
  reverse_dalembert_profit_ceiling?: Record<string, unknown> | null;
  reverse_dalembert_reset_trigger?: string | null;
  reverse_dalembert_aggressive_mode?: boolean;
  reverse_dalembert_win_streak_bonus?: number | null;
  reverse_dalembert_contract_type?: string | null;
  reverse_dalembert_duration?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface OscarsGrindStrategySection {
  oscars_grind_base_unit?: Record<string, unknown> | null;
  oscars_grind_profit_target?: Record<string, unknown> | null;
  oscars_grind_increment_on_win?: boolean;
  oscars_grind_max_bet_units?: number | null;
  oscars_grind_reset_on_target?: boolean;
  oscars_grind_session_limit?: number | null;
  oscars_grind_loss_limit?: Record<string, unknown> | null;
  oscars_grind_progression_speed?: string | null;
  oscars_grind_maintain_stake_on_loss?: boolean;
  oscars_grind_partial_target?: boolean;
  oscars_grind_contract_type?: string | null;
  oscars_grind_duration?: number | null;
  oscars_grind_auto_stop_on_target?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface BotAdvancedSettings {
  general_settings_section?: GeneralSettingsSection;
  bot_schedule?: BotScheduleSection;
  risk_management_section?: RiskManagementSection;
  volatility_controls_section?: VolatilityControlsSection;
  market_conditions_section?: MarketConditionsSection;
  recovery_settings_section?: RecoverySettingsSection;
  martingale_strategy_section?: MartingaleStrategySection;
  martingale_reset_strategy_section?: MartingaleResetStrategySection;
  dalembert_strategy_section?: DalembertStrategySection;
  dalembert_reset_strategy_section?: DalembertResetStrategySection;
  reverse_martingale_strategy_section?: ReverseMartingaleStrategySection;
  reverse_martingale_reset_strategy_section?: ReverseMartingaleResetStrategySection;
  reverse_dalembert_strategy_section?: ReverseDalembertStrategySection;
  reverse_dalembert_reset_strategy_section?: ReverseDalembertResetStrategySection;
  accumulator_strategy_section?: AccumulatorStrategySection;
  options_martingale_section?: OptionsMartingaleSection;
  options_dalembert_section?: OptionsDalembertSection;
  options_reverse_martingale_section?: OptionsReverseMartingaleSection;
  system_1326_strategy_section?: System1326StrategySection;
  reverse_dalembert_main_strategy_section?: ReverseDalembertMainStrategySection;
  oscars_grind_strategy_section?: OscarsGrindStrategySection;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TRADING BOT INTERFACE
// ═══════════════════════════════════════════════════════════════════════════════

export interface ITradingBot {
  _id: string;
  botId: string;
  botUUID: string;
  strategyId: string;
  parentBotId: string | null;
  botName: string;
  botDescription: string;
  botIcon: string;
  botThumbnail: string;
  botBanner: string;
  botTags: string[];
  botAccount: BotDerivAccount;
  contract: BotContractData;
  status: BotStatus;
  isActive: boolean;
  isPremium: boolean;
  isPublic: boolean;
  createdBy: string;
  deletedAt: string | null;
  version: BotVersion;
  amounts: BotAmounts;
  recovery_steps: BotRecoverySteps;
  advanced_settings: BotAdvancedSettings;
  realtimePerformance: BotRealtimePerformance;
  statistics: BotStatistics;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // Virtuals
  computedWinRate: number;
  computedProfitFactor: number;
  computedROI: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export interface CreateTradingBotDTO {
  botName: string;
  botDescription?: string;
  strategyId?: string;
  botTags?: string[];
  botIcon?: string;
  botThumbnail?: string;
  botBanner?: string;
  botAccount?: Partial<BotDerivAccount>;
  contract?: Partial<BotContractData>;
  amounts?: Partial<BotAmounts>;
  recovery_steps?: BotRecoverySteps;
  advanced_settings?: Partial<BotAdvancedSettings>;
  metadata?: Record<string, unknown>;
  isPremium?: boolean;
  isPublic?: boolean;
}

export interface UpdateTradingBotDTO {
  botName?: string;
  botDescription?: string;
  strategyId?: string;
  botTags?: string[];
  botIcon?: string;
  botThumbnail?: string;
  botBanner?: string;
  botAccount?: Partial<BotDerivAccount>;
  contract?: Partial<BotContractData>;
  amounts?: Partial<BotAmounts>;
  recovery_steps?: BotRecoverySteps;
  advanced_settings?: Partial<BotAdvancedSettings>;
  realtimePerformance?: Partial<BotRealtimePerformance>;
  statistics?: Partial<BotStatistics>;
  metadata?: Record<string, unknown>;
  isPremium?: boolean;
  isPublic?: boolean;
}

export interface ListTradingBotsParams {
  page?: number;
  limit?: number;
  sortBy?: SortField | string;
  sortOrder?: SortOrder;
  status?: BotStatus;
  isPremium?: boolean;
  isPublic?: boolean;
  isActive?: boolean;
  strategyId?: string;
  tags?: string | string[];
}

export interface ListMyBotsParams {
  page?: number;
  limit?: number;
  sortBy?: SortField | string;
  sortOrder?: SortOrder;
  status?: BotStatus;
  isActive?: boolean;
}

export interface UpdateAmountsDTO {
  base_stake?: BotAmountConfig;
  maximum_stake?: BotAmountConfig;
  take_profit?: BotAmountConfig;
  stop_loss?: BotAmountConfig;
}

export interface UpdateTagsDTO {
  botTags: string[];
}

export interface UpdateContractDTO {
  contract: Partial<BotContractData>;
}

export interface UpdateScheduleDTO {
  bot_schedule: Partial<BotSchedule>;
}

export interface UpdateAccountDTO {
  botAccount: Partial<BotDerivAccount>;
}

export interface UpdateGeneralDataDTO {
  botName?: string;
  botDescription?: string;
  botTags?: string[];
}

export interface UpdatePhotosDTO {
  botIcon?: string;
  botThumbnail?: string;
  botBanner?: string;
}

export interface UpdateMetadataDTO {
  metadata: Record<string, unknown>;
}

export interface UpdateStatisticsDTO {
  statistics: Partial<BotStatistics>;
}

export interface UpdateAdvancedSettingsDTO {
  advanced_settings: Partial<BotAdvancedSettings>;
}

export interface UpdateStrategySettingsDTO {
  strategyId?: string;
  advanced_settings?: Partial<BotAdvancedSettings>;
}

export interface UpdateRealtimePerformanceDTO {
  realtimePerformance: Partial<BotRealtimePerformance>;
}

export interface UpdateStatusDTO {
  status: BotStatus;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  code: number;
  message: string;
  stack?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedBotList {
  bots: ITradingBot[];
  pagination: PaginationMeta;
}

// ─── Action Responses ────────────────────────────────────────────────────────

export interface StartBotData {
  status: BotStatus;
  startedAt: string;
}

export interface PauseBotData {
  status: BotStatus;
}

export interface ResumeBotData {
  status: BotStatus;
}

export interface StopBotData {
  status: BotStatus;
  stoppedAt: string;
}

// ─── Field-specific Response Data ────────────────────────────────────────────

export interface AmountsData {
  amounts: BotAmounts;
}

export interface TagsData {
  botTags: string[];
}

export interface ContractFieldData {
  contract: BotContractData;
}

export interface ScheduleFieldData {
  bot_schedule: BotSchedule;
}

export interface AccountFieldData {
  botAccount: BotDerivAccount;
}

export interface GeneralFieldData {
  botName: string;
  botDescription: string;
  botTags: string[];
}

export interface PhotosFieldData {
  botIcon: string;
  botThumbnail: string;
  botBanner: string;
}

export interface MetadataFieldData {
  metadata: Record<string, unknown>;
}

export interface StatisticsFieldData {
  statistics: BotStatistics;
  computedWinRate: number;
  computedProfitFactor: number;
  computedROI: number;
}

export interface AdvancedSettingsFieldData {
  advanced_settings: BotAdvancedSettings;
}

export interface StrategySettingsFieldData {
  strategyId: string;
  advanced_settings: BotAdvancedSettings;
}

export interface RealtimePerformanceFieldData {
  realtimePerformance: BotRealtimePerformance;
}

export interface StatusFieldData {
  status: BotStatus;
  isActive: boolean;
}

export interface StrategyFieldData {
  strategyId: string;
}

export interface ParentFieldData {
  parentBotId: string | null;
  parentBot: ITradingBot | null;
}

export interface VisibilityData {
  isPublic: boolean;
}

export interface ActivationData {
  isActive: boolean;
  status?: BotStatus;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class TradingBotApiError extends Error {
  public readonly statusCode: number;
  public readonly originalError: unknown;

  constructor(message: string, statusCode: number = 500, originalError?: unknown) {
    super(message);
    this.name = 'TradingBotApiError';
    this.statusCode = statusCode;
    this.originalError = originalError;
    Object.setPrototypeOf(this, TradingBotApiError.prototype);
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isBadRequest(): boolean {
    return this.statusCode === 400;
  }

  get isRateLimited(): boolean {
    return this.statusCode === 429;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const BASE_URL = '/trading-bots';

function buildUrl(uuid: string, path?: string): string {
  return path ? `${BASE_URL}/${uuid}/${path}` : `${BASE_URL}/${uuid}`;
}

function handleError(error: unknown, context: string): never {
  if (error instanceof TradingBotApiError) {
    throw error;
  }

  // Axios error shape
  const axiosError = error as {
    response?: { status?: number; data?: ApiErrorResponse | { message?: string } };
    message?: string;
  };

  const statusCode = axiosError?.response?.status ?? 500;
  const serverMessage =
    (axiosError?.response?.data as ApiErrorResponse)?.message ??
    (axiosError?.response?.data as { message?: string })?.message ??
    axiosError?.message ??
    'An unexpected error occurred';

  throw new TradingBotApiError(
    `[TradingBot:${context}] ${serverMessage}`,
    statusCode,
    error,
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// API SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export const tradingBotAPIService = {
  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a new trading bot.
   */
  async createBot(data: CreateTradingBotDTO): Promise<ApiSuccessResponse<ITradingBot>> {
    try {
      return await apiService.post<ApiSuccessResponse<ITradingBot>>(BASE_URL, data);
    } catch (error) {
      handleError(error, 'createBot');
    }
  },

  /**
   * Get a single trading bot by UUID.
   */
  async getBot(uuid: string): Promise<ApiSuccessResponse<ITradingBot>> {
    try {
      return await apiService.get<ApiSuccessResponse<ITradingBot>>(buildUrl(uuid));
    } catch (error) {
      handleError(error, 'getBot');
    }
  },

  /**
   * Update a trading bot (general update).
   */
  async updateBot(uuid: string, data: UpdateTradingBotDTO): Promise<ApiSuccessResponse<ITradingBot>> {
    try {
      return await apiService.patch<ApiSuccessResponse<ITradingBot>>(buildUrl(uuid), data);
    } catch (error) {
      handleError(error, 'updateBot');
    }
  },

  /**
   * Soft-delete a trading bot.
   */
  async deleteBot(uuid: string): Promise<ApiSuccessResponse<ITradingBot>> {
    try {
      return await apiService.delete<ApiSuccessResponse<ITradingBot>>(buildUrl(uuid));
    } catch (error) {
      handleError(error, 'deleteBot');
    }
  },

  /**
   * List all trading bots (filtered by access, paginated).
   */
  async listBots(params?: ListTradingBotsParams): Promise<ApiSuccessResponse<PaginatedBotList>> {
    try {
      const queryParams: Record<string, unknown> = { ...params };
      if (Array.isArray(params?.tags)) {
        queryParams.tags = params!.tags.join(',');
      }
      return await apiService.get<ApiSuccessResponse<PaginatedBotList>>(BASE_URL, queryParams);
    } catch (error) {
      handleError(error, 'listBots');
    }
  },

  /**
   * List the authenticated user's own trading bots.
   */
  async listMyBots(params?: ListMyBotsParams): Promise<ApiSuccessResponse<PaginatedBotList>> {
    try {
      return await apiService.get<ApiSuccessResponse<PaginatedBotList>>(
        `${BASE_URL}/mine`,
        params as Record<string, unknown>,
      );
    } catch (error) {
      handleError(error, 'listMyBots');
    }
  },

  // ─── BOT ACTIONS ───────────────────────────────────────────────────────────

  /**
   * Start a trading bot. Requires status IDLE or STOP.
   */
  async startBot(uuid: string): Promise<ApiSuccessResponse<StartBotData>> {
    try {
      return await apiService.post<ApiSuccessResponse<StartBotData>>(buildUrl(uuid, 'start'));
    } catch (error) {
      handleError(error, 'startBot');
    }
  },

  /**
   * Pause a running trading bot. Requires status START or RESUME.
   */
  async pauseBot(uuid: string): Promise<ApiSuccessResponse<PauseBotData>> {
    try {
      return await apiService.post<ApiSuccessResponse<PauseBotData>>(buildUrl(uuid, 'pause'));
    } catch (error) {
      handleError(error, 'pauseBot');
    }
  },

  /**
   * Resume a paused trading bot. Requires status PAUSE.
   */
  async resumeBot(uuid: string): Promise<ApiSuccessResponse<ResumeBotData>> {
    try {
      return await apiService.post<ApiSuccessResponse<ResumeBotData>>(buildUrl(uuid, 'resume'));
    } catch (error) {
      handleError(error, 'resumeBot');
    }
  },

  /**
   * Stop a trading bot. Requires status START, PAUSE, or RESUME.
   */
  async stopBot(uuid: string): Promise<ApiSuccessResponse<StopBotData>> {
    try {
      return await apiService.post<ApiSuccessResponse<StopBotData>>(buildUrl(uuid, 'stop'));
    } catch (error) {
      handleError(error, 'stopBot');
    }
  },

  /**
   * Clone a trading bot. Creates a copy with reset statistics.
   */
  async cloneBot(uuid: string): Promise<ApiSuccessResponse<ITradingBot>> {
    try {
      return await apiService.post<ApiSuccessResponse<ITradingBot>>(buildUrl(uuid, 'clone'));
    } catch (error) {
      handleError(error, 'cloneBot');
    }
  },

  // ─── FIELD-SPECIFIC UPDATES ────────────────────────────────────────────────

  /**
   * Update bot amounts (base_stake, maximum_stake, take_profit, stop_loss).
   */
  async updateAmounts(uuid: string, data: UpdateAmountsDTO): Promise<ApiSuccessResponse<AmountsData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<AmountsData>>(buildUrl(uuid, 'update-amounts'), data);
    } catch (error) {
      handleError(error, 'updateAmounts');
    }
  },

  /**
   * Update bot tags.
   */
  async updateTags(uuid: string, data: UpdateTagsDTO): Promise<ApiSuccessResponse<TagsData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<TagsData>>(buildUrl(uuid, 'update-tags'), data);
    } catch (error) {
      handleError(error, 'updateTags');
    }
  },

  /**
   * Update bot contract configuration.
   */
  async updateContract(uuid: string, data: UpdateContractDTO): Promise<ApiSuccessResponse<ContractFieldData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<ContractFieldData>>(buildUrl(uuid, 'update-contract'), data);
    } catch (error) {
      handleError(error, 'updateContract');
    }
  },

  /**
   * Update bot trading schedule.
   */
  async updateSchedule(uuid: string, data: UpdateScheduleDTO): Promise<ApiSuccessResponse<ScheduleFieldData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<ScheduleFieldData>>(buildUrl(uuid, 'update-schedule'), data);
    } catch (error) {
      handleError(error, 'updateSchedule');
    }
  },

  /**
   * Update bot Deriv account credentials.
   */
  async updateAccount(uuid: string, data: UpdateAccountDTO): Promise<ApiSuccessResponse<AccountFieldData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<AccountFieldData>>(buildUrl(uuid, 'update-account'), data);
    } catch (error) {
      handleError(error, 'updateAccount');
    }
  },

  /**
   * Update bot general data (name, description, tags).
   */
  async updateGeneralData(uuid: string, data: UpdateGeneralDataDTO): Promise<ApiSuccessResponse<GeneralFieldData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<GeneralFieldData>>(buildUrl(uuid, 'update-general-data'), data);
    } catch (error) {
      handleError(error, 'updateGeneralData');
    }
  },

  /**
   * Update bot photos (icon, thumbnail, banner).
   */
  async updatePhotos(uuid: string, data: UpdatePhotosDTO): Promise<ApiSuccessResponse<PhotosFieldData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<PhotosFieldData>>(buildUrl(uuid, 'update-photos'), data);
    } catch (error) {
      handleError(error, 'updatePhotos');
    }
  },

  /**
   * Update bot metadata object.
   */
  async updateMetadata(uuid: string, data: UpdateMetadataDTO): Promise<ApiSuccessResponse<MetadataFieldData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<MetadataFieldData>>(buildUrl(uuid, 'update-metadata'), data);
    } catch (error) {
      handleError(error, 'updateMetadata');
    }
  },

  /**
   * Update bot lifetime statistics.
   */
  async updateStatistics(uuid: string, data: UpdateStatisticsDTO): Promise<ApiSuccessResponse<StatisticsFieldData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<StatisticsFieldData>>(buildUrl(uuid, 'update-statistics'), data);
    } catch (error) {
      handleError(error, 'updateStatistics');
    }
  },

  /**
   * Update bot advanced settings (all sections).
   */
  async updateAdvancedSettings(
    uuid: string,
    data: UpdateAdvancedSettingsDTO,
  ): Promise<ApiSuccessResponse<AdvancedSettingsFieldData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<AdvancedSettingsFieldData>>(
        buildUrl(uuid, 'update-advanced-settings'),
        data,
      );
    } catch (error) {
      handleError(error, 'updateAdvancedSettings');
    }
  },

  /**
   * Update bot strategy ID and/or strategy-specific advanced settings.
   */
  async updateStrategySettings(
    uuid: string,
    data: UpdateStrategySettingsDTO,
  ): Promise<ApiSuccessResponse<StrategySettingsFieldData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<StrategySettingsFieldData>>(
        buildUrl(uuid, 'update-strategy-settings'),
        data,
      );
    } catch (error) {
      handleError(error, 'updateStrategySettings');
    }
  },

  /**
   * Update bot realtime performance metrics.
   */
  async updateRealtimePerformance(
    uuid: string,
    data: UpdateRealtimePerformanceDTO,
  ): Promise<ApiSuccessResponse<RealtimePerformanceFieldData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<RealtimePerformanceFieldData>>(
        buildUrl(uuid, 'update-realtime-performance'),
        data,
      );
    } catch (error) {
      handleError(error, 'updateRealtimePerformance');
    }
  },

  /**
   * Directly set bot status.
   */
  async updateStatus(uuid: string, data: UpdateStatusDTO): Promise<ApiSuccessResponse<{ status: BotStatus }>> {
    try {
      return await apiService.patch<ApiSuccessResponse<{ status: BotStatus }>>(buildUrl(uuid, 'update-status'), data);
    } catch (error) {
      handleError(error, 'updateStatus');
    }
  },

  // ─── VISIBILITY & ACTIVATION ───────────────────────────────────────────────

  /**
   * Make bot publicly visible.
   */
  async setAsPublic(uuid: string): Promise<ApiSuccessResponse<VisibilityData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<VisibilityData>>(buildUrl(uuid, 'set-as-public'));
    } catch (error) {
      handleError(error, 'setAsPublic');
    }
  },

  /**
   * Make bot private.
   */
  async setAsPrivate(uuid: string): Promise<ApiSuccessResponse<VisibilityData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<VisibilityData>>(buildUrl(uuid, 'set-as-private'));
    } catch (error) {
      handleError(error, 'setAsPrivate');
    }
  },

  /**
   * Activate a deactivated bot.
   */
  async activateBot(uuid: string): Promise<ApiSuccessResponse<{ isActive: boolean }>> {
    try {
      return await apiService.patch<ApiSuccessResponse<{ isActive: boolean }>>(buildUrl(uuid, 'activate'));
    } catch (error) {
      handleError(error, 'activateBot');
    }
  },

  /**
   * Deactivate a bot (auto-stops if running).
   */
  async deactivateBot(uuid: string): Promise<ApiSuccessResponse<ActivationData>> {
    try {
      return await apiService.patch<ApiSuccessResponse<ActivationData>>(buildUrl(uuid, 'deactivate'));
    } catch (error) {
      handleError(error, 'deactivateBot');
    }
  },

  // ─── GET FIELD-SPECIFIC DATA ───────────────────────────────────────────────

  /**
   * Get linked strategy ID.
   */
  async getStrategy(uuid: string): Promise<ApiSuccessResponse<StrategyFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<StrategyFieldData>>(buildUrl(uuid, 'get-strategy'));
    } catch (error) {
      handleError(error, 'getStrategy');
    }
  },

  /**
   * Get parent bot info (if cloned).
   */
  async getParent(uuid: string): Promise<ApiSuccessResponse<ParentFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<ParentFieldData>>(buildUrl(uuid, 'get-parent'));
    } catch (error) {
      handleError(error, 'getParent');
    }
  },

  /**
   * Get bot name, description, and tags.
   */
  async getGeneralData(uuid: string): Promise<ApiSuccessResponse<GeneralFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<GeneralFieldData>>(buildUrl(uuid, 'get-general-data'));
    } catch (error) {
      handleError(error, 'getGeneralData');
    }
  },

  /**
   * Get bot icon, thumbnail, and banner URLs.
   */
  async getPhotos(uuid: string): Promise<ApiSuccessResponse<PhotosFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<PhotosFieldData>>(buildUrl(uuid, 'get-photos'));
    } catch (error) {
      handleError(error, 'getPhotos');
    }
  },

  /**
   * Get Deriv account (owner only).
   */
  async getAccount(uuid: string): Promise<ApiSuccessResponse<AccountFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<AccountFieldData>>(buildUrl(uuid, 'get-account'));
    } catch (error) {
      handleError(error, 'getAccount');
    }
  },

  /**
   * Get full advanced settings configuration.
   */
  async getAdvancedSettings(uuid: string): Promise<ApiSuccessResponse<AdvancedSettingsFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<AdvancedSettingsFieldData>>(
        buildUrl(uuid, 'get-advanced-settings'),
      );
    } catch (error) {
      handleError(error, 'getAdvancedSettings');
    }
  },

  /**
   * Get strategy ID and strategy-specific advanced settings.
   */
  async getStrategySettings(uuid: string): Promise<ApiSuccessResponse<StrategySettingsFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<StrategySettingsFieldData>>(
        buildUrl(uuid, 'get-strategy-settings'),
      );
    } catch (error) {
      handleError(error, 'getStrategySettings');
    }
  },

  /**
   * Get bot tags array.
   */
  async getTags(uuid: string): Promise<ApiSuccessResponse<TagsData>> {
    try {
      return await apiService.get<ApiSuccessResponse<TagsData>>(buildUrl(uuid, 'get-tags'));
    } catch (error) {
      handleError(error, 'getTags');
    }
  },

  /**
   * Get bot status and isActive state.
   */
  async getStatus(uuid: string): Promise<ApiSuccessResponse<StatusFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<StatusFieldData>>(buildUrl(uuid, 'get-status'));
    } catch (error) {
      handleError(error, 'getStatus');
    }
  },

  /**
   * Get bot metadata object.
   */
  async getMetadata(uuid: string): Promise<ApiSuccessResponse<MetadataFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<MetadataFieldData>>(buildUrl(uuid, 'get-metadata'));
    } catch (error) {
      handleError(error, 'getMetadata');
    }
  },

  /**
   * Get lifetime statistics with computed metrics.
   */
  async getStatistics(uuid: string): Promise<ApiSuccessResponse<StatisticsFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<StatisticsFieldData>>(buildUrl(uuid, 'get-statistics'));
    } catch (error) {
      handleError(error, 'getStatistics');
    }
  },

  /**
   * Get current session realtime performance.
   */
  async getRealtimePerformance(uuid: string): Promise<ApiSuccessResponse<RealtimePerformanceFieldData>> {
    try {
      return await apiService.get<ApiSuccessResponse<RealtimePerformanceFieldData>>(
        buildUrl(uuid, 'get-realtime-performance'),
      );
    } catch (error) {
      handleError(error, 'getRealtimePerformance');
    }
  },
};

export default tradingBotAPIService;
