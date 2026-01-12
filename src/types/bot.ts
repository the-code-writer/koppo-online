/**
 * @file: types/bot.ts
 * @description: Type definitions for bot configuration and management
 */

// Risk Step configuration
export interface RiskStep {
  id: string;
  marketType: string;
  contractType: string;
  prediction: string;
  predictionRandomize: boolean;
  market: string;
  marketRandomize: boolean;
  multiplier: number;
  delay: number;
}

// Bot Schedule configuration
export interface BotSchedule {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'once';
  startDate: string;
  startTime: string;
  isEnabled: boolean;
  exclusions: string[];
  endDate?: string;
}

// Amount configuration with type
export interface AmountConfig {
  type: 'fixed' | 'percentage';
  value: number;
}

// Bot General settings
export interface BotGeneral {
  botName: string;
  tradeType: string;
  market: string;
}

// Bot Basic settings
export interface BotBasicSettings {
  number_of_trades: number;
  maximum_stake: number;
  compound_stake: boolean;
}

// Bot Amount settings
export interface BotAmounts {
  amount: AmountConfig;
  profit_threshold: AmountConfig;
  loss_threshold: AmountConfig;
}

// Bot Recovery settings
export interface BotRecovery {
  risk_steps: RiskStep[];
}

// Bot Schedules
export interface BotSchedules {
  bot_schedules: BotSchedule[];
}

// Bot Execution settings
export interface BotExecution {
  recovery_type: 'on' | 'off';
  cooldown_period: string;
  stop_on_loss_streak: boolean;
  auto_restart: boolean;
}

// Complete Bot Configuration
export interface BotConfiguration {
  general: BotGeneral;
  basicSettings: BotBasicSettings;
  amounts: BotAmounts;
  recovery: BotRecovery;
  schedules: BotSchedules;
  execution: BotExecution;
}

// Bot instance with metadata
export interface BotInstance {
  _id: string;
  userId: string;
  configuration: BotConfiguration;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'error';
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  totalProfit: number;
  totalLoss: number;
  totalTrades: number;
  runningTime: number; // in seconds
}

// API Response types
export interface CreateBotResponse {
  success: boolean;
  bot?: BotInstance;
  message?: string;
  error?: string;
}

export interface UpdateBotResponse {
  success: boolean;
  bot?: BotInstance;
  message?: string;
  error?: string;
}

export interface DeleteBotResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface GetBotsResponse {
  success: boolean;
  bots?: BotInstance[];
  message?: string;
  error?: string;
}

export interface GetBotResponse {
  success: boolean;
  bot?: BotInstance;
  message?: string;
  error?: string;
}

export interface StartBotResponse {
  success: boolean;
  sessionId?: string;
  message?: string;
  error?: string;
}

export interface StopBotResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Bot statistics
export interface BotStats {
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  totalTrades: number;
  winRate: number;
  runningTime: number;
}

// Default bot configuration
export const defaultBotConfiguration: BotConfiguration = {
  general: {
    botName: '',
    tradeType: 'Rise',
    market: 'Volatility 100 (1s) Index'
  },
  basicSettings: {
    number_of_trades: 10,
    maximum_stake: 1000,
    compound_stake: false
  },
  amounts: {
    amount: { type: 'fixed', value: 10 },
    profit_threshold: { type: 'fixed', value: 100 },
    loss_threshold: { type: 'fixed', value: 50 }
  },
  recovery: {
    risk_steps: []
  },
  schedules: {
    bot_schedules: []
  },
  execution: {
    recovery_type: 'off',
    cooldown_period: '0',
    stop_on_loss_streak: false,
    auto_restart: false
  }
};
