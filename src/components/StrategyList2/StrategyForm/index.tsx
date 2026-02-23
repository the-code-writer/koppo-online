import {
  Form,
  Button,
  Segmented,
  Select,
  Tabs,
  Typography,
  Card,
  Switch,
  Flex,
  Collapse,
  Tag,
  Input,
  notification,
} from "antd";
import { InputField } from "../../InputField";
import { DurationSelector } from "../../DurationSelector";
import { ThresholdSelector } from "../../ProfitThreshold";
import { StepsComponent } from "../../StepsComponent";
import { ContractParams } from "../../ContractParams";
import { BotSchedule } from "../../BotSchedule";
import {
  LabelPairedArrowLeftMdBoldIcon,
  LabelPairedCircleQuestionMdBoldIcon,
} from "@deriv/quill-icons";
import { useState, useEffect, useCallback, useMemo } from "react";
import Confetti from "react-confetti-boom";
import { TradeErrorBoundary } from "../../ErrorBoundary/TradeErrorBoundary";
import { TradingAccountSelector } from "../../TradingAccountSelector";
import { BotBannerUpload } from "../../BotBannerUpload";
import "./styles.scss";

import {
  FormValues,
  StrategyFormProps,
  FieldConfig,
} from "../../../types/form";
import {
  ContractData,
  getAdvancedSettingsForStrategy,
} from "../../../types/strategy";

// Define RiskStep type that matches the expected interface
interface RiskStep {
  id: string;
  lossStreak: number;
  multiplier: number;
  action: string;
}
import { useLocalStorage } from "../../../utils/use-local-storage/useLocalStorage";
import { tradingBotAPIService } from "../../../services/tradingBotAPIService";
// Interface for the structured strategy form data


