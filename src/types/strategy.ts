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

export interface StrategyAuthor {
  photoURL: string;

  displayName: string;

  date: string;
}

export interface Strategy {
  strategyId: string;

  strategyUUID: string;

  title: string;

  tradeType: string;

  market: string;

  metadata: {
    riskLevel: string;

    minCapital: number;

    expectedReturn: number;

    maxDrawdown: number;

    timeframe: string;

    indicators: string[];

    winRate: number;
  };

  tags: string[];

  description: string;

  author: {
    photoURL: string;

    displayName: string;

    date: string;
  };

  coverPhoto: string;

  thumbnail: string;

  icon: string;

  isActive: boolean;

  isPublic: boolean;

  createdAt: string;

  updatedAt: string;

  totalRuns: number;

  totalWins: number;

  totalLosses: number;

  totalPayout: number;

  totalStake: number;

  totalTrades: number;

  rank: number;
}

// Reusable field interfaces for strategy configuration

export interface StrategyField {
  name: string;

  label: string;

  type: FieldType;

  placeholder?: string;

  prefixType?: PrefixType;

  options?: Array<{ value: string; label: string }>;

  fields?: StrategyField[];
}

export interface StrategyTab {
  key: string;

  label: string;

  fields: StrategyField[];
}

export const STORAGE_KEYS = {
  STRATEGIES_LIST: "koppo_strategies",
};

// Reusable field collections

