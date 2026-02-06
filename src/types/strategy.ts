import { FormConfig, FieldType, PrefixType } from "./form";
import { MarketInfo } from "./market";
import { StrategyType } from "./trade";

export const filterButtons = [
  { key: "all", label: "All Strategies" },
  { key: "long-calls", label: "Long Calls" },
  { key: "short-puts", label: "Short Puts" },
  { key: "iron-condors", label: "Iron Condors" },
  { key: "covered-calls", label: "Covered Calls" },
  { key: "bull-spreads", label: "Bull Spreads" },
] as const;

export type FilterKey = (typeof filterButtons)[number]["key"];

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
  status?: "running" | "paused" | "stopped";
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
  status: "running" | "paused" | "stopped";
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
  market: MarketInfo | null;
  marketRandomize: boolean;
  multiplier: number;
  delay: number;
  duration: number;
  durationUnits: string;
  allowEquals?: boolean;
  alternateAfter?: number;
}

export interface ContractParamsProps {
  defaultValues: ContractData;
  currentValue?: ContractData; // Add current value from form
  updateStep: (
    stepId: string,
    field: keyof ContractData,
    fieldValue: any,
  ) => void;
  onContractParamsChange: (contractParams: ContractData) => void;
}

// Static symbol field that's common to all strategies
export const SYMBOL_FIELD = {
  name: "symbol",
  label: "Symbol",
  type: "select" as FieldType,
  options: [
    { value: "R_100", label: "Volatility 100 (1s) Index" },
    { value: "R_75", label: "Volatility 75 (1s) Index" },
    { value: "R_50", label: "Volatility 50 (1s) Index" },
    { value: "R_25", label: "Volatility 25 (1s) Index" },
  ],
};

// Common fields for all strategies
const COMMON_FIELDS = [
  {
    name: "amount",
    label: "Amount",
    type: "number-prefix" as FieldType,
    prefixType: "currency" as PrefixType,
  },
  {
    name: "growth_rate",
    label: "Growth Rate",
    type: "number-prefix" as FieldType,
    prefixType: "percentage" as PrefixType,
  },
];

// Strategy-specific advanced settings sections mapping
export const STRATEGY_ADVANCED_SETTINGS: Record<string, string[]> = {
  [StrategyType.MARTINGALE]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'martingale_strategy_section'
  ],
  [StrategyType.MARTINGALE_ON_STAT_RESET]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'martingale_strategy_section',
    'martingale_reset_strategy_section'
  ],
  [StrategyType.DALEMBERT]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'dalembert_strategy_section'
  ],
  [StrategyType.DALEMBERT_ON_STAT_RESET]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'dalembert_strategy_section',
    'dalembert_reset_strategy_section'
  ],
  [StrategyType.REVERSE_MARTINGALE]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'reverse_martingale_strategy_section'
  ],
  [StrategyType.REVERSE_MARTINGALE_ON_STAT_RESET]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'reverse_martingale_strategy_section',
    'reverse_martingale_reset_strategy_section'
  ],
  [StrategyType.REVERSE_DALEMBERT]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'reverse_dalembert_strategy_section'
  ],
  [StrategyType.REVERSE_DALEMBERT_ON_STAT_RESET]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'reverse_dalembert_strategy_section',
    'reverse_dalembert_reset_strategy_section'
  ],
  [StrategyType.OPTIONS_MARTINGALE]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'options_martingale_section'
  ],
  [StrategyType.OPTIONS_DALEMBERT]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'options_dalembert_section'
  ],
  [StrategyType.OPTIONS_REVERSE_MARTINGALE]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'options_reverse_martingale_section'
  ],
  [StrategyType.OPTIONS_OSCARS_GRIND]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'oscars_grind_strategy_section'
  ],
  [StrategyType.OPTIONS_1326_SYSTEM]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'system_1326_strategy_section'
  ],
  [StrategyType.OSCARS_GRIND]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'oscars_grind_strategy_section'
  ],
  [StrategyType.SYSTEM_1326]: [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section',
    'system_1326_strategy_section'
  ]
};

// Helper function to get filtered advanced settings for a strategy
export const getAdvancedSettingsForStrategy = (strategyId: string): string[] => {
  return STRATEGY_ADVANCED_SETTINGS[strategyId] || [
    'general_settings_section',
    'risk_management_section',
    'volatility_controls_section',
    'market_conditions_section',
    'recovery_settings_section'
  ];
};