export function StrategyForm({
  config,
  strategyType,
  strategyId,
  onBack,
  editBot,
}: StrategyFormProps) {
  const [form] = Form.useForm<FormValues>();
  const isEditMode = !!editBot;

  const watchedBotName = Form.useWatch("botName", form);
  const watchedBotDescription = Form.useWatch("botDescription", form);
  const watchedBotAccount = Form.useWatch("botAccount", form);
  const watchedBotBanner = Form.useWatch("botBanner", form);
  const watchedContract = Form.useWatch("contract", form) as
    | ContractData
    | undefined;
  const watchedBotSchedule = Form.useWatch("bot_schedule", form);
  const watchedBaseStake = Form.useWatch("base_stake", form);
  const watchedMaximumStake = Form.useWatch("maximum_stake", form);
  const watchedTakeProfit = Form.useWatch("take_profit", form);
  const watchedStopLoss = Form.useWatch("stop_loss", form);
  const watchedRecoveryType = Form.useWatch("recovery_type", form);
  const watchedRiskSteps = Form.useWatch("risk_steps", form);

  const [createStatus, setCreateStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdBot, setCreatedBot] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  
  // Initialize contract field with default values on mount
  const defaultContractValues = useMemo(
    (): ContractData => ({
      id: "default-step",
      tradeType: "DIGITS",
      contractType: "DIGITUNDER",
      prediction: "8",
      predictionRandomize: false,
      market: {
        symbol: "R_100",
        displayName: "Volatility 100 (1s) Index",
        shortName: "Volatility 100",
        market_name: "synthetic_index",
        type: "volatility",
      },
      marketRandomize: false,
      multiplier: 1,
      delay: 0,
      duration: 1,
      durationUnits: "ticks",
      allowEquals: true,
      alternateAfter: 1,
    }),
    [],
  );

  const [contractParams, setContractParams] = useState<ContractData>(
    {} as ContractData,
  );
  const [adhocContractParams, setAdhocContractParams] = useState<
    ContractData[]
  >([defaultContractValues] as ContractData[]);
  const [botTags, setBotTags] = useState<string[]>(editBot?.botTags || []);
  const [tagInputValue, setTagInputValue] = useState("");

  const getAmountNumericValue = useCallback((amount: unknown): number => {
    if (typeof amount === "number") {
      return amount;
    }
    if (amount && typeof amount === "object" && "value" in (amount as any)) {
      const v = (amount as any).value;
      return typeof v === "number" ? v : Number(v);
    }
    return 0;
  }, []);

  const missingCreateRequirements = useMemo(() => {
    const missing: Array<{ key: string; message: string }> = [];

    return missing;

    if (!String(watchedBotName || "").trim()) {
      missing.push({ key: "botName", message: "Bot name is required" });
    }

    if (!String(watchedBotDescription || "").trim()) {
      missing.push({
        key: "botDescription",
        message: "Bot description is required",
      });
    }

    if (!Array.isArray(botTags) || botTags.length === 0) {
      missing.push({ key: "botTags", message: "Add at least 1 bot tag" });
    }

    if (
      !watchedBotAccount ||
      typeof watchedBotAccount !== "object" ||
      !(watchedBotAccount as any)?.account
    ) {
      missing.push({ key: "botAccount", message: "Select a bot account" });
    }

    if (!String(watchedBotBanner || "").trim()) {
      missing.push({ key: "botBanner", message: "Bot banner is required" });
    }

    const contract = watchedContract || contractParams;
    const contractType = (contract as any)?.contractType;
    const tradeType = (contract as any)?.tradeType;
    const multiplier = (contract as any)?.multiplier;

    if (!String(contractType || "").trim()) {
      missing.push({
        key: "contract.contractType",
        message: "Contract type is required",
      });
    }

    if (!String(tradeType || "").trim()) {
      missing.push({
        key: "contract.tradeType",
        message: "Contract name/trade type is required",
      });
    }

    if (
      !(typeof multiplier === "number"
        ? multiplier > 0
        : Number(multiplier) > 0)
    ) {
      missing.push({
        key: "contract.multiplier",
        message: "Multiplier must be greater than 0",
      });
    }

    if (!(getAmountNumericValue(watchedBaseStake) > 0)) {
      missing.push({
        key: "base_stake",
        message: "Base stake must be greater than 0",
      });
    }
    if (!(getAmountNumericValue(watchedMaximumStake) > 0)) {
      missing.push({
        key: "maximum_stake",
        message: "Maximum stake must be greater than 0",
      });
    }
    if (!(getAmountNumericValue(watchedTakeProfit) > 0)) {
      missing.push({
        key: "take_profit",
        message: "Take profit must be greater than 0",
      });
    }
    if (!(getAmountNumericValue(watchedStopLoss) > 0)) {
      missing.push({
        key: "stop_loss",
        message: "Stop loss must be greater than 0",
      });
    }

    if (!String(watchedRecoveryType || "").trim()) {
      missing.push({
        key: "recovery_type",
        message: "Select at least 1 recovery type",
      });
    }

    if (!Array.isArray(watchedRiskSteps) || watchedRiskSteps.length === 0) {
      missing.push({
        key: "risk_steps",
        message: "Add at least 1 recovery step",
      });
    }

    return missing;
  }, [
    botTags,
    contractParams,
    getAmountNumericValue,
    watchedBaseStake,
    watchedBotAccount,
    watchedBotBanner,
    watchedBotDescription,
    watchedBotName,
    watchedContract,
    watchedMaximumStake,
    watchedRecoveryType,
    watchedRiskSteps,
    watchedStopLoss,
    watchedTakeProfit,
  ]);

  const canCreateBot =
    missingCreateRequirements.length === 0 && createStatus !== "loading";

  const showMissingCreateRequirements = useCallback(() => {
    if (missingCreateRequirements.length === 0) {
      return;
    }

    notification.error({
      message: "Missing required bot setup",
      description: (
        <div>
          {missingCreateRequirements.map((m) => (
            <div key={m.key}>{m.message}</div>
          ))}
        </div>
      ),
      duration: 4,
    });
  }, [missingCreateRequirements]);

  const sanitizeCreateBotPayload = useCallback(
    (data: StrategyFormData): Record<string, unknown> => {
      const stripServerManagedKeysDeep = (input: unknown): unknown => {
        if (Array.isArray(input)) {
          return input.map(stripServerManagedKeysDeep);
        }

        if (!input || typeof input !== "object") {
          return input;
        }

        const obj = input as Record<string, unknown>;
        const out: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(obj)) {
          // Remove nested identifiers and server-managed timestamps
          if (
            key === "id" ||
            key === "_id" ||
            key === "isVirtual" ||
            key === "createdAt" ||
            key === "updatedAt" ||
            key === "deletedAt" ||
            key === "lastUpdated"
          ) {
            continue;
          }

          out[key] = stripServerManagedKeysDeep(value);
        }

        return out;
      };

      const botId =
        data.botId && String(data.botId).trim()
          ? String(data.botId).trim()
          : `bot-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      const parentBotId =
        data.parentBotId && String(data.parentBotId).trim()
          ? String(data.parentBotId).trim()
          : null;

      const accountRaw = (data as any).botAccount as
        | {
            id?: string;
            currency?: string;
            isVirtual?: boolean;
            token?: string;
            account?: string;
          }
        | undefined;

      const botAccount = accountRaw
        ? {
            currency: accountRaw.currency,
            account: accountRaw.account ?? accountRaw.id,
            token: accountRaw.token,
          }
        : undefined;

      const payload: Record<string, unknown> = {
        ...(stripServerManagedKeysDeep(data) as Record<string, unknown>),
        botId,
        parentBotId,
        botAccount,
      };

      // Keys rejected by API validation
      delete payload.botCurrency;
      delete payload.createdBy;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.deletedAt;

      // These blocks are server-computed/managed on create
      delete payload.statistics;
      delete payload.realtimePerformance;

      // Strip client-only fields inside botAccount
      if (payload.botAccount && typeof payload.botAccount === "object") {
        delete (payload.botAccount as any).id;
        delete (payload.botAccount as any).isVirtual;
      }

      // Avoid sending invalid/empty amounts object
      if (
        payload.amounts &&
        typeof payload.amounts === "object" &&
        (Object.values(payload.amounts as Record<string, unknown>).some(
          (v) => v === undefined,
        ) ||
          Object.keys(payload.amounts as Record<string, unknown>).length === 0)
      ) {
        delete payload.amounts;
      }

      return payload;
    },
    [],
  );

  const { Title } = Typography;
  const [formStep, setFormStep] = useState<"info" | "configure">("info");

  // Validate strategyId and get filtered advanced settings
  const filteredAdvancedSettings = getAdvancedSettingsForStrategy(strategyId);

  // Filter the advanced settings tab fields based on strategy
  const getFilteredAdvancedSettingsFields = () => {
    if (!config?.tabs) return [];

    const advancedTab = config.tabs.find(
      (tab) => tab.key === "advanced-settings",
    );
    if (!advancedTab) return [];

    const filteredFields = advancedTab.fields.filter((field) => {
      // Always include non-section fields like schedules
      if (field.type !== "collapsible-section") {
        return true;
      }

      // Only include sections that are in the filtered list for this strategy
      const shouldInclude = filteredAdvancedSettings.includes(field.name);
      console.log(
        `Field ${field.name}:`,
        shouldInclude ? "INCLUDED" : "FILTERED OUT",
      );
      return shouldInclude;
    });

    console.log("Original fields count:", advancedTab.fields.length);
    console.log("Filtered fields count:", filteredFields.length);

    return filteredFields;
  };

  useEffect(() => {
    // Only set if contract field is empty
    if (!form.getFieldValue("contract")) {
      form.setFieldValue("contract", defaultContractValues);
      setContractParams(defaultContractValues);
    }
  }, [defaultContractValues, form]);

  // Function to build the structured form data object
  const buildStructuredFormData = useCallback((): StrategyFormData => {
    const values = form.getFieldsValue();

    const botBannerValue = (form.getFieldValue("botBanner") ??
      values.botBanner) as string | undefined;
    const botIconValue = botBannerValue
      ? `${botBannerValue}?size=64`
      : undefined;
    const botThumbnailValue = botBannerValue
      ? `${botBannerValue}?size=256`
      : undefined;

    const structuredData: StrategyFormData = {
      strategyId,
      contract: (values.contract as ContractData) || contractParams,
      status: "IDLE",
      botId: "",
      parentBotId: "",
      botName: (values.botName as string) || "",
      botDescription: (values.botDescription as string) || "",
      botIcon: botIconValue || "",
      botThumbnail: botThumbnailValue || "",
      botBanner: botBannerValue || "",
      botTags: [],
      botCurrency: "USD",
      isActive: false,
      isPremium: false,
      isPublic: false,
      createdBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: "",
      version: {
        current: "1.0.0",
        notes: "",
        date: new Date().toISOString(),
      },
      amounts: {
        base_stake: values.base_stake,
        maximum_stake: values.maximum_stake,
        take_profit: values.take_profit,
        stop_loss: values.stop_loss,
      },
      recovery_steps: {
        risk_steps: (values.risk_steps as RiskStep[]) || [],
      },
      advanced_settings: {
        general_settings_section: {
          maximum_number_of_trades: values.maximim_number_of_trades as
            | number
            | null,
          maximum_running_time: values.maximum_running_time as number | null,
          cooldown_period: values.cooldown_period as {
            duration: number;
            unit: string;
          } | null,
          recovery_type: values.recovery_type as string | null,
          compound_stake: (values.compound_stake as boolean) || false,
          auto_restart: (values.auto_restart as boolean) || false,
        },
        bot_schedule: {
          bot_schedule:
            typeof values.bot_schedule === "object" &&
            values.bot_schedule !== null
              ? (values.bot_schedule as any)
              : {
                  id: "",
                  name: "Default Schedule",
                  type: "daily",
                  startDate: null,
                  endDate: null,
                  startTime: null,
                  endTime: null,
                  daysOfWeek: [],
                  dayOfMonth: null,
                  isEnabled: true,
                  exclusions: [],
                },
        },
        risk_management_section: {
          max_daily_loss: values.max_daily_loss,
          max_daily_profit: values.max_daily_profit,
          max_consecutive_losses: values.max_consecutive_losses as
            | number
            | null,
          max_drawdown_percentage: values.max_drawdown_percentage as
            | number
            | null,
          risk_per_trade: values.risk_per_trade as number | null,
          position_sizing: (values.position_sizing as boolean) || false,
          emergency_stop: (values.emergency_stop as boolean) || false,
        },
        volatility_controls_section: {
          volatility_filter: (values.volatility_filter as boolean) || false,
          min_volatility: values.min_volatility as number | null,
          max_volatility: values.max_volatility as number | null,
          volatility_adjustment:
            (values.volatility_adjustment as boolean) || false,
          pause_on_high_volatility:
            (values.pause_on_high_volatility as boolean) || false,
          volatility_lookback_period: values.volatility_lookback_period as
            | number
            | null,
        },
        market_conditions_section: {
          trend_detection: (values.trend_detection as boolean) || false,
          trend_strength_threshold: values.trend_strength_threshold as
            | number
            | null,
          avoid_ranging_market:
            (values.avoid_ranging_market as boolean) || false,
          market_correlation_check:
            (values.market_correlation_check as boolean) || false,
          time_of_day_filter: (values.time_of_day_filter as boolean) || false,
          preferred_trading_hours: values.preferred_trading_hours as
            | string
            | null,
        },
        recovery_settings_section: {
          progressive_recovery:
            (values.progressive_recovery as boolean) || false,
          recovery_multiplier: values.recovery_multiplier as number | null,
          max_recovery_attempts: values.max_recovery_attempts as number | null,
          recovery_cooldown: values.recovery_cooldown as {
            duration: number;
            unit: string;
          } | null,
          partial_recovery: (values.partial_recovery as boolean) || false,
          recovery_threshold: values.recovery_threshold,
          metadata: values.metadata,
        },
        martingale_strategy_section: {
          martingale_multiplier: values.martingale_multiplier as number | null,
          martingale_max_steps: values.martingale_max_steps as number | null,
          martingale_reset_on_profit:
            (values.martingale_reset_on_profit as boolean) || false,
          martingale_progressive_target:
            (values.martingale_progressive_target as boolean) || false,
          martingale_safety_net: values.martingale_safety_net as number | null,
          metadata: values.metadata,
        },
        martingale_reset_strategy_section: {
          reset_trigger_type: values.reset_trigger_type as string | null,
          reset_after_trades: values.reset_after_trades as number | null,
          reset_multiplier_adjustment: values.reset_multiplier_adjustment as
            | number
            | null,
          track_session_stats: (values.track_session_stats as boolean) || false,
        },
        dalembert_strategy_section: {
          dalembert_increment: values.dalembert_increment,
          dalembert_decrement: values.dalembert_decrement,
          dalembert_max_units: values.dalembert_max_units as number | null,
          dalembert_reset_threshold: values.dalembert_reset_threshold,
          dalembert_conservative_mode:
            (values.dalembert_conservative_mode as boolean) || false,
          metadata: values.metadata,
        },
        dalembert_reset_strategy_section: {
          dalembert_reset_frequency: values.dalembert_reset_frequency as
            | number
            | null,
          dalembert_reset_on_target:
            (values.dalembert_reset_on_target as boolean) || false,
          dalembert_adaptive_increment:
            (values.dalembert_adaptive_increment as boolean) || false,
          dalembert_session_profit_lock:
            (values.dalembert_session_profit_lock as boolean) || false,
          metadata: values.metadata,
        },
        reverse_martingale_strategy_section: {
          reverse_martingale_multiplier:
            values.reverse_martingale_multiplier as number | null,
          reverse_martingale_max_wins: values.reverse_martingale_max_wins as
            | number
            | null,
          reverse_martingale_profit_lock:
            values.reverse_martingale_profit_lock as number | null,
          reverse_martingale_reset_on_loss:
            (values.reverse_martingale_reset_on_loss as boolean) || false,
          reverse_martingale_aggressive_mode:
            (values.reverse_martingale_aggressive_mode as boolean) || false,
          metadata: values.reverse_martingale_metadata as unknown,
        },
        reverse_martingale_reset_strategy_section: {
          reverse_reset_win_streak: values.reverse_reset_win_streak as
            | number
            | null,
          reverse_reset_profit_target: values.reverse_reset_profit_target,
          reverse_preserve_winnings:
            (values.reverse_preserve_winnings as boolean) || false,
          metadata: values.reverse_reset_metadata as unknown,
        },
        reverse_dalembert_strategy_section: {
          reverse_dalembert_increment: values.reverse_dalembert_increment,
          reverse_dalembert_decrement: values.reverse_dalembert_decrement,
          reverse_dalembert_max_units: values.reverse_dalembert_max_units as
            | number
            | null,
          reverse_dalembert_profit_ceiling:
            values.reverse_dalembert_profit_ceiling,
          metadata: values.reverse_dalembert_metadata as unknown,
        },
        reverse_dalembert_reset_strategy_section: {
          reverse_dalembert_reset_interval:
            values.reverse_dalembert_reset_interval as number | null,
          reverse_dalembert_dynamic_reset:
            (values.reverse_dalembert_dynamic_reset as boolean) || false,
          reverse_dalembert_win_rate_threshold:
            values.reverse_dalembert_win_rate_threshold as number | null,
          metadata: values.reverse_dalembert_reset_metadata as unknown,
        },
        accumulator_strategy_section: {
          accumulator_growth_rate: values.accumulator_growth_rate as
            | number
            | null,
          accumulator_target_multiplier:
            values.accumulator_target_multiplier as number | null,
          accumulator_auto_cashout:
            (values.accumulator_auto_cashout as boolean) || false,
          accumulator_trailing_stop:
            (values.accumulator_trailing_stop as boolean) || false,
          metadata: values.accumulator_metadata as unknown,
          accumulator_tick_duration: values.accumulator_tick_duration as
            | number
            | null,
        },
        options_martingale_section: {
          options_contract_type: values.options_contract_type as string | null,
          options_duration: values.options_duration as number | null,
          options_martingale_multiplier:
            values.options_martingale_multiplier as number | null,
          options_prediction_mode: values.options_prediction_mode as
            | string
            | null,
          metadata: values.options_martingale_metadata as unknown,
        },
        options_dalembert_section: {
          options_dalembert_contract_type:
            values.options_dalembert_contract_type as string | null,
          options_dalembert_increment: values.options_dalembert_increment,
          options_dalembert_duration: values.options_dalembert_duration as
            | number
            | null,
          metadata: values.options_dalembert_metadata as unknown,
        },
        options_reverse_martingale_section: {
          options_reverse_contract_type:
            values.options_reverse_contract_type as string | null,
          options_reverse_win_multiplier:
            values.options_reverse_win_multiplier as number | null,
          options_reverse_duration: values.options_reverse_duration as
            | number
            | null,
          options_reverse_max_streak: values.options_reverse_max_streak as
            | number
            | null,
          metadata: values.options_reverse_martingale_metadata as unknown,
        },
        system_1326_strategy_section: {
          system_1326_base_unit: values.system_1326_base_unit,
          system_1326_sequence: values.system_1326_sequence as string | null,
          system_1326_reset_on_loss:
            (values.system_1326_reset_on_loss as boolean) || false,
          system_1326_complete_cycle_target:
            values.system_1326_complete_cycle_target,
          system_1326_partial_profit_lock:
            (values.system_1326_partial_profit_lock as boolean) || false,
          system_1326_max_cycles: values.system_1326_max_cycles as
            | number
            | null,
          system_1326_progression_mode: values.system_1326_progression_mode as
            | string
            | null,
          system_1326_stop_on_cycle_complete:
            (values.system_1326_stop_on_cycle_complete as boolean) || false,
          system_1326_loss_recovery:
            (values.system_1326_loss_recovery as boolean) || false,
          system_1326_contract_type: values.system_1326_contract_type as
            | string
            | null,
          system_1326_duration: values.system_1326_duration as number | null,
          metadata: values.system_1326_metadata as unknown,
        },
        reverse_dalembert_main_strategy_section: {
          reverse_dalembert_base_stake: values.reverse_dalembert_base_stake,
          reverse_dalembert_win_increment:
            values.reverse_dalembert_win_increment,
          reverse_dalembert_loss_decrement:
            values.reverse_dalembert_loss_decrement,
          reverse_dalembert_maximum_units:
            values.reverse_dalembert_maximum_units as number | null,
          reverse_dalembert_minimum_units:
            values.reverse_dalembert_minimum_units as number | null,
          reverse_dalembert_profit_ceiling:
            values.reverse_dalembert_profit_ceiling,
          reverse_dalembert_reset_trigger:
            values.reverse_dalembert_reset_trigger as string | null,
          reverse_dalembert_aggressive_mode:
            (values.reverse_dalembert_aggressive_mode as boolean) || false,
          reverse_dalembert_win_streak_bonus:
            values.reverse_dalembert_win_streak_bonus as number | null,
          reverse_dalembert_contract_type:
            values.reverse_dalembert_contract_type as string | null,
          reverse_dalembert_duration: values.reverse_dalembert_duration as
            | number
            | null,
          metadata: values.reverse_dalembert_metadata as unknown,
        },
        oscars_grind_strategy_section: {
          oscars_grind_base_unit: values.oscars_grind_base_unit,
          oscars_grind_profit_target: values.oscars_grind_profit_target,
          oscars_grind_increment_on_win:
            (values.oscars_grind_increment_on_win as boolean) || false,
          oscars_grind_max_bet_units: values.oscars_grind_max_bet_units as
            | number
            | null,
          oscars_grind_reset_on_target:
            (values.oscars_grind_reset_on_target as boolean) || false,
          oscars_grind_session_limit: values.oscars_grind_session_limit as
            | number
            | null,
          oscars_grind_loss_limit: values.oscars_grind_loss_limit,
          oscars_grind_progression_speed:
            values.oscars_grind_progression_speed as string | null,
          oscars_grind_maintain_stake_on_loss:
            (values.oscars_grind_maintain_stake_on_loss as boolean) || false,
          oscars_grind_partial_target:
            (values.oscars_grind_partial_target as boolean) || false,
          oscars_grind_contract_type: values.oscars_grind_contract_type as
            | string
            | null,
          oscars_grind_duration: values.oscars_grind_duration as number | null,
          oscars_grind_auto_stop_on_target:
            (values.oscars_grind_auto_stop_on_target as boolean) || false,
          metadata: values.oscars_grind_metadata || null,
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
        currentStake: 0,
        baseStake: 0,
        highestStake: 0,
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
        highestStake: 0,
        highestPayout: 0,
        createdAt: "",
        lastUpdated: "",
      },
    };

    structuredData.botName = String(
      (form.getFieldValue("botName") ?? values.botName) || "",
    );
    structuredData.botDescription = String(
      (form.getFieldValue("botDescription") ?? values.botDescription) || "",
    );
    structuredData.botTags = Array.isArray(
      form.getFieldValue("botTags") ?? values.botTags,
    )
      ? ((form.getFieldValue("botTags") ?? values.botTags) as string[])
      : [];
    structuredData.botAccount =
      (form.getFieldValue("botAccount") ?? values.botAccount) || {};
    structuredData.botBanner = String(botBannerValue || "");
    structuredData.botThumbnail = String(botThumbnailValue || "");
    structuredData.botIcon = String(botIconValue || "");
    structuredData.isPublic = false;
    structuredData.isPremium = false;
    const botId = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    structuredData.metadata = {
      seed: botId,
    };
    return structuredData;
  }, [form, strategyId, contractParams]);

  // Helper function to log field updates
  const logFieldUpdate = useCallback(
    (fieldName: string, value: unknown, tabKey?: string) => {
      console.log(
        `[Form Update] ${tabKey ? `[${tabKey}] ` : ""}${fieldName}:`,
        value,
      );
      // Ensure the form field is updated before building structured data
      form.setFieldValue(fieldName, value);
      const structuredData = buildStructuredFormData();
      setDraftBotFormData(structuredData);
    },
    [form, buildStructuredFormData],
  );

  const [draftBotFormData, setDraftBotFormData] =
    useLocalStorage("bot-form-data");

  useEffect(() => {
    console.log("+++ FORM +++", draftBotFormData);
  }, [draftBotFormData]);

  useEffect(() => {
    console.log("adhocContractParams", { adhocContractParams });
  }, [adhocContractParams]);

  useEffect(() => {
    if (createStatus !== "success") {
      setShowConfetti(false);
      return;
    }

    const t = window.setTimeout(() => {
      setShowConfetti(true);
    }, 3000);

    return () => {
      window.clearTimeout(t);
    };
  }, [createStatus]);

  // Initialize form with editBot data when in edit mode
  useEffect(() => {
    if (isEditMode && editBot) {
      console.log("Initializing form with editBot data:", editBot);
      
      // Populate form with existing bot data
      const formValues = {
        botName: editBot.botName,
        botDescription: editBot.botDescription,
        botTags: editBot.botTags || [],
        botIcon: editBot.botIcon,
        botThumbnail: editBot.botThumbnail,
        botBanner: editBot.botBanner,
        botAccount: editBot.botAccount,
        contract: editBot.contract,
        amounts: editBot.amounts,
        recovery_steps: editBot.recovery_steps,
        advanced_settings: editBot.advanced_settings,
        // Add any other fields as needed
      };
      
      // Set form values
      form.setFieldsValue(formValues);
      
      // Set bot tags
      setBotTags(editBot.botTags || []);
      
      // Set contract params
      if (editBot.contract) {
        setContractParams(editBot.contract);
      }
      
      console.log("Form initialized with editBot data");
    }
  }, [isEditMode, editBot, form, setBotTags, setContractParams]);

  // Render field based on type
  const renderField = (field: FieldConfig) => {
    const getPlaceholder = () => {
      if (field.name === "amount") {
        return "Enter base stake amount";
      }
      return `Enter ${field.label.toLowerCase()}`;
    };

    const commonProps = {
      label: field.label,
      placeholder: getPlaceholder(),
    };

    switch (field.type) {
      case "heading":
        return (
          <Card className="field-heading" size="small">
            <Title level={4} className="heading-title">
              {field.label}
            </Title>
          </Card>
        );

      case "risk-management":
        return (
          <StepsComponent
            settings={form.getFieldValue(field.name) || []}
            onSettingsChange={(newValue) => {
              form.setFieldValue(field.name, newValue);
              logFieldUpdate(field.name, newValue, "recovery_steps");
            }}
            title="Recovery Steps"
            addButtonText="Add Recovery Step"
            showButton
          />
        );

      case "bot-schedule":
        return (
          <Card className="field-heading" size="small">
            <div className="field-label-row">
              <Title level={4} className="heading-title">
                {field.label}
              </Title>
            </div>
            <BotSchedule
              value={
                (watchedBotSchedule || form.getFieldValue(field.name)) as any
              }
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, "advanced_settings");
              }}
            />
          </Card>
        );

      case "duration-selector-with-heading":
        return (
          <Card className="field-heading" size="small">
            <Title level={4} className="heading-title">
              {field.label}
            </Title>
            <div className="duration-selector-in-card">
              <DurationSelector
                onChange={(value) => {
                  form.setFieldValue(field.name, value);
                  logFieldUpdate(field.name, value, "basicSettings");
                }}
              />
            </div>
          </Card>
        );

      case "contract-params":
        return (
          <>
            <StepsComponent
              settings={adhocContractParams}
              onSettingsChange={(params) => {
                if (Array.isArray(params)) {
                  if (params.length > 0) {
                    form.setFieldValue(field.name, params[0]);
                    logFieldUpdate(field.name, params[0], "contract");
                    setAdhocContractParams(params);
                  }
                }
              }}
              title={field.label}
            />
            {/**
          <Card className="field-heading" size="small">
            <Title level={4} className="heading-title">
              {field.label}
            </Title>
            <div className="contract-params-in-card">
              <ContractParams
                defaultValues={defaultContractValues}
                currentValue={watchedContract || defaultContractValues}
                onContractParamsChange={(params) => {
                  form.setFieldValue(field.name, params);
                  setContractParams(params);
                  logFieldUpdate(field.name, params, 'contract');
                }}
                updateStep={() => { }}
              />
            </div>
          </Card> 
          */}
          </>
        );

      case "duration-selector":
        return (
          <DurationSelector
            {...commonProps}
            value={form.getFieldValue(field.name)}
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, "basicSettings");
            }}
          />
        );

      case "threshold-selector":
        return (
          <ThresholdSelector
            label={field.label}
            value={form.getFieldValue(field.name)}
            onChange={(value) => {
              form.setFieldValue(field.name, value);
              logFieldUpdate(field.name, value, "amounts");
            }}
            fixedPlaceholder={field.placeholder || "Enter fixed amount"}
            percentagePlaceholder={`Enter percentage of balance for ${field.label.toLowerCase()}`}
            fixedHelperText={`Enter a fixed ${field.label.toLowerCase()} amount`}
            percentageHelperText={`${field.label} will be calculated as a percentage of your account balance`}
          />
        );

      case "select":
        return (
          <div className="select-field">
            <label className="input-field-label">{field.label}</label>
            <Select
              placeholder={commonProps.placeholder}
              options={field.options}
              value={form.getFieldValue(field.name)}
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value);
              }}
              style={{ width: "100%" }}
              size="large"
            />
          </div>
        );

      case "number-prefix":
        return (
          <Card className="field-heading" size="small">
            <InputField
              {...commonProps}
              type="number-prefix"
              value={form.getFieldValue(field.name)}
              suffix={
                field.prefixType === "currency"
                  ? "$"
                  : field.prefixType === "percentage"
                    ? "%"
                    : field.prefixType === "multiplier"
                      ? "×"
                      : ""
              }
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, "basicSettings");
              }}
            />
          </Card>
        );

      case "number":
        return (
          <Card className="field-heading" size="small">
            <InputField
              {...commonProps}
              type="number"
              value={form.getFieldValue(field.name)}
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, "basicSettings");
              }}
            />
          </Card>
        );

      case "switch-with-helper":
        return (
          <Card className="field-heading" size="small">
            <Flex
              justify="space-between"
              align="center"
              style={{ width: "100%" }}
            >
              <span>{field.label}</span>
              <Switch
                checked={!!form.getFieldValue(field.name)}
                onChange={(value) => {
                  form.setFieldValue(field.name, value);
                  logFieldUpdate(field.name, value, "execution");
                }}
              />
            </Flex>
          </Card>
        );

      case "recovery-type":
        return (
          <Card className="field-heading" size="small">
            <div className="field-label-row">
              <Title level={4} className="heading-title">
                {field.label}
              </Title>
            </div>
            <Segmented
              block
              options={[
                { label: "Conservative", value: "conservative" },
                { label: "Neutral", value: "neutral" },
                { label: "Aggressive", value: "aggressive" },
              ]}
              onChange={(value) => {
                form.setFieldValue(field.name, value);
                logFieldUpdate(field.name, value, "execution");
              }}
            />
            <div className="recovery-type-description">
              <span className="description-text">
                Controls how quickly the bot recovers from losses
              </span>
            </div>
          </Card>
        );

      case "cooldown-period":
        return (
          <Card className="field-heading" size="small">
            <div className="field-label-row">
              <Title level={4} className="heading-title">
                {field.label}
              </Title>
            </div>
            <Flex justify="space-between" align="center" gap={12}>
              <InputField
                type="number"
                placeholder="Duration"
                onChange={(value) => {
                  const newValue = {
                    duration: value,
                    unit: form.getFieldValue(field.name)?.unit || "seconds",
                  };
                  form.setFieldValue(field.name, newValue);
                  logFieldUpdate(field.name, newValue, "execution");
                }}
              />
              <Segmented
                style={{ width: 200 }}
                block
                options={[
                  { label: "Sec", value: "seconds" },
                  { label: "Min", value: "minutes" },
                  { label: "Hour", value: "hours" },
                ]}
                defaultValue="seconds"
                onChange={(value) => {
                  const newValue = {
                    duration: form.getFieldValue(field.name)?.duration || 0,
                    unit: value,
                  };
                  form.setFieldValue(field.name, newValue);
                  logFieldUpdate(field.name, newValue, "execution");
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

      case "max-trades-control":
        return (
          <div className="max-trades-field">
            <div className="field-label-row">
              <span className="field-label">{field.label}</span>
              <LabelPairedCircleQuestionMdBoldIcon
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
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
              <span className="trades-value">
                {form.getFieldValue(field.name) || 1}
              </span>
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

      case "trade-interval":
        return (
          <div className="trade-interval-field">
            <div className="field-label-row">
              <span className="field-label">{field.label}</span>
              <LabelPairedCircleQuestionMdBoldIcon
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              />
            </div>
            <div className="interval-controls">
              <InputField
                type="number"
                placeholder="Enter interval"
                onChange={(value) =>
                  form.setFieldValue(field.name, {
                    interval: value,
                    unit: form.getFieldValue(field.name)?.unit || "seconds",
                  })
                }
              />
              <Segmented
                options={[
                  { label: "Sec", value: "seconds" },
                  { label: "Min", value: "minutes" },
                ]}
                defaultValue="seconds"
                onChange={(value) =>
                  form.setFieldValue(field.name, {
                    interval: form.getFieldValue(field.name)?.interval || 0,
                    unit: value,
                  })
                }
              />
            </div>
            <div className="interval-description">
              <span className="description-text">
                Minimum time between starting new trades
              </span>
            </div>
          </div>
        );

      case "collapsible-section":
        return (
          <Collapse
            ghost
            accordion
            items={[
              {
                key: field.name,
                label: (
                  <div className="collapsible-header">
                    <Title level={4} className="collapsible-title">
                      {field.label}
                    </Title>
                  </div>
                ),
                children: (
                  <div className="collapsible-content">
                    {field.fields?.map((childField) => (
                      <Form.Item
                        key={childField.name}
                        name={childField.name}
                        className={`${childField.type}-item`}
                      >
                        {renderField(childField)}
                      </Form.Item>
                    ))}
                  </div>
                ),
              },
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

  const handleSubmit = async () => {
    // Log the full structured form data
    console.log("[Form Submit] Structured Strategy Data:", draftBotFormData);
    try {
      setCreateStatus("loading");
      setCreateError(null);

      // Save bot to localStorage

      const payload = sanitizeCreateBotPayload(
        draftBotFormData as StrategyFormData,
      );
      console.log("[Form Submit] Sanitized Payload:", payload);

      let result;
      
      if (isEditMode && editBot) {
        // Update existing bot
        console.log("[Form Submit] Updating bot:", editBot.botUUID);
        result = await tradingBotAPIService.updateBot(editBot.botUUID, payload as any);
        console.log("[Bot Update Result]", result);
      } else {
        // Create new bot
        console.log("[Form Submit] Creating new bot");
        result = await tradingBotAPIService.createBot(payload as any);
        console.log("[Bot Create Result]", result);
      }

      if ((result as any)?.success) {
        setCreatedBot((result as any).data);
        setCreateStatus("success");
      } else {
        setCreateStatus("error");
        setCreateError((result as any)?.message || `Failed to ${isEditMode ? 'update' : 'create'} bot`);
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} bot:`, error);
      setCreateStatus("error");
      setCreateError(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? 'update' : 'create'} bot. Please try again.`,
      );
    }
  };

  const handleReset = () => {
    form.resetFields();
  };

  const resetAllState = useCallback(() => {
    form.resetFields();
    setCreateStatus("idle");
    setCreateError(null);
    setCreatedBot(null);
    setShowConfetti(false);
    setFormStep("info");
    setBotTags(isEditMode ? editBot?.botTags || [] : []);
    setTagInputValue("");
    setContractParams({} as ContractData);
    setDraftBotFormData(null);
  }, [editBot?.botTags, form, isEditMode, setDraftBotFormData]);

  const handleClose = useCallback(() => {
    resetAllState();
    onBack?.();
  }, [onBack, resetAllState]);

  return (
    <TradeErrorBoundary onReset={handleReset}>
      <div className="strategy-form-container">
        <div className="strategy-form-header">
          <div className="header-left">
            <Button
              type="text"
              icon={<LabelPairedArrowLeftMdBoldIcon />}
              className="back-button"
              onClick={createStatus === "success" ? handleClose : undefined}
              disabled={createStatus !== "success"}
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

        {createStatus === "success" ? (
          <div className="bot-create-success">
            {showConfetti && (
              <Confetti
                mode="boom"
                particleCount={220}
                spreadDeg={80}
                effectCount={1}
              />
            )}
            <div className="bot-summary-glass">
              <div className="bot-summary-banner">
                {createdBot?.botBanner ? (
                  <img
                    src={createdBot.botBanner}
                    alt={createdBot?.botName || "Bot banner"}
                  />
                ) : (
                  <div className="bot-summary-banner-placeholder" />
                )}
              </div>
              <div className="bot-summary-body">
                <Typography.Title level={3} className="bot-summary-title">
                  {createdBot?.botName ||
                    draftBotFormData?.botName ||
                    "New Bot"}
                </Typography.Title>
                {Array.isArray(createdBot?.botTags) &&
                  createdBot.botTags.length > 0 && (
                    <div className="bot-summary-tags">
                      {createdBot.botTags.map((tag: string, i: number) => (
                        <span className="bot-summary-tag" key={`${tag}-${i}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        ) : (
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            className="strategy-form modern-form"
            initialValues={{
              botName: "Test-01",
              tradeType: "Rise",
              market: "Volatility 100 (1s) Index",
              initialStake: 10,
              repeatTrade: 2,
            }}
          >
            {formStep === "info" && (
              <Card className="field-heading" size="small">
                <Form.Item
                  label="Bot Name"
                  name="botName"
                  style={{ marginBottom: 24 }}
                  rules={[
                    {
                      required: true,
                      message: "Please enter the name of the bot",
                    },
                    () => ({
                      validator(_, value) {
                        if (value.length > 8) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Bot name must be at least 8 characters"),
                        );
                      },
                    }),
                  ]}
                >
                  <div className="bot-tags-input-container">
                    <Input
                      value={String(watchedBotName ?? "")}
                      placeholder="Enter The Bot Name"
                      size="large"
                      onChange={(e) => {
                        form.setFieldValue("botName", e.target.value);
                        logFieldUpdate("botName", e.target.value, "botInfo");
                      }}
                    />
                  </div>
                </Form.Item>

                <Form.Item
                  label="Bot Description"
                  name="botDescription"
                  style={{ marginBottom: 24 }}
                  rules={[
                    {
                      required: true,
                      message: "Please enter the description of the bot",
                    },
                    () => ({
                      validator(_, value) {
                        if (value.length > 16) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(
                            "Bot description must be at least 16 characters",
                          ),
                        );
                      },
                    }),
                  ]}
                >
                  <div className="bot-tags-input-container">
                    <Input
                      value={String(watchedBotDescription ?? "")}
                      placeholder="Enter The Bot Description"
                      size="large"
                      onChange={(e) => {
                        form.setFieldValue("botDescription", e.target.value);
                        logFieldUpdate(
                          "botDescription",
                          e.target.value,
                          "botInfo",
                        );
                      }}
                    />
                  </div>
                </Form.Item>

                <Form.Item
                  label="Bot Tags"
                  name="botTags"
                  style={{ marginBottom: 24 }}
                  rules={[
                    {
                      required: true,
                      message: "Please enter at least one bot tag",
                    },
                    () => ({
                      validator(_, value) {
                        if (value && value.length > 0) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error("Please add at least one tag"),
                        );
                      },
                    }),
                  ]}
                >
                  <div className="bot-tags-input-container">
                    <div className="bot-tags-list">
                      {botTags.map((tag, index) => (
                        <Tag
                          key={`${tag}-${index}`}
                          closable
                          onClose={() => {
                            const newTags = botTags.filter(
                              (_, i) => i !== index,
                            );
                            setBotTags(newTags);
                            logFieldUpdate("botTags", newTags, "botInfo");
                          }}
                          className="bot-tag"
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                    <Input
                      value={tagInputValue}
                      placeholder={
                        botTags.length === 0
                          ? "Type tags separated by commas"
                          : "Add another tag..."
                      }
                      size="large"
                      className="bot-name-input no-border-no-bg"
                      onChange={(e) => setTagInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        const commitTagsFromInput = () => {
                          const chunks = tagInputValue
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean);

                          if (chunks.length === 0) {
                            return;
                          }

                          const next = [...botTags];
                          for (const t of chunks) {
                            if (!next.includes(t)) {
                              next.push(t);
                            }
                          }

                          setBotTags(next);
                          setTagInputValue("");
                          logFieldUpdate("botTags", next, "botInfo");
                        };

                        if (e.key === "," || e.key === "Enter") {
                          e.preventDefault();
                          commitTagsFromInput();
                        }
                        if (
                          e.key === "Backspace" &&
                          tagInputValue === "" &&
                          botTags.length > 0
                        ) {
                          const newTags = botTags.slice(0, -1);
                          setBotTags(newTags);
                          logFieldUpdate("botTags", newTags, "botInfo");
                        }
                      }}
                    />
                  </div>
                </Form.Item>

                <Form.Item
                  label="Select Trading Account"
                  name="botAccount"
                  style={{ marginBottom: 24 }}
                >
                  <TradingAccountSelector
                    value={watchedBotAccount as any}
                    onChange={(account) => {
                      const accountData = {
                        currency: account.currency,
                        id: account.id,
                        token: account.token,
                        balance: account.balance,
                        isVirtual: account.isVirtual,
                      };
                      form.setFieldValue("botAccount", accountData);
                      form.setFieldValue("botCurrency", account.currency);
                      logFieldUpdate("botAccount", accountData, "botInfo");
                      logFieldUpdate(
                        "botCurrency",
                        account.currency,
                        "botInfo",
                      );
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="Bot Banner Image"
                  name="botBanner"
                  style={{ marginBottom: 0 }}
                >
                  <BotBannerUpload
                    value={String(watchedBotBanner ?? "")}
                    onChange={(url) => {
                      // Set banner URL and automatically set icon and thumbnail with size parameters
                      if (url) {
                        const iconUrl = `${url}?size=64`;
                        const thumbnailUrl = `${url}?size=256`;
                        // Batch all field updates together for synchronous state update
                        form.setFieldsValue({
                          botBanner: url,
                          botIcon: iconUrl,
                          botThumbnail: thumbnailUrl,
                        });
                        console.log(`[Form Update] [botInfo] botBanner:`, url);
                        console.log(
                          `[Form Update] [botInfo] botIcon:`,
                          iconUrl,
                        );
                        console.log(
                          `[Form Update] [botInfo] botThumbnail:`,
                          thumbnailUrl,
                        );
                        setTimeout(() => {
                          const structuredData = buildStructuredFormData();
                          setDraftBotFormData(structuredData);
                        }, 500);
                      } else {
                        form.setFieldsValue({
                          botBanner: "",
                          botIcon: "",
                          botThumbnail: "",
                        });
                        console.log(`[Form Update] [botInfo] botBanner:`, "");
                        console.log(`[Form Update] [botInfo] botIcon:`, "");
                        console.log(
                          `[Form Update] [botInfo] botThumbnail:`,
                          "",
                        );
                        const structuredData = buildStructuredFormData();
                        setDraftBotFormData(structuredData);
                      }
                    }}
                  />
                </Form.Item>
              </Card>
            )}

            {/* Render tabbed fields from config */}
            {formStep === "configure" &&
              (config?.tabs ? (
                <Tabs
                  defaultActiveKey="advanced"
                  items={config.tabs.map((tab) => {
                    // Use filtered fields for advanced-settings tab
                    const fieldsToRender =
                      tab.key === "advanced-settings"
                        ? getFilteredAdvancedSettingsFields()
                        : tab.fields;

                    return {
                      key: tab.key,
                      label: tab.label,
                      children: (
                        <>
                          {tab.key === "amounts" ? (
                            <Collapse
                              className="risk-accordion"
                              size="small"
                              activeKey={["1"]}
                              collapsible="disabled"
                            >
                              <Collapse.Panel
                                key="1"
                                className="risk-step-panel"
                                showArrow={false}
                                header={
                                  <div className="step-header">
                                    <span
                                      className="step-title"
                                      title="Stake, Profits & Losses"
                                    >
                                      Stake, Profits & Losses
                                    </span>
                                  </div>
                                }
                              >
                                {fieldsToRender.map((field) => {
                                  if (field.type === "collapsible-section") {
                                    return renderField(field);
                                  }
                                  return (
                                    <Form.Item
                                      key={field.name}
                                      name={field.name}
                                      className={`${tab.key} ${field.type}-item`}
                                    >
                                      {renderField(field)}
                                    </Form.Item>
                                  );
                                })}
                              </Collapse.Panel>
                            </Collapse>
                          ) : (
                            <div>
                              {fieldsToRender.map((field) => {
                                if (field.type === "collapsible-section") {
                                  return renderField(field);
                                }
                                return (
                                  <Form.Item
                                    key={field.name}
                                    name={field.name}
                                    className={`${tab.key} ${field.type}-item`}
                                  >
                                    {renderField(field)}
                                  </Form.Item>
                                );
                              })}
                            </div>
                          )}
                        </>
                      ),
                    };
                  })}
                />
              ) : (
                /* Render flat fields for backward compatibility */
                <>
                  {config?.fields?.map((field) => {
                    if (field.type === "collapsible-section") {
                      return renderField(field);
                    }
                    return (
                      <Form.Item
                        key={field.name}
                        name={field.name}
                        className={`${field.type}-item`}
                      >
                        {renderField(field)}
                      </Form.Item>
                    );
                  })}
                </>
              ))}
          </Form>
        )}

        <div className="form-footer">
          <Flex gap={12} style={{ width: "100%" }}>
            {createStatus === "success" ? (
              <Button
                type="primary"
                block
                className="create-button"
                onClick={handleClose}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  type="default"
                  block
                  className="configure-button"
                  onClick={() =>
                    setFormStep(formStep === "info" ? "configure" : "info")
                  }
                  disabled={createStatus === "loading"}
                >
                  {formStep === "info" ? "Configure Bot" : "Edit Bot Info"}
                </Button>
                <div className="create-button-wrapper">
                  {!canCreateBot && (
                    <div
                      className="create-button-overlay"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showMissingCreateRequirements();
                      }}
                    />
                  )}
                  <Button
                    type="primary"
                    block
                    className="create-button"
                    onClick={() => {
                      if (canCreateBot) {
                        form.submit();
                      }
                    }}
                    disabled={!canCreateBot}
                  >
                    {createStatus === "loading" ? (
                      <span className="create-bot-loading">
                        <span className="create-bot-loading-text">
                          Creating
                        </span>
                        <span className="loading-dots" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>
                      </span>
                    ) : createStatus === "error" ? (
                      "Retry"
                    ) : isEditMode ? (
                      "Update bot"
                    ) : (
                      "Create bot"
                    )}
                  </Button>
                </div>
              </>
            )}
          </Flex>
          {createStatus === "error" && createError && (
            <div className="create-bot-error">{createError}</div>
          )}
        </div>
      </div>
    </TradeErrorBoundary>
  );
}
