import React, { useState } from 'react';
import { Select, Switch, InputNumber, TimePicker, Typography, Card, Row, Col, Divider, Badge } from 'antd';
import { InfoCircleOutlined, SecurityScanOutlined, BarChartOutlined, RobotOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './styles.scss';

const { Text } = Typography;
const { Option } = Select;

// Enhanced Multi-Select Component
export const EnhancedMultiSelect: React.FC<{
  value?: string[];
  onChange?: (value: string[]) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  maxTagCount?: number;
}> = ({ value = [], onChange, options, placeholder, maxTagCount = 3 }) => {
  return (
    <Select
      mode="multiple"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxTagCount={maxTagCount}
      className="enhanced-multi-select"
      popupClassName="enhanced-multi-select-dropdown"
    >
      {options.map(option => (
        <Option key={option.value} value={option.value}>
          <div className="select-option">
            <span className="option-label">{option.label}</span>
            {value.includes(option.value) && <Badge dot />}
          </div>
        </Option>
      ))}
    </Select>
  );
};

// Enhanced Switch Component
export const EnhancedSwitch: React.FC<{
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, description, disabled }) => {
  return (
    <div className="enhanced-switch">
      <div className="switch-content">
        <div className="switch-info">
          <Text strong>{label}</Text>
          {description && <Text type="secondary" className="switch-description">{description}</Text>}
        </div>
        <Switch checked={checked} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
};

// Enhanced Time Range Component
export const EnhancedTimeRange: React.FC<{
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  startTime?: string;
  onStartTimeChange?: (time: string) => void;
  endTime?: string;
  onEndTimeChange?: (time: string) => void;
}> = ({ enabled, onEnabledChange, startTime, onStartTimeChange, endTime, onEndTimeChange }) => {
  return (
    <div className="enhanced-time-range">
      <EnhancedSwitch
        checked={enabled}
        onChange={onEnabledChange}
        label="Enable Quiet Hours"
        description="Disable notifications during specific times"
      />
      {enabled && (
        <div className="time-range-controls">
          <div className="time-control">
            <Text>Start Time</Text>
            <TimePicker
              value={startTime ? dayjs(startTime, 'HH:mm') : null}
              onChange={(time) => onStartTimeChange?.(time?.format('HH:mm') || '')}
              format="HH:mm"
              className="time-picker"
            />
          </div>
          <div className="time-control">
            <Text>End Time</Text>
            <TimePicker
              value={endTime ? dayjs(endTime, 'HH:mm') : null}
              onChange={(time) => onEndTimeChange?.(time?.format('HH:mm') || '')}
              format="HH:mm"
              className="time-picker"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Nested Group Component
export const NestedGroup: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}> = ({ title, icon, children, defaultCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  return (
    <Card
      className="nested-group"
      size="small"
      title={
        <div className="nested-group-header" onClick={() => setCollapsed(!collapsed)}>
          {icon}
          <Text strong>{title}</Text>
          <div className={`collapse-icon ${collapsed ? 'collapsed' : ''}`}>
            <InfoCircleOutlined />
          </div>
        </div>
      }
    >
      {!collapsed && <div className="nested-group-content">{children}</div>}
    </Card>
  );
};

// Command Preview Component
export const CommandPreview: React.FC<{
  prefix: string;
  commands: string[];
}> = ({ prefix, commands }) => {
  return (
    <div className="command-preview">
      <Text strong>Available Commands:</Text>
      <div className="command-list">
        {commands.map(command => (
          <div key={command} className="command-item">
            <code>{prefix}{command}</code>
          </div>
        ))}
      </div>
    </div>
  );
};

// Security Settings Component
export const SecuritySettings: React.FC<{
  requireAuthentication?: boolean;
  onRequireAuthenticationChange?: (value: boolean) => void;
  allowedUsers?: string;
  onAllowedUsersChange?: (value: string) => void;
  adminUsers?: string;
  onAdminUsersChange?: (value: string) => void;
  rateLimiting?: boolean;
  onRateLimitingChange?: (value: boolean) => void;
  maxCommandsPerMinute?: number;
  onMaxCommandsChange?: (value: number) => void;
}> = ({
  requireAuthentication,
  onRequireAuthenticationChange,
  allowedUsers,
  onAllowedUsersChange,
  adminUsers,
  onAdminUsersChange,
  rateLimiting,
  onRateLimitingChange,
  maxCommandsPerMinute,
  onMaxCommandsChange
}) => {
  return (
    <NestedGroup title="Security Settings" icon={<SecurityScanOutlined />}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <EnhancedSwitch
            checked={requireAuthentication}
            onChange={onRequireAuthenticationChange}
            label="Require Authentication"
            description="Only authenticated users can control the bot"
          />
        </Col>
        <Col span={12}>
          <div className="form-field">
            <Text strong>Allowed User IDs</Text>
            <Input.TextArea
              value={allowedUsers}
              onChange={(e) => onAllowedUsersChange?.(e.target.value)}
              placeholder="Comma-separated Telegram user IDs"
              rows={2}
            />
          </div>
        </Col>
        <Col span={12}>
          <div className="form-field">
            <Text strong>Admin User IDs</Text>
            <Input.TextArea
              value={adminUsers}
              onChange={(e) => onAdminUsersChange?.(e.target.value)}
              placeholder="Comma-separated admin Telegram user IDs"
              rows={2}
            />
          </div>
        </Col>
        <Col span={24}>
          <EnhancedSwitch
            checked={rateLimiting}
            onChange={onRateLimitingChange}
            label="Enable Rate Limiting"
            description="Prevent spam and abuse"
          />
        </Col>
        {rateLimiting && (
          <Col span={12}>
            <div className="form-field">
              <Text strong>Max Commands Per Minute</Text>
              <InputNumber
                value={maxCommandsPerMinute}
                onChange={onMaxCommandsChange}
                min={1}
                max={100}
                className="number-input"
              />
            </div>
          </Col>
        )}
      </Row>
    </NestedGroup>
  );
};

// Analytics Dashboard Component
export const AnalyticsDashboard: React.FC<{
  enableAnalytics?: boolean;
  onEnableAnalyticsChange?: (value: boolean) => void;
  reportFrequency?: string;
  onReportFrequencyChange?: (value: string) => void;
  includePredictions?: boolean;
  onIncludePredictionsChange?: (value: boolean) => void;
  sentimentAnalysis?: boolean;
  onSentimentAnalysisChange?: (value: boolean) => void;
  riskMetrics?: boolean;
  onRiskMetricsChange?: (value: boolean) => void;
}> = ({
  enableAnalytics,
  onEnableAnalyticsChange,
  reportFrequency,
  onReportFrequencyChange,
  includePredictions,
  onIncludePredictionsChange,
  sentimentAnalysis,
  onSentimentAnalysisChange,
  riskMetrics,
  onRiskMetricsChange
}) => {
  return (
    <NestedGroup title="Analytics and Reporting" icon={<BarChartOutlined />}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <EnhancedSwitch
            checked={enableAnalytics}
            onChange={onEnableAnalyticsChange}
            label="Enable Analytics Dashboard"
            description="Get detailed insights about bot performance"
          />
        </Col>
        {enableAnalytics && (
          <>
            <Col span={12}>
              <div className="form-field">
                <Text strong>Report Frequency</Text>
                <Select
                  value={reportFrequency}
                  onChange={onReportFrequencyChange}
                  className="select-input"
                >
                  <Option value="realtime">Real-time</Option>
                  <Option value="hourly">Hourly</Option>
                  <Option value="daily">Daily</Option>
                  <Option value="weekly">Weekly</Option>
                  <Option value="monthly">Monthly</Option>
                </Select>
              </div>
            </Col>
            <Col span={24}>
              <Divider>Advanced Analytics</Divider>
            </Col>
            <Col span={8}>
              <EnhancedSwitch
                checked={includePredictions}
                onChange={onIncludePredictionsChange}
                label="AI Predictions"
                description="Include AI-powered predictions"
              />
            </Col>
            <Col span={8}>
              <EnhancedSwitch
                checked={sentimentAnalysis}
                onChange={onSentimentAnalysisChange}
                label="Sentiment Analysis"
                description="Market sentiment insights"
              />
            </Col>
            <Col span={8}>
              <EnhancedSwitch
                checked={riskMetrics}
                onChange={onRiskMetricsChange}
                label="Risk Metrics"
                description="Detailed risk analysis"
              />
            </Col>
          </>
        )}
      </Row>
    </NestedGroup>
  );
};

// Automation Features Component
export const AutomationFeatures: React.FC<{
  autoRestartOnError?: boolean;
  onAutoRestartOnErrorChange?: (value: boolean) => void;
  autoAdjustRisk?: boolean;
  onAutoAdjustRiskChange?: (value: boolean) => void;
  autoOptimizeParameters?: boolean;
  onAutoOptimizeParametersChange?: (value: boolean) => void;
  machineLearning?: boolean;
  onMachineLearningChange?: (value: boolean) => void;
  learningRate?: number;
  onLearningRateChange?: (value: number) => void;
}> = ({
  autoRestartOnError,
  onAutoRestartOnErrorChange,
  autoAdjustRisk,
  onAutoAdjustRiskChange,
  autoOptimizeParameters,
  onAutoOptimizeParametersChange,
  machineLearning,
  onMachineLearningChange,
  learningRate,
  onLearningRateChange
}) => {
  return (
    <NestedGroup title="Automation Features" icon={<RobotOutlined />}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <EnhancedSwitch
            checked={autoRestartOnError}
            onChange={onAutoRestartOnErrorChange}
            label="Auto-restart on Error"
            description="Automatically restart bot if it crashes"
          />
        </Col>
        <Col span={12}>
          <EnhancedSwitch
            checked={autoAdjustRisk}
            onChange={onAutoAdjustRiskChange}
            label="Auto-adjust Risk"
            description="Dynamically adjust risk based on performance"
          />
        </Col>
        <Col span={12}>
          <EnhancedSwitch
            checked={autoOptimizeParameters}
            onChange={onAutoOptimizeParametersChange}
            label="Auto-optimize Parameters"
            description="Automatically optimize trading parameters"
          />
        </Col>
        <Col span={12}>
          <EnhancedSwitch
            checked={machineLearning}
            onChange={onMachineLearningChange}
            label="Machine Learning"
            description="Enable ML-based improvements"
          />
        </Col>
        {machineLearning && (
          <Col span={12}>
            <div className="form-field">
              <Text strong>Learning Rate</Text>
              <InputNumber
                value={learningRate}
                onChange={onLearningRateChange}
                min={0.001}
                max={1}
                step={0.001}
                formatter={(value) => `${value}%`}
                parser={(value) => value!.replace('%', '')}
                className="number-input"
              />
            </div>
          </Col>
        )}
      </Row>
    </NestedGroup>
  );
};

export default {
  EnhancedMultiSelect,
  EnhancedSwitch,
  EnhancedTimeRange,
  NestedGroup,
  CommandPreview,
  SecuritySettings,
  AnalyticsDashboard,
  AutomationFeatures,
};