// Define input parameters for each strategy
export const STRATEGY_PARAMS: Record<string, FormConfig> = {
  "martingale": {
    tabs: [
      {
        key: "contract",
        label: "Contract",
        fields: [
          {
            name: "contract",
            label: "Contract Parameters",
            type: "contract-params" as FieldType,
          },
        ],
      },
      {
        key: "amounts",
        label: "Amounts",
        fields: [
          {
            name: "base_stake",
            label: "Base Stake",
            type: "threshold-selector" as FieldType,
            placeholder: "Enter base stake amount",
          },
          {
            name: "maximum_stake",
            label: "Maximum Stake",
            type: "threshold-selector" as FieldType,
            placeholder: "Enter maximum stake amount",
          },
          {
            name: "take_profit",
            label: "Take Profit",
            type: "threshold-selector" as FieldType,
            placeholder: "Enter take profit target",
          },
          {
            name: "stop_loss",
            label: "Stop Loss",
            type: "threshold-selector" as FieldType,
            placeholder: "Enter stop loss amount",
          },
        ],
      },
      {
        key: "recovery-steps",
        label: "Recovery Steps",
        fields: [
          {
            name: "risk_steps",
            label: "Recovery Steps",
            type: "risk-management" as FieldType,
          },
        ],
      },
      {
        key: "advanced-settings",
        label: "Advanced",
        fields: [
          {
            name: "bot_schedules",
            label: "Bot Schedules",
            type: "schedules" as FieldType,
          },
          {
            name: "general_settings_section",
            label: "General Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "maximim_number_of_trades",
                label: "Maximum Number of Trades",
                type: "number" as FieldType,
              },
              {
                name: "maximum_running_time",
                label: "Maximum Running Time",
                type: "cooldown-period" as FieldType,
              },
              {
                name: "cooldown_period",
                label: "Cooldown Period",
                type: "cooldown-period" as FieldType,
              },
              {
                name: "recovery_type",
                label: "Recovery Type",
                type: "recovery-type" as FieldType,
              },
              {
                name: "compound_stake",
                label: "Compound stake",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "auto_restart",
                label: "Auto restart after cooldown",
                type: "switch-with-helper" as FieldType,
              },
            ],
          },
          {
            name: "risk_management_section",
            label: "Risk Management",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "max_daily_loss",
                label: "Maximum Daily Loss",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter maximum daily loss limit",
              },
              {
                name: "max_daily_profit",
                label: "Maximum Daily Profit",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter daily profit target",
              },
              {
                name: "max_consecutive_losses",
                label: "Maximum Consecutive Losses",
                type: "number" as FieldType,
              },
              {
                name: "max_drawdown_percentage",
                label: "Maximum Drawdown (%)",
                type: "number-prefix" as FieldType,
                prefixType: "percentage" as PrefixType,
              },
              {
                name: "risk_per_trade",
                label: "Risk Per Trade (%)",
                type: "number-prefix" as FieldType,
                prefixType: "percentage" as PrefixType,
              },
              {
                name: "position_sizing",
                label: "Dynamic Position Sizing",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "emergency_stop",
                label: "Emergency Stop on High Loss",
                type: "switch-with-helper" as FieldType,
              },
            ],
          },
          {
            name: "volatility_controls_section",
            label: "Volatility Controls",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "volatility_filter",
                label: "Enable Volatility Filter",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "min_volatility",
                label: "Minimum Volatility Threshold",
                type: "number" as FieldType,
              },
              {
                name: "max_volatility",
                label: "Maximum Volatility Threshold",
                type: "number" as FieldType,
              },
              {
                name: "volatility_adjustment",
                label: "Auto-Adjust Stake on Volatility",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "pause_on_high_volatility",
                label: "Pause Trading on High Volatility",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "volatility_lookback_period",
                label: "Volatility Lookback Period (ticks)",
                type: "number" as FieldType,
              },
            ],
          },
          {
            name: "market_conditions_section",
            label: "Market Conditions",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "trend_detection",
                label: "Enable Trend Detection",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "trend_strength_threshold",
                label: "Trend Strength Threshold",
                type: "number" as FieldType,
              },
              {
                name: "avoid_ranging_market",
                label: "Avoid Ranging Markets",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "market_correlation_check",
                label: "Check Market Correlation",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "time_of_day_filter",
                label: "Time of Day Filter",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "preferred_trading_hours",
                label: "Preferred Trading Hours",
                type: "text" as FieldType,
                placeholder: "e.g., 08:00-16:00",
              },
            ],
          },
          {
            name: "recovery_settings_section",
            label: "Advanced Recovery Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "progressive_recovery",
                label: "Progressive Recovery Mode",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "recovery_multiplier",
                label: "Recovery Multiplier",
                type: "number-prefix" as FieldType,
                prefixType: "percentage" as PrefixType,
              },
              {
                name: "max_recovery_attempts",
                label: "Maximum Recovery Attempts",
                type: "number" as FieldType,
              },
              {
                name: "recovery_cooldown",
                label: "Recovery Cooldown Period",
                type: "cooldown-period" as FieldType,
              },
              {
                name: "partial_recovery",
                label: "Allow Partial Recovery",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "recovery_threshold",
                label: "Recovery Threshold Amount",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter recovery threshold",
              },
            ],
          },
          {
            name: "martingale_strategy_section",
            label: "Martingale Strategy Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "martingale_multiplier",
                label: "Martingale Multiplier",
                type: "number" as FieldType,
              },
              {
                name: "martingale_max_steps",
                label: "Maximum Martingale Steps",
                type: "number" as FieldType,
              },
              {
                name: "cooldown_period",
                label: "Cooldown Period",
                type: "cooldown-period" as FieldType,
              },
              {
                name: "maximum_loss_streak",
                label: "Maximum Loss Streak",
                type: "number" as FieldType,
              },
              {
                name: "error_handling",
                label: "Error Handling",
                type: "select" as FieldType,
                options: [
                  { value: "stop", label: "Stop After Error" },
                  { value: "restart", label: "Restart After Error" },
                  { value: "reset", label: "Reset After Error" }
                ],
              },
              {
                name: "reset_after_losses",
                label: "Reset After N Losses",
                type: "number" as FieldType,
              },
              {
                name: "minimum_balance_percentage",
                label: "Minimum Balance Percentage as Base Stake",
                type: "number-prefix" as FieldType,
                prefixType: "percentage" as PrefixType,
              },
              {
                name: "martingale_reset_on_profit",
                label: "Reset on Profit",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "martingale_progressive_target",
                label: "Progressive Profit Target",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "martingale_safety_net",
                label: "Safety Net (Stop at X% of Balance)",
                type: "number-prefix" as FieldType,
                prefixType: "percentage" as PrefixType,
              },
            ],
          },
          {
            name: "martingale_reset_strategy_section",
            label: "Martingale on Stat Reset Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "reset_trigger_type",
                label: "Reset Trigger Type",
                type: "select" as FieldType,
                options: [
                  { value: "profit", label: "On Profit" },
                  { value: "loss", label: "On Loss" },
                  { value: "both", label: "On Both" },
                ],
              },
              {
                name: "reset_after_trades",
                label: "Reset After N Trades",
                type: "number" as FieldType,
              },
              {
                name: "reset_multiplier_adjustment",
                label: "Multiplier Adjustment on Reset",
                type: "number" as FieldType,
              },
              {
                name: "track_session_stats",
                label: "Track Session Statistics",
                type: "switch-with-helper" as FieldType,
              },
            ],
          },
          {
            name: "dalembert_strategy_section",
            label: "D'Alembert Strategy Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "dalembert_increment",
                label: "Stake Increment Amount",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter increment amount",
              },
              {
                name: "dalembert_decrement",
                label: "Stake Decrement Amount",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter decrement amount",
              },
              {
                name: "dalembert_max_units",
                label: "Maximum Units",
                type: "number" as FieldType,
              },
              {
                name: "dalembert_reset_threshold",
                label: "Reset at Profit Threshold",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter reset threshold",
              },
              {
                name: "dalembert_conservative_mode",
                label: "Conservative Mode",
                type: "switch-with-helper" as FieldType,
              },
            ],
          },
          {
            name: "dalembert_reset_strategy_section",
            label: "D'Alembert on Stat Reset Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "dalembert_reset_frequency",
                label: "Reset Frequency (trades)",
                type: "number" as FieldType,
              },
              {
                name: "dalembert_reset_on_target",
                label: "Reset on Target Achievement",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "dalembert_adaptive_increment",
                label: "Adaptive Increment Based on Win Rate",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "dalembert_session_profit_lock",
                label: "Lock Profit After Reset",
                type: "switch-with-helper" as FieldType,
              },
            ],
          },
          {
            name: "reverse_martingale_strategy_section",
            label: "Reverse Martingale Strategy Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "reverse_martingale_multiplier",
                label: "Win Multiplier",
                type: "number" as FieldType,
              },
              {
                name: "reverse_martingale_max_wins",
                label: "Maximum Consecutive Wins",
                type: "number" as FieldType,
              },
              {
                name: "reverse_martingale_profit_lock",
                label: "Lock Profit Percentage",
                type: "number-prefix" as FieldType,
                prefixType: "percentage" as PrefixType,
              },
              {
                name: "reverse_martingale_reset_on_loss",
                label: "Reset to Base on Loss",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "reverse_martingale_aggressive_mode",
                label: "Aggressive Mode",
                type: "switch-with-helper" as FieldType,
              },
            ],
          },
          {
            name: "reverse_martingale_reset_strategy_section",
            label: "Reverse Martingale on Stat Reset Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "reverse_reset_win_streak",
                label: "Reset After Win Streak",
                type: "number" as FieldType,
              },
              {
                name: "reverse_reset_profit_target",
                label: "Reset at Profit Target",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter profit target",
              },
              {
                name: "reverse_preserve_winnings",
                label: "Preserve Winnings on Reset",
                type: "switch-with-helper" as FieldType,
              },
            ],
          },
          {
            name: "reverse_dalembert_strategy_section",
            label: "Reverse D'Alembert Strategy Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "reverse_dalembert_increment",
                label: "Increment on Win",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter increment amount",
              },
              {
                name: "reverse_dalembert_decrement",
                label: "Decrement on Loss",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter decrement amount",
              },
              {
                name: "reverse_dalembert_max_units",
                label: "Maximum Units",
                type: "number" as FieldType,
              },
              {
                name: "reverse_dalembert_profit_ceiling",
                label: "Profit Ceiling",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter profit ceiling",
              },
            ],
          },
          {
            name: "reverse_dalembert_reset_strategy_section",
            label: "Reverse D'Alembert on Stat Reset Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "reverse_dalembert_reset_interval",
                label: "Reset Interval (trades)",
                type: "number" as FieldType,
              },
              {
                name: "reverse_dalembert_dynamic_reset",
                label: "Dynamic Reset Based on Performance",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "reverse_dalembert_win_rate_threshold",
                label: "Win Rate Threshold for Reset (%)",
                type: "number-prefix" as FieldType,
                prefixType: "percentage" as PrefixType,
              },
            ],
          },
          {
            name: "accumulator_strategy_section",
            label: "Accumulator Strategy Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "accumulator_growth_rate",
                label: "Accumulator Growth Rate",
                type: "number-prefix" as FieldType,
                prefixType: "percentage" as PrefixType,
              },
              {
                name: "accumulator_target_multiplier",
                label: "Target Multiplier",
                type: "number" as FieldType,
              },
              {
                name: "accumulator_auto_cashout",
                label: "Auto Cashout at Target",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "accumulator_trailing_stop",
                label: "Trailing Stop Loss",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "accumulator_tick_duration",
                label: "Tick Duration",
                type: "number" as FieldType,
              },
            ],
          },
          {
            name: "options_martingale_section",
            label: "Options Martingale Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "options_contract_type",
                label: "Contract Type",
                type: "select" as FieldType,
                options: [
                  { value: "rise_fall", label: "Rise/Fall" },
                  { value: "higher_lower", label: "Higher/Lower" },
                  { value: "touch_no_touch", label: "Touch/No Touch" },
                ],
              },
              {
                name: "options_duration",
                label: "Contract Duration (ticks)",
                type: "number" as FieldType,
              },
              {
                name: "options_martingale_multiplier",
                label: "Options Multiplier",
                type: "number" as FieldType,
              },
              {
                name: "options_prediction_mode",
                label: "Prediction Mode",
                type: "select" as FieldType,
                options: [
                  { value: "fixed", label: "Fixed" },
                  { value: "alternate", label: "Alternate" },
                  { value: "trend_based", label: "Trend Based" },
                ],
              },
            ],
          },
          {
            name: "options_dalembert_section",
            label: "Options D'Alembert Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "options_dalembert_contract_type",
                label: "Contract Type",
                type: "select" as FieldType,
                options: [
                  { value: "rise_fall", label: "Rise/Fall" },
                  { value: "higher_lower", label: "Higher/Lower" },
                  { value: "matches_differs", label: "Matches/Differs" },
                ],
              },
              {
                name: "options_dalembert_increment",
                label: "Stake Increment",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter increment amount",
              },
              {
                name: "options_dalembert_duration",
                label: "Contract Duration (ticks)",
                type: "number" as FieldType,
              },
            ],
          },
          {
            name: "options_reverse_martingale_section",
            label: "Options Reverse Martingale Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "options_reverse_contract_type",
                label: "Contract Type",
                type: "select" as FieldType,
                options: [
                  { value: "rise_fall", label: "Rise/Fall" },
                  { value: "higher_lower", label: "Higher/Lower" },
                  { value: "even_odd", label: "Even/Odd" },
                ],
              },
              {
                name: "options_reverse_win_multiplier",
                label: "Win Multiplier",
                type: "number" as FieldType,
              },
              {
                name: "options_reverse_duration",
                label: "Contract Duration (ticks)",
                type: "number" as FieldType,
              },
              {
                name: "options_reverse_max_streak",
                label: "Maximum Win Streak",
                type: "number" as FieldType,
              },
            ],
          },
          {
            name: "system_1326_strategy_section",
            label: "1326 System Strategy Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "system_1326_base_unit",
                label: "Base Unit Stake",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter base unit amount",
              },
              {
                name: "system_1326_sequence",
                label: "Betting Sequence",
                type: "text" as FieldType,
                placeholder: "Default: 1-3-2-6",
              },
              {
                name: "system_1326_reset_on_loss",
                label: "Reset Sequence on Loss",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "system_1326_complete_cycle_target",
                label: "Complete Cycle Profit Target",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter cycle profit target",
              },
              {
                name: "system_1326_partial_profit_lock",
                label: "Lock Profit After Step 2",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "system_1326_max_cycles",
                label: "Maximum Cycles Per Session",
                type: "number" as FieldType,
              },
              {
                name: "system_1326_progression_mode",
                label: "Progression Mode",
                type: "select" as FieldType,
                options: [
                  { value: "standard", label: "Standard (1-3-2-6)" },
                  { value: "conservative", label: "Conservative (1-2-3-4)" },
                  { value: "aggressive", label: "Aggressive (1-4-3-8)" },
                  { value: "custom", label: "Custom Sequence" },
                ],
              },
              {
                name: "system_1326_stop_on_cycle_complete",
                label: "Stop After Successful Cycle",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "system_1326_loss_recovery",
                label: "Enable Loss Recovery Mode",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "system_1326_contract_type",
                label: "Contract Type",
                type: "select" as FieldType,
                options: [
                  { value: "rise_fall", label: "Rise/Fall" },
                  { value: "higher_lower", label: "Higher/Lower" },
                  { value: "matches_differs", label: "Matches/Differs" },
                  { value: "even_odd", label: "Even/Odd" },
                ],
              },
              {
                name: "system_1326_duration",
                label: "Contract Duration (ticks)",
                type: "number" as FieldType,
              },
            ],
          },
          {
            name: "reverse_dalembert_main_strategy_section",
            label: "Reverse D'Alembert Strategy Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "reverse_dalembert_base_stake",
                label: "Base Stake Amount",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter base stake amount",
              },
              {
                name: "reverse_dalembert_win_increment",
                label: "Increment on Win",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter increment amount",
              },
              {
                name: "reverse_dalembert_loss_decrement",
                label: "Decrement on Loss",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter decrement amount",
              },
              {
                name: "reverse_dalembert_maximum_units",
                label: "Maximum Units",
                type: "number" as FieldType,
              },
              {
                name: "reverse_dalembert_minimum_units",
                label: "Minimum Units",
                type: "number" as FieldType,
              },
              {
                name: "reverse_dalembert_profit_ceiling",
                label: "Profit Ceiling Target",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter profit ceiling",
              },
              {
                name: "reverse_dalembert_reset_trigger",
                label: "Reset Trigger",
                type: "select" as FieldType,
                options: [
                  { value: "profit_target", label: "On Profit Target" },
                  { value: "loss_limit", label: "On Loss Limit" },
                  { value: "max_units", label: "On Max Units Reached" },
                  { value: "manual", label: "Manual Only" },
                ],
              },
              {
                name: "reverse_dalembert_aggressive_mode",
                label: "Aggressive Increment Mode",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "reverse_dalembert_win_streak_bonus",
                label: "Win Streak Bonus Multiplier",
                type: "number" as FieldType,
              },
              {
                name: "reverse_dalembert_contract_type",
                label: "Contract Type",
                type: "select" as FieldType,
                options: [
                  { value: "rise_fall", label: "Rise/Fall" },
                  { value: "higher_lower", label: "Higher/Lower" },
                  { value: "matches_differs", label: "Matches/Differs" },
                  { value: "even_odd", label: "Even/Odd" },
                ],
              },
              {
                name: "reverse_dalembert_duration",
                label: "Contract Duration (ticks)",
                type: "number" as FieldType,
              },
            ],
          },
          {
            name: "oscars_grind_strategy_section",
            label: "Oscar's Grind Strategy Settings",
            type: "collapsible-section" as FieldType,
            fields: [
              {
                name: "oscars_grind_base_unit",
                label: "Base Unit Stake",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter base unit amount",
              },
              {
                name: "oscars_grind_profit_target",
                label: "Session Profit Target",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter profit target per session",
              },
              {
                name: "oscars_grind_increment_on_win",
                label: "Increment Stake on Win After Loss",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "oscars_grind_max_bet_units",
                label: "Maximum Bet Units",
                type: "number" as FieldType,
              },
              {
                name: "oscars_grind_reset_on_target",
                label: "Reset on Target Achievement",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "oscars_grind_session_limit",
                label: "Maximum Sessions Per Day",
                type: "number" as FieldType,
              },
              {
                name: "oscars_grind_loss_limit",
                label: "Session Loss Limit",
                type: "threshold-selector" as FieldType,
                placeholder: "Enter loss limit per session",
              },
              {
                name: "oscars_grind_progression_speed",
                label: "Progression Speed",
                type: "select" as FieldType,
                options: [
                  { value: "slow", label: "Slow (Conservative)" },
                  { value: "standard", label: "Standard" },
                  { value: "fast", label: "Fast (Aggressive)" },
                ],
              },
              {
                name: "oscars_grind_maintain_stake_on_loss",
                label: "Maintain Stake on Loss",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "oscars_grind_partial_target",
                label: "Allow Partial Target Achievement",
                type: "switch-with-helper" as FieldType,
              },
              {
                name: "oscars_grind_contract_type",
                label: "Contract Type",
                type: "select" as FieldType,
                options: [
                  { value: "rise_fall", label: "Rise/Fall" },
                  { value: "higher_lower", label: "Higher/Lower" },
                  { value: "matches_differs", label: "Matches/Differs" },
                  { value: "even_odd", label: "Even/Odd" },
                ],
              },
              {
                name: "oscars_grind_duration",
                label: "Contract Duration (ticks)",
                type: "number" as FieldType,
              },
              {
                name: "oscars_grind_auto_stop_on_target",
                label: "Auto Stop on Target",
                type: "switch-with-helper" as FieldType,
              },
            ],
          },
        ],
      },
    ],
  },
  "dalembert-trade": {
    // Changed from threshold-trade
    fields: [
      ...COMMON_FIELDS,
      {
        name: "duration",
        label: "Duration",
        type: "number" as FieldType,
      },
      {
        name: "profit_threshold",
        label: "Profit Threshold",
        type: "number-prefix" as FieldType,
        prefixType: "currency" as PrefixType,
      },
      {
        name: "loss_threshold",
        label: "Loss Threshold",
        type: "number-prefix" as FieldType,
        prefixType: "currency" as PrefixType,
      },
    ],
  },
  "martingale-trade": {
    fields: [
      ...COMMON_FIELDS,
      {
        name: "multiplier",
        label: "Multiplier",
        type: "number-prefix" as FieldType,
        prefixType: "percentage" as PrefixType,
      },
      {
        name: "max_steps",
        label: "Maximum Steps",
        type: "number" as FieldType,
      },
      {
        name: "profit_threshold",
        label: "Profit Threshold",
        type: "number-prefix" as FieldType,
        prefixType: "currency" as PrefixType,
      },
      {
        name: "loss_threshold",
        label: "Loss Threshold",
        type: "number-prefix" as FieldType,
        prefixType: "currency" as PrefixType,
      },
    ],
  },
};
