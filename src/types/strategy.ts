import { FormConfig, FieldType, PrefixType } from './form';
import { MarketInfo } from './market';

export const filterButtons = [
  { key: "all", label: "All Strategies" },
  { key: "long-calls", label: "Long Calls" },
  { key: "short-puts", label: "Short Puts" },
  { key: "iron-condors", label: "Iron Condors" },
  { key: "covered-calls", label: "Covered Calls" },
  { key: "bull-spreads", label: "Bull Spreads" },
] as const;

export type FilterKey = typeof filterButtons[number]['key'];

export interface StrategyFiltersProps {
  selectedFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
}

export interface Strategy {
  id: string;
  title: string;
  description: string;
  risk?: "low" | "medium" | "high";
  profit?: "limited" | "unlimited";
  category?: FilterKey;
  isAvailable?: boolean;
  name?: string;
  tags?: string[];
  market?: string;
  status?: 'running' | 'paused' | 'stopped';
  createdAt?: string;
  updatedAt?: string;
  lastRunAt?: string;
  totalProfit?: number;
  totalLoss?: number;
  totalTrades?: number;
  runningTime?: number;
}

export interface StrategyInstance {
  _id: string;
  name: string;
  description: string;
  tags: string[];
  market: string;
  status: 'running' | 'paused' | 'stopped';
  createdAt: string;
  updatedAt: string;
  lastRunAt: string;
  totalProfit: number;
  totalLoss: number;
  totalTrades: number;
  runningTime: number;
}

export interface StrategyDrawerProps {
  strategy: Strategy | null;
  onClose: () => void;
  isOpen: boolean;
  editBot?: any;
}
export interface ContractData {
  id: string;
  tradeType: string;
  contractType: string;
  prediction: string;
  predictionRandomize: boolean;
  market: MarketInfo | string;
  marketRandomize: boolean;
  multiplier: number;
  delay: number;
  duration: number;
  durationUnits: string;
  allowEquals?: boolean;
  alternateAfter?: number;
}

export interface ContractParamsProps {
  defaultValues: ContractData,
  currentValue?: ContractData,  // Add current value from form
  updateStep: (stepId: string, field: keyof ContractData, fieldValue: any) => void;
  onContractParamsChange: (contractParams: ContractData)=>void;
}

// Static symbol field that's common to all strategies
export const SYMBOL_FIELD = {
  name: 'symbol',
  label: 'Symbol',
  type: 'select' as FieldType,
  options: [
    { value: "R_100", label: "Volatility 100 (1s) Index" },
    { value: "R_75", label: "Volatility 75 (1s) Index" },
    { value: "R_50", label: "Volatility 50 (1s) Index" },
    { value: "R_25", label: "Volatility 25 (1s) Index" }
  ]
};

// Common fields for all strategies
const COMMON_FIELDS = [
  {
    name: 'amount',
    label: 'Amount',
    type: 'number-prefix' as FieldType,
    prefixType: 'currency' as PrefixType
  },
  {
    name: 'growth_rate',
    label: 'Growth Rate',
    type: 'number-prefix' as FieldType,
    prefixType: 'percentage' as PrefixType
  }
];

