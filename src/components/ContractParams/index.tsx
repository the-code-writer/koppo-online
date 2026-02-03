import { Flex, Space, Divider, Switch, Segmented, Select, Row, Col, Slider, InputNumber } from 'antd';
import { MoneyCollectOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { LabelPairedCircleZeroLgRegularIcon, LabelPairedCircleZeroMdFillIcon, LabelPairedCircleOneLgRegularIcon, LabelPairedCircleOneMdFillIcon, LabelPairedCircleTwoLgRegularIcon, LabelPairedCircleTwoMdFillIcon, LabelPairedCircleThreeLgRegularIcon, LabelPairedCircleThreeMdFillIcon, LabelPairedCircleFourLgRegularIcon, LabelPairedCircleFourMdFillIcon, LabelPairedCircleFiveLgRegularIcon, LabelPairedCircleFiveMdFillIcon, LabelPairedCircleSixLgRegularIcon, LabelPairedCircleSixMdFillIcon, LabelPairedCircleSevenLgRegularIcon, LabelPairedCircleSevenMdFillIcon, LabelPairedCircleEightLgRegularIcon, LabelPairedCircleEightMdFillIcon, LabelPairedCircleNineLgRegularIcon, LabelPairedCircleNineMdFillIcon } from '@deriv/quill-icons';
import { InputField } from '../InputField';
import './styles.scss';
import { ContractParamsProps, ContractData } from '../../types/strategy';
import { MarketSelectorComponent } from '../MarketSelectorComponent';
import { useState } from 'react';

export function ContractParams({ defaultValues, currentValue, updateStep, onContractParamsChange }: ContractParamsProps) {

  // Use current value if available, otherwise fall back to default values
  const [contractParams, setcontractParams] = useState(currentValue || {
    ...defaultValues,
    duration: defaultValues.duration || 5,
    durationUnits: defaultValues.durationUnits || 'ticks',
    delay: defaultValues.delay || 0,
    multiplier: defaultValues.multiplier || 1,
    allowEquals: defaultValues.allowEquals || false,
    alternateAfter: defaultValues.alternateAfter || 1,
  });

  // Check if current trade type is RISE/FALL or ODD/EVEN
  const isRiseFallType = contractParams.tradeType === 'CALLE|PUTE';
  const isOddEvenType = contractParams.tradeType === 'ODD|EVEN';
  const isDigitsType = contractParams.tradeType === 'DIGITS';
  
  // Check if ALTERNATE is selected
  const isAlternateSelected = contractParams.contractType === 'ALTERNATE';

  const updateContractParams = (field: keyof ContractData, value: any) => {
    const updatedParams = { ...contractParams, [field]: value };
    updateStep(defaultValues.id, field, value);
    onContractParamsChange(updatedParams);
    setcontractParams(updatedParams);
    console.log("CONTRACT_PARAMS_UPDATE", defaultValues.id, {field, value}, updatedParams);
  };
  return (
    <Space vertical size={0} className="contract-params-wrapper">
      <Space vertical size={8} className="contract-params-spacer-for-label-element">
        <label className="field-label">
          <Flex justify='space-between' align='center'>
            <span>Market</span>
            <span>Random Market
              <Switch
                className="switch" size="small" style={{marginLeft: 12, marginTop: -3}}
                checked={contractParams.marketRandomize}
                onChange={(val) => updateContractParams('marketRandomize', val)}
              />
              
            </span>
          </Flex>
        </label>
        {!contractParams.marketRandomize && (
          <MarketSelectorComponent
            value={contractParams.market}
            onChange={(market) => updateContractParams('market', market)}
            className="contract-market-selector"
          />
        )}
      </Space>
      <Divider className="contract-params-divider" />
      <Space vertical size={8} className="contract-params-spacer-for-label-element">
        <label className="field-label">Trade Type</label>
        <Segmented size="large" block className="contract-params-segment"
          options={[
            { label: "Digits", value: "DIGITS" },
            { label: "Rise / Fall", value: "CALLE|PUTE" },
            { label: "Odd / Even", value: "ODD|EVEN" },
          ]}
          value={contractParams.tradeType}
          onChange={(val) => updateContractParams('tradeType', val)}
        />
      </Space>
      <Divider className="contract-params-divider"  />
      <Space vertical size={8} className="contract-params-spacer-for-label-element">
        <label className="field-label">Contract Type</label>
        {isRiseFallType ? (
          <>
            <Segmented size="large" block className="contract-params-segment"
              options={[
                { label: "Call", value: "CALL" },
                { label: "Put", value: "PUT" },
                { label: "Alternate", value: "ALTERNATE" },
              ]}
              value={contractParams.contractType}
              onChange={(val) => updateContractParams('contractType', val)}
            />
            {!isAlternateSelected && (
              <Flex align="center" gap={8} style={{ marginTop: 8 }}>
                <Switch
                  size="small"
                  checked={contractParams.allowEquals}
                  onChange={(val) => updateContractParams('allowEquals', val)}
                />
                <span className="field-label" style={{ margin: 0 }}>Allow equals</span>
              </Flex>
            )}
          </>
        ) : isOddEvenType ? (
          <Segmented size="large" block className="contract-params-segment"
            options={[
              { label: "Odd", value: "ODD" },
              { label: "Even", value: "EVEN" },
              { label: "Alternate", value: "ALTERNATE" },
            ]}
            value={contractParams.contractType}
            onChange={(val) => updateContractParams('contractType', val)}
          />
        ) : (
          <Segmented size="large" block className="contract-params-segment"
            options={[
              { label: "Digits Under", value: "DIGITUNDER" },
              { label: "Digits Over", value: "DIGITOVER" },
              { label: "Digits Diff", value: "DIGITDIFF" },
            ]}
            value={contractParams.contractType}
            onChange={(val) => updateContractParams('contractType', val)}
          />
        )}
      </Space>
      {isAlternateSelected && (
        <>
          <Divider className="contract-params-divider" />
          <Space vertical size={8} className="contract-params-spacer-for-label-element">
            <label className="field-label">Alternate after (trades)</label>
            <Row gutter={16}>
              <Col span={16}>
                <Slider
                  min={1}
                  max={20}
                  value={typeof contractParams.alternateAfter === 'number' ? contractParams.alternateAfter : 1}
                  onChange={(value) => updateContractParams('alternateAfter', value)}
                />
              </Col>
              <Col span={8}>
                <InputNumber
                  min={1}
                  max={20}
                  size="large"
                  style={{ width: '100%' }}
                  value={contractParams.alternateAfter}
                  onChange={(value) => updateContractParams('alternateAfter', value)}
                />
              </Col>
            </Row>
          </Space>
        </>
      )}
      {isDigitsType && (
        <>
          <Divider className="contract-params-divider" />
          <Space vertical size={8} className="contract-params-spacer-for-label-element">
            <label className="field-label">
              <Flex justify='space-between' align='center'>
                <span>Prediction</span>
                <span>Random Integer
                  <Switch className="switch" size="small" style={{marginLeft: 12, marginTop: -3}}
                    checked={contractParams.predictionRandomize}
                    onChange={(val) => updateContractParams('predictionRandomize', val)}
                  />
                </span>
              </Flex>
            </label>
            {!contractParams.predictionRandomize && (
              <Segmented size="large" block className="contract-params-segment"
                options={[
                  { label: contractParams.prediction === "0" ? <LabelPairedCircleZeroMdFillIcon /> : <LabelPairedCircleZeroLgRegularIcon />, value: "0" },
                  { label: contractParams.prediction === "1" ? <LabelPairedCircleOneMdFillIcon /> : <LabelPairedCircleOneLgRegularIcon />, value: "1" },
                  { label: contractParams.prediction === "2" ? <LabelPairedCircleTwoMdFillIcon /> : <LabelPairedCircleTwoLgRegularIcon />, value: "2" },
                  { label: contractParams.prediction === "3" ? <LabelPairedCircleThreeMdFillIcon /> : <LabelPairedCircleThreeLgRegularIcon />, value: "3" },
                  { label: contractParams.prediction === "4" ? <LabelPairedCircleFourMdFillIcon /> : <LabelPairedCircleFourLgRegularIcon />, value: "4" },
                  { label: contractParams.prediction === "5" ? <LabelPairedCircleFiveMdFillIcon /> : <LabelPairedCircleFiveLgRegularIcon />, value: "5" },
                  { label: contractParams.prediction === "6" ? <LabelPairedCircleSixMdFillIcon /> : <LabelPairedCircleSixLgRegularIcon />, value: "6" },
                  { label: contractParams.prediction === "7" ? <LabelPairedCircleSevenMdFillIcon /> : <LabelPairedCircleSevenLgRegularIcon />, value: "7" },
                  { label: contractParams.prediction === "8" ? <LabelPairedCircleEightMdFillIcon /> : <LabelPairedCircleEightLgRegularIcon />, value: "8" },
                  { label: contractParams.prediction === "9" ? <LabelPairedCircleNineMdFillIcon /> : <LabelPairedCircleNineLgRegularIcon />, value: "9" },
                ]}
                value={contractParams.prediction}
                onChange={(val) => updateContractParams('prediction', val)}
              />
            )}
          </Space>
        </>
      )}
      <Divider className="contract-params-divider" />
      <Flex justify='space-between' align='center' gap={32}>
        <Space vertical size={8} className="contract-params-spacer-for-label-element">
          <label className="field-label">Duration ({contractParams.durationUnits})</label>
          <InputField
            type="number-prefix"
            suffix={<ClockCircleOutlined />}
            value={contractParams.duration}
            onChange={(val) => updateContractParams('duration', val)}
          />
        </Space>
        <Space vertical size={8} className="contract-params-spacer-for-label-element">
          <label className="field-label">Duration Units</label>
          <Select
            value={contractParams.durationUnits || 'ticks'}
            onChange={(value) => updateContractParams('durationUnits', value)}
            style={{ width: '100%' }}
            size="large"
            options={[
              { label: 'Ticks', value: 'ticks' },
              { label: 'Seconds', value: 'seconds' },
              { label: 'Minutes', value: 'minutes' },
              { label: 'Hours', value: 'hours' },
            ]}
          />
        </Space>
      </Flex>
      <Divider className="contract-params-divider" />
      <Flex justify='space-between' align='center' gap={32}>
        <Space vertical size={8} className="contract-params-spacer-for-label-element">
          <label className="field-label">Delay (seconds)</label>
          <InputField
            type="number-prefix"
            suffix={<ClockCircleOutlined />}
            value={contractParams.delay}
            onChange={(val) => updateContractParams('delay', val)}
          />
        </Space>
        <Space vertical size={8} className="contract-params-spacer-for-label-element">
          <label className="field-label">Multiplier</label>
          <InputField
            type="number-prefix"
            suffix={<MoneyCollectOutlined />}
            value={contractParams.multiplier}
            onChange={(val) => updateContractParams('multiplier', val)}
          />
        </Space>
      </Flex>
    </Space>
  );
}
