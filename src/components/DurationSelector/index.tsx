import { useState } from 'react';
import { Select, InputNumber, Button, Space, Typography } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import './styles.scss';

const { Text } = Typography;

interface DurationSelectorProps {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
}

interface DurationUnit {
  label: string;
  value: string;
  multiplier: number; // Convert to base unit (seconds)
}

const durationUnits: DurationUnit[] = [
  { label: 'Ticks', value: 'ticks', multiplier: 1 },
  { label: 'Seconds', value: 'seconds', multiplier: 1 },
  { label: 'Minutes', value: 'minutes', multiplier: 60 },
  { label: 'Hours', value: 'hours', multiplier: 3600 },
  { label: 'Days', value: 'days', multiplier: 86400 },
];

export function DurationSelector({ value, onChange, placeholder }: DurationSelectorProps) {
  const [durationValue, setDurationValue] = useState<number>(1);
  const [unit, setUnit] = useState<string>('ticks');

  // Convert total value back to display format
  const parseValue = (totalValue: number) => {
    if (totalValue === 0 || !totalValue) {
      setDurationValue(1);
      setUnit('ticks');
      return;
    }

    // Find the best unit to display
    for (let i = durationUnits.length - 1; i >= 0; i--) {
      const unitInfo = durationUnits[i];
      if (totalValue % unitInfo.multiplier === 0 && totalValue / unitInfo.multiplier >= 1) {
        setDurationValue(totalValue / unitInfo.multiplier);
        setUnit(unitInfo.value);
        return;
      }
    }
    
    // Default to ticks if no perfect division found
    setDurationValue(totalValue);
    setUnit('ticks');
  };

  // Initialize value
  if (value && durationValue === 1 && unit === 'ticks') {
    parseValue(value);
  }

  const handleValueChange = (newValue: number | null) => {
    if (newValue !== null) {
      setDurationValue(newValue);
      updateTotalValue(newValue, unit);
    }
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    updateTotalValue(durationValue, newUnit);
  };

  const updateTotalValue = (val: number, selectedUnit: string) => {
    const unitInfo = durationUnits.find(u => u.value === selectedUnit);
    if (unitInfo) {
      const totalValue = val * unitInfo.multiplier;
      onChange?.(totalValue);
    }
  };

  const swapValueAndUnit = () => {
    // Find a different unit to swap to
    const currentIndex = durationUnits.findIndex(u => u.value === unit);
    const nextIndex = (currentIndex + 1) % durationUnits.length;
    const nextUnit = durationUnits[nextIndex];
    
    setUnit(nextUnit.value);
    updateTotalValue(durationValue, nextUnit.value);
  };

  return (
    <div className="duration-selector">
      <Space.Compact style={{ width: '100%' }}>
        <InputNumber
          value={durationValue}
          onChange={handleValueChange}
          min={1}
          placeholder={placeholder || "Duration"}
          style={{ flex: 1 }}
          size="large"
        />
        <Select
          value={unit}
          onChange={handleUnitChange}
          style={{ width: 120 }}
          size="large"
        >
          {durationUnits.map(unitInfo => (
            <Select.Option key={unitInfo.value} value={unitInfo.value}>
              {unitInfo.label}
            </Select.Option>
          ))}
        </Select>
        <Button 
          icon={<SwapOutlined />} 
          onClick={swapValueAndUnit}
          className="swap-button"
          size="large"
        >
          Swap
        </Button>
      </Space.Compact>
      <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
        Total: {durationValue * durationUnits.find(u => u.value === unit)?.multiplier || 1} base units
      </Text>
    </div>
  );
}
