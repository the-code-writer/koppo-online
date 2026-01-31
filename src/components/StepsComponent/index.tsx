import { useEffect, useState } from 'react';
import { Collapse, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { DownOutlined } from '@ant-design/icons';
import { ContractParams } from '../ContractParams';
import './styles.scss';

const { Panel } = Collapse;

interface StepData {
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

  useEffect(() => {
    console.log("+++ STEPS COMPONENT SETTINGS", settings);
  }, [settings]);

  const addStep = () => {
    const newStep: StepData = {
      id: `step-${Date.now()}`,
      marketType: 'DIGITS',
      contractType: 'DIGITUNDER',
      prediction: '8',
      predictionRandomize: false,
      market: 'Volatility 100 (1s) Index',
      marketRandomize: false,
      multiplier: 3.125,
      delay: 1,
      ...defaultStepValues
    };
    const newSettings = [...settings, newStep];
    onSettingsChange?.(newSettings);
    setActiveKeys([...activeKeys, newStep.id]);
  };

  const removeStep = (stepId: string) => {
    const newSettings = settings.filter(step => step.id !== stepId);
    onSettingsChange?.(newSettings);
    setActiveKeys(activeKeys.filter(key => key !== stepId));
  };

  const updateStep = (stepId: string, field: keyof StepData, fieldValue: any) => {
    const newSettings = settings.map(step =>
      step.id === stepId ? { ...step, [field]: fieldValue } : step
    );
    onSettingsChange?.(newSettings);
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
        {settings.map((step, index) => (
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
            <ContractParams step={step} updateStep={updateStep} />
          </Panel>
        ))}
      </Collapse>

      <Button
        type="primary"
        block
        icon={<PlusOutlined />}
        onClick={addStep}
        className="add-step-btn"
        size="large"
      >
        Add Step
      </Button>
    </div>
  );
}