// Define input parameters for each strategy
export const STRATEGY_PARAMS: Record<string, FormConfig> = {
  '1': {
    tabs: [
      {
        key: 'contract',
        label: 'Contract',
        fields: [
          {
            name: 'contract',
            label: 'Contract Parameters',
            type: 'contract-params' as FieldType
          }
        ]
      },
      {
        key: 'amounts',
        label: 'Amounts',
        fields: [
          {
            name: 'base_stake',
            label: 'Base Stake',
            type: 'threshold-selector' as FieldType,
            placeholder: 'Enter base stake amount'
          },
          {
            name: 'maximum_stake',
            label: 'Maximum Stake',
            type: 'threshold-selector' as FieldType,
            placeholder: 'Enter maximum stake amount'
          },
          {
            name: 'take_profit',
            label: 'Take Profit',
            type: 'threshold-selector' as FieldType,
            placeholder: 'Enter take profit target'
          },
          {
            name: 'stop_loss',
            label: 'Stop Loss',
            type: 'threshold-selector' as FieldType,
            placeholder: 'Enter stop loss amount'
          }
        ]
      },
      {
        key: 'recovery-steps',
        label: 'Recovery Steps',
        fields: [
          {
            name: 'risk_steps',
            label: 'Recovery Steps',
            type: 'risk-management' as FieldType
          }
        ]
      },
      {
        key: 'advanced-settings',
        label: 'Advanced',
        fields: [
          {
            name: 'general_settings_section',
            label: 'General Settings',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'bot_schedules',
                label: 'Bot Schedules',
                type: 'schedules' as FieldType
              },
              {
                name: 'number_of_trades',
                label: 'Maximum Number of Trades',
                type: 'number' as FieldType
              },
              {
                name: 'maximum_stake',
                label: 'Withdraw Profit',
                type: 'number-prefix' as FieldType,
                prefixType: 'currency' as PrefixType
              },
              {
                name: 'recovery_type',
                label: 'Recovery Type',
                type: 'recovery-type' as FieldType
              },
              {
                name: 'cooldown_period',
                label: 'Cooldown Period',
                type: 'cooldown-period' as FieldType
              },
              {
                name: 'compound_stake',
                label: 'Compound stake',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'stop_on_loss_streak',
                label: 'Stop on loss streak',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'auto_restart',
                label: 'Auto restart after cooldown',
                type: 'switch-with-helper' as FieldType
              }
            ]
          },
          {
            name: 'telegram_notifications_section',
            label: 'Telegram Notifications',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'enable_telegram_notifications',
                label: 'Enable Telegram Notifications',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'notification_frequency',
                label: 'Notification Frequency',
                type: 'select' as FieldType,
                options: [
                  { value: 'immediate', label: 'Immediate - Get notifications instantly' },
                  { value: 'hourly', label: 'Hourly Digest - Receive hourly summaries' },
                  { value: 'daily', label: 'Daily Summary - Get daily reports' },
                  { value: 'weekly', label: 'Weekly Report - Receive weekly analytics' }
                ]
              },
              {
                name: 'notification_timing',
                label: 'Notification Timing',
                type: 'multi-select' as FieldType,
                options: [
                  { value: 'business_hours', label: 'Business Hours (9 AM - 5 PM)' },
                  { value: 'after_hours', label: 'After Hours (5 PM - 9 PM)' },
                  { value: 'weekend', label: 'Weekend Trading' },
                  { value: '24_7', label: '24/7 - All the time' }
                ]
              },
              {
                name: 'trade_notifications',
                label: 'Trade Notifications',
                type: 'nested-group' as FieldType,
                fields: [
                  {
                    name: 'trade_executed',
                    label: 'Trade Executed',
                    type: 'switch-with-helper' as FieldType
                  },
                  {
                    name: 'trade_completed',
                    label: 'Trade Completed',
                    type: 'switch-with-helper' as FieldType
                  },
                  {
                    name: 'trade_profit',
                    label: 'Profitable Trades Only',
                    type: 'switch-with-helper' as FieldType
                  },
                  {
                    name: 'trade_loss',
                    label: 'Loss Trades Only',
                    type: 'switch-with-helper' as FieldType
                  }
                ]
              },
              {
                name: 'performance_notifications',
                label: 'Performance Notifications',
                type: 'nested-group' as FieldType,
                fields: [
                  {
                    name: 'daily_summary',
                    label: 'Daily Summary',
                    type: 'switch-with-helper' as FieldType
                  },
                  {
                    name: 'weekly_summary',
                    label: 'Weekly Summary',
                    type: 'switch-with-helper' as FieldType
                  },
                  {
                    name: 'milestone_reached',
                    label: 'Milestones Reached',
                    type: 'switch-with-helper' as FieldType
                  },
                  {
                    name: 'drawdown_alert',
                    label: 'Drawdown Alerts',
                    type: 'switch-with-helper' as FieldType
                  }
                ]
              },
              {
                name: 'system_notifications',
                label: 'System Notifications',
                type: 'nested-group' as FieldType,
                fields: [
                  {
                    name: 'bot_started',
                    label: 'Bot Started',
                    type: 'switch-with-helper' as FieldType
                  },
                  {
                    name: 'bot_stopped',
                    label: 'Bot Stopped',
                    type: 'switch-with-helper' as FieldType
                  },
                  {
                    name: 'bot_error',
                    label: 'Bot Errors',
                    type: 'switch-with-helper' as FieldType
                  },
                  {
                    name: 'cooldown_triggered',
                    label: 'Cooldown Triggered',
                    type: 'switch-with-helper' as FieldType
                  }
                ]
              },
              {
                name: 'custom_message_threshold',
                label: 'Custom Message Threshold',
                type: 'number-prefix' as FieldType,
                prefixType: 'currency' as PrefixType
              },
              {
                name: 'quiet_hours',
                label: 'Quiet Hours',
                type: 'time-range' as FieldType,
                fields: [
                  {
                    name: 'quiet_hours_enabled',
                    label: 'Enable Quiet Hours',
                    type: 'switch-with-helper' as FieldType
                  },
                  {
                    name: 'quiet_hours_start',
                    label: 'Start Time',
                    type: 'time-picker' as FieldType
                  },
                  {
                    name: 'quiet_hours_end',
                    label: 'End Time',
                    type: 'time-picker' as FieldType
                  }
                ]
              },
              {
                name: 'advanced_bot_interaction',
                label: 'Advanced Bot Interaction',
                type: 'collapsible-section' as FieldType,
                fields: [
                  {
                    name: 'bot_commands',
                    label: 'Bot Commands',
                    type: 'nested-group' as FieldType,
                    fields: [
                      {
                        name: 'enable_commands',
                        label: 'Enable Interactive Commands',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'command_prefix',
                        label: 'Command Prefix',
                        type: 'text' as FieldType,
                        placeholder: 'e.g., / or !'
                      },
                      {
                        name: 'allowed_commands',
                        label: 'Allowed Commands',
                        type: 'multi-select' as FieldType,
                        options: [
                          { value: 'status', label: 'Status - Check bot status' },
                          { value: 'start', label: 'Start - Start the bot' },
                          { value: 'stop', label: 'Stop - Stop the bot' },
                          { value: 'pause', label: 'Pause - Pause trading' },
                          { value: 'resume', label: 'Resume - Resume trading' },
                          { value: 'balance', label: 'Balance - Check account balance' },
                          { value: 'positions', label: 'Positions - View open positions' },
                          { value: 'history', label: 'History - View trade history' },
                          { value: 'settings', label: 'Settings - Modify bot settings' },
                          { value: 'help', label: 'Help - Show available commands' }
                        ]
                      }
                    ]
                  },
                  {
                    name: 'interactive_notifications',
                    label: 'Interactive Notifications',
                    type: 'nested-group' as FieldType,
                    fields: [
                      {
                        name: 'enable_quick_actions',
                        label: 'Enable Quick Action Buttons',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'quick_actions',
                        label: 'Available Quick Actions',
                        type: 'multi-select' as FieldType,
                        options: [
                          { value: 'quick_stop', label: 'Quick Stop - Emergency stop' },
                          { value: 'quick_pause', label: 'Quick Pause - Temporary pause' },
                          { value: 'reduce_risk', label: 'Reduce Risk - Lower position sizes' },
                          { value: 'close_all', label: 'Close All - Close all positions' },
                          { value: 'take_profit', label: 'Take Profit - Close profitable positions' },
                          { value: 'extend_cooldown', label: 'Extend Cooldown - Add more cooldown time' }
                        ]
                      },
                      {
                        name: 'confirmation_required',
                        label: 'Require Confirmation for Actions',
                        type: 'switch' as FieldType
                      }
                    ]
                  },
                  {
                    name: 'voice_commands',
                    label: 'Voice Commands',
                    type: 'nested-group' as FieldType,
                    fields: [
                      {
                        name: 'enable_voice',
                        label: 'Enable Voice Commands',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'voice_language',
                        label: 'Voice Language',
                        type: 'select' as FieldType,
                        options: [
                          { value: 'en', label: 'English' },
                          { value: 'es', label: 'Spanish' },
                          { value: 'fr', label: 'French' },
                          { value: 'de', label: 'German' },
                          { value: 'it', label: 'Italian' },
                          { value: 'pt', label: 'Portuguese' },
                          { value: 'ru', label: 'Russian' },
                          { value: 'zh', label: 'Chinese' },
                          { value: 'ja', label: 'Japanese' }
                        ]
                      },
                      {
                        name: 'voice_sensitivity',
                        label: 'Voice Sensitivity',
                        type: 'number-prefix' as FieldType,
                        prefixType: 'percentage' as PrefixType
                      }
                    ]
                  },
                  {
                    name: 'message_formatting',
                    label: 'Message Formatting',
                    type: 'nested-group' as FieldType,
                    fields: [
                      {
                        name: 'use_emoji',
                        label: 'Use Emojis in Messages',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'message_style',
                        label: 'Message Style',
                        type: 'select' as FieldType,
                        options: [
                          { value: 'simple', label: 'Simple - Plain text' },
                          { value: 'formatted', label: 'Formatted - Bold/Italic' },
                          { value: 'rich', label: 'Rich - Full formatting' },
                          { value: 'minimal', label: 'Minimal - Essential info only' }
                        ]
                      },
                      {
                        name: 'include_charts',
                        label: 'Include Charts in Messages',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'chart_type',
                        label: 'Chart Type',
                        type: 'select' as FieldType,
                        options: [
                          { value: 'line', label: 'Line Chart' },
                          { value: 'candlestick', label: 'Candlestick Chart' },
                          { value: 'bar', label: 'Bar Chart' },
                          { value: 'pie', label: 'Pie Chart' }
                        ]
                      }
                    ]
                  },
                  {
                    name: 'security_settings',
                    label: 'Security Settings',
                    type: 'nested-group' as FieldType,
                    fields: [
                      {
                        name: 'require_authentication',
                        label: 'Require Authentication',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'allowed_users',
                        label: 'Allowed User IDs',
                        type: 'text' as FieldType,
                        placeholder: 'Comma-separated Telegram user IDs'
                      },
                      {
                        name: 'admin_users',
                        label: 'Admin User IDs',
                        type: 'text' as FieldType,
                        placeholder: 'Comma-separated admin Telegram user IDs'
                      },
                      {
                        name: 'rate_limiting',
                        label: 'Enable Rate Limiting',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'max_commands_per_minute',
                        label: 'Max Commands Per Minute',
                        type: 'number' as FieldType
                      }
                    ]
                  },
                  {
                    name: 'analytics_and_reporting',
                    label: 'Analytics and Reporting',
                    type: 'nested-group' as FieldType,
                    fields: [
                      {
                        name: 'enable_analytics',
                        label: 'Enable Analytics Dashboard',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'report_frequency',
                        label: 'Analytics Report Frequency',
                        type: 'select' as FieldType,
                        options: [
                          { value: 'realtime', label: 'Real-time' },
                          { value: 'hourly', label: 'Hourly' },
                          { value: 'daily', label: 'Daily' },
                          { value: 'weekly', label: 'Weekly' },
                          { value: 'monthly', label: 'Monthly' }
                        ]
                      },
                      {
                        name: 'include_predictions',
                        label: 'Include AI Predictions',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'sentiment_analysis',
                        label: 'Enable Sentiment Analysis',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'risk_metrics',
                        label: 'Include Risk Metrics',
                        type: 'switch' as FieldType
                      }
                    ]
                  },
                  {
                    name: 'automation_features',
                    label: 'Automation Features',
                    type: 'nested-group' as FieldType,
                    fields: [
                      {
                        name: 'auto_restart_on_error',
                        label: 'Auto-restart on Error',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'auto_adjust_risk',
                        label: 'Auto-adjust Risk Based on Performance',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'auto_optimize_parameters',
                        label: 'Auto-optimize Trading Parameters',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'machine_learning',
                        label: 'Enable Machine Learning',
                        type: 'switch' as FieldType
                      },
                      {
                        name: 'learning_rate',
                        label: 'Learning Rate',
                        type: 'number-prefix' as FieldType,
                        prefixType: 'percentage' as PrefixType
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            name: 'risk_management_section',
            label: 'Risk Management',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'max_drawdown_percentage',
                label: 'Maximum Drawdown %',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'max_consecutive_losses',
                label: 'Max Consecutive Losses',
                type: 'number' as FieldType
              },
              {
                name: 'daily_loss_limit',
                label: 'Daily Loss Limit',
                type: 'number-prefix' as FieldType,
                prefixType: 'currency' as PrefixType
              },
              {
                name: 'risk_per_trade',
                label: 'Risk Per Trade %',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'risk_reward_ratio',
                label: 'Minimum Risk/Reward Ratio',
                type: 'number' as FieldType
              },
              {
                name: 'maximum_exposure',
                label: 'Maximum Market Exposure %',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'portfolio_heat_check',
                label: 'Portfolio Heat Check',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'margin_call_buffer',
                label: 'Margin Call Safety Buffer %',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'correlation_limit',
                label: 'Max Correlated Positions',
                type: 'number' as FieldType
              }
            ]
          },
          {
            name: 'profit_targets_section',
            label: 'Profit Targets',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'profit_target_daily',
                label: 'Daily Profit Target',
                type: 'number-prefix' as FieldType,
                prefixType: 'currency' as PrefixType
              },
              {
                name: 'trailing_stop_loss',
                label: 'Trailing Stop Loss %',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'breakeven_after_profit',
                label: 'Move to Breakeven After Profit %',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'confidence_threshold',
                label: 'Signal Confidence Threshold %',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              }
            ]
          },
          {
            name: 'market_filters_section',
            label: 'Market Filters',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'volatility_threshold',
                label: 'Volatility Threshold',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'safe_zone_upper',
                label: 'Safe Zone Upper Bound',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'safe_zone_lower',
                label: 'Safe Zone Lower Bound',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'market_condition_filter',
                label: 'Market Condition Filter',
                type: 'select' as FieldType,
                options: [
                  { value: 'all', label: 'All Conditions' },
                  { value: 'trending', label: 'Trending Only' },
                  { value: 'ranging', label: 'Ranging Only' },
                  { value: 'high_volatility', label: 'High Volatility Only' },
                  { value: 'low_volatility', label: 'Low Volatility Only' }
                ]
              },
              {
                name: 'sentiment_filter',
                label: 'Market Sentiment Filter',
                type: 'select' as FieldType,
                options: [
                  { value: 'disabled', label: 'Disabled' },
                  { value: 'bullish_only', label: 'Bullish Only' },
                  { value: 'bearish_only', label: 'Bearish Only' },
                  { value: 'neutral_allowed', label: 'Neutral Allowed' }
                ]
              },
              {
                name: 'economic_calendar_filter',
                label: 'Economic Calendar Filter',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'news_impact_filter',
                label: 'News Impact Filter',
                type: 'select' as FieldType,
                options: [
                  { value: 'all', label: 'All News' },
                  { value: 'high_impact_only', label: 'High Impact Only' },
                  { value: 'exclude_high', label: 'Exclude High Impact' },
                  { value: 'no_news_trading', label: 'No News Trading' }
                ]
              },
              {
                name: 'geopolitical_risk_filter',
                label: 'Geopolitical Risk Filter',
                type: 'switch-with-helper' as FieldType
              }
            ]
          },
          {
            name: 'technical_indicators_section',
            label: 'Technical Indicators',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'rsi_overbought',
                label: 'RSI Overbought Level',
                type: 'number' as FieldType
              },
              {
                name: 'rsi_oversold',
                label: 'RSI Oversold Level',
                type: 'number' as FieldType
              },
              {
                name: 'macd_signal_threshold',
                label: 'MACD Signal Threshold',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'bollinger_band_width',
                label: 'Bollinger Band Width Threshold',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'momentum_threshold',
                label: 'Momentum Indicator Threshold',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'volume_spike_threshold',
                label: 'Volume Spike Multiplier',
                type: 'number' as FieldType
              }
            ]
          },
          {
            name: 'advanced_analysis_section',
            label: 'Advanced Analysis',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'price_action_confirmation',
                label: 'Price Action Confirmation',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'multi_timeframe_analysis',
                label: 'Multi-Timeframe Analysis',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'pattern_recognition',
                label: 'Chart Pattern Recognition',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'support_resistance_levels',
                label: 'Support/Resistance Level Analysis',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'fibonacci_retracement',
                label: 'Fibonacci Retracement Levels',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'order_book_analysis',
                label: 'Order Book Depth Analysis',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'market_microstructure',
                label: 'Market Microstructure Analysis',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'regime_detection',
                label: 'Market Regime Detection',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'seasonal_adjustments',
                label: 'Seasonal Trading Adjustments',
                type: 'switch-with-helper' as FieldType
              }
            ]
          },
          {
            name: 'execution_control_section',
            label: 'Execution Control',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'liquidity_threshold',
                label: 'Minimum Liquidity Requirement',
                type: 'number-prefix' as FieldType,
                prefixType: 'currency' as PrefixType
              },
              {
                name: 'spread_tolerance',
                label: 'Maximum Spread Tolerance %',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'slippage_tolerance',
                label: 'Slippage Tolerance %',
                type: 'number-prefix' as FieldType,
                prefixType: 'percentage' as PrefixType
              },
              {
                name: 'execution_delay_limit',
                label: 'Max Execution Delay (ms)',
                type: 'number' as FieldType
              },
              {
                name: 'partial_fill_handling',
                label: 'Partial Fill Handling Strategy',
                type: 'select' as FieldType,
                options: [
                  { value: 'cancel', label: 'Cancel Order' },
                  { value: 'accept', label: 'Accept Partial' },
                  { value: 'reorder', label: 'Reorder Balance' }
                ]
              },
              {
                name: 'liquidity_hunting_protection',
                label: 'Liquidity Hunting Protection',
                type: 'switch-with-helper' as FieldType
              }
            ]
          },
          {
            name: 'position_sizing_section',
            label: 'Position Sizing',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'adaptive_sizing',
                label: 'Adaptive Position Sizing',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'quantile_based_sizing',
                label: 'Quantile-Based Position Sizing',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'kelly_criterion_sizing',
                label: 'Kelly Criterion Position Sizing',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'volatility_normalized_sizing',
                label: 'Volatility-Normalized Sizing',
                type: 'switch-with-helper' as FieldType
              }
            ]
          },
          {
            name: 'ai_machine_learning_section',
            label: 'AI & Machine Learning',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'machine_learning_signals',
                label: 'ML Signal Integration',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'reinforcement_learning',
                label: 'Reinforcement Learning Adaptation',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'neural_network_signals',
                label: 'Neural Network Signal Processing',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'ensemble_predictions',
                label: 'Ensemble Prediction Models',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'regime_switching_model',
                label: 'Regime-Switching Model',
                type: 'switch-with-helper' as FieldType
              }
            ]
          },
          {
            name: 'market_intelligence_section',
            label: 'Market Intelligence',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'social_sentiment_integration',
                label: 'Social Sentiment Integration',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'whale_activity_monitoring',
                label: 'Whale Activity Monitoring',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'dark_pool_analysis',
                label: 'Dark Pool Flow Analysis',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'cross_market_correlation',
                label: 'Cross-Market Correlation Analysis',
                type: 'switch-with-helper' as FieldType
              }
            ]
          },
          {
            name: 'advanced_strategies_section',
            label: 'Advanced Strategies',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'dynamic_hedging',
                label: 'Dynamic Hedging Strategy',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'arbitrage_detection',
                label: 'Arbitrage Opportunity Detection',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'strategy_rotation',
                label: 'Automatic Strategy Rotation',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'auto_parameter_tuning',
                label: 'Auto Parameter Tuning',
                type: 'switch-with-helper' as FieldType
              }
            ]
          },
          {
            name: 'optimization_section',
            label: 'Optimization',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'gas_fee_optimization',
                label: 'Transaction Fee Optimization',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'tax_optimization',
                label: 'Tax Loss Harvesting',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'quantum_computing_optimization',
                label: 'Quantum Computing Optimization',
                type: 'switch-with-helper' as FieldType
              }
            ]
          },
          {
            name: 'monitoring_control_section',
            label: 'Monitoring & Control',
            type: 'collapsible-section' as FieldType,
            fields: [
              {
                name: 'time_restriction',
                label: 'Time-based Trading Restriction',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'performance_monitoring',
                label: 'Real-time Performance Monitoring',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'backtesting_mode',
                label: 'Live Backtesting Mode',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'performance_degradation_detection',
                label: 'Performance Degradation Detection',
                type: 'switch-with-helper' as FieldType
              },
              {
                name: 'emergency_stop',
                label: 'Emergency Stop All Trading',
                type: 'switch-with-helper' as FieldType
              }
            ]
          }
        ]
      }
    ]
  },
  'dalembert-trade': {  // Changed from threshold-trade
    fields: [
      ...COMMON_FIELDS,
      {
        name: 'duration',
        label: 'Duration',
        type: 'number' as FieldType
      },
      {
        name: 'profit_threshold',
        label: 'Profit Threshold',
        type: 'number-prefix' as FieldType,
        prefixType: 'currency' as PrefixType
      },
      {
        name: 'loss_threshold',
        label: 'Loss Threshold',
        type: 'number-prefix' as FieldType,
        prefixType: 'currency' as PrefixType
      }
    ]
  },
  'martingale-trade': {
    fields: [
      ...COMMON_FIELDS,
      {
        name: 'multiplier',
        label: 'Multiplier',
        type: 'number-prefix' as FieldType,
        prefixType: 'percentage' as PrefixType
      },
      {
        name: 'max_steps',
        label: 'Maximum Steps',
        type: 'number' as FieldType
      },
      {
        name: 'profit_threshold',
        label: 'Profit Threshold',
        type: 'number-prefix' as FieldType,
        prefixType: 'currency' as PrefixType
      },
      {
        name: 'loss_threshold',
        label: 'Loss Threshold',
        type: 'number-prefix' as FieldType,
        prefixType: 'currency' as PrefixType
      }
    ]
  }
};