export const COMMON_FIELDS = {
  contract: [
    {
      name: "contract",

      label: "Contract Parameters",

      type: "contract-params" as FieldType,
    },
  ] as StrategyField[],

  amounts: [
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
  ] as StrategyField[],

  recoverySteps: [
    {
      name: "risk_steps",

      label: "Recovery Steps",

      type: "risk-management" as FieldType,
    },
  ] as StrategyField[],

  generalSettings: [
    {
      name: "maximum_number_of_trades",

      label: "Maximum Number of Trades",

      type: "number" as FieldType,
    },

    {
      name: "maximum_running_time",

      label: "Maximum Running Time",

      type: "duration-selector-with-heading" as FieldType,
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
  ] as StrategyField[],

  botSchedule: [
    {
      name: "bot_schedule",

      label: "Schedule Configuration",

      type: "bot-schedule" as FieldType,
    },
  ] as StrategyField[],

  riskManagement: [
    {
      name: "max_hourly_profit",

      label: "Maximum Hourly Profit",

      type: "threshold-selector" as FieldType,

      placeholder: "Enter hourly profit target",
    },

    {
      name: "max_hourly_loss",

      label: "Maximum Hourly Loss",

      type: "threshold-selector" as FieldType,

      placeholder: "Enter maximum hourly loss limit",
    },

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
      name: "max_weekly_loss",

      label: "Maximum Weekly Loss",

      type: "threshold-selector" as FieldType,

      placeholder: "Enter maximum weekly loss limit",
    },

    {
      name: "max_weekly_profit",

      label: "Maximum Weekly Profit",

      type: "threshold-selector" as FieldType,

      placeholder: "Enter weekly profit target",
    },

    {
      name: "trailing_stop_loss",

      label: "Trailing Stop Loss",

      type: "threshold-selector" as FieldType,

      placeholder: "Set trailing stop loss amount",
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
      name: "max_account_risk_percentage",

      label: "Maximum Account Risk (%)",

      type: "number-prefix" as FieldType,

      prefixType: "percentage" as PrefixType,
    },

    {
      name: "minimum_profit_ratio",

      label: "Minimum Profit/Loss Ratio",

      type: "number-prefix" as FieldType,

      prefixType: "multiplier" as PrefixType,
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

    {
      name: "loss_protection_mode",

      label: "Loss Protection Mode",

      type: "switch-with-helper" as FieldType,
    },

    {
      name: "auto_reduce_stake_on_loss",

      label: "Auto Reduce Stake on Loss Streak",

      type: "switch-with-helper" as FieldType,
    },
  ] as StrategyField[],

  volatilityControls: [
    {
      name: "volatility_filter",

      label: "Enable Volatility Filter",

      type: "switch-with-helper" as FieldType,
    },

    {
      name: "min_volatility",

      label: "Minimum Volatility Index",

      type: "number-prefix" as FieldType,

      prefixType: "multiplier" as PrefixType,
    },

    {
      name: "max_volatility",

      label: "Maximum Volatility Index",

      type: "number-prefix" as FieldType,

      prefixType: "multiplier" as PrefixType,
    },

    {
      name: "volatility_adjustment",

      label: "Adjust Stake Based on Volatility",

      type: "switch-with-helper" as FieldType,
    },

    {
      name: "pause_on_high_volatility",

      label: "Pause Trading on High Volatility",

      type: "switch-with-helper" as FieldType,
    },

    {
      name: "volatility_lookback_period",

      label: "Volatility Lookback Period",

      type: "number" as FieldType,
    },
  ] as StrategyField[],

  marketConditions: [
    {
      name: "trend_detection",

      label: "Enable Trend Detection",

      type: "switch-with-helper" as FieldType,
    },

    {
      name: "trend_strength_threshold",

      label: "Trend Strength Threshold",

      type: "number-prefix" as FieldType,

      prefixType: "multiplier" as PrefixType,
    },

    {
      name: "avoid_ranging_market",

      label: "Avoid Ranging Market",

      type: "switch-with-helper" as FieldType,
    },

    {
      name: "market_correlation_check",

      label: "Market Correlation Check",

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

      type: "time-range" as FieldType,
    },
  ] as StrategyField[],

  recoverySettings: [
    {
      name: "progressive_recovery",

      label: "Progressive Recovery Mode",

      type: "switch-with-helper" as FieldType,
    },

    {
      name: "recovery_multiplier",

      label: "Recovery Multiplier",

      type: "number-prefix" as FieldType,

      prefixType: "multiplier" as PrefixType,
    },

    {
      name: "max_recovery_attempts",

      label: "Maximum Recovery Attempts",

      type: "number" as FieldType,
    },

    {
      name: "recovery_cooldown",

      label: "Recovery Cooldown",

      type: "cooldown-period" as FieldType,
    },

    {
      name: "partial_recovery",

      label: "Partial Recovery Mode",

      type: "switch-with-helper" as FieldType,
    },

    {
      name: "recovery_threshold",

      label: "Recovery Threshold",

      type: "threshold-selector" as FieldType,

      placeholder: "Enter recovery threshold",
    },

    {
      name: "metadata",

      label: "Metadata",

      type: "text" as FieldType,
    },
  ] as StrategyField[],
};

// Helper function to create collapsible section

export const createCollapsibleSection = (
  name: string,
  label: string,
  fields: StrategyField[],
): StrategyField => ({
  name,

  label,

  type: "collapsible-section" as FieldType,

  fields,
});

// Helper function to create standard tabs

export const createStandardTabs = (
  strategySpecificFields: StrategyField[],
): StrategyTab[] => [
    {
      key: "contract",

      label: "Contract",

      fields: COMMON_FIELDS.contract,
    },

    {
      key: "amounts",

      label: "Amounts",

      fields: COMMON_FIELDS.amounts,
    },

    {
      key: "recovery_steps",

      label: "Recovery Steps",

      fields: COMMON_FIELDS.recoverySteps,
    },

    {
      key: "advanced_settings",

      label: "Advanced",

      fields: [
        createCollapsibleSection(
          "general_settings_section",
          "General Settings",
          COMMON_FIELDS.generalSettings,
        ),

        createCollapsibleSection(
          "bot_schedule_section",
          "Bot Schedule",
          COMMON_FIELDS.botSchedule,
        ),

        createCollapsibleSection(
          "risk_management_section",
          "Risk Management",
          COMMON_FIELDS.riskManagement,
        ),

        createCollapsibleSection(
          "volatility_controls_section",
          "Volatility Controls",
          COMMON_FIELDS.volatilityControls,
        ),

        createCollapsibleSection(
          "market_conditions_section",
          "Market Conditions",
          COMMON_FIELDS.marketConditions,
        ),

        createCollapsibleSection(
          "recovery_settings_section",
          "Recovery Settings",
          COMMON_FIELDS.recoverySettings,
        ),

        ...strategySpecificFields,
      ],
    },
  ];

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

// Common fields for all strategies (using the exported COMMON_FIELDS above)

// Note: Legacy COMMON_FIELDS has been replaced by the reusable COMMON_FIELDS object above

// Strategy-specific advanced settings sections mapping

export const STRATEGY_ADVANCED_SETTINGS: Record<string, string[]> = {
  [StrategyType.MARTINGALE]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "martingale_strategy_section",
  ],

  [StrategyType.MARTINGALE_ON_STAT_RESET]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "martingale_reset_strategy_section",
  ],

  [StrategyType.DALEMBERT]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "dalembert_strategy_section",
  ],

  [StrategyType.DALEMBERT_ON_STAT_RESET]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "dalembert_reset_strategy_section",
  ],

  [StrategyType.REVERSE_MARTINGALE]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "reverse_martingale_strategy_section",
  ],

  [StrategyType.REVERSE_MARTINGALE_ON_STAT_RESET]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "reverse_martingale_reset_strategy_section",
  ],

  [StrategyType.REVERSE_DALEMBERT]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "reverse_dalembert_strategy_section",
  ],

  [StrategyType.REVERSE_DALEMBERT_ON_STAT_RESET]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "reverse_dalembert_reset_strategy_section",
  ],

  [StrategyType.OPTIONS_MARTINGALE]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "options_martingale_section",
  ],

  [StrategyType.OPTIONS_DALEMBERT]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "options_dalembert_section",
  ],

  [StrategyType.OPTIONS_REVERSE_MARTINGALE]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "options_reverse_martingale_section",
  ],

  [StrategyType.OPTIONS_OSCARS_GRIND]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "oscars_grind_strategy_section",
  ],

  [StrategyType.OPTIONS_1326_SYSTEM]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "system_1326_strategy_section",
  ],

  [StrategyType.OSCARS_GRIND]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "oscars_grind_strategy_section",
  ],

  [StrategyType.SYSTEM_1326]: [
    "general_settings_section",

    "bot_schedule_section",

    "risk_management_section",

    "volatility_controls_section",

    "system_1326_strategy_section",
  ],
};

