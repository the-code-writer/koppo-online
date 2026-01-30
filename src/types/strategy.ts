import { FormConfig, FieldType, PrefixType } from './form';

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
        key: 'advanced',
        label: 'Contract',
        fields: [
          {
            name: 'tick_duration',
            label: 'Ticks Duration',
            type: 'duration-selector-with-heading' as FieldType
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
            label: 'Re Steps',
            type: 'risk-management' as FieldType
          }
        ]
      },
      {
        key: 'advanced-settings',
        label: 'Advanced',
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
