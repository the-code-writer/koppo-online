export enum BotStatus {
  START = 'START',
  STOP = 'STOP',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME'
}

export interface Amount {
  type: 'fixed' | 'percentage';
  value: number;
}

export interface Market {
  symbol: string;
  displayName: string;
  shortName: string;
  market_name: string;
  type: string;
}

export interface ContractData {
  id: string;
  tradeType: string;
  contractType: string;
  prediction: string;
  predictionRandomize: boolean;
  market: Market;
  marketRandomize: boolean;
  multiplier: number;
  delay: number;
  duration: number;
  durationUnits: string;
  allowEquals: boolean;
  alternateAfter: number;
}

export interface Schedule {
  id: string;
  name: string;
  type: string;
  startDate: string;
  startTime: string;
  isEnabled: boolean;
  exclusions: any[];
  endDate: string;
  endTime: string;
}

export interface QuietHours {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

export interface BotData {
  strategyId: string;
  contract: ContractData;
  amounts: {
    base_stake: Amount;
    maximum_stake: Amount;
    take_profit: Amount;
    stop_loss: Amount;
  };
  'recovery-steps': {
    risk_steps: ContractData[];
  };
  'advanced-settings': {
    general_settings_section: {
      bot_schedules: Schedule[];
      maximum_stake: Amount;
      compound_stake: boolean;
      stop_on_loss_streak: boolean;
      auto_restart: boolean;
    };
    telegram_notifications_section: {
      enable_telegram_notifications: boolean;
      notification_frequency: string;
      notification_timing: string[];
      trade_notifications: {
        trade_executed: boolean;
        trade_completed: boolean;
        trade_profit: boolean;
        trade_loss: boolean;
      };
      performance_notifications: {
        daily_summary: boolean;
        weekly_summary: boolean;
        milestone_reached: boolean;
        drawdown_alert: boolean;
      };
      system_notifications: {
        bot_started: boolean;
        bot_stopped: boolean;
        bot_error: boolean;
        cooldown_triggered: boolean;
      };
      custom_message_threshold: number;
      quiet_hours: QuietHours;
    };
    advanced_bot_interaction: {
      bot_commands: {
        enable_commands: boolean;
        command_prefix: string;
        allowed_commands: string[];
      };
      interactive_notifications: {
        enable_quick_actions: boolean;
        quick_actions: string[];
        confirmation_required: boolean;
      };
      voice_commands: {
        enable_voice: boolean;
        voice_language: string;
        voice_sensitivity: number;
      };
      message_formatting: {
        use_emoji: boolean;
        message_style: string;
        include_charts: boolean;
        chart_type: string;
      };
      security_settings: {
        require_authentication: boolean;
        allowed_users: string;
        admin_users: string;
        rate_limiting: boolean;
        max_commands_per_minute: number;
      };
      analytics_and_reporting: {
        enable_analytics: boolean;
        report_frequency: string;
        include_predictions: boolean;
        sentiment_analysis: boolean;
        risk_metrics: boolean;
      };
      automation_features: {
        auto_restart_on_error: boolean;
        auto_adjust_risk: boolean;
        auto_optimize_parameters: boolean;
        machine_learning: boolean;
        learning_rate: number;
      };
    };
    risk_management_section: Record<string, any>;
    profit_targets_section: Record<string, any>;
    market_filters_section: {
      economic_calendar_filter: boolean;
      geopolitical_risk_filter: boolean;
      [key: string]: any;
    };
    technical_indicators_section: Record<string, any>;
    advanced_analysis_section: {
      price_action_confirmation: boolean;
      multi_timeframe_analysis: boolean;
      pattern_recognition: boolean;
      support_resistance_levels: boolean;
      fibonacci_retracement: boolean;
      order_book_analysis: boolean;
      market_microstructure: boolean;
      regime_detection: boolean;
      seasonal_adjustments: boolean;
    };
    execution_control_section: {
      liquidity_hunting_protection: boolean;
      [key: string]: any;
    };
    position_sizing_section: {
      adaptive_sizing: boolean;
      quantile_based_sizing: boolean;
      kelly_criterion_sizing: boolean;
      volatility_normalized_sizing: boolean;
    };
    ai_machine_learning_section: {
      machine_learning_signals: boolean;
      reinforcement_learning: boolean;
      neural_network_signals: boolean;
      ensemble_predictions: boolean;
      regime_switching_model: boolean;
    };
    market_intelligence_section: {
      social_sentiment_integration: boolean;
      whale_activity_monitoring: boolean;
      dark_pool_analysis: boolean;
      cross_market_correlation: boolean;
    };
    advanced_strategies_section: {
      dynamic_hedging: boolean;
      arbitrage_detection: boolean;
      strategy_rotation: boolean;
      auto_parameter_tuning: boolean;
    };
    optimization_section: {
      gas_fee_optimization: boolean;
      tax_optimization: boolean;
      quantum_computing_optimization: boolean;
    };
    monitoring_control_section: {
      time_restriction: boolean;
      performance_monitoring: boolean;
      backtesting_mode: boolean;
      performance_degradation_detection: boolean;
      emergency_stop: boolean;
    };
  };
}

export interface Bot extends BotData {
  id: string;
  name: string;
  status: BotStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class BotManager {
  private static instance: BotManager;
  private bots: Map<string, Bot> = new Map();
  private storageKey = 'koppo_bots';

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): BotManager {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager();
    }
    return BotManager.instance;
  }

