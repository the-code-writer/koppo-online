// =============================================
// ENUMS
// =============================================

export enum BotStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR'
}

export enum TradeType {
  RISE = 'Rise',
  FALL = 'Fall'
}

export enum AmountType {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  DYNAMIC = 'dynamic'
}

export enum MarketType {
  VOLATILITY_75_1S = 'Volatility 75 (1s) Index',
  VOLATILITY_100_1S = 'Volatility 100 (1s) Index',
  FOREX = 'Forex',
  CRYPTO = 'Cryptocurrency'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum RecoveryType {
  OFF = 'off',
  MARTINGALE = 'martingale',
  D_ALEMBERT = 'd_alembert',
  FIBONACCI = 'fibonacci'
}

// =============================================
// INTERFACES
// =============================================

export interface AmountConfig {
  type: AmountType;
  value: number;
  maxValue?: number;
  minValue?: number;
}

export interface Strategy {
  name: string;
  id: string;
  parameters?: Record<string, any>;
  version?: string;
}

export interface RiskStep {
  step: number;
  multiplier: number;
  maxStake?: number;
  condition?: 'after_loss' | 'after_win' | 'always';
}

export interface BotSchedule {
  id: string;
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  timezone: string;
}

export interface GeneralConfig {
  botName: string;
  botDescription: string;
  tradeType: TradeType;
  market: MarketType;
  version?: string;
  tags?: string[];
}

export interface BasicSettings {
  number_of_trades: number;
  maximum_stake: number;
  compound_stake: boolean;
  minStake?: number;
  maxStake?: number;
}

export interface ExecutionConfig {
  recovery_type: RecoveryType;
  maxConcurrentTrades: number;
  riskLevel: RiskLevel;
  cooldown_period: string; // in seconds or '0' for none
  stop_on_loss_streak: boolean;
  max_loss_streak?: number;
  auto_restart: boolean;
  maxDrawdown: number;
  tradeDelay?: number; // milliseconds between trades
  allowPartialClosure?: boolean;
}

export interface RecoveryConfig {
  risk_steps: RiskStep[];
  maxRecoverySteps?: number;
  resetAfterWin?: boolean;
  initialStep?: number;
}

export interface SchedulesConfig {
  bot_schedules: BotSchedule[];
  enableMarketHours?: boolean;
  marketOpenTime?: string;
  marketCloseTime?: string;
}

export interface AmountsConfig {
  amount: AmountConfig;
  profit_threshold: AmountConfig;
  loss_threshold: AmountConfig;
  maxDailyProfit?: AmountConfig;
  maxDailyLoss?: AmountConfig;
}

export interface BotConfiguration {
  general: GeneralConfig;
  basicSettings: BasicSettings;
  amounts: AmountsConfig;
  strategy: Strategy;
  recovery: RecoveryConfig;
  schedules: SchedulesConfig;
  execution: ExecutionConfig;
}

export interface PerformanceMetrics {
  currentProfit: number;
  dailyProfit: number;
  weeklyProfit: number;
  monthlyProfit: number;
  allTimeHigh: number;
  allTimeLow: number;
  winRate?: number;
  profitFactor?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
}

export interface SessionData {
  sessionId: string;
  startedAt: Date;
  endedAt?: Date;
  netProfit: number;
  baseStake: number;
  totalStake: number;
  totalPayout: number;
  numberOfWins: number;
  numberOfLosses: number;
  numberOfRuns: number;
  duration?: number; // in seconds
  averageTradeDuration?: number; // in milliseconds
  currentStreak?: {
    type: 'win' | 'loss';
    count: number;
  };
}

export interface TradeStats {
  totalProfit: number;
  totalLoss: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  averageProfit: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
}

export interface TimingMetrics {
  runningTime: number; // in seconds
  lastRunAt: Date;
  averageRunTime?: number; // in seconds
  uptimePercentage?: number;
}

// =============================================
// MAIN BOT INTERFACE
// =============================================

export interface TradingBot {
  _id: string;
  userId: string;
  configuration: BotConfiguration;
  performance: PerformanceMetrics;
  session: SessionData;
  stats: TradeStats;
  timing: TimingMetrics;
  isActive: boolean;
  status: BotStatus;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  metadata?: {
    tags?: string[];
    notes?: string;
    category?: string;
    riskScore?: number;
  };
}

// =============================================
// HELPER FUNCTIONS
// =============================================

export function calculateWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  return total > 0 ? (wins / total) * 100 : 0;
}

export function calculateProfitFactor(totalProfit: number, totalLoss: number): number {
  return totalLoss !== 0 ? Math.abs(totalProfit / totalLoss) : Infinity;
}

export function createDefaultStrategy(): Strategy {
  return {
    name: "Default Strategy",
    id: "default_strategy_001",
    parameters: {},
    version: "1.0.0"
  };
}

