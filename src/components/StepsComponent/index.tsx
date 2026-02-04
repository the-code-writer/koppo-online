import { useEffect, useState } from 'react';
import { Collapse, Button } from 'antd';
import type { CollapseProps } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { DownOutlined } from '@ant-design/icons';
import { ContractParams } from '../ContractParams';
import './styles.scss';
import { ContractData } from '../../types/strategy';

interface StepData extends ContractData {
  id: string;
}

interface StepsComponentProps {
  settings?: StepData[];
  onSettingsChange?: (settings: StepData[]) => void;
  title?: string;
  addButtonText?: string;
  defaultStepValues?: Partial<StepData>;
}

export function StepsComponent({ 
  settings = [], 
  onSettingsChange,
  title = "Steps Configuration",
  addButtonText = "Add Step",
  defaultStepValues = {}
}: StepsComponentProps) {

  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [stepSettings, setStepSettings] = useState<StepData[]>(settings);

  useEffect(() => {
    console.log("+++ STEPS COMPONENT SETTINGS", stepSettings);
  }, [stepSettings]);

  const addStep = () => {
    const newStep: StepData = {
      id: `step-${Date.now()}`,
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
      multiplier: 3.125,
      delay: 1,
      duration: 1,
      durationUnits: 'ticks',
      allowEquals: false,
      alternateAfter: 1,
      ...defaultStepValues
    };
    const newSettings = [...stepSettings, newStep];
    setStepSettings(newSettings);
    onSettingsChange?.(newSettings);
    setActiveKeys([...activeKeys, newStep.id]);
  };

  const removeStep = (stepId: string) => {
    const newSettings = stepSettings.filter(step => step.id !== stepId);
    setStepSettings(newSettings);
    onSettingsChange?.(newSettings);
    setActiveKeys(activeKeys.filter(key => key !== stepId));
  };

  const updateStep = (stepId: string, field: keyof StepData, fieldValue: any) => {
    const newSettings = stepSettings.map(step =>
      step.id === stepId ? { ...step, [field]: fieldValue } : step
    );
    setStepSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const collapseItems: CollapseProps['items'] = stepSettings.map((step, index) => ({
    key: step.id,
    label: (
      <div className="step-header">
        <span className="step-title" title={title}>Recovery Step {index + 1}</span>
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
    ),
    children: (
      <ContractParams 
        defaultValues={step} 
        currentValue={step}
        updateStep={updateStep}
        onContractParamsChange={(params) => {
          const newSettings = stepSettings.map(s =>
            s.id === step.id ? { ...s, ...params } : s
          );
          setStepSettings(newSettings);
          onSettingsChange?.(newSettings);
        }}
      />
    ),
    className: "risk-step-panel"
  }));

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
        items={collapseItems}
      />

      <Button
        type="primary"
        block
        icon={<PlusOutlined />}
        onClick={addStep}
        className="add-step-btn"
        size="large"
      >
        {addButtonText}
      </Button>
    </div>
  );
}