// Helper function to get filtered advanced settings for a strategy

export const getAdvancedSettingsForStrategy = (
  strategyId: string,
): string[] => {
  return (
    STRATEGY_ADVANCED_SETTINGS[strategyId] || [
      "general_settings_section",

      "bot_schedule_section",

      "risk_management_section",

      "volatility_controls_section",

      "",
    ]
  );
};

export const STRATEGY_PARAMS: Record<string, FormConfig> = {
  [StrategyType.MARTINGALE]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "martingale_strategy_section",
        "Martingale Settings",
        [
          {
            name: "martingale_multiplier",

            label: "Martingale Multiplier",

            type: "number" as FieldType,
          },

          {
            name: "max_consecutive_losses",

            label: "Maximum Consecutive Losses",

            type: "number" as FieldType,
          },

          {
            name: "reset_on_win",

            label: "Reset on Win",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.DALEMBERT]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "dalembert_strategy_section",
        "D'Alembert Strategy Settings",
        [
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

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.DALEMBERT_ON_STAT_RESET]: {
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
        key: "recovery_steps",

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
        key: "advanced_settings",

        label: "Advanced",

        fields: [
          {
            name: "general_settings_section",

            label: "General Settings",

            type: "collapsible-section" as FieldType,

            fields: [
              {
                name: "maximum_number_of_trades",

                label: "Maximum Number of Trades",

                type: "number" as FieldType,
              },

              {
                name: "maximum_running_time",

                label: "Maximum Running Time",

                type: "duration-selector-with-heading" as FieldType,
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
            name: "bot_schedule_section",

            label: "Bot Schedule",

            type: "collapsible-section" as FieldType,

            fields: [
              {
                name: "bot_schedule",

                label: "Schedule Configuration",

                type: "bot-schedule" as FieldType,
              },
            ],
          },

          {
            name: "risk_management_section",

            label: "Risk Management",

            type: "collapsible-section" as FieldType,

            fields: [
              {
                name: "max_hourly_profit",

                label: "Maximum Hourly Profit",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter hourly profit target",
              },

              {
                name: "max_hourly_loss",

                label: "Maximum Hourly Loss",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter maximum hourly loss limit",
              },

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
                name: "max_weekly_loss",

                label: "Maximum Weekly Loss",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter maximum weekly loss limit",
              },

              {
                name: "max_weekly_profit",

                label: "Maximum Weekly Profit",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter weekly profit target",
              },

              {
                name: "trailing_stop_loss",

                label: "Trailing Stop Loss",

                type: "threshold-selector" as FieldType,

                placeholder: "Set trailing stop loss amount",
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
                name: "max_account_risk_percentage",

                label: "Maximum Account Risk (%)",

                type: "number-prefix" as FieldType,

                prefixType: "percentage" as PrefixType,
              },

              {
                name: "minimum_profit_ratio",

                label: "Minimum Profit/Loss Ratio",

                type: "number-prefix" as FieldType,

                prefixType: "multiplier" as PrefixType,
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

              {
                name: "loss_protection_mode",

                label: "Loss Protection Mode",

                type: "switch-with-helper" as FieldType,
              },

              {
                name: "auto_reduce_stake_on_loss",

                label: "Auto Reduce Stake on Loss Streak",

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

              {
                name: "metadata",

                label: "Metadata",

                type: "text" as FieldType,
              },
            ],
          },
        ],
      },
    ],
  },

  [StrategyType.REVERSE_MARTINGALE]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "reverse_martingale_strategy_section",
        "Reverse Martingale Strategy Settings",
        [
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

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.REVERSE_MARTINGALE_ON_STAT_RESET]: {
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
        key: "recovery_steps",

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
        key: "advanced_settings",

        label: "Advanced",

        fields: [
          {
            name: "general_settings_section",

            label: "General Settings",

            type: "collapsible-section" as FieldType,

            fields: [
              {
                name: "maximum_number_of_trades",

                label: "Maximum Number of Trades",

                type: "number" as FieldType,
              },

              {
                name: "maximum_running_time",

                label: "Maximum Running Time",

                type: "duration-selector-with-heading" as FieldType,
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
            name: "bot_schedule_section",

            label: "Bot Schedule",

            type: "collapsible-section" as FieldType,

            fields: [
              {
                name: "bot_schedule",

                label: "Schedule Configuration",

                type: "bot-schedule" as FieldType,
              },
            ],
          },

          {
            name: "risk_management_section",

            label: "Risk Management",

            type: "collapsible-section" as FieldType,

            fields: [
              {
                name: "max_hourly_profit",

                label: "Maximum Hourly Profit",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter hourly profit target",
              },

              {
                name: "max_hourly_loss",

                label: "Maximum Hourly Loss",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter maximum hourly loss limit",
              },

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
                name: "max_weekly_loss",

                label: "Maximum Weekly Loss",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter maximum weekly loss limit",
              },

              {
                name: "max_weekly_profit",

                label: "Maximum Weekly Profit",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter weekly profit target",
              },

              {
                name: "trailing_stop_loss",

                label: "Trailing Stop Loss",

                type: "threshold-selector" as FieldType,

                placeholder: "Set trailing stop loss amount",
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
                name: "max_account_risk_percentage",

                label: "Maximum Account Risk (%)",

                type: "number-prefix" as FieldType,

                prefixType: "percentage" as PrefixType,
              },

              {
                name: "minimum_profit_ratio",

                label: "Minimum Profit/Loss Ratio",

                type: "number-prefix" as FieldType,

                prefixType: "multiplier" as PrefixType,
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

              {
                name: "loss_protection_mode",

                label: "Loss Protection Mode",

                type: "switch-with-helper" as FieldType,
              },

              {
                name: "auto_reduce_stake_on_loss",

                label: "Auto Reduce Stake on Loss Streak",

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

              {
                name: "metadata",

                label: "Metadata",

                type: "text" as FieldType,
              },
            ],
          },
        ],
      },
    ],
  },

  [StrategyType.OPTIONS_MARTINGALE]: {
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
        key: "recovery_steps",

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
        key: "advanced_settings",

        label: "Advanced",

        fields: [
          {
            name: "general_settings_section",

            label: "General Settings",

            type: "collapsible-section" as FieldType,

            fields: [
              {
                name: "maximum_number_of_trades",

                label: "Maximum Number of Trades",

                type: "number" as FieldType,
              },

              {
                name: "maximum_running_time",

                label: "Maximum Running Time",

                type: "duration-selector-with-heading" as FieldType,
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
            name: "bot_schedule_section",

            label: "Bot Schedule",

            type: "collapsible-section" as FieldType,

            fields: [
              {
                name: "bot_schedule",

                label: "Schedule Configuration",

                type: "bot-schedule" as FieldType,
              },
            ],
          },

          {
            name: "risk_management_section",

            label: "Risk Management",

            type: "collapsible-section" as FieldType,

            fields: [
              {
                name: "max_hourly_profit",

                label: "Maximum Hourly Profit",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter hourly profit target",
              },

              {
                name: "max_hourly_loss",

                label: "Maximum Hourly Loss",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter maximum hourly loss limit",
              },

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
                name: "max_weekly_loss",

                label: "Maximum Weekly Loss",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter maximum weekly loss limit",
              },

              {
                name: "max_weekly_profit",

                label: "Maximum Weekly Profit",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter weekly profit target",
              },

              {
                name: "trailing_stop_loss",

                label: "Trailing Stop Loss",

                type: "threshold-selector" as FieldType,

                placeholder: "Set trailing stop loss amount",
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
                name: "max_account_risk_percentage",

                label: "Maximum Account Risk (%)",

                type: "number-prefix" as FieldType,

                prefixType: "percentage" as PrefixType,
              },

              {
                name: "minimum_profit_ratio",

                label: "Minimum Profit/Loss Ratio",

                type: "number-prefix" as FieldType,

                prefixType: "multiplier" as PrefixType,
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

              {
                name: "loss_protection_mode",

                label: "Loss Protection Mode",

                type: "switch-with-helper" as FieldType,
              },

              {
                name: "auto_reduce_stake_on_loss",

                label: "Auto Reduce Stake on Loss Streak",

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

                label: "Minimum Volatility Index",

                type: "number-prefix" as FieldType,

                prefixType: "multiplier" as PrefixType,
              },

              {
                name: "max_volatility",

                label: "Maximum Volatility Index",

                type: "number-prefix" as FieldType,

                prefixType: "multiplier" as PrefixType,
              },

              {
                name: "volatility_adjustment",

                label: "Adjust Stake Based on Volatility",

                type: "switch-with-helper" as FieldType,
              },

              {
                name: "pause_on_high_volatility",

                label: "Pause Trading on High Volatility",

                type: "switch-with-helper" as FieldType,
              },

              {
                name: "volatility_lookback_period",

                label: "Volatility Lookback Period",

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

                type: "number-prefix" as FieldType,

                prefixType: "multiplier" as PrefixType,
              },

              {
                name: "avoid_ranging_market",

                label: "Avoid Ranging Market",

                type: "switch-with-helper" as FieldType,
              },

              {
                name: "market_correlation_check",

                label: "Market Correlation Check",

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

                type: "time-range" as FieldType,
              },
            ],
          },

          {
            name: "recovery_settings_section",

            label: "Recovery Settings",

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

                prefixType: "multiplier" as PrefixType,
              },

              {
                name: "max_recovery_attempts",

                label: "Maximum Recovery Attempts",

                type: "number" as FieldType,
              },

              {
                name: "recovery_cooldown",

                label: "Recovery Cooldown",

                type: "cooldown-period" as FieldType,
              },

              {
                name: "partial_recovery",

                label: "Partial Recovery Mode",

                type: "switch-with-helper" as FieldType,
              },

              {
                name: "recovery_threshold",

                label: "Recovery Threshold",

                type: "threshold-selector" as FieldType,

                placeholder: "Enter recovery threshold",
              },

              {
                name: "metadata",

                label: "Metadata",

                type: "text" as FieldType,
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

              {
                name: "metadata",

                label: "Metadata",

                type: "text" as FieldType,
              },
            ],
          },
        ],
      },
    ],
  },

  [StrategyType.OPTIONS_DALEMBERT]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "options_dalembert_section",
        "Options D'Alembert Settings",
        [
          {
            name: "options_dalembert_increment",

            label: "Increment Amount",

            type: "threshold-selector" as FieldType,

            placeholder: "Enter increment amount",
          },

          {
            name: "options_dalembert_decrement",

            label: "Decrement Amount",

            type: "threshold-selector" as FieldType,

            placeholder: "Enter decrement amount",
          },

          {
            name: "options_dalembert_max_units",

            label: "Maximum Units",

            type: "number" as FieldType,
          },

          {
            name: "options_dalembert_conservative_mode",

            label: "Conservative Mode",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.DALEMBERT_ON_STAT_RESET]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "dalembert_reset_strategy_section",
        "D'Alembert on Stat Reset Settings",
        [
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

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.REVERSE_DALEMBERT]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "reverse_dalembert_strategy_section",
        "Reverse D'Alembert Strategy Settings",
        [
          {
            name: "reverse_dalembert_increment",

            label: "Win Increment Amount",

            type: "threshold-selector" as FieldType,

            placeholder: "Enter win increment amount",
          },

          {
            name: "reverse_dalembert_decrement",

            label: "Loss Decrement Amount",

            type: "threshold-selector" as FieldType,

            placeholder: "Enter loss decrement amount",
          },

          {
            name: "reverse_dalembert_max_units",

            label: "Maximum Units",

            type: "number" as FieldType,
          },

          {
            name: "reverse_dalembert_conservative_mode",

            label: "Conservative Mode",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.REVERSE_DALEMBERT_ON_STAT_RESET]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "reverse_dalembert_reset_strategy_section",
        "Reverse D'Alembert on Stat Reset Settings",
        [
          {
            name: "reverse_dalembert_reset_frequency",

            label: "Reset Frequency (trades)",

            type: "number" as FieldType,
          },

          {
            name: "reverse_dalembert_reset_on_target",

            label: "Reset on Target Achievement",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "reverse_dalembert_preserve_winnings",

            label: "Preserve Winnings on Reset",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.OPTIONS_MARTINGALE]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "options_martingale_section",
        "Options Martingale Settings",
        [
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

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.OPTIONS_REVERSE_MARTINGALE]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "options_reverse_martingale_section",
        "Options Reverse Martingale Settings",
        [
          {
            name: "options_reverse_contract_type",

            label: "Contract Type",

            type: "select" as FieldType,

            options: [
              { value: "rise_fall", label: "Rise/Fall" },

              { value: "higher_lower", label: "Higher/Lower" },

              { value: "touch_no_touch", label: "Touch/No Touch" },
            ],
          },

          {
            name: "options_reverse_duration",

            label: "Contract Duration (ticks)",

            type: "number" as FieldType,
          },

          {
            name: "options_reverse_multiplier",

            label: "Win Multiplier",

            type: "number" as FieldType,
          },

          {
            name: "options_reverse_max_wins",

            label: "Maximum Consecutive Wins",

            type: "number" as FieldType,
          },

          {
            name: "options_reverse_profit_lock",

            label: "Lock Profit Percentage",

            type: "number-prefix" as FieldType,

            prefixType: "percentage" as PrefixType,
          },

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.OPTIONS_OSCARS_GRIND]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "oscars_grind_strategy_section",
        "Options Oscar's Grind Settings",
        [
          {
            name: "options_oscars_unit_size",

            label: "Unit Size",

            type: "threshold-selector" as FieldType,

            placeholder: "Enter unit size",
          },

          {
            name: "options_oscars_profit_target",

            label: "Profit Target per Unit",

            type: "threshold-selector" as FieldType,

            placeholder: "Enter profit target",
          },

          {
            name: "options_oscars_max_units",

            label: "Maximum Units",

            type: "number" as FieldType,
          },

          {
            name: "options_oscars_reset_on_loss",

            label: "Reset on Loss",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.OPTIONS_1326_SYSTEM]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "system_1326_strategy_section",
        "Options 1-3-2-6 System Settings",
        [
          {
            name: "options_1326_base_unit",

            label: "Base Unit",

            type: "threshold-selector" as FieldType,

            placeholder: "Enter base unit",
          },

          {
            name: "options_1326_sequence",

            label: "Betting Sequence",

            type: "text" as FieldType,

            placeholder: "1-3-2-6",
          },

          {
            name: "options_1326_reset_on_loss",

            label: "Reset on Loss",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "options_1326_reset_on_completion",

            label: "Reset on Sequence Completion",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.OSCARS_GRIND]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "oscars_grind_strategy_section",
        "Oscar's Grind Settings",
        [
          {
            name: "oscars_unit_size",

            label: "Unit Size",

            type: "threshold-selector" as FieldType,

            placeholder: "Enter unit size",
          },

          {
            name: "oscars_profit_target",

            label: "Profit Target per Unit",

            type: "threshold-selector" as FieldType,

            placeholder: "Enter profit target",
          },

          {
            name: "oscars_max_units",

            label: "Maximum Units",

            type: "number" as FieldType,
          },

          {
            name: "oscars_reset_on_loss",

            label: "Reset on Loss",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "oscars_conservative_mode",

            label: "Conservative Mode",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.SYSTEM_1326]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "system_1326_strategy_section",
        "1-3-2-6 System Settings",
        [
          {
            name: "system_1326_base_unit",

            label: "Base Unit",

            type: "threshold-selector" as FieldType,

            placeholder: "Enter base unit",
          },

          {
            name: "system_1326_sequence",

            label: "Betting Sequence",

            type: "text" as FieldType,

            placeholder: "1-3-2-6",
          },

          {
            name: "system_1326_reset_on_loss",

            label: "Reset on Loss",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "system_1326_reset_on_completion",

            label: "Reset on Sequence Completion",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "system_1326_progressive_mode",

            label: "Progressive Mode",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },

  [StrategyType.MARTINGALE_ON_STAT_RESET]: {
    tabs: createStandardTabs([
      createCollapsibleSection(
        "martingale_reset_strategy_section",
        "Martingale on Stat Reset Settings",
        [
          {
            name: "martingale_reset_frequency",

            label: "Reset Frequency (trades)",

            type: "number" as FieldType,
          },

          {
            name: "martingale_reset_on_target",

            label: "Reset on Target Achievement",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "martingale_adaptive_multiplier",

            label: "Adaptive Multiplier Based on Win Rate",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "martingale_session_profit_lock",

            label: "Lock Profit After Reset",

            type: "switch-with-helper" as FieldType,
          },

          {
            name: "metadata",

            label: "Metadata",

            type: "text" as FieldType,
          },
        ],
      ),
    ]),
  },
};