  // CREATE
  public createBot(botData: BotData, name?: string): Bot {
    const id = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const bot: Bot = {
      ...botData,
      id,
      name: name || `Bot ${this.bots.size + 1}`,
      status: BotStatus.STOP,
      createdAt: now,
      updatedAt: now
    };

    this.bots.set(id, bot);
    this.saveToStorage();
    
    console.log(`[BotManager] Created bot: ${bot.name} (${id})`);
    return bot;
  }

  // READ
  public getBot(id: string): Bot | undefined {
    return this.bots.get(id);
  }

  public getAllBots(): Bot[] {
    return Array.from(this.bots.values());
  }

  public getBotsByStatus(status: BotStatus): Bot[] {
    return this.getAllBots().filter(bot => bot.status === status);
  }

  public getBotsByStrategy(strategyId: string): Bot[] {
    return this.getAllBots().filter(bot => bot.strategyId === strategyId);
  }

  // UPDATE
  public updateBot(id: string, updates: Partial<BotData>): Bot | null {
    const bot = this.bots.get(id);
    if (!bot) {
      console.error(`[BotManager] Bot with id ${id} not found`);
      return null;
    }

    const updatedBot: Bot = {
      ...bot,
      ...updates,
      updatedAt: new Date()
    };

    this.bots.set(id, updatedBot);
    this.saveToStorage();
    
    console.log(`[BotManager] Updated bot: ${updatedBot.name} (${id})`);
    return updatedBot;
  }

  public updateBotStatus(id: string, status: BotStatus): Bot | null {
    return this.updateBot(id, {}); // Update timestamp and trigger save
  }

  public setBotStatus(id: string, status: BotStatus): Bot | null {
    const bot = this.bots.get(id);
    if (!bot) {
      console.error(`[BotManager] Bot with id ${id} not found`);
      return null;
    }

    const updatedBot: Bot = {
      ...bot,
      status,
      updatedAt: new Date()
    };

    this.bots.set(id, updatedBot);
    this.saveToStorage();
    
    console.log(`[BotManager] Bot ${updatedBot.name} status changed to: ${status}`);
    return updatedBot;
  }

  // DELETE
  public deleteBot(id: string): boolean {
    const bot = this.bots.get(id);
    if (!bot) {
      console.error(`[BotManager] Bot with id ${id} not found`);
      return false;
    }

    this.bots.delete(id);
    this.saveToStorage();
    
    console.log(`[BotManager] Deleted bot: ${bot.name} (${id})`);
    return true;
  }

  // UTILITY METHODS
  public startBot(id: string): Bot | null {
    return this.setBotStatus(id, BotStatus.START);
  }

  public stopBot(id: string): Bot | null {
    return this.setBotStatus(id, BotStatus.STOP);
  }

  public pauseBot(id: string): Bot | null {
    return this.setBotStatus(id, BotStatus.PAUSE);
  }

  public resumeBot(id: string): Bot | null {
    return this.setBotStatus(id, BotStatus.RESUME);
  }

  public duplicateBot(id: string, newName?: string): Bot | null {
    const originalBot = this.getBot(id);
    if (!originalBot) {
      console.error(`[BotManager] Bot with id ${id} not found for duplication`);
      return null;
    }

    // Create a copy without id, name, status, createdAt, updatedAt
    const { id: _, name: __, status: ___, createdAt: ____, updatedAt: _____, ...botData } = originalBot;
    
    return this.createBot(botData, newName || `${originalBot.name} (Copy)`);
  }

  // STORAGE METHODS
  private saveToStorage(): void {
    try {
      const botsArray = Array.from(this.bots.entries());
      const serializedData = JSON.stringify(botsArray);
      localStorage.setItem(this.storageKey, serializedData);
      console.log(`[BotManager] Saved ${this.bots.size} bots to storage`);
    } catch (error) {
      console.error('[BotManager] Failed to save to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        const botsArray = JSON.parse(storedData);
        this.bots = new Map(botsArray.map(([id, bot]: [string, any]) => [
          id,
          {
            ...bot,
            createdAt: new Date(bot.createdAt),
            updatedAt: new Date(bot.updatedAt)
          }
        ]));
        console.log(`[BotManager] Loaded ${this.bots.size} bots from storage`);
      }
    } catch (error) {
      console.error('[BotManager] Failed to load from storage:', error);
      this.bots = new Map();
    }
  }

  public clearStorage(): void {
    try {
      localStorage.removeItem(this.storageKey);
      this.bots.clear();
      console.log('[BotManager] Cleared all bots from storage');
    } catch (error) {
      console.error('[BotManager] Failed to clear storage:', error);
    }
  }

  // EXPORT/IMPORT
  public exportBot(id: string): string | null {
    const bot = this.getBot(id);
    if (!bot) return null;
    
    try {
      return JSON.stringify(bot, null, 2);
    } catch (error) {
      console.error('[BotManager] Failed to export bot:', error);
      return null;
    }
  }

  public importBot(botJson: string): Bot | null {
    try {
      const botData = JSON.parse(botJson);
      
      // Validate basic structure
      if (!botData.strategyId || !botData.contract) {
        throw new Error('Invalid bot data structure');
      }

      // Remove id, name, status, createdAt, updatedAt if present
      const { id: _, name: __, status: ___, createdAt: ____, updatedAt: _____, ...cleanBotData } = botData;
      
      return this.createBot(cleanBotData);
    } catch (error) {
      console.error('[BotManager] Failed to import bot:', error);
      return null;
    }
  }
}
