import { useState } from 'react';
import { Segmented, Typography, Card } from 'antd';
import { InputField } from '../InputField';
import './styles.scss';

const { Text } = Typography;

interface ThresholdValue {
  type: 'fixed' | 'percentage';
  value: number;
  balancePercentage?: number;
}

interface ThresholdProps {
  label: string;
  value?: ThresholdValue;
  onChange?: (value: ThresholdValue) => void;
  fixedPlaceholder?: string;
  percentagePlaceholder?: string;
  fixedHelperText?: string;
  percentageHelperText?: string;
}

export function ThresholdSelector({ 
  label, 
  value, 
  onChange, 
  fixedPlaceholder = "Enter fixed amount",
  percentagePlaceholder = "Enter percentage of balance",
  fixedHelperText = "Enter a fixed amount that will trigger when reached",
  percentageHelperText = "This will be calculated as a percentage of your account balance"
}: ThresholdProps) {
  const [thresholdType, setThresholdType] = useState<'fixed' | 'percentage'>(
    value?.type || 'fixed'
  );

  const handleTypeChange = (value: string) => {
    const newType = value as 'fixed' | 'percentage';
    setThresholdType(newType);
    
    // Reset value when type changes
    const newValue: ThresholdValue = {
      type: newType,
      value: 0,
      balancePercentage: newType === 'percentage' ? 0 : undefined
    };
    onChange?.(newValue);
  };

  const handleValueChange = (fieldValue: any) => {
    if (fieldValue !== null && fieldValue !== undefined) {
      const numValue = typeof fieldValue === 'string' ? parseFloat(fieldValue) : fieldValue;
      if (!isNaN(numValue)) {
        const newValue: ThresholdValue = {
          type: thresholdType,
          value: numValue,
          balancePercentage: thresholdType === 'percentage' ? numValue : undefined
        };
        onChange?.(newValue);
      }
    }
  };

  return (
    <Card className="profit-threshold-card" size="small">
      <div className="profit-threshold-header">
        <label className="input-field-label">{label}</label>
        <Segmented
          value={thresholdType}
          onChange={handleTypeChange}
          size="small"
          className="threshold-type-segmented"
          options={[
            { label: 'Fixed', value: 'fixed' },
            { label: 'Percentage', value: 'percentage' }
          ]}
        />
      </div>
      
      <div className="profit-threshold-content">
        {thresholdType === 'fixed' ? (
          <div className="threshold-input-section">
            <InputField
              type="number-prefix"
              suffix="$"
              placeholder={fixedPlaceholder}
              value={value?.value}
              onChange={handleValueChange}
            />
            <Text type="secondary" className="helper-text">
              {fixedHelperText}
            </Text>
          </div>
        ) : (
          <div className="threshold-input-section">
            <InputField
              type="number-prefix"
              suffix="%"
              placeholder={percentagePlaceholder}
              value={value?.balancePercentage}
              onChange={handleValueChange}
            />
            <Text type="secondary" className="helper-text">
              {percentageHelperText}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
}

// Backward compatibility export
export function ProfitThreshold(props: Omit<ThresholdProps, 'label'>) {
  return <ThresholdSelector {...props} label="Profit Threshold" />;
}
