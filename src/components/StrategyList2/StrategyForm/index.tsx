import { Form, Button, Segmented, Select, Tabs, Typography, Card, Switch, Flex, Collapse } from "antd";
import { InputField } from "../../InputField";
import { DurationSelector } from "../../DurationSelector";
import { ThresholdSelector } from "../../ProfitThreshold";
import { StepsComponent } from "../../StepsComponent";
import { ContractParams } from "../../ContractParams";
import { Schedules } from "../../Schedules";
import { BotSchedule } from "../../BotSchedule";
import {
  LabelPairedArrowLeftMdBoldIcon,
  LabelPairedCircleQuestionMdBoldIcon,
} from "@deriv/quill-icons";
import { useState, useEffect, useCallback } from "react";
import { TradeErrorBoundary } from "../../ErrorBoundary/TradeErrorBoundary";
import "./styles.scss";

import { FormValues, StrategyFormProps, FieldConfig, isValidStrategyId } from "../../../types/form";
import { ContractData, getAdvancedSettingsForStrategy } from "../../../types/strategy";

// Interface for the structured strategy form data
interface StrategyFormData {
  strategyId: string;
  contract: ContractData;
  status: 'STOP' | 'START' | 'PAUSE' | 'RESUME' | 'ERROR' | 'IDLE';
  botId: string;
  parentBotId: string;
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
    }
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
  realtimePerformance: {
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
  };
  statistics: {
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
  };
}

