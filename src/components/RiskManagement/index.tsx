import { useEffect, useState } from 'react';
import { Collapse, Button, Segmented, Flex, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, ClockCircleOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import { DownOutlined } from '@ant-design/icons';
import { MarketDerivedVolatility1001sIcon } from '@deriv/quill-icons';
import { InputField } from '../InputField';
import './styles.scss';

const { Panel } = Collapse;

interface RiskStep {
  id: string;
  marketType: string;
  contractType: string;
  prediction: string;
  predictionRandomize: boolean;
  market: string;
  marketRandomize: boolean;
  multiplier: number;
  delay: number;
}

interface RiskManagementProps {
  value?: RiskStep[];
  onChange?: (value: RiskStep[]) => void;
}

export function RiskManagement({ value = [], onChange }: RiskManagementProps) {
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  useEffect(()=>{

    console.log("+++ FORM VALUE", value)

  },[value])

  const addStep = () => {
    const newStep: RiskStep = {
      id: `step-${Date.now()}`,
      marketType: 'DIGITS',
      contractType: 'DIGITUNDER',
      prediction: '8',
      predictionRandomize: false,
      market: 'Volatility 100 (1s) Index',
      marketRandomize: false,
      multiplier: 3.125,
      delay: 1
    };
    const newValue = [...value, newStep];
    onChange?.(newValue);
    setActiveKeys([...activeKeys, newStep.id]);
  };

  const removeStep = (stepId: string) => {
    const newValue = value.filter(step => step.id !== stepId);
    onChange?.(newValue);
    setActiveKeys(activeKeys.filter(key => key !== stepId));
  };

  const updateStep = (stepId: string, field: keyof RiskStep, fieldValue: any) => {
    const newValue = value.map(step =>
      step.id === stepId ? { ...step, [field]: fieldValue } : step
    );
    onChange?.(newValue);
  };

  return (
    <div className="risk-management">
      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys}
        expandIcon={({ isActive }) => (
          <DownOutlined
            rotate={isActive ? 180 : 0}
            style={{ fontSize: '16px', color: 'var(--text-primary)' }}
          />
        )}
        className="risk-accordion"
        size="small"
      >
        {value.map((step, index) => (
          <Panel
            key={step.id}
            header={
              <div className="step-header">
                <span className="step-title">Step {index + 1}</span>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStep(step.id);
                  }}
                  className="delete-step-btn"
                />
              </div>
            }
            className="risk-step-panel"
          >
            <div className="step-content">


              <div className="step-row">
                <div className="step-field">
                  <label className="field-label"><Flex justify='justify-content' align='center'><span>Market</span><span>Random Market <Switch size="small" value={step.marketRandomize}
                    onChange={(val) => updateStep(step.id, 'marketRandomize', val)} /></span></Flex></label>
                  {!step.marketRandomize && (
                    <InputField
                      type="selectable"
                      value={step.market}
                      prefix={<MarketDerivedVolatility1001sIcon fill='#000000' iconSize='sm' />}
                      suffix={<DownOutlined />}
                    />
                  )}

                </div>
              </div>

              <div className="step-row">
                <div className="step-field">
                  <label className="field-label">Market Type</label>
                  <Segmented size="large"
                    options={[
                      { label: "Digits", value: "DIGITS" },
                      { label: "Rise / Fall", value: "CALLE|PUTE" },
                      { label: "Odd / Even", value: "ODD|EVEN" },
                    ]}
                    value={step.marketType}
                    onChange={(val) => updateStep(step.id, 'marketType', val)}
                  />
                </div>
              </div>

              <div className="step-row">
                <div className="step-field">
                  <label className="field-label">Contract Type</label>
                  <Segmented size="large"
                    options={[
                      { label: "Digits Under", value: "DIGITUNDER" },
                      { label: "Digits Over", value: "DIGITOVER" },
                      { label: "Digits Diff", value: "DIGITDIFF" },
                    ]}
                    value={step.contractType}
                    onChange={(val) => updateStep(step.id, 'contractType', val)}
                  />
                </div>
              </div>

              <div className="step-row">
                <div className="step-field">
                  <label className="field-label"><Flex justify='justify-content' align='center'><span>Prediction</span><span>Random Integer <Switch size="small" value={step.predictionRandomize}
                    onChange={(val) => updateStep(step.id, 'predictionRandomize', val)} /></span></Flex></label>
                  {!step.predictionRandomize && (
                    <Segmented size="large"
                      options={[
                        { label: "0", value: "0" },
                        { label: "1", value: "1" },
                        { label: "2", value: "2" },
                        { label: "3", value: "3" },
                        { label: "4", value: "4" },
                        { label: "5", value: "5" },
                        { label: "6", value: "6" },
                        { label: "7", value: "7" },
                        { label: "8", value: "8" },
                        { label: "9", value: "9" },
                      ]}
                      value={step.prediction}
                      onChange={(val) => updateStep(step.id, 'prediction', val)}
                    />)}
                </div>
              </div>

              <div className="step-row">
                <Flex justify='justify-content' align='center' gap={32}>
                  <div className="step-field">
                    <label className="field-label">Multiplier</label>
                    <InputField
                      type="number-prefix"
                      suffix={<MoneyCollectOutlined />}
                      value={step.multiplier}
                      onChange={(val) => updateStep(step.id, 'multiplier', val)}
                    />
                  </div>
                  <div className="step-field">
                    <label className="field-label">Delay (seconds)</label>
                    <InputField
                      type="number-prefix"
                      suffix={<ClockCircleOutlined />}
                      value={step.delay}
                      onChange={(val) => updateStep(step.id, 'delay', val)}
                    />
                  </div>
                </Flex>
              </div>
            </div>
          </Panel>
        ))}
      </Collapse>

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={addStep}
        className="add-step-btn"
      >
        Add Step
      </Button>
    </div>
  );
}
