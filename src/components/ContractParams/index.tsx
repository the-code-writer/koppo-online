import { Flex, Space, Divider, Switch, Segmented } from 'antd';
import { DownOutlined, MoneyCollectOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { MarketDerivedVolatility1001sIcon } from '@deriv/quill-icons';
import { InputField } from '../InputField';

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

interface ContractParamsProps {
  step: StepData;
  updateStep: (stepId: string, field: keyof StepData, fieldValue: any) => void;
}

export function ContractParams({ step, updateStep }: ContractParamsProps) {
  return (
    <Space vertical size={0} className="contract-params-wrapper">
      <Space vertical size={8} className="contract-params-spacer-for-label-element">
        <label className="field-label">
          <Flex justify='space-between' align='center'>
            <span>Market</span>
            <span>Random Market
              <Switch
                className="switch" size="small" style={{marginLeft: 12, marginTop: -3}}
                value={step.marketRandomize}
                onChange={(val) => updateStep(step.id, 'marketRandomize', val)}
              />
            </span>
          </Flex>
        </label>
        {!step.marketRandomize && (
          <InputField
            type="selectable"
            value={step.market}
            prefix={<MarketDerivedVolatility1001sIcon fill='#000000' iconSize='sm' />}
            suffix={<DownOutlined />}
          />
        )}
      </Space>
      <Divider className="contract-params-divider" />
      <Space vertical size={8} className="contract-params-spacer-for-label-element">
        <label className="field-label">Market Type</label>
        <Segmented size="large" block className="contract-params-segment"
          options={[
            { label: "Digits", value: "DIGITS" },
            { label: "Rise / Fall", value: "CALLE|PUTE" },
            { label: "Odd / Even", value: "ODD|EVEN" },
          ]}
          value={step.marketType}
          onChange={(val) => updateStep(step.id, 'marketType', val)}
        />
      </Space>
      <Divider className="contract-params-divider"  />
      <Space vertical size={8} className="contract-params-spacer-for-label-element">
        <label className="field-label">Contract Type</label>
        <Segmented size="large" block className="contract-params-segment"
          options={[
            { label: "Digits Under", value: "DIGITUNDER" },
            { label: "Digits Over", value: "DIGITOVER" },
            { label: "Digits Diff", value: "DIGITDIFF" },
          ]}
          value={step.contractType}
          onChange={(val) => updateStep(step.id, 'contractType', val)}
        />
      </Space>
      <Divider className="contract-params-divider" />
      <Space vertical size={8} className="contract-params-spacer-for-label-element">
        <label className="field-label">
          <Flex justify='space-between' align='center'>
            <span>Prediction</span>
            <span>Random Integer
              <Switch className="switch" size="small" style={{marginLeft: 12, marginTop: -3}}
                value={step.predictionRandomize}
                onChange={(val) => updateStep(step.id, 'predictionRandomize', val)}
              />
            </span>
          </Flex>
        </label>
        {!step.predictionRandomize && (
          <Segmented size="large" block className="contract-params-segment"
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
          />
        )}
      </Space>
      <Divider className="contract-params-divider" />
      <Flex justify='justify-content' align='center' gap={32}>
        <Space vertical size={8} className="contract-params-spacer-for-label-element">
          <label className="field-label">Multiplier</label>
          <InputField
            type="number-prefix"
            suffix={<MoneyCollectOutlined />}
            value={step.multiplier}
            onChange={(val) => updateStep(step.id, 'multiplier', val)}
          />
        </Space>
        <Space vertical size={8} className="contract-params-spacer-for-label-element">
          <label className="field-label">Delay (seconds)</label>
          <InputField
            type="number-prefix"
            suffix={<ClockCircleOutlined />}
            value={step.delay}
            onChange={(val) => updateStep(step.id, 'delay', val)}
          />
        </Space>
      </Flex>
    </Space>
  );
}