export function createDefaultRiskSteps(): RiskStep[] {
  return [
    { step: 1, multiplier: 1.0, condition: 'after_loss' },
    { step: 2, multiplier: 2.0, condition: 'after_loss' },
    { step: 3, multiplier: 3.0, condition: 'after_loss', maxStake: 1000 }
  ];
}

// =============================================
// BOT CREATION FUNCTION
// =============================================

export function createTradingBot(
  userId: string,
  botId: string,
  config: Partial<BotConfiguration> = {}
): TradingBot {
  const now = new Date();
  
  // Default configuration
  const defaultConfig: BotConfiguration = {
    general: {
      botName: 'Beta Scalper',
      botDescription: "Advanced bot for trading volatility indices with high precision",
      tradeType: TradeType.FALL,
      market: MarketType.VOLATILITY_75_1S,
      version: '1.0.0'
    },
    basicSettings: {
      number_of_trades: 30,
      maximum_stake: 500,
      compound_stake: false,
      minStake: 1,
      maxStake: 1000
    },
    amounts: {
      amount: { type: AmountType.FIXED, value: 5 },
      profit_threshold: { type: AmountType.FIXED, value: 50 },
      loss_threshold: { type: AmountType.FIXED, value: 25 },
      maxDailyProfit: { type: AmountType.FIXED, value: 200, maxValue: 1000 },
      maxDailyLoss: { type: AmountType.FIXED, value: 100, maxValue: 500 }
    },
    strategy: createDefaultStrategy(),
    recovery: {
      risk_steps: createDefaultRiskSteps(),
      maxRecoverySteps: 5,
      resetAfterWin: true,
      initialStep: 1
    },
    schedules: {
      bot_schedules: [],
      enableMarketHours: false
    },
    execution: {
      recovery_type: RecoveryType.OFF,
      maxConcurrentTrades: 3,
      riskLevel: RiskLevel.MEDIUM,
      cooldown_period: '0',
      stop_on_loss_streak: false,
      max_loss_streak: 5,
      auto_restart: false,
      maxDrawdown: 150.00,
      tradeDelay: 1000,
      allowPartialClosure: true
    }
  };

  // Merge with provided config
  const mergedConfig: BotConfiguration = {
    ...defaultConfig,
    ...config,
    general: { ...defaultConfig.general, ...config.general },
    basicSettings: { ...defaultConfig.basicSettings, ...config.basicSettings },
    amounts: { ...defaultConfig.amounts, ...config.amounts },
    strategy: { ...defaultConfig.strategy, ...config.strategy },
    recovery: { ...defaultConfig.recovery, ...config.recovery },
    schedules: { ...defaultConfig.schedules, ...config.schedules },
    execution: { ...defaultConfig.execution, ...config.execution }
  };

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const bot: TradingBot = {
    _id: botId,
    userId,
    configuration: mergedConfig,
    performance: {
      currentProfit: 0,
      dailyProfit: 0,
      weeklyProfit: 0,
      monthlyProfit: 0,
      allTimeHigh: 0,
      allTimeLow: 0,
      winRate: 0,
      profitFactor: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    },
    session: {
      sessionId,
      startedAt: now,
      netProfit: 0,
      baseStake: mergedConfig.amounts.amount.value,
      totalStake: 0,
      totalPayout: 0,
      numberOfWins: 0,
      numberOfLosses: 0,
      numberOfRuns: 0,
      duration: 0,
      averageTradeDuration: 0
    },
    stats: {
      totalProfit: 0,
      totalLoss: 0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      averageProfit: 0,
      averageLoss: 0,
      bestTrade: 0,
      worstTrade: 0
    },
    timing: {
      runningTime: 0,
      lastRunAt: now,
      averageRunTime: 0,
      uptimePercentage: 100
    },
    isActive: true,
    status: BotStatus.PAUSED,
    createdAt: now,
    updatedAt: now,
    version: '1.0.0',
    metadata: {
      tags: ['volatility', 'scalper'],
      notes: '',
      category: 'high-frequency',
      riskScore: 65
    }
  };

  return bot;
}

// =============================================
// EXAMPLE USAGE
// =============================================

// Create a bot instance
const tradingBot: TradingBot = createTradingBot('user1', '2', {
  configuration: {
    general: {
      botName: 'Beta Scalper Pro',
      botDescription: "Advanced bot for trading volatility indices with high precision",
      tradeType: TradeType.FALL,
      market: MarketType.VOLATILITY_75_1S
    },
    basicSettings: {
      number_of_trades: 30,
      maximum_stake: 500,
      compound_stake: false
    },
    amounts: {
      amount: { type: AmountType.FIXED, value: 5 },
      profit_threshold: { type: AmountType.FIXED, value: 50 },
      loss_threshold: { type: AmountType.FIXED, value: 25 }
    },
    strategy: {
      name: "fsdfsfwefw",
      id: "fsdfvsvdsdvd"
    },
    recovery: { risk_steps: [] },
    schedules: { bot_schedules: [] },
    execution: {
      recovery_type: RecoveryType.OFF,
      maxConcurrentTrades: 3,
      riskLevel: RiskLevel.MEDIUM,
      cooldown_period: '0',
      stop_on_loss_streak: false,
      auto_restart: false,
      maxDrawdown: 150.00
    }
  }
});

