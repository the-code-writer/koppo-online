import { useState } from 'react';
import { Collapse, Typography, Space, Select } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { InputField } from '../InputField';
import { AccordionItemConfig, FieldConfig } from '../../types/form';
import './styles.scss';

const { Panel } = Collapse;
const { Title } = Typography;

interface AccordionGroupProps {
  items: AccordionItemConfig[];
  value?: any;
  onChange?: (value: any) => void;
}

export function AccordionGroup({ items, value, onChange }: AccordionGroupProps) {
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const handlePanelChange = (keys: string | string[]) => {
    setActiveKeys(Array.isArray(keys) ? keys : [keys]);
  };

  const handleFieldChange = (fieldName: string, fieldValue: any) => {
    const newValue = { ...value, [fieldName]: fieldValue };
    onChange?.(newValue);
  };

  const getFieldValue = (fieldName: string) => {
    return value?.[fieldName];
  };

  return (
    <div className="accordion-group">
      <Title level={4} className="accordion-group-title">Recovery Steps</Title>
      <Collapse
        activeKey={activeKeys}
        onChange={handlePanelChange}
        expandIcon={({ isActive }) => (
          <DownOutlined
            rotate={isActive ? 180 : 0}
            style={{ fontSize: '16px', color: 'var(--text-primary)' }}
          />
        )}
        className="recovery-accordion"
        size="small"
      >
        {items.map((item) => (
          <Panel
            key={item.key}
            header={
              <Space>
                <span className="panel-title">{item.title}</span>
              </Space>
            }
            className="recovery-panel"
          >
            <div className="panel-content">
              {item.fields.map((field: FieldConfig) => (
                <div key={field.name} className="accordion-field">
                  {field.type === 'select' ? (
                    <div className="select-field">
                      <label className="input-field-label">{field.label}</label>
                      <Select
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        options={field.options}
                        value={getFieldValue(field.name)}
                        onChange={(value: any) => handleFieldChange(field.name, value)}
                        style={{ width: '100%' }}
                        size="large"
                      />
                    </div>
                  ) : (
                    <InputField
                      label={field.label}
                      type={field.type as any}
                      value={getFieldValue(field.name)}
                      onChange={(fieldValue: any) => handleFieldChange(field.name, fieldValue)}
                      prefix={field.prefixType === 'currency' ? '$' : 
                             field.prefixType === 'percentage' ? '%' :
                             field.prefixType === 'multiplier' ? '×' : undefined}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </Collapse>
    </div>
  );
}
