/**
 * @file: BotManager.ts
 * @description: Robust Bot management class for handling bot lifecycle, API communication, and control operations
 * 
 * @features:
 *   - Complete bot CRUD operations
 *   - Real-time status management
 *   - API integration with error handling
 *   - Bot control operations (start, stop, pause, resume)
 *   - Performance tracking and statistics
 *   - Configuration management
 *   - Event-driven architecture
 * 
 * @usage:
 *   const botManager = new BotManager('https://api.example.com');
 *   await botManager.loadBot('bot-id');
 *   await botManager.startBot();
 *   const status = botManager.getStatus();
 */

import { ContractData } from '../../types/strategy';

// Bot status types
export type BotStatus = 'STOP' | 'START' | 'PAUSE' | 'RESUME' | 'ERROR' | 'IDLE';

// Performance metrics interface
export interface RealtimePerformance {
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
}

export interface Statistics {
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
  createdAt: string;
  lastUpdated: string;
}

// Complete bot configuration interface
export interface BotConfiguration {
  strategyId: string;
  contract: ContractData;
  status: BotStatus;
  botId: string;
  botName: string;
  botDescription: string;
  botIcon: string;
  botThumbnail: string;
  botBanner: string;
  botTags: string[];
  botCurrency: string;
  isActive: boolean;
  isPremium: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: {
    current: string;
    notes: string;
    date: string;
  };
  amounts: {
    base_stake: unknown;
    maximum_stake: unknown;
    take_profit: unknown;
    stop_loss: unknown;
  };
  recovery_steps: {
    risk_steps: Array<{
      id: string;
      lossStreak: number;
      multiplier: number;
      action: string;
    }>;
  };
  advanced_settings: {
    general_settings_section: {
      maximum_number_of_trades: number | null;
      maximum_running_time: number | null;
      cooldown_period: { duration: number; unit: string } | null;
      recovery_type: string | null;
      compound_stake: boolean;
      auto_restart: boolean;
    };
    bot_schedule: {
      bot_schedule: {
        id: string;
        name: string;
        type: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
        startDate: any;
        endDate?: any;
        startTime: any;
        endTime?: any;
        daysOfWeek?: number[];
        dayOfMonth?: number;
        isEnabled: boolean;
        exclusions?: Array<{
          id: string;
          date: any;
          reason: string;
        }>;
      };
    };
    risk_management_section: {
      max_daily_loss: unknown;
      max_daily_profit: unknown;
      max_consecutive_losses: number | null;
      max_drawdown_percentage: number | null;
      risk_per_trade: number | null;
      position_sizing: boolean;
      emergency_stop: boolean;
    };
    volatility_controls_section: {
      volatility_filter: boolean;
      min_volatility: number | null;
      max_volatility: number | null;
      volatility_adjustment: boolean;
      pause_on_high_volatility: boolean;
      volatility_lookback_period: number | null;
    };
    market_conditions_section: {
      trend_detection: boolean;
      trend_strength_threshold: number | null;
      avoid_ranging_market: boolean;
      market_correlation_check: boolean;
      time_of_day_filter: boolean;
      preferred_trading_hours: string | null;
    };
    recovery_settings_section: {
      progressive_recovery: boolean;
      recovery_multiplier: number | null;
      max_recovery_attempts: number | null;
      recovery_cooldown: { duration: number; unit: string } | null;
      partial_recovery: boolean;
      recovery_threshold: unknown;
      metadata: unknown;
    };
    martingale_strategy_section: {
      martingale_multiplier: number | null;
      martingale_max_steps: number | null;
      martingale_reset_on_profit: boolean;
      martingale_progressive_target: boolean;
      martingale_safety_net: number | null;
      metadata: unknown;
    };
    martingale_reset_strategy_section: {
      reset_trigger_type: string | null;
      reset_after_trades: number | null;
      reset_multiplier_adjustment: number | null;
      track_session_stats: boolean;
    };
    dalembert_strategy_section: {
      dalembert_increment: unknown;
      dalembert_decrement: unknown;
      dalembert_max_units: number | null;
      dalembert_reset_threshold: unknown;
      dalembert_conservative_mode: boolean;
      metadata: unknown;
    };
    dalembert_reset_strategy_section: {
      dalembert_reset_frequency: number | null;
      dalembert_reset_on_target: boolean;
      dalembert_adaptive_increment: boolean;
      dalembert_session_profit_lock: boolean;
      metadata: unknown;
    };
    reverse_martingale_strategy_section: {
      reverse_martingale_multiplier: number | null;
      reverse_martingale_max_wins: number | null;
      reverse_martingale_profit_lock: number | null;
      reverse_martingale_reset_on_loss: boolean;
      reverse_martingale_aggressive_mode: boolean;
      metadata: unknown;
    };
    reverse_martingale_reset_strategy_section: {
      reverse_reset_win_streak: number | null;
      reverse_reset_profit_target: unknown;
      reverse_preserve_winnings: boolean;
      metadata: unknown;
    };
    reverse_dalembert_strategy_section: {
      reverse_dalembert_increment: unknown;
      reverse_dalembert_decrement: unknown;
      reverse_dalembert_max_units: number | null;
      reverse_dalembert_profit_ceiling: unknown;
      metadata: unknown;
    };
    reverse_dalembert_reset_strategy_section: {
      reverse_dalembert_reset_interval: number | null;
      reverse_dalembert_dynamic_reset: boolean;
      reverse_dalembert_win_rate_threshold: number | null;
      metadata: unknown;
    };
    accumulator_strategy_section: {
      accumulator_growth_rate: number | null;
      accumulator_target_multiplier: number | null;
      accumulator_auto_cashout: boolean;
      accumulator_trailing_stop: boolean;
      accumulator_tick_duration: number | null;
      metadata: unknown;
    };
    options_martingale_section: {
      options_contract_type: string | null;
      options_duration: number | null;
      options_martingale_multiplier: number | null;
      options_prediction_mode: string | null;
      metadata: unknown;
    };
    options_dalembert_section: {
      options_dalembert_contract_type: string | null;
      options_dalembert_increment: unknown;
      options_dalembert_duration: number | null;
      metadata: unknown;
    };
    options_reverse_martingale_section: {
      options_reverse_contract_type: string | null;
      options_reverse_win_multiplier: number | null;
      options_reverse_duration: number | null;
      options_reverse_max_streak: number | null;
      metadata: unknown;
    };
    system_1326_strategy_section: {
      system_1326_base_unit: unknown;
      system_1326_sequence: string | null;
      system_1326_reset_on_loss: boolean;
      system_1326_complete_cycle_target: unknown;
      system_1326_partial_profit_lock: boolean;
      system_1326_max_cycles: number | null;
      system_1326_progression_mode: string | null;
      system_1326_stop_on_cycle_complete: boolean;
      system_1326_loss_recovery: boolean;
      system_1326_contract_type: string | null;
      system_1326_duration: number | null;
      metadata: unknown;
    };
    reverse_dalembert_main_strategy_section: {
      reverse_dalembert_base_stake: unknown;
      reverse_dalembert_win_increment: unknown;
      reverse_dalembert_loss_decrement: unknown;
      reverse_dalembert_maximum_units: number | null;
      reverse_dalembert_minimum_units: number | null;
      reverse_dalembert_profit_ceiling: unknown;
      reverse_dalembert_reset_trigger: string | null;
      reverse_dalembert_aggressive_mode: boolean;
      reverse_dalembert_win_streak_bonus: number | null;
      reverse_dalembert_contract_type: string | null;
      reverse_dalembert_duration: number | null;
      metadata: unknown;
    };
    oscars_grind_strategy_section: {
      oscars_grind_base_unit: unknown;
      oscars_grind_profit_target: unknown;
      oscars_grind_increment_on_win: boolean;
      oscars_grind_max_bet_units: number | null;
      oscars_grind_reset_on_target: boolean;
      oscars_grind_session_limit: number | null;
      oscars_grind_loss_limit: unknown;
      oscars_grind_progression_speed: string | null;
      oscars_grind_maintain_stake_on_loss: boolean;
      oscars_grind_partial_target: boolean;
      oscars_grind_contract_type: string | null;
      oscars_grind_duration: number | null;
      oscars_grind_auto_stop_on_target: boolean;
      metadata: unknown;
    };
  };
  realtimePerformance: RealtimePerformance;
  statistics: Statistics;
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BotListResponse {
  bots: BotConfiguration[];
  total: number;
  page: number;
  limit: number;
}

// Event types for bot management
export type BotEventType = 
  | 'status_changed'
  | 'performance_updated'
  | 'error_occurred'
  | 'configuration_updated'
  | 'bot_created'
  | 'bot_deleted';

export interface BotEvent {
  type: BotEventType;
  botId: string;
  timestamp: string;
  data?: any;
}

// Event listener type
export type BotEventListener = (event: BotEvent) => void;

/**
 * BotManager Class - Comprehensive bot management system
 */
export class BotManager {
  private apiBaseUrl: string;
  private authToken?: string;
  private currentBot?: BotConfiguration;
  private eventListeners: Map<BotEventType, BotEventListener[]> = new Map();
  private performanceUpdateInterval?: NodeJS.Timeout;