export function StrategyForm({
  config,
  strategyType,
  strategyId,
  onBack,
  editBot,
}: StrategyFormProps) {
  const [form] = Form.useForm<FormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!editBot;

  const { Title } = Typography;

  const [contractParams, setContractParams] = useState<ContractData>({} as ContractData);

  // Validate strategyId and get filtered advanced settings
  const filteredAdvancedSettings = getAdvancedSettingsForStrategy(strategyId);

  // Debug: Log strategy validation and filtering
  console.log('Strategy ID:', strategyId);
  console.log('Is valid strategy:', isValidStrategyId(strategyId));
  console.log('Filtered advanced settings:', filteredAdvancedSettings);

  // Filter the advanced settings tab fields based on strategy
  const getFilteredAdvancedSettingsFields = () => {
    if (!config?.tabs) return [];

    const advancedTab = config.tabs.find(tab => tab.key === 'advanced-settings');
    if (!advancedTab) return [];

    const filteredFields = advancedTab.fields.filter(field => {
      // Always include non-section fields like schedules
      if (field.type !== 'collapsible-section') {
        return true;
      }

      // Only include sections that are in the filtered list for this strategy
      const shouldInclude = filteredAdvancedSettings.includes(field.name);
      console.log(`Field ${field.name}:`, shouldInclude ? 'INCLUDED' : 'FILTERED OUT');
      return shouldInclude;
    });

    console.log('Original fields count:', advancedTab.fields.length);
    console.log('Filtered fields count:', filteredFields.length);

    return filteredFields;
  };

  // Initialize contract field with default values on mount
  useEffect(() => {
    const defaultContractValues: ContractData = {
      id: 'default-step',
      tradeType: 'DIGITS',
      contractType: 'DIGITUNDER',
      prediction: '8',
      predictionRandomize: false,
      market: {
        symbol: 'R_100',
        displayName: 'Volatility 100 (1s) Index',
        shortName: 'Volatility 100',
        market_name: 'synthetic_index',
        type: 'volatility'
      },
      marketRandomize: false,
      multiplier: 1,
      delay: 1,
      duration: 1,
      durationUnits: 'seconds',
      allowEquals: false,
      alternateAfter: 1
    };

    // Only set if contract field is empty
    if (!form.getFieldValue('contract')) {
      form.setFieldValue('contract', defaultContractValues);
      setContractParams(defaultContractValues);
    }
  }, [form]);

  // Function to build the structured form data object
  const buildStructuredFormData = useCallback((): StrategyFormData => {

    const values = form.getFieldsValue();

    const structuredData: StrategyFormData = {
      strategyId,
      contract: (values.contract as ContractData) || contractParams,
      amounts: {
        base_stake: values.base_stake,
        maximum_stake: values.maximum_stake,
        take_profit: values.take_profit,
        stop_loss: values.stop_loss,
      },
      recovery_steps: {
        risk_steps: values.risk_steps,
      },
      advanced_settings: {
        general_settings_section: {
          maximum_number_of_trades: values.maximim_number_of_trades as number | null,
          maximum_running_time: values.maximum_running_time as number | null,
          cooldown_period: values.cooldown_period as { duration: number; unit: string } | null,
          recovery_type: values.recovery_type as string | null,
          compound_stake: values.compound_stake as boolean || false,
          auto_restart: values.auto_restart as boolean || false,
        },
        bot_schedule: {
          bot_schedule: values.bot_schedule,
        },
        risk_management_section: {
          max_daily_loss: values.max_daily_loss,
          max_daily_profit: values.max_daily_profit,
          max_consecutive_losses: values.max_consecutive_losses as number | null,
          max_drawdown_percentage: values.max_drawdown_percentage as number | null,
          risk_per_trade: values.risk_per_trade as number | null,
          position_sizing: values.position_sizing as boolean || false,
          emergency_stop: values.emergency_stop as boolean || false,
        },
        volatility_controls_section: {
          volatility_filter: values.volatility_filter as boolean || false,
          min_volatility: values.min_volatility as number | null,
          max_volatility: values.max_volatility as number | null,
          volatility_adjustment: values.volatility_adjustment as boolean || false,
          pause_on_high_volatility: values.pause_on_high_volatility as boolean || false,
          volatility_lookback_period: values.volatility_lookback_period as number | null,
        },
        market_conditions_section: {
          trend_detection: values.trend_detection as boolean || false,
          trend_strength_threshold: values.trend_strength_threshold as number | null,
          avoid_ranging_market: values.avoid_ranging_market as boolean || false,
          market_correlation_check: values.market_correlation_check as boolean || false,
          time_of_day_filter: values.time_of_day_filter as boolean || false,
          preferred_trading_hours: values.preferred_trading_hours as string | null,
        },
        recovery_settings_section: {
          progressive_recovery: values.progressive_recovery as boolean || false,
          recovery_multiplier: values.recovery_multiplier as number | null,
          max_recovery_attempts: values.max_recovery_attempts as number | null,
          recovery_cooldown: values.recovery_cooldown as { duration: number; unit: string } | null,
          partial_recovery: values.partial_recovery as boolean || false,
          recovery_threshold: values.recovery_threshold,
        },
        martingale_strategy_section: {
          martingale_multiplier: values.martingale_multiplier as number | null,
          martingale_max_steps: values.martingale_max_steps as number | null,
          martingale_reset_on_profit: values.martingale_reset_on_profit as boolean || false,
          martingale_progressive_target: values.martingale_progressive_target as boolean || false,
          martingale_safety_net: values.martingale_safety_net as number | null,
        },
        martingale_reset_strategy_section: {
          reset_trigger_type: values.reset_trigger_type as string | null,
          reset_after_trades: values.reset_after_trades as number | null,
          reset_multiplier_adjustment: values.reset_multiplier_adjustment as number | null,
          track_session_stats: values.track_session_stats as boolean || false,
        },
        dalembert_strategy_section: {
          dalembert_increment: values.dalembert_increment,
          dalembert_decrement: values.dalembert_decrement,
          dalembert_max_units: values.dalembert_max_units as number | null,
          dalembert_reset_threshold: values.dalembert_reset_threshold,
          dalembert_conservative_mode: values.dalembert_conservative_mode as boolean || false,
        },
        dalembert_reset_strategy_section: {
          dalembert_reset_frequency: values.dalembert_reset_frequency as number | null,
          dalembert_reset_on_target: values.dalembert_reset_on_target as boolean || false,
          dalembert_adaptive_increment: values.dalembert_adaptive_increment as boolean || false,
          dalembert_session_profit_lock: values.dalembert_session_profit_lock as boolean || false,
        },
        reverse_martingale_strategy_section: {
          reverse_martingale_multiplier: values.reverse_martingale_multiplier as number | null,
          reverse_martingale_max_wins: values.reverse_martingale_max_wins as number | null,
          reverse_martingale_profit_lock: values.reverse_martingale_profit_lock as number | null,
          reverse_martingale_reset_on_loss: values.reverse_martingale_reset_on_loss as boolean || false,
          reverse_martingale_aggressive_mode: values.reverse_martingale_aggressive_mode as boolean || false,
        },
        reverse_martingale_reset_strategy_section: {
          reverse_reset_win_streak: values.reverse_reset_win_streak as number | null,
          reverse_reset_profit_target: values.reverse_reset_profit_target,
          reverse_preserve_winnings: values.reverse_preserve_winnings as boolean || false,
        },
        reverse_dalembert_strategy_section: {
          reverse_dalembert_increment: values.reverse_dalembert_increment,
          reverse_dalembert_decrement: values.reverse_dalembert_decrement,
          reverse_dalembert_max_units: values.reverse_dalembert_max_units as number | null,
          reverse_dalembert_profit_ceiling: values.reverse_dalembert_profit_ceiling,
        },
        reverse_dalembert_reset_strategy_section: {
          reverse_dalembert_reset_interval: values.reverse_dalembert_reset_interval as number | null,
          reverse_dalembert_dynamic_reset: values.reverse_dalembert_dynamic_reset as boolean || false,
          reverse_dalembert_win_rate_threshold: values.reverse_dalembert_win_rate_threshold as number | null,
        },
        accumulator_strategy_section: {
          accumulator_growth_rate: values.accumulator_growth_rate as number | null,
          accumulator_target_multiplier: values.accumulator_target_multiplier as number | null,
          accumulator_auto_cashout: values.accumulator_auto_cashout as boolean || false,
          accumulator_trailing_stop: values.accumulator_trailing_stop as boolean || false,
          accumulator_tick_duration: values.accumulator_tick_duration as number | null,
        },
        options_martingale_section: {
          options_contract_type: values.options_contract_type as string | null,
          options_duration: values.options_duration as number | null,
          options_martingale_multiplier: values.options_martingale_multiplier as number | null,
          options_prediction_mode: values.options_prediction_mode as string | null,
        },
        options_dalembert_section: {
          options_dalembert_contract_type: values.options_dalembert_contract_type as string | null,
          options_dalembert_increment: values.options_dalembert_increment,
          options_dalembert_duration: values.options_dalembert_duration as number | null,
        },
        options_reverse_martingale_section: {
          options_reverse_contract_type: values.options_reverse_contract_type as string | null,
          options_reverse_win_multiplier: values.options_reverse_win_multiplier as number | null,
          options_reverse_duration: values.options_reverse_duration as number | null,
          options_reverse_max_streak: values.options_reverse_max_streak as number | null,
        },
        system_1326_strategy_section: {
          system_1326_base_unit: values.system_1326_base_unit,
          system_1326_sequence: values.system_1326_sequence as string | null,
          system_1326_reset_on_loss: values.system_1326_reset_on_loss as boolean || false,
          system_1326_complete_cycle_target: values.system_1326_complete_cycle_target,
          system_1326_partial_profit_lock: values.system_1326_partial_profit_lock as boolean || false,
          system_1326_max_cycles: values.system_1326_max_cycles as number | null,
          system_1326_progression_mode: values.system_1326_progression_mode as string | null,
          system_1326_stop_on_cycle_complete: values.system_1326_stop_on_cycle_complete as boolean || false,
          system_1326_loss_recovery: values.system_1326_loss_recovery as boolean || false,
          system_1326_contract_type: values.system_1326_contract_type as string | null,
          system_1326_duration: values.system_1326_duration as number | null,
        },
        reverse_dalembert_main_strategy_section: {
          reverse_dalembert_base_stake: values.reverse_dalembert_base_stake,
          reverse_dalembert_win_increment: values.reverse_dalembert_win_increment,
          reverse_dalembert_loss_decrement: values.reverse_dalembert_loss_decrement,
          reverse_dalembert_maximum_units: values.reverse_dalembert_maximum_units as number | null,
          reverse_dalembert_minimum_units: values.reverse_dalembert_minimum_units as number | null,
          reverse_dalembert_profit_ceiling: values.reverse_dalembert_profit_ceiling,
          reverse_dalembert_reset_trigger: values.reverse_dalembert_reset_trigger as string | null,
          reverse_dalembert_aggressive_mode: values.reverse_dalembert_aggressive_mode as boolean || false,
          reverse_dalembert_win_streak_bonus: values.reverse_dalembert_win_streak_bonus as number | null,
          reverse_dalembert_contract_type: values.reverse_dalembert_contract_type as string | null,
          reverse_dalembert_duration: values.reverse_dalembert_duration as number | null,
        },
        oscars_grind_strategy_section: {
          oscars_grind_base_unit: values.oscars_grind_base_unit,
          oscars_grind_profit_target: values.oscars_grind_profit_target,
          oscars_grind_increment_on_win: values.oscars_grind_increment_on_win as boolean || false,
          oscars_grind_max_bet_units: values.oscars_grind_max_bet_units as number | null,
          oscars_grind_reset_on_target: values.oscars_grind_reset_on_target as boolean || false,
          oscars_grind_session_limit: values.oscars_grind_session_limit as number | null,
          oscars_grind_loss_limit: values.oscars_grind_loss_limit,
          oscars_grind_progression_speed: values.oscars_grind_progression_speed as string | null,
          oscars_grind_maintain_stake_on_loss: values.oscars_grind_maintain_stake_on_loss as boolean || false,
          oscars_grind_partial_target: values.oscars_grind_partial_target as boolean || false,
          oscars_grind_contract_type: values.oscars_grind_contract_type as string | null,
          oscars_grind_duration: values.oscars_grind_duration as number | null,
          oscars_grind_auto_stop_on_target: values.oscars_grind_auto_stop_on_target as boolean || false,
        },
      },
      realtimePerformance: {
        totalRuns: 0,
        numberOfWins: 0,
        numberOfLosses: 0,
        totalStake: 0,
        totalPayout: 0,
        startedAt: null,
        stoppedAt: null,
      },
      statistics: {
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
        createdAt: 0,
        lastUpdated: 0,
      },
    };

    return structuredData;

  }, [form, strategyId, contractParams]);

  // Helper function to log field updates
  const logFieldUpdate = useCallback((fieldName: string, value: unknown, tabKey?: string) => {
    console.log(`[Form Update] ${tabKey ? `[${tabKey}] ` : ''}${fieldName}:`, value);
    const structuredData = buildStructuredFormData();
    console.log("+++ FORM", structuredData);
  }, [buildStructuredFormData]);

  // Log the full structured form data
  const logFullFormData = useCallback(() => {
    const rawValues = form.getFieldsValue();
    const structuredData = buildStructuredFormData();
    console.log('[Form Data - Raw Values]', rawValues);
    console.log('[Form Data - Full Structure]', JSON.stringify(structuredData, null, 2));
    console.log('[Form Data - Object]', structuredData);
    return structuredData;
  }, [buildStructuredFormData, form]);

  useEffect(() => {
    const structuredData = buildStructuredFormData();
    console.log("+++ FORM", structuredData);
  }, [form, buildStructuredFormData])

  // Render field based on type
  const renderField = (field: FieldConfig) => {
    const getPlaceholder = () => {
      if (field.name === 'amount') {
        return 'Enter base stake amount';
      }
      return `Enter ${field.label.toLowerCase()}`;
    };

    const commonProps = {
      label: field.label,
      placeholder: getPlaceholder(),
    };

    switch (field.type) {
      case 'heading':
        return (
          <Card className="field-heading" size="small">
            <Title level={4} className="heading-title">
              {field.label}
            </Title>
          </Card>
        );

      case 'risk-management':
        return (
          <Card className="field-heading" size="small">
            <StepsComponent
              settings={form.getFieldValue(field.name) || []}
              onSettingsChange={(newValue) => {
                form.setFieldValue(field.name, newValue);
                logFieldUpdate(field.name, newValue, 'recovery_steps');
              }}
              title="Recovery Steps"
              addButtonText="Add Recovery Step"
            />
          </Card>
        );

      case 'schedules':
        return (
          <Card className="field-heading" size="small">
            <div className="field-label-row">
              <Title level={4} className="heading-title">{field.label}</Title>
            </div>
            <Schedules
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, 'advanced_settings');
              }}
            />
          </Card>
        );

      case 'bot-schedule':
        return (
          <Card className="field-heading" size="small">
            <div className="field-label-row">
              <Title level={4} className="heading-title">{field.label}</Title>
            </div>
            <BotSchedule
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, 'advanced_settings');
              }}
            />
          </Card>
        );

      case 'duration-selector-with-heading':
        return (
          <Card className="field-heading" size="small">
            <Title level={4} className="heading-title">
              {field.label}
            </Title>
            <div className="duration-selector-in-card">
              <DurationSelector
                onChange={(value) => {
                  form.setFieldValue(field.name, value);
                  logFieldUpdate(field.name, value, 'basicSettings');
                }}
              />
            </div>
          </Card>
        );

      case 'contract-params':
        return (
          <Card className="field-heading" size="small">
            <Title level={4} className="heading-title">
              {field.label}
            </Title>
            <div className="contract-params-in-card">
              <ContractParams
                defaultValues={{
                  id: 'default-step',
                  tradeType: 'DIGITS',
                  contractType: 'DIGITUNDER',
                  prediction: '8',
                  predictionRandomize: false,
                  market: {
                    symbol: 'R_100',
                    displayName: 'Volatility 100 (1s) Index',
                    shortName: 'Volatility 100',
                    market_name: 'synthetic_index',
                    type: 'volatility'
                  },
                  marketRandomize: false,
                  multiplier: 1,
                  delay: 1,
                  duration: 1,
                  durationUnits: 'seconds',
                  allowEquals: false,
                  alternateAfter: 1
                }}
                currentValue={form.getFieldValue(field.name)}
                onContractParamsChange={(params) => {
                  form.setFieldValue(field.name, params);
                  setContractParams(params);
                  logFieldUpdate(field.name, params, 'contract');
                }}
                updateStep={() => { }}
              />
            </div>
          </Card>
        );

      case 'duration-selector':
        return (
          <DurationSelector
            {...commonProps}
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, 'basicSettings');
            }}
          />
        );

      case 'threshold-selector':
        return (
          <ThresholdSelector
            label={field.label}
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, 'amounts');
            }}
            fixedPlaceholder={field.placeholder || 'Enter fixed amount'}
            percentagePlaceholder={`Enter percentage of balance for ${field.label.toLowerCase()}`}
            fixedHelperText={`Enter a fixed ${field.label.toLowerCase()} amount`}
            percentageHelperText={`${field.label} will be calculated as a percentage of your account balance`}
          />
        );

      case 'select':
        return (
          <div className="select-field">
            <label className="input-field-label">{field.label}</label>
            <Select
              placeholder={commonProps.placeholder}
              options={field.options}
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value);
              }}
              style={{ width: '100%' }}
              size="large"
            />
          </div>
        );

      case 'number-prefix':
        return (
          <Card className="field-heading" size="small">
            <InputField
              {...commonProps}
              type="number-prefix"
              suffix={field.prefixType === 'currency' ? '$' :
                field.prefixType === 'percentage' ? '%' :
                  field.prefixType === 'multiplier' ? '×' : ''}
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, 'basicSettings');
              }}
            />
          </Card>
        );

      case 'number':
        return (
          <Card className="field-heading" size="small">
            <InputField
              {...commonProps}
              type="number"
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, 'basicSettings');
              }}
            />
          </Card>
        );

      case 'switch-with-helper':
        return (
          <Card className="field-heading" size="small">
            <Flex justify="space-between" align="center" style={{ width: "100%" }} >
              <span>{field.label}</span>
              <Switch
                onChange={(value) => {
                  form.setFieldValue(field.name, value);
                  logFieldUpdate(field.name, value, 'execution');
                }}
              />
            </Flex>
          </Card>
        );

      case 'recovery-type':
        return (
          <Card className="field-heading" size="small">
            <div className="field-label-row">
              <Title level={4} className="heading-title">{field.label}</Title>
            </div>
            <Segmented
              block
              options={[
                { label: 'Conservative', value: 'conservative' },
                { label: 'Neutral', value: 'neutral' },
                { label: 'Aggressive', value: 'aggressive' },
              ]}
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, 'execution');
              }}
            />
            <div className="recovery-type-description">
              <span className="description-text">
                Controls how quickly the bot recovers from losses
              </span>
            </div>
          </Card>
        );

      case 'cooldown-period':
        return (
          <Card className="field-heading" size="small">
            <div className="field-label-row">
              <Title level={4} className="heading-title">{field.label}</Title>
            </div>
            <Flex justify="space-between" align="center" gap={12} >
              <InputField
                type="number"
                placeholder="Duration"
                onChange={(value) => {
                  const newValue = { duration: value, unit: form.getFieldValue(field.name)?.unit || 'seconds' };
                  form.setFieldValue(field.name, newValue);
                  logFieldUpdate(field.name, newValue, 'execution');
                }}
              /><Segmented style={{ width: 200 }}
                block
                options={[
                  { label: 'Sec', value: 'seconds' },
                  { label: 'Min', value: 'minutes' },
                  { label: 'Hour', value: 'hours' },
                ]}
                defaultValue="seconds"
                onChange={(value) => {
                  const newValue = { duration: form.getFieldValue(field.name)?.duration || 0, unit: value };
                  form.setFieldValue(field.name, newValue);
                  logFieldUpdate(field.name, newValue, 'execution');
                }}
                className="cooldown-segment"
              />
            </Flex>
            <div className="cooldown-description">
              <span className="description-text">
                Wait time between consecutive trades after a loss
              </span>
            </div>
          </Card>
        );

      case 'max-trades-control':
        return (
          <div className="max-trades-field">
            <div className="field-label-row">
              <span className="field-label">{field.label}</span>
              <LabelPairedCircleQuestionMdBoldIcon
                style={{ fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              />
            </div>
            <div className="max-trades-controls">
              <Button
                className="stepper-btn"
                onClick={() => {
                  const current = form.getFieldValue(field.name) || 1;
                  if (current > 1) form.setFieldValue(field.name, current - 1);
                }}
              >
                −
              </Button>
              <span className="trades-value">{form.getFieldValue(field.name) || 1}</span>
              <Button
                className="stepper-btn"
                onClick={() => {
                  const current = form.getFieldValue(field.name) || 1;
                  form.setFieldValue(field.name, current + 1);
                }}
              >
                +
              </Button>
            </div>
            <div className="max-trades-description">
              <span className="description-text">
                Maximum number of trades running at the same time
              </span>
            </div>
          </div>
        );

      case 'trade-interval':
        return (
          <div className="trade-interval-field">
            <div className="field-label-row">
              <span className="field-label">{field.label}</span>
              <LabelPairedCircleQuestionMdBoldIcon
                style={{ fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              />
            </div>
            <div className="interval-controls">
              <InputField
                type="number"
                placeholder="Enter interval"
                onChange={(value) => form.setFieldValue(field.name, { interval: value, unit: form.getFieldValue(field.name)?.unit || 'seconds' })}
              />
              <Segmented
                options={[
                  { label: 'Sec', value: 'seconds' },
                  { label: 'Min', value: 'minutes' },
                ]}
                defaultValue="seconds"
                onChange={(value) => form.setFieldValue(field.name, { interval: form.getFieldValue(field.name)?.interval || 0, unit: value })}
              />
            </div>
            <div className="interval-description">
              <span className="description-text">
                Minimum time between starting new trades
              </span>
            </div>
          </div>
        );

      case 'collapsible-section':
        return (
          <Collapse
            ghost
            accordion
            items={[
              {
                key: field.name,
                label: (
                  <div className="collapsible-header">
                    <Title level={4} className="collapsible-title">{field.label}</Title>
                  </div>
                ),
                children: (
                  <div className="collapsible-content">
                    {field.fields?.map((childField) => (
                      <Form.Item key={childField.name} name={childField.name} className={`${childField.type}-item`}>
                        {renderField(childField)}
                      </Form.Item>
                    ))}
                  </div>
                ),
              }
            ]}
            defaultActiveKey={[]}
          />
        );

      default:
        return (
          <Card className="field-heading" size="small">
            <InputField
              {...commonProps}
              type="text"
              onChange={(value) => form.setFieldValue(field.name, value)}
            />
          </Card>
        );
    }
  };

  const handleSubmit = async (values: FormValues) => {
    // Log the full structured form data
    const structuredFormData = logFullFormData();
    console.log('[Form Submit] Structured Strategy Data:', structuredFormData);
    console.log("Strategy submitted:", values);

    try {
      setIsSubmitting(true);

      // Save bot to localStorage
      const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const botData = {
        id: botId,
        name: `${strategyType} Bot`,
        strategyType,
        configuration: structuredFormData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'inactive',
      };

      // Get existing bots from localStorage
      const existingBotsJson = localStorage.getItem('trading_bots');
      const existingBots = existingBotsJson ? JSON.parse(existingBotsJson) : [];

      // Add new bot
      existingBots.push(botData);

      // Save back to localStorage
      localStorage.setItem('trading_bots', JSON.stringify(existingBots));

      console.log('[Bot Saved] Bot saved to localStorage:', botData);
      alert(`Bot "${botData.name}" created successfully!`);

      // Close drawer and navigate back
      onBack?.();

    } catch (error) {
      console.error("Failed to process strategy:", error);
      alert('Failed to save bot. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
  };


  return (
    <TradeErrorBoundary onReset={handleReset}>
      <div className="strategy-form-container">
        <div className="strategy-form-header">
          <div className="header-left">
            <Button
              type="text"
              icon={<LabelPairedArrowLeftMdBoldIcon />}
              className="back-button"
              onClick={onBack}
            />
          </div>
          <div className="header-right">
            <Button
              type="text"
              shape="circle"
              icon={<LabelPairedCircleQuestionMdBoldIcon />}
              className="help-button"
            />
          </div>
        </div>

        <h1 className="strategy-title">{strategyType} Strategy</h1>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          className="strategy-form"
          initialValues={{
            botName: "Test-01",
            tradeType: "Rise",
            market: "Volatility 100 (1s) Index",
            initialStake: 10,
            repeatTrade: 2,
          }}
        >
          <Card className="field-heading" size="small">
            <Form.Item name="botName" style={{ marginBottom: 0 }}>
              <InputField
                label="Enter The Bot Name"
                type="text"
                className="bot-name-input no-border-no-bg"
              />
            </Form.Item>
          </Card>

          {/* Render tabbed fields from config */}
          {config?.tabs ? (
            <Tabs
              defaultActiveKey="advanced"
              items={config.tabs.map((tab) => {
                // Use filtered fields for advanced-settings tab
                const fieldsToRender = tab.key === 'advanced-settings'
                  ? getFilteredAdvancedSettingsFields()
                  : tab.fields;

                return {
                  key: tab.key,
                  label: tab.label,
                  children: (
                    <div>
                      {fieldsToRender.map((field) => {
                        if (field.type === 'collapsible-section') {
                          return renderField(field);
                        }
                        return (
                          <Form.Item key={field.name} name={field.name} className={`${field.type}-item`}>
                            {renderField(field)}
                          </Form.Item>
                        );
                      })}
                    </div>
                  ),
                };
              })}
            />
          ) : (
            /* Render flat fields for backward compatibility */
            config?.fields?.map((field) => {
              if (field.type === 'collapsible-section') {
                return renderField(field);
              }
              return (
                <Form.Item key={field.name} name={field.name} className={`${field.type}-item`}>
                  {renderField(field)}
                </Form.Item>
              );
            })
          )}
        </Form>

        <div className="form-footer">
          <Button
            type="primary"
            block
            className="create-button"
            onClick={() => form.submit()}
            loading={isSubmitting}
          >
            {isEditMode ? "Update bot" : "Create bot"}
          </Button>
        </div>
      </div>
    </TradeErrorBoundary>
  );
}
