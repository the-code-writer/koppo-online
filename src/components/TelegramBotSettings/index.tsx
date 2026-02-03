import React, { useState } from 'react';
import { Card, Typography, Row, Col, Divider, Alert, Space, Tag } from 'antd';
import { 
  MessageOutlined, 
  SecurityScanOutlined, 
  BarChartOutlined, 
  RobotOutlined,
  AudioOutlined,
  BulbOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { 
  EnhancedMultiSelect, 
  EnhancedSwitch, 
  NestedGroup, 
  CommandPreview,
  SecuritySettings,
  AnalyticsDashboard,
  AutomationFeatures
} from '../EnhancedFormComponents';
import './styles.scss';

const { Title, Text, Paragraph } = Typography;

interface TelegramBotSettingsProps {
  values?: any;
  onChange?: (values: any) => void;
}

export const TelegramBotSettings: React.FC<TelegramBotSettingsProps> = ({ 
  values = {}, 
  onChange 
}) => {
  const [activeSection, setActiveSection] = useState<string>('commands');

  const updateValue = (path: string, value: any) => {
    const newValues = { ...values };
    const keys = path.split('.');
    let current = newValues;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    onChange?.(newValues);
  };

  const getValue = (path: string, defaultValue: any = null) => {
    const keys = path.split('.');
    let current = values;
    
    for (const key of keys) {
      if (current?.[key] === undefined) return defaultValue;
      current = current[key];
    }
    
    return current;
  };

  const commandOptions = [
    { value: 'status', label: 'Status - Check bot status' },
    { value: 'start', label: 'Start - Start the bot' },
    { value: 'stop', label: 'Stop - Stop the bot' },
    { value: 'pause', label: 'Pause - Pause trading' },
    { value: 'resume', label: 'Resume - Resume trading' },
    { value: 'balance', label: 'Balance - Check account balance' },
    { value: 'positions', label: 'Positions - View open positions' },
    { value: 'history', label: 'History - View trade history' },
    { value: 'settings', label: 'Settings - Modify bot settings' },
    { value: 'help', label: 'Help - Show available commands' }
  ];

  const quickActionOptions = [
    { value: 'quick_stop', label: 'Quick Stop - Emergency stop' },
    { value: 'quick_pause', label: 'Quick Pause - Temporary pause' },
    { value: 'reduce_risk', label: 'Reduce Risk - Lower position sizes' },
    { value: 'close_all', label: 'Close All - Close all positions' },
    { value: 'take_profit', label: 'Take Profit - Close profitable positions' },
    { value: 'extend_cooldown', label: 'Extend Cooldown - Add more cooldown time' }
  ];

  return (
    <div className="telegram-bot-settings">
      {/* Header Section */}
      <div className="telegram-header">
        <div className="header-content">
          <div className="header-icon">
            <MessageOutlined />
          </div>
          <div className="header-text">
            <Title level={3} className="header-title">Advanced Telegram Bot Settings</Title>
            <Paragraph className="header-description">
              Configure comprehensive Telegram integration with advanced features including voice commands, 
              AI-powered analytics, and automated trading controls.
            </Paragraph>
          </div>
        </div>
        <div className="header-status">
          <Tag color={getValue('enable_telegram_notifications') ? 'green' : 'default'}>
            {getValue('enable_telegram_notifications') ? 'Active' : 'Inactive'}
          </Tag>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card size="small" className="stat-card">
              <div className="stat-content">
                <MessageOutlined className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-value">{getValue('notification_frequency', 'immediate')}</div>
                  <div className="stat-label">Frequency</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card">
              <div className="stat-content">
                <SecurityScanOutlined className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-value">{getValue('security_settings.require_authentication') ? 'Secured' : 'Open'}</div>
                  <div className="stat-label">Security</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card">
              <div className="stat-content">
                <RobotOutlined className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-value">{getValue('automation_features.machine_learning') ? 'ML On' : 'ML Off'}</div>
                  <div className="stat-label">Automation</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" className="stat-card">
              <div className="stat-content">
                <BarChartOutlined className="stat-icon" />
                <div className="stat-info">
                  <div className="stat-value">{getValue('analytics_and_reporting.enable_analytics') ? 'Enabled' : 'Disabled'}</div>
                  <div className="stat-label">Analytics</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Settings */}
      <div className="settings-content">
        <Row gutter={[24, 24]}>
          <Col span={16}>
            {/* Core Settings */}
            <Card title="Core Settings" className="settings-card">
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <EnhancedSwitch
                  checked={getValue('enable_telegram_notifications')}
                  onChange={(checked) => updateValue('enable_telegram_notifications', checked)}
                  label="Enable Telegram Notifications"
                  description="Send notifications and receive commands via Telegram bot"
                />

                <div className="form-field">
                  <Text strong>Notification Frequency</Text>
                  <select 
                    className="ant-select ant-select-single ant-select-show-arrow"
                    value={getValue('notification_frequency', 'immediate')}
                    onChange={(e) => updateValue('notification_frequency', e.target.value)}
                  >
                    <option value="immediate">Immediate</option>
                    <option value="hourly">Hourly Digest</option>
                    <option value="daily">Daily Summary</option>
                    <option value="weekly">Weekly Report</option>
                  </select>
                </div>

                <div className="form-field">
                  <Text strong>Notification Timing</Text>
                  <EnhancedMultiSelect
                    value={getValue('notification_timing', ['business_hours'])}
                    onChange={(value) => updateValue('notification_timing', value)}
                    options={[
                      { value: 'business_hours', label: 'Business Hours (9 AM - 5 PM)' },
                      { value: 'after_hours', label: 'After Hours (5 PM - 9 PM)' },
                      { value: 'weekend', label: 'Weekend' },
                      { value: '24_7', label: '24/7' }
                    ]}
                    placeholder="Select notification timing"
                  />
                </div>
              </Space>
            </Card>

            {/* Bot Commands */}
            <Card title="Bot Commands" className="settings-card">
              <NestedGroup title="Interactive Commands" icon={<MessageOutlined />}>
                <EnhancedSwitch
                  checked={getValue('bot_commands.enable_commands')}
                  onChange={(checked) => updateValue('bot_commands.enable_commands', checked)}
                  label="Enable Interactive Commands"
                  description="Allow users to control the bot via Telegram commands"
                />

                {getValue('bot_commands.enable_commands') && (
                  <>
                    <div className="form-field">
                      <Text strong>Command Prefix</Text>
                      <input
                        type="text"
                        className="ant-input"
                        value={getValue('bot_commands.command_prefix', '/')}
                        onChange={(e) => updateValue('bot_commands.command_prefix', e.target.value)}
                        placeholder="e.g., / or !"
                      />
                    </div>

                    <div className="form-field">
                      <Text strong>Allowed Commands</Text>
                      <EnhancedMultiSelect
                        value={getValue('bot_commands.allowed_commands', ['status', 'help'])}
                        onChange={(value) => updateValue('bot_commands.allowed_commands', value)}
                        options={commandOptions}
                        placeholder="Select allowed commands"
                      />
                    </div>

                    <CommandPreview
                      prefix={getValue('bot_commands.command_prefix', '/')}
                      commands={getValue('bot_commands.allowed_commands', ['status', 'help'])}
                    />
                  </>
                )}
              </NestedGroup>
            </Card>

            {/* Voice Commands */}
            <Card title="Voice Commands" className="settings-card">
              <NestedGroup title="Voice Control" icon={<AudioOutlined />}>
                <EnhancedSwitch
                  checked={getValue('voice_commands.enable_voice')}
                  onChange={(checked) => updateValue('voice_commands.enable_voice', checked)}
                  label="Enable Voice Commands"
                  description="Control the bot using voice messages in Telegram"
                />

                {getValue('voice_commands.enable_voice') && (
                  <div className="voice-commands-demo">
                    <Alert
                      message="Voice Commands Active"
                      description="Send voice messages to control your bot. Supported languages: English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese."
                      type="success"
                      showIcon
                    />
                  </div>
                )}
              </NestedGroup>
            </Card>
          </Col>

          <Col span={8}>
            {/* Quick Actions */}
            <Card title="Quick Actions" className="settings-card">
              <NestedGroup title="Interactive Buttons" icon={<ThunderboltOutlined />}>
                <EnhancedSwitch
                  checked={getValue('interactive_notifications.enable_quick_actions')}
                  onChange={(checked) => updateValue('interactive_notifications.enable_quick_actions', checked)}
                  label="Enable Quick Action Buttons"
                  description="Add action buttons to notifications for instant responses"
                />

                {getValue('interactive_notifications.enable_quick_actions') && (
                  <div className="form-field">
                    <Text strong>Available Quick Actions</Text>
                    <EnhancedMultiSelect
                      value={getValue('interactive_notifications.quick_actions', [])}
                      onChange={(value) => updateValue('interactive_notifications.quick_actions', value)}
                      options={quickActionOptions}
                      placeholder="Select quick actions"
                      maxTagCount={2}
                    />
                  </div>
                )}

                <EnhancedSwitch
                  checked={getValue('interactive_notifications.confirmation_required')}
                  onChange={(checked) => updateValue('interactive_notifications.confirmation_required', checked)}
                  label="Require Confirmation"
                  description="Ask for confirmation before executing critical actions"
                />
              </NestedGroup>
            </Card>

            {/* Message Formatting */}
            <Card title="Message Formatting" className="settings-card">
              <NestedGroup title="Display Options" icon={<BulbOutlined />}>
                <EnhancedSwitch
                  checked={getValue('message_formatting.use_emoji')}
                  onChange={(checked) => updateValue('message_formatting.use_emoji', checked)}
                  label="Use Emojis"
                  description="Make messages more engaging with emojis"
                />

                <EnhancedSwitch
                  checked={getValue('message_formatting.include_charts')}
                  onChange={(checked) => updateValue('message_formatting.include_charts', checked)}
                  label="Include Charts"
                  description="Add visual charts to performance reports"
                />
              </NestedGroup>
            </Card>

            {/* Security Settings */}
            <SecuritySettings
              requireAuthentication={getValue('security_settings.require_authentication')}
              onRequireAuthenticationChange={(checked) => updateValue('security_settings.require_authentication', checked)}
              allowedUsers={getValue('security_settings.allowed_users')}
              onAllowedUsersChange={(value) => updateValue('security_settings.allowed_users', value)}
              adminUsers={getValue('security_settings.admin_users')}
              onAdminUsersChange={(value) => updateValue('security_settings.admin_users', value)}
              rateLimiting={getValue('security_settings.rate_limiting')}
              onRateLimitingChange={(checked) => updateValue('security_settings.rate_limiting', checked)}
              maxCommandsPerMinute={getValue('security_settings.max_commands_per_minute')}
              onMaxCommandsChange={(value) => updateValue('security_settings.max_commands_per_minute', value)}
            />
          </Col>
        </Row>

        {/* Advanced Features */}
        <Divider />
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <AnalyticsDashboard
              enableAnalytics={getValue('analytics_and_reporting.enable_analytics')}
              onEnableAnalyticsChange={(checked) => updateValue('analytics_and_reporting.enable_analytics', checked)}
              reportFrequency={getValue('analytics_and_reporting.report_frequency')}
              onReportFrequencyChange={(value) => updateValue('analytics_and_reporting.report_frequency', value)}
              includePredictions={getValue('analytics_and_reporting.include_predictions')}
              onIncludePredictionsChange={(checked) => updateValue('analytics_and_reporting.include_predictions', checked)}
              sentimentAnalysis={getValue('analytics_and_reporting.sentiment_analysis')}
              onSentimentAnalysisChange={(checked) => updateValue('analytics_and_reporting.sentiment_analysis', checked)}
              riskMetrics={getValue('analytics_and_reporting.risk_metrics')}
              onRiskMetricsChange={(checked) => updateValue('analytics_and_reporting.risk_metrics', checked)}
            />
          </Col>
          <Col span={12}>
            <AutomationFeatures
              autoRestartOnError={getValue('automation_features.auto_restart_on_error')}
              onAutoRestartOnErrorChange={(checked) => updateValue('automation_features.auto_restart_on_error', checked)}
              autoAdjustRisk={getValue('automation_features.auto_adjust_risk')}
              onAutoAdjustRiskChange={(checked) => updateValue('automation_features.auto_adjust_risk', checked)}
              autoOptimizeParameters={getValue('automation_features.auto_optimize_parameters')}
              onAutoOptimizeParametersChange={(checked) => updateValue('automation_features.auto_optimize_parameters', checked)}
              machineLearning={getValue('automation_features.machine_learning')}
              onMachineLearningChange={(checked) => updateValue('automation_features.machine_learning', checked)}
              learningRate={getValue('automation_features.learning_rate')}
              onLearningRateChange={(value) => updateValue('automation_features.learning_rate', value)}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default TelegramBotSettings;