// Update with your specific data
tradingBot.performance = {
  currentProfit: 85.20,
  dailyProfit: 85.20,
  weeklyProfit: 425.00,
  monthlyProfit: 1250.50,
  allTimeHigh: 1450.00,
  allTimeLow: -200.00,
  winRate: calculateWinRate(45, 12),
  profitFactor: calculateProfitFactor(450.75, 180.50),
  sharpeRatio: 1.5,
  maxDrawdown: 200.00
};

tradingBot.session = {
  sessionId: "wdwfwdfwe",
  startedAt: new Date('2024-01-09T15:30:00Z'),
  netProfit: 1250.50,
  baseStake: 25.00,
  totalStake: 25.00,
  totalPayout: 25.00,
  numberOfWins: 45,
  numberOfLosses: 12,
  numberOfRuns: 54,
  duration: 1800,
  averageTradeDuration: 3333 // ~3.3 seconds per trade
};

tradingBot.stats = {
  totalProfit: 450.75,
  totalLoss: 180.50,
  totalTrades: 28,
  winRate: calculateWinRate(45, 12),
  profitFactor: calculateProfitFactor(450.75, 180.50),
  averageProfit: 450.75 / 28,
  averageLoss: 180.50 / 28,
  bestTrade: 85.20,
  worstTrade: -25.00
};

tradingBot.timing = {
  runningTime: 1800,
  lastRunAt: new Date('2024-01-09T15:30:00Z'),
  averageRunTime: 900,
  uptimePercentage: 95.5
};

tradingBot.status = BotStatus.PAUSED;
tradingBot.createdAt = new Date('2024-01-09T15:30:00Z');
tradingBot.updatedAt = new Date('2024-01-09T15:30:00Z');

// Type-safe function to update bot performance
export function updateBotPerformance(
  bot: TradingBot,
  update: Partial<PerformanceMetrics>
): TradingBot {
  return {
    ...bot,
    performance: { ...bot.performance, ...update },
    updatedAt: new Date()
  };
}

// Type-safe function to record a trade
export interface TradeResult {
  profit: number;
  stake: number;
  duration: number;
  timestamp: Date;
}

export function recordTrade(
  bot: TradingBot,
  trade: TradeResult
): TradingBot {
  const isWin = trade.profit > 0;
  const updatedSession: SessionData = {
    ...bot.session,
    netProfit: bot.session.netProfit + trade.profit,
    totalStake: bot.session.totalStake + trade.stake,
    totalPayout: bot.session.totalPayout + trade.stake + trade.profit,
    numberOfWins: isWin ? bot.session.numberOfWins + 1 : bot.session.numberOfWins,
    numberOfLosses: !isWin ? bot.session.numberOfLosses + 1 : bot.session.numberOfLosses,
    numberOfRuns: bot.session.numberOfRuns + 1,
    currentStreak: {
      type: isWin ? 'win' : 'loss',
      count: (bot.session.currentStreak?.type === (isWin ? 'win' : 'loss') 
        ? (bot.session.currentStreak?.count || 0) + 1 
        : 1)
    }
  };

  const updatedStats: TradeStats = {
    ...bot.stats,
    totalProfit: isWin ? bot.stats.totalProfit + trade.profit : bot.stats.totalProfit,
    totalLoss: !isWin ? bot.stats.totalLoss + Math.abs(trade.profit) : bot.stats.totalLoss,
    totalTrades: bot.stats.totalTrades + 1,
    winRate: calculateWinRate(updatedSession.numberOfWins, updatedSession.numberOfLosses),
    profitFactor: calculateProfitFactor(
      isWin ? bot.stats.totalProfit + trade.profit : bot.stats.totalProfit,
      !isWin ? bot.stats.totalLoss + Math.abs(trade.profit) : bot.stats.totalLoss
    ),
    bestTrade: Math.max(bot.stats.bestTrade, trade.profit),
    worstTrade: Math.min(bot.stats.worstTrade, trade.profit)
  };

  return {
    ...bot,
    session: updatedSession,
    stats: updatedStats,
    performance: {
      ...bot.performance,
      currentProfit: bot.performance.currentProfit + trade.profit,
      winRate: updatedStats.winRate,
      profitFactor: updatedStats.profitFactor
    },
    timing: {
      ...bot.timing,
      lastRunAt: trade.timestamp
    },
    updatedAt: new Date()
  };
}