  /**
   * Constructor
   * @param apiBaseUrl Base URL for the API
   * @param authToken Optional authentication token
   */
  constructor(apiBaseUrl: string, authToken?: string) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.authToken = authToken;
    
    // Initialize event listeners map
    Object.values(['status_changed', 'performance_updated', 'error_occurred', 'configuration_updated', 'bot_created', 'bot_deleted']).forEach(eventType => {
      this.eventListeners.set(eventType as BotEventType, []);
    });
  }

  /**
   * Set authentication token
   * @param token Authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Add event listener
   * @param eventType Event type to listen for
   * @param listener Callback function
   */
  addEventListener(eventType: BotEventType, listener: BotEventListener): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Remove event listener
   * @param eventType Event type
   * @param listener Callback function to remove
   */
  removeEventListener(eventType: BotEventType, listener: BotEventListener): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }

  /**
   * Emit event to all listeners
   * @param event Event to emit
   */
  private emitEvent(event: BotEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    });
  }

  /**
   * Make HTTP request with proper error handling
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Promise with API response
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Create a new bot
   * @param botData Bot configuration data
   * @returns Promise with created bot data
   */
  async createBot(botData: Partial<BotConfiguration>): Promise<ApiResponse<BotConfiguration>> {
    const response = await this.makeRequest<BotConfiguration>('/bots', {
      method: 'POST',
      body: JSON.stringify(botData),
    });

    if (response.success && response.data) {
      this.currentBot = response.data;
      this.emitEvent({
        type: 'bot_created',
        botId: response.data.botId,
        timestamp: new Date().toISOString(),
        data: response.data,
      });
    }

    return response;
  }

  /**
   * Load bot configuration from API
   * @param botId Bot ID to load
   * @returns Promise with loaded bot data
   */
  async loadBot(botId: string): Promise<ApiResponse<BotConfiguration>> {
    const response = await this.makeRequest<BotConfiguration>(`/bots/${botId}`);

    if (response.success && response.data) {
      this.currentBot = response.data;
      this.startPerformanceUpdates();
    }

    return response;
  }

  /**
   * Update bot configuration
   * @param botId Bot ID
   * @param updates Configuration updates
   * @returns Promise with updated bot data
   */
  async updateBot(botId: string, updates: Partial<BotConfiguration>): Promise<ApiResponse<BotConfiguration>> {
    const response = await this.makeRequest<BotConfiguration>(`/bots/${botId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    if (response.success && response.data) {
      this.currentBot = response.data;
      this.emitEvent({
        type: 'configuration_updated',
        botId,
        timestamp: new Date().toISOString(),
        data: response.data,
      });
    }

    return response;
  }

  /**
   * Delete bot
   * @param botId Bot ID to delete
   * @returns Promise with deletion result
   */
  async deleteBot(botId: string): Promise<ApiResponse<void>> {
    const response = await this.makeRequest<void>(`/bots/${botId}`, {
      method: 'DELETE',
    });

    if (response.success) {
      if (this.currentBot?.botId === botId) {
        this.stopPerformanceUpdates();
        this.currentBot = undefined;
      }
      this.emitEvent({
        type: 'bot_deleted',
        botId,
        timestamp: new Date().toISOString(),
      });
    }

    return response;
  }

  /**
   * Get list of all bots
   * @param page Page number (default: 1)
   * @param limit Number of bots per page (default: 10)
   * @returns Promise with bot list
   */
  async getBots(page: number = 1, limit: number = 10): Promise<ApiResponse<BotListResponse>> {
    return this.makeRequest<BotListResponse>(`/bots?page=${page}&limit=${limit}`);
  }

  /**
   * Start bot execution
   * @param botId Bot ID (optional, uses current bot if not provided)
   * @returns Promise with operation result
   */
  async startBot(botId?: string): Promise<ApiResponse<BotConfiguration>> {
    const targetBotId = botId || this.currentBot?.botId;
    if (!targetBotId) {
      return { success: false, error: 'No bot ID provided' };
    }

    const response = await this.makeRequest<BotConfiguration>(`/bots/${targetBotId}/start`, {
      method: 'POST',
    });

    if (response.success && response.data) {
      if (this.currentBot?.botId === targetBotId) {
        this.currentBot = response.data;
      }
      this.emitEvent({
        type: 'status_changed',
        botId: targetBotId,
        timestamp: new Date().toISOString(),
        data: { status: 'START' },
      });
    }

    return response;
  }

  /**
   * Stop bot execution
   * @param botId Bot ID (optional, uses current bot if not provided)
   * @returns Promise with operation result
   */
  async stopBot(botId?: string): Promise<ApiResponse<BotConfiguration>> {
    const targetBotId = botId || this.currentBot?.botId;
    if (!targetBotId) {
      return { success: false, error: 'No bot ID provided' };
    }

    const response = await this.makeRequest<BotConfiguration>(`/bots/${targetBotId}/stop`, {
      method: 'POST',
    });

    if (response.success && response.data) {
      if (this.currentBot?.botId === targetBotId) {
        this.currentBot = response.data;
      }
      this.emitEvent({
        type: 'status_changed',
        botId: targetBotId,
        timestamp: new Date().toISOString(),
        data: { status: 'STOP' },
      });
    }

    return response;
  }

  /**
   * Pause bot execution
   * @param botId Bot ID (optional, uses current bot if not provided)
   * @returns Promise with operation result
   */
  async pauseBot(botId?: string): Promise<ApiResponse<BotConfiguration>> {
    const targetBotId = botId || this.currentBot?.botId;
    if (!targetBotId) {
      return { success: false, error: 'No bot ID provided' };
    }

    const response = await this.makeRequest<BotConfiguration>(`/bots/${targetBotId}/pause`, {
      method: 'POST',
    });

    if (response.success && response.data) {
      if (this.currentBot?.botId === targetBotId) {
        this.currentBot = response.data;
      }
      this.emitEvent({
        type: 'status_changed',
        botId: targetBotId,
        timestamp: new Date().toISOString(),
        data: { status: 'PAUSE' },
      });
    }

    return response;
  }

  /**
   * Resume bot execution
   * @param botId Bot ID (optional, uses current bot if not provided)
   * @returns Promise with operation result
   */
  async resumeBot(botId?: string): Promise<ApiResponse<BotConfiguration>> {
    const targetBotId = botId || this.currentBot?.botId;
    if (!targetBotId) {
      return { success: false, error: 'No bot ID provided' };
    }

    const response = await this.makeRequest<BotConfiguration>(`/bots/${targetBotId}/resume`, {
      method: 'POST',
    });

    if (response.success && response.data) {
      if (this.currentBot?.botId === targetBotId) {
        this.currentBot = response.data;
      }
      this.emitEvent({
        type: 'status_changed',
        botId: targetBotId,
        timestamp: new Date().toISOString(),
        data: { status: 'RESUME' },
      });
    }

    return response;
  }

  /**
   * Get current bot status
   * @returns Current bot status or null if no bot loaded
   */
  getStatus(): BotStatus | null {
    return this.currentBot?.status || null;
  }

  /**
   * Get current bot configuration
   * @returns Current bot configuration or null if no bot loaded
   */
  getCurrentBot(): BotConfiguration | null {
    return this.currentBot || null;
  }

  /**
   * Get bot performance metrics
   * @param botId Bot ID (optional, uses current bot if not provided)
   * @returns Promise with performance data
   */
  async getPerformance(botId?: string): Promise<ApiResponse<RealtimePerformance>> {
    const targetBotId = botId || this.currentBot?.botId;
    if (!targetBotId) {
      return { success: false, error: 'No bot ID provided' };
    }

    return this.makeRequest<RealtimePerformance>(`/bots/${targetBotId}/performance`);
  }

  /**
   * Get bot statistics
   * @param botId Bot ID (optional, uses current bot if not provided)
   * @returns Promise with statistics data
   */
  async getStatistics(botId?: string): Promise<ApiResponse<Statistics>> {
    const targetBotId = botId || this.currentBot?.botId;
    if (!targetBotId) {
      return { success: false, error: 'No bot ID provided' };
    }

    return this.makeRequest<Statistics>(`/bots/${targetBotId}/statistics`);
  }

  /**
   * Start real-time performance updates
   * @param interval Update interval in milliseconds (default: 5000)
   */
  private startPerformanceUpdates(interval: number = 5000): void {
    this.stopPerformanceUpdates(); // Clear any existing interval

    this.performanceUpdateInterval = setInterval(async () => {
      if (this.currentBot) {
        try {
          const performanceResponse = await this.getPerformance(this.currentBot.botId);
          if (performanceResponse.success && performanceResponse.data) {
            this.currentBot.realtimePerformance = performanceResponse.data;
            this.emitEvent({
              type: 'performance_updated',
              botId: this.currentBot.botId,
              timestamp: new Date().toISOString(),
              data: performanceResponse.data,
            });
          }
        } catch (error) {
          console.error('Error updating performance:', error);
          this.emitEvent({
            type: 'error_occurred',
            botId: this.currentBot.botId,
            timestamp: new Date().toISOString(),
            data: { error: error instanceof Error ? error.message : 'Performance update error' },
          });
        }
      }
    }, interval);
  }

  /**
   * Stop real-time performance updates
   */
  private stopPerformanceUpdates(): void {
    if (this.performanceUpdateInterval) {
      clearInterval(this.performanceUpdateInterval);
      this.performanceUpdateInterval = undefined;
    }
  }

  /**
   * Validate bot configuration
   * @param config Bot configuration to validate
   * @returns Validation result with errors if any
   */
  validateConfiguration(config: Partial<BotConfiguration>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!config.botName || config.botName.trim().length === 0) {
      errors.push('Bot name is required');
    }

    if (!config.strategyId) {
      errors.push('Strategy ID is required');
    }

    if (!config.contract) {
      errors.push('Contract configuration is required');
    } else {
      // Validate contract
      if (!config.contract.market) {
        errors.push('Market selection is required');
      }
      if (!config.contract.tradeType) {
        errors.push('Trade type is required');
      }
      if (!config.contract.contractType) {
        errors.push('Contract type is required');
      }
    }

    // Validate amounts
    if (config.amounts) {
      if (!config.amounts.base_stake) {
        errors.push('Base stake is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Map form data to bot configuration
   * @param formData Form data from StrategyForm
   * @param additionalData Additional bot metadata
   * @returns Mapped bot configuration
   */
  mapFormDataToBotConfig(formData: any, additionalData: {
    botName: string;
    botDescription: string;
    botTags: string[];
    createdBy: string;
    botCurrency?: string;
  }): BotConfiguration {
    const now = new Date().toISOString();
    
    return {
      strategyId: formData.strategyId,
      contract: formData.contract,
      status: 'IDLE',
      botId: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      botName: additionalData.botName,
      botDescription: additionalData.botDescription,
      botIcon: '',
      botThumbnail: '',
      botBanner: '',
      botTags: additionalData.botTags,
      botCurrency: additionalData.botCurrency || 'USD',
      isActive: false,
      isPremium: false,
      isPublic: false,
      createdBy: additionalData.createdBy,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: {
        current: '1.0.0',
        notes: 'Initial version',
        date: now,
      },
      amounts: formData.amounts || {
        base_stake: null,
        maximum_stake: null,
        take_profit: null,
        stop_loss: null,
      },
      recovery_steps: formData.recovery_steps || {
        risk_steps: [],
      },
      advanced_settings: formData.advanced_settings || this.getDefaultAdvancedSettings(),
      realtimePerformance: this.getDefaultRealtimePerformance(),
      statistics: this.getDefaultStatistics(),
    };
  }

  /**
   * Get default advanced settings structure
   * @returns Default advanced settings
   */
  private getDefaultAdvancedSettings(): BotConfiguration['advanced_settings'] {
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
          endDate: null,
          startTime: null,
          endTime: null,
          daysOfWeek: [],
          dayOfMonth: null,
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

  /**
   * Get default real-time performance metrics
   * @returns Default performance metrics
   */
  private getDefaultRealtimePerformance(): RealtimePerformance {
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

  /**
   * Get default statistics
   * @returns Default statistics
   */
  private getDefaultStatistics(): Statistics {
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

  /**
   * Cleanup resources when bot manager is no longer needed
   */
  cleanup(): void {
    this.stopPerformanceUpdates();
    this.eventListeners.clear();
    this.currentBot = undefined;
  }
}

export default BotManager;
