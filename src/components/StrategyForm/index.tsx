import { Form, Button, Segmented, Select, Tabs, Typography, Card, Switch, Flex, Collapse } from "antd";
import { BottomActionSheet } from "../BottomActionSheet";
import { DownOutlined } from "@ant-design/icons";
import { InputField } from "../InputField";
import { DurationSelector } from "../DurationSelector";
import { ProfitThreshold, ThresholdSelector } from "../ProfitThreshold";
import { StepsComponent } from "../StepsComponent";
import { ContractParams } from "../ContractParams";
import { Schedules } from "../Schedules";
import {
  LabelPairedArrowLeftMdBoldIcon,
  LabelPairedCircleQuestionMdBoldIcon,
  MarketDerivedVolatility1001sIcon,
} from "@deriv/quill-icons";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TradeErrorBoundary } from "../ErrorBoundary/TradeErrorBoundary";
import { MarketInfo } from "../../types/market";
import MarketSelector from "../MarketSelector";
import "./styles.scss";

import { FormValues, StrategyFormProps, FieldConfig } from "../../types/form";

// Interface for the structured strategy form data
interface StrategyFormData {
  contract: {
    tick_duration: { duration: number; unit: string } | null;
  };
  amounts: {
    base_stake: unknown;
    maximum_stake: unknown;
    take_profit: unknown;
    stop_loss: unknown;
  };
  'recovery-steps': {
    risk_steps: unknown;
  };
  'advanced-settings': {
    general_settings_section: {
      bot_schedules: unknown;
      number_of_trades: number | null;
      maximum_stake: number | null;
      recovery_type: string | null;
      cooldown_period: { duration: number; unit: string } | null;
      compound_stake: boolean;
      stop_on_loss_streak: boolean;
      auto_restart: boolean;
    };
    risk_management_section: {
      max_drawdown_percentage: unknown;
      max_consecutive_losses: unknown;
      daily_loss_limit: unknown;
      risk_per_trade: unknown;
      risk_reward_ratio: unknown;
      maximum_exposure: unknown;
      portfolio_heat_check: unknown;
      margin_call_buffer: unknown;
      correlation_limit: unknown;
    };
    profit_targets_section: {
      profit_target_daily: unknown;
      trailing_stop_loss: unknown;
      breakeven_after_profit: unknown;
      confidence_threshold: unknown;
    };
    market_filters_section: {
      volatility_threshold: unknown;
      safe_zone_upper: unknown;
      safe_zone_lower: unknown;
      market_condition_filter: unknown;
      sentiment_filter: unknown;
      economic_calendar_filter: boolean;
      news_impact_filter: unknown;
      geopolitical_risk_filter: boolean;
    };
    technical_indicators_section: {
      rsi_overbought: unknown;
      rsi_oversold: unknown;
      macd_signal_threshold: unknown;
      bollinger_band_width: unknown;
      momentum_threshold: unknown;
      volume_spike_threshold: unknown;
    };
    advanced_analysis_section: {
      price_action_confirmation: boolean;
      multi_timeframe_analysis: boolean;
      pattern_recognition: boolean;
      support_resistance_levels: boolean;
      fibonacci_retracement: boolean;
      order_book_analysis: boolean;
      market_microstructure: boolean;
      regime_detection: boolean;
      seasonal_adjustments: boolean;
    };
    execution_control_section: {
      liquidity_threshold: unknown;
      spread_tolerance: unknown;
      slippage_tolerance: unknown;
      execution_delay_limit: unknown;
      partial_fill_handling: unknown;
      liquidity_hunting_protection: boolean;
    };
    position_sizing_section: {
      adaptive_sizing: boolean;
      quantile_based_sizing: boolean;
      kelly_criterion_sizing: boolean;
      volatility_normalized_sizing: boolean;
    };
    ai_machine_learning_section: {
      machine_learning_signals: boolean;
      reinforcement_learning: boolean;
      neural_network_signals: boolean;
      ensemble_predictions: boolean;
      regime_switching_model: boolean;
    };
    market_intelligence_section: {
      social_sentiment_integration: boolean;
      whale_activity_monitoring: boolean;
      dark_pool_analysis: boolean;
      cross_market_correlation: boolean;
    };
    advanced_strategies_section: {
      dynamic_hedging: boolean;
      arbitrage_detection: boolean;
      strategy_rotation: boolean;
      auto_parameter_tuning: boolean;
    };
    optimization_section: {
      gas_fee_optimization: boolean;
      tax_optimization: boolean;
      quantum_computing_optimization: boolean;
    };
    monitoring_control_section: {
      time_restriction: boolean;
      performance_monitoring: boolean;
      backtesting_mode: boolean;
      performance_degradation_detection: boolean;
      emergency_stop: boolean;
    };
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
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<MarketInfo>();
  const navigate = useNavigate();
  const isEditMode = !!editBot;

  const { Title } = Typography;

  // Function to build the structured form data object
  const buildStructuredFormData = useCallback((): StrategyFormData => {
    const values = form.getFieldsValue();
    
    const structuredData: StrategyFormData = {
      contract: {
        tick_duration: values.tick_duration,
      },
      amounts: {
        base_stake: values.base_stake,
        maximum_stake: values.maximum_stake,
        take_profit: values.take_profit,
        stop_loss: values.stop_loss,
      },
      'recovery-steps': {
        risk_steps: values.risk_steps,
      },
      'advanced-settings': {
        general_settings_section: {
          bot_schedules: values.bot_schedules,
          number_of_trades: values.number_of_trades as number | null,
          maximum_stake: values.maximum_stake as number | null,
          recovery_type: values.recovery_type as string | null,
          cooldown_period: values.cooldown_period as { duration: number; unit: string } | null,
          compound_stake: values.compound_stake as boolean || false,
          stop_on_loss_streak: values.stop_on_loss_streak as boolean || false,
          auto_restart: values.auto_restart as boolean || false,
        },
        risk_management_section: {
          max_drawdown_percentage: values.max_drawdown_percentage,
          max_consecutive_losses: values.max_consecutive_losses,
          daily_loss_limit: values.daily_loss_limit,
          risk_per_trade: values.risk_per_trade,
          risk_reward_ratio: values.risk_reward_ratio,
          maximum_exposure: values.maximum_exposure,
          portfolio_heat_check: values.portfolio_heat_check,
          margin_call_buffer: values.margin_call_buffer,
          correlation_limit: values.correlation_limit,
        },
        profit_targets_section: {
          profit_target_daily: values.profit_target_daily,
          trailing_stop_loss: values.trailing_stop_loss,
          breakeven_after_profit: values.breakeven_after_profit,
          confidence_threshold: values.confidence_threshold,
        },
        market_filters_section: {
          volatility_threshold: values.volatility_threshold,
          safe_zone_upper: values.safe_zone_upper,
          safe_zone_lower: values.safe_zone_lower,
          market_condition_filter: values.market_condition_filter,
          sentiment_filter: values.sentiment_filter,
          economic_calendar_filter: values.economic_calendar_filter as boolean || false,
          news_impact_filter: values.news_impact_filter,
          geopolitical_risk_filter: values.geopolitical_risk_filter as boolean || false,
        },
        technical_indicators_section: {
          rsi_overbought: values.rsi_overbought,
          rsi_oversold: values.rsi_oversold,
          macd_signal_threshold: values.macd_signal_threshold,
          bollinger_band_width: values.bollinger_band_width,
          momentum_threshold: values.momentum_threshold,
          volume_spike_threshold: values.volume_spike_threshold,
        },
        advanced_analysis_section: {
          price_action_confirmation: values.price_action_confirmation as boolean || false,
          multi_timeframe_analysis: values.multi_timeframe_analysis as boolean || false,
          pattern_recognition: values.pattern_recognition as boolean || false,
          support_resistance_levels: values.support_resistance_levels as boolean || false,
          fibonacci_retracement: values.fibonacci_retracement as boolean || false,
          order_book_analysis: values.order_book_analysis as boolean || false,
          market_microstructure: values.market_microstructure as boolean || false,
          regime_detection: values.regime_detection as boolean || false,
          seasonal_adjustments: values.seasonal_adjustments as boolean || false,
        },
        execution_control_section: {
          liquidity_threshold: values.liquidity_threshold,
          spread_tolerance: values.spread_tolerance,
          slippage_tolerance: values.slippage_tolerance,
          execution_delay_limit: values.execution_delay_limit,
          partial_fill_handling: values.partial_fill_handling,
          liquidity_hunting_protection: values.liquidity_hunting_protection as boolean || false,
        },
        position_sizing_section: {
          adaptive_sizing: values.adaptive_sizing as boolean || false,
          quantile_based_sizing: values.quantile_based_sizing as boolean || false,
          kelly_criterion_sizing: values.kelly_criterion_sizing as boolean || false,
          volatility_normalized_sizing: values.volatility_normalized_sizing as boolean || false,
        },
        ai_machine_learning_section: {
          machine_learning_signals: values.machine_learning_signals as boolean || false,
          reinforcement_learning: values.reinforcement_learning as boolean || false,
          neural_network_signals: values.neural_network_signals as boolean || false,
          ensemble_predictions: values.ensemble_predictions as boolean || false,
          regime_switching_model: values.regime_switching_model as boolean || false,
        },
        market_intelligence_section: {
          social_sentiment_integration: values.social_sentiment_integration as boolean || false,
          whale_activity_monitoring: values.whale_activity_monitoring as boolean || false,
          dark_pool_analysis: values.dark_pool_analysis as boolean || false,
          cross_market_correlation: values.cross_market_correlation as boolean || false,
        },
        advanced_strategies_section: {
          dynamic_hedging: values.dynamic_hedging as boolean || false,
          arbitrage_detection: values.arbitrage_detection as boolean || false,
          strategy_rotation: values.strategy_rotation as boolean || false,
          auto_parameter_tuning: values.auto_parameter_tuning as boolean || false,
        },
        optimization_section: {
          gas_fee_optimization: values.gas_fee_optimization as boolean || false,
          tax_optimization: values.tax_optimization as boolean || false,
          quantum_computing_optimization: values.quantum_computing_optimization as boolean || false,
        },
        monitoring_control_section: {
          time_restriction: values.time_restriction as boolean || false,
          performance_monitoring: values.performance_monitoring as boolean || false,
          backtesting_mode: values.backtesting_mode as boolean || false,
          performance_degradation_detection: values.performance_degradation_detection as boolean || false,
          emergency_stop: values.emergency_stop as boolean || false,
        },
      },
    };

    return structuredData;
  }, [form]);

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

  useEffect(()=>{
    const structuredData = buildStructuredFormData();
    console.log("+++ FORM", structuredData);
  },[form, buildStructuredFormData])

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
          <StepsComponent
            settings={form.getFieldValue(field.name) || []}
            onSettingsChange={(newValue) => {
              form.setFieldValue(field.name, newValue);
              logFieldUpdate(field.name, newValue, 'recovery_steps');
            }}
            title="Recovery Steps"
            addButtonText="Add Recovery Step"
          />
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
                step={{
                  id: 'default-step',
                  marketType: 'DIGITS',
                  contractType: 'DIGITUNDER',
                  prediction: '8',
                  predictionRandomize: false,
                  market: 'Volatility 100 (1s) Index',
                  marketRandomize: false,
                  multiplier: 3.125,
                  delay: 1
                }}
                updateStep={(stepId, field, value) => {
                  console.log(`ContractParams update: ${field} = ${value}`);
                  logFieldUpdate(field.name, value, 'contract');
                }}
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
            <Flex justify="space-between" align="center" style={{width: "100%"}} >
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
              /><Segmented style={{width: 200}}
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

  // Set initial form values when in edit mode
  useEffect(() => {
    if (isEditMode && editBot) {
      // Find param values from the bot
      const repeatTradeParam = editBot.params.find(param => param.key === "repeat_trade");
      const initialStakeParam = editBot.params.find(param => param.key === "initial_stake");
      
      // Set form values
      form.setFieldsValue({
        botName: editBot.name,
        tradeType: editBot.tradeType,
        market: editBot.market,
        repeatTrade: repeatTradeParam ? repeatTradeParam.value : 2,
        initialStake: initialStakeParam ? initialStakeParam.value : 10,
      });
    }
  }, [isEditMode, editBot, form]);

  const handleSubmit = async (values: FormValues) => {
    // Log the full structured form data
    const structuredFormData = logFullFormData();
    console.log('[Form Submit] Structured Strategy Data:', structuredFormData);
    
    // Bot functionality has been removed - just log the strategy data
    console.log("Strategy submitted:", values);
    
    try {
      setIsSubmitting(true);
      
      // Close drawer and navigate back
      onBack?.();
      
    } catch (error) {
      console.error("Failed to process strategy:", error);
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

        <h1 className="strategy-title">{strategyType} strategy</h1>

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
          <Form.Item name="botName">
            <InputField
              label="Bot name"
              type="text"
              className="bot-name-input"
            />
          </Form.Item>

          {/* Render tabbed fields from config */}
          {config?.tabs ? (
            <Tabs
              defaultActiveKey="advanced"
              items={config.tabs.map((tab) => ({
                key: tab.key,
                label: tab.label,
                children: (
                  <div>
                    {tab.fields.map((field) => {
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
              }))}
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

      {/* Market Selector */}
      <BottomActionSheet
        isOpen={showMarketSelector}
        onClose={() => setShowMarketSelector(false)}
        className="market-selector-drawer"
        height="80vh"
      >
        <MarketSelector
          onSelectMarket={(market) => {
            setSelectedMarket(market);
            form.setFieldsValue({ market: market.displayName });
            setShowMarketSelector(false);
          }}
          selectedMarket={selectedMarket}
        />
      </BottomActionSheet>
    </TradeErrorBoundary>
  );
}
