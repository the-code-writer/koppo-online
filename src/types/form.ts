import { TradingBotConfig } from './strategy';
import { StrategyType } from './trade';

// Field types
export type FieldType = 'text' | 'number' | 'number-prefix' | 'select' | 'multi-select' | 'duration-selector' | 'threshold-selector' | 'heading' | 'duration-selector-with-heading' | 'risk-management' | 'schedules' | 'bot-schedule' | 'switch-with-helper' | 'switch' | 'recovery-type' | 'cooldown-period' | 'max-trades-control' | 'trade-interval' | 'collapsible-section' | 'contract-params' | 'nested-group' | 'time-picker' | 'time-range' | 'key-value-editor';
export type PrefixType = 'currency' | 'percentage' | 'multiplier';

// Tab configuration
export interface TabConfig {
  key: string;
  label: string;
  fields: FieldConfig[];
}

// Basic field configuration
export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  prefixType?: PrefixType; // For number-prefix fields
  options?: { value: string; label: string }[]; // For select fields
  placeholder?: string; // For threshold-selector fields
  fields?: FieldConfig[]; // For collapsible sections
  sectionName?: string; // Optional parent section identifier (used for metadata disambiguation)
  default: any;
}

export interface FormConfig {
  fields?: FieldConfig[];
  tabs?: TabConfig[];
}

// Base form values that all forms can extend
export interface FormValues {
  [key: string]: string | number | object | boolean | undefined;
}

// Form values type
export interface StrategyFormProps {
  config?: FormConfig;
  strategyType: string;
  strategyId: string; // Should match StrategyType enum values
  tradeType?: string;
  onBack?: () => void;
  editBot?: TradingBotConfig;
}

// Helper function to validate if a strategyId is valid
export const isValidStrategyId = (strategyId: string): strategyId is keyof typeof StrategyType => {
  return Object.values(StrategyType).includes(strategyId as StrategyType);
};

// Accordion item configuration
export interface AccordionItemConfig {
  key: string;
  title: string;
  fields: FieldConfig[];
}
