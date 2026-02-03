import { Bot } from '../hooks/useBots';

// Field types
export type FieldType = 'text' | 'number' | 'number-prefix' | 'select' | 'multi-select' | 'duration-selector' | 'profit-threshold' | 'threshold-selector' | 'heading' | 'duration-selector-with-heading' | 'risk-management' | 'schedules' | 'switch-with-helper' | 'switch' | 'recovery-type' | 'cooldown-period' | 'max-trades-control' | 'trade-interval' | 'collapsible-section' | 'contract-params' | 'nested-group' | 'time-picker' | 'time-range';
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
}

export interface FormConfig {
  fields?: FieldConfig[];
  tabs?: TabConfig[];
}

// Form values type
export interface StrategyFormProps {
  config?: FormConfig;
  strategyType: string;
  strategyId: string;
  tradeType?: string;
  onBack?: () => void;
  editBot?: Bot;
}

// Base form values that all forms can extend
export interface FormValues {
  [key: string]: string | number | object | boolean | undefined;
}

// Accordion item configuration
export interface AccordionItemConfig {
  key: string;
  title: string;
  fields: FieldConfig[];
}
