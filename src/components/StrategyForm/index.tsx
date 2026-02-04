import { Form, Button, Segmented, Select, Tabs, Typography, Card, Switch, Flex, Collapse } from "antd";
import { InputField } from "../InputField";
import { DurationSelector } from "../DurationSelector";
import { ThresholdSelector } from "../ProfitThreshold";
import { StepsComponent } from "../StepsComponent";
import { ContractParams } from "../ContractParams";
import { Schedules } from "../Schedules";
import {
  LabelPairedArrowLeftMdBoldIcon,
  LabelPairedCircleQuestionMdBoldIcon,
} from "@deriv/quill-icons";
import { useState, useEffect, useCallback } from "react";
import { TradeErrorBoundary } from "../ErrorBoundary/TradeErrorBoundary";
import "./styles.scss";

import { FormValues, StrategyFormProps, FieldConfig } from "../../types/form";
import { ContractData } from "../../types/strategy";

// Interface for the structured strategy form data
interface StrategyFormData {
  strategyId: string;
  contract: ContractData;
  amounts: {
    base_stake: unknown;
    maximum_stake: unknown;
    take_profit: unknown;
    stop_loss: unknown;
  };
  'recovery-steps': {
    risk_steps: any;
  };
  'advanced-settings': {
      bot_schedules: unknown;
    general_settings_section: {
      maximum_number_of_trades: number | null;
      maximum_running_time: number | null;
      cooldown_period: { duration: number; unit: string } | null;
      recovery_type: string | null;
      compound_stake: boolean;
      auto_restart: boolean;
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
  const isEditMode = !!editBot;

  const { Title } = Typography;

  const [contractParams, setContractParams] = useState<ContractData>({} as ContractData);

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
      'recovery-steps': {
        risk_steps: values.risk_steps,
      },
      'advanced-settings': {
          bot_schedules: values.bot_schedules,
        general_settings_section: {
          maximum_number_of_trades: values.number_of_trades as number | null,
          maximum_running_time: values.maximum_running_time as number | null,
          cooldown_period: values.cooldown_period as { duration: number; unit: string } | null,
          recovery_type: values.recovery_type as string | null,
          compound_stake: values.compound_stake as boolean || false,
          auto_restart: values.auto_restart as boolean || false,
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
                onContractParamsChange={(params)=>{
                  form.setFieldValue(field.name, params);
                  setContractParams(params);
                  logFieldUpdate(field.name, params, 'contract');
                }}
                updateStep={()=>{}}
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

  const handleSubmit = async (values: FormValues) => {
    // Log the full structured form data
    const structuredFormData = logFullFormData();
    console.log('[Form Submit] Structured Strategy Data:', structuredFormData);
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
          <Form.Item name="botName" style={{marginBottom: 0}}>
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
    </TradeErrorBoundary>
  );
}
