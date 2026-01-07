import { Form, Button, Segmented, Select, Tabs, Typography, Card } from "antd";
import { BottomActionSheet } from "../BottomActionSheet";
import { DownOutlined } from "@ant-design/icons";
import { InputField } from "../InputField";
import { DurationSelector } from "../DurationSelector";
import { ProfitThreshold, ThresholdSelector } from "../ProfitThreshold";
import { RiskManagement } from "../RiskManagement";
import { Schedules } from "../Schedules";
import {
  LabelPairedArrowLeftMdBoldIcon,
  LabelPairedCircleQuestionMdBoldIcon,
  MarketDerivedVolatility1001sIcon,
} from "@deriv/quill-icons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, useBots } from "../../hooks/useBots";
import { TradeErrorBoundary } from "../ErrorBoundary/TradeErrorBoundary";
import { MarketInfo } from "../../types/market";
import MarketSelector from "../MarketSelector";
import "./styles.scss";

import { FormValues, StrategyFormProps, FieldConfig } from "../../types/form";

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
  // We're not using submitTrade in this component
  const { addBot, updateBot } = useBots();
  const navigate = useNavigate();
  const isEditMode = !!editBot;

  const { Title } = Typography;

  useEffect(()=>{

    console.log("+++ FORM", form)

  },[form])

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
          <RiskManagement
            onChange={(value) => form.setFieldValue(field.name, value)}
          />
        );
      
      case 'schedules':
        return (
          <Schedules
            onChange={(value) => form.setFieldValue(field.name, value)}
          />
        );
      
      case 'duration-selector-with-heading':
        return (
          <Card className="field-heading" size="small">
            <Title level={4} className="heading-title">
              {field.label}
            </Title>
            <div className="duration-selector-in-card">
              <DurationSelector
                onChange={(value) => form.setFieldValue(field.name, value)}
              />
            </div>
          </Card>
        );
      
      case 'duration-selector':
        return (
          <DurationSelector
            {...commonProps}
            onChange={(value) => form.setFieldValue(field.name, value)}
          />
        );
      
      case 'profit-threshold':
        return (
          <ProfitThreshold
            onChange={(value) => form.setFieldValue(field.name, value)}
          />
        );
      
      case 'threshold-selector':
        return (
          <ThresholdSelector
            label={field.label}
            onChange={(value) => form.setFieldValue(field.name, value)}
            fixedPlaceholder={field.name === 'amount' ? 'Enter base stake amount' : 'Enter fixed loss amount'}
            percentagePlaceholder={field.name === 'amount' ? 'Enter percentage of balance for stake' : 'Enter percentage of balance for loss'}
            fixedHelperText={field.name === 'amount' ? 'Enter the base stake amount for trading' : 'Enter a fixed amount that will trigger loss prevention when reached'}
            percentageHelperText={field.name === 'amount' ? 'Stake will be calculated as this percentage of your account balance' : 'Loss will be calculated as this percentage of your account balance'}
          />
        );
      
      case 'select':
        return (
          <div className="select-field">
            <label className="input-field-label">{field.label}</label>
            <Select
              placeholder={commonProps.placeholder}
              options={field.options}
              onChange={(value) => form.setFieldValue(field.name, value)}
              style={{ width: '100%' }}
              size="large"
            />
          </div>
        );
      
      case 'number-prefix':
        return (
          <InputField
            {...commonProps}
            type="number-prefix"
            suffix={field.prefixType === 'currency' ? '$' : 
                   field.prefixType === 'percentage' ? '%' :
                   field.prefixType === 'multiplier' ? '×' : ''}
            onChange={(value) => form.setFieldValue(field.name, value)}
          />
        );
      
      case 'number':
        return (
          <InputField
            {...commonProps}
            type="number"
            onChange={(value) => form.setFieldValue(field.name, value)}
          />
        );
      
      default:
        return (
          <InputField
            {...commonProps}
            type="text"
            onChange={(value) => form.setFieldValue(field.name, value)}
          />
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
    // for now some values here are static 
    // once we have the api we will make this function dynamic based on the api schema
    // Get the current form values
    const currentValues = form.getFieldsValue();
    
    const botData : Bot = {
      id: isEditMode && editBot ? editBot.id : Date.now().toString(),
      // Use the form value for botName, only fallback to "New Strategy Bot" if it's empty
      name: currentValues.botName ? currentValues.botName.toString() : "New Strategy Bot",
      market: values.market?.toString() || "",
      tradeType: values.tradeType?.toString() || "",
      // Use the strategy ID from props instead of hardcoding "Custom"
      strategy: isEditMode && editBot ? editBot.strategy : strategyType,
      // Store the strategy ID for API calls when the bot is run
      strategyId: strategyId,
      params: [
        { key: "repeat_trade", label: "Repeat trade", value: Number(values.repeatTrade) },
        { key: "initial_stake", label: "Initial stake", value: Number(values.initialStake) },
      ],
    };

    try {
      setIsSubmitting(true);

      if (isEditMode) {
        // Update existing bot
        updateBot(botData);
        console.log("Bot updated successfully:", botData);
        
        // Close the drawer first, then navigate
        onBack?.();
        navigate("/bots");
      } else {
        // Add new bot
        addBot(botData);
        console.log("Bot created successfully:", botData);
        
        // Navigate to the bots list page
        navigate("/bots");
      }
    } catch (error) {
      console.error("Failed to create/update bot:", error);
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

          <h2 className="parameters-title">Parameters</h2>

          <Form.Item name="tradeType" className="trade-type-item">
            <Segmented
              block
              options={[
                { label: "Rise", value: "Rise" },
                { label: "Fall", value: "Fall" },
              ]}
            />
          </Form.Item>

          <Form.Item name="market" className="market-item">
                <InputField 
                  type="selectable" 
                  value={"Volatility 100 (1s) Index"}
                  prefix={<MarketDerivedVolatility1001sIcon fill='#000000' iconSize='sm' />}
                  suffix={<DownOutlined />}
                  onClick={() => setShowMarketSelector(true)}
                />
          </Form.Item>

          {/* Render tabbed fields from config */}
          {config?.tabs ? (
            <Tabs
              defaultActiveKey="basic"
              items={config.tabs.map((tab) => ({
                key: tab.key,
                label: tab.label,
                children: (
                  <div className="tab-content fixed-height">
                    {tab.fields.map((field) => (
                      <Form.Item key={field.name} name={field.name} className={`${field.type}-item`}>
                        {renderField(field)}
                      </Form.Item>
                    ))}
                  </div>
                ),
              }))}
              className="strategy-tabs"
            />
          ) : (
            /* Render flat fields for backward compatibility */
            config?.fields?.map((field) => (
              <Form.Item key={field.name} name={field.name} className={`${field.type}-item`}>
                {renderField(field)}
              </Form.Item>
            ))
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
