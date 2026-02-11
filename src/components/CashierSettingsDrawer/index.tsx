import { useState, useEffect } from 'react';
import { Drawer, InputNumber, Switch, Button, Typography, Space, message, Form, Radio } from 'antd';
import { QRCodeGenerator } from '../../utils/AuthenticatorApp';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  SecurityScanOutlined,
  RocketOutlined,
  WalletOutlined,
  GlobalOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import './styles.scss';

const { Title, Text } = Typography;

interface CashierSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface WithdrawalSettings {
  autoWithdrawal: boolean;
  triggerDay: number;
  profitThreshold: number;
  amountThreshold: number;
  timeInterval: number;
  withdrawalAmount: number;
}

const walletChains = [
  { value: 'ethereum', label: 'Ethereum', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45', color: '#627eea' },
  { value: 'polygon', label: 'Polygon', address: '0x8ba1f109551bD432803012645Hac136c22C57B', color: '#8247e5' },
  { value: 'bsc', label: 'BSC', address: '0x1234567890123456789012345678901234567890', color: '#f3ba2f' },
  { value: 'arbitrum', label: 'Arbitrum', address: '0x9876543210987654321098765432109876543210', color: '#28a0f0' }
];

export function CashierSettingsDrawer({ visible, onClose }: CashierSettingsDrawerProps) {
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [withdrawalSettings, setWithdrawalSettings] = useState<WithdrawalSettings>({
    autoWithdrawal: false,
    triggerDay: 1,
    profitThreshold: 100,
    amountThreshold: 500,
    timeInterval: 24,
    withdrawalAmount: 100
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      generateQRCode(selectedChain);
    }
  }, [visible, selectedChain]);

  const generateQRCode = async (chain: string) => {
    setLoading(true);
    try {
      const chainData = walletChains.find(c => c.value === chain);
      if (chainData) {
        const qrData = `ethereum:${chainData.address}`;
        const qrUrl = await QRCodeGenerator.generateQRCode(qrData, 200);
        setQrCodeUrl(qrUrl);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChainChange = (chain: string) => {
    setSelectedChain(chain);
  };

  const handleWithdrawalSettingsChange = (key: keyof WithdrawalSettings, value: any) => {
    setWithdrawalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveWithdrawalSettings = async () => {
    setLoading(true);
    try {
      // TODO: Save withdrawal settings to API
      console.log('Saving withdrawal settings:', withdrawalSettings);
      message.success('Withdrawal settings saved successfully!');
    } catch (error) {
      console.error('Error saving withdrawal settings:', error);
      message.error('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const currentWallet = walletChains.find(c => c.value === selectedChain);

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={visible}
      size={600}
      className="cashier-settings-drawer"
      closeIcon={null}
    >
      <div className="drawer-header">
        <Button 
          type="text" 
          icon={<ArrowRightOutlined rotate={180} />} 
          onClick={onClose}
          className="back-button"
        />
        <Title level={4} className="drawer-title">Cashier Settings</Title>
      </div>

      <div className="drawer-content">
        <div className="drawer-sections">
          {/* Automatic Withdrawals Section */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <ThunderboltOutlined className="section-icon" />
              <h3 className="drawer-section-title">Automatic Withdrawals</h3>
            </div>
            <div className="drawer-section-content">
              <Space className="action-buttons" vertical size={18}>
                <Text className="info-text">
                  Configure smart withdrawals to automatically secure your profits based on your targets.
                </Text>
                
                <div className="switch-container">
                  <span className="switch-label">Enable Automatic Withdrawals</span>
                  <Switch
                    checked={withdrawalSettings.autoWithdrawal}
                    onChange={(checked) => handleWithdrawalSettingsChange('autoWithdrawal', checked)}
                    className="modern-switch"
                  />
                </div>
              </Space>

              {withdrawalSettings.autoWithdrawal && (
                <Form layout="vertical" className="modern-form" requiredMark={false}>
                  <div className="settings-grid">
                    <Form.Item label="Payout Day">
                      <InputNumber
                        min={1} max={31}
                        value={withdrawalSettings.triggerDay}
                        onChange={(v) => handleWithdrawalSettingsChange('triggerDay', v)}
                        addonAfter="th"
                        className="modern-input"
                        placeholder="Day of month"
                      />
                    </Form.Item>

                    <Form.Item label="Profit Target">
                      <InputNumber
                        min={0}
                        value={withdrawalSettings.profitThreshold}
                        onChange={(v) => handleWithdrawalSettingsChange('profitThreshold', v)}
                        prefix="$"
                        className="modern-input"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                        placeholder="Minimum profit"
                      />
                    </Form.Item>

                    <Form.Item label="Minimum Balance">
                      <InputNumber
                        min={0}
                        value={withdrawalSettings.amountThreshold}
                        onChange={(v) => handleWithdrawalSettingsChange('amountThreshold', v)}
                        prefix="$"
                        className="modern-input"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                        placeholder="Account balance"
                      />
                    </Form.Item>

                    <Form.Item label="Frequency">
                      <InputNumber
                        min={1} max={168}
                        value={withdrawalSettings.timeInterval}
                        onChange={(v) => handleWithdrawalSettingsChange('timeInterval', v)}
                        addonAfter="Hrs"
                        className="modern-input"
                        placeholder="Check interval"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item label="Target Withdrawal Amount">
                    <InputNumber
                      min={0}
                      value={withdrawalSettings.withdrawalAmount}
                      onChange={(v) => handleWithdrawalSettingsChange('withdrawalAmount', v)}
                      prefix="$"
                      className="modern-input amount-input"
                      size="large"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                      placeholder="Amount to withdraw"
                    />
                  </Form.Item>
                </Form>
              )}
            </div>
          </div>

          {/* Withdraw Crypto Section */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <WalletOutlined className="section-icon" />
              <h3 className="drawer-section-title">Withdraw Crypto</h3>
            </div>
            <div className="drawer-section-content">
              <Space className="action-buttons" vertical size={18}>
                <Text className="info-text">
                  Select a network to view your unique deposit address and QR code for receiving crypto payments.
                </Text>
              </Space>

              <div className="network-selection">
                <div className="section-label">Select Network</div>
                <Radio.Group 
                  value={selectedChain} 
                  onChange={(e) => handleChainChange(e.target.value)}
                  className="crypto-radio-group"
                >
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {walletChains.map(chain => (
                      <Radio 
                        key={chain.value} 
                        value={chain.value}
                        className="crypto-radio-option"
                      >
                        <div className="radio-content">
                          <span className="network-dot" style={{ backgroundColor: chain.color }} />
                          <span className="network-name">{chain.label}</span>
                        </div>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>

              <div className="deposit-details">
                <div className="section-label">Deposit Details</div>
                
                <div className="info-box">
                  <InfoCircleOutlined className="info-icon" />
                  <div className="info-content">
                    <Text strong>Security Notice</Text>
                    <Text className="info-text">
                      Ensure you are sending assets compatible with the {currentWallet?.label} network. 
                      Sending incorrect assets may lead to permanent loss.
                    </Text>
                  </div>
                </div>

                <div className="address-display">
                  <div className="qr-section">
                    <div className="qr-frame">
                      {loading ? (
                        <div className="qr-placeholder" />
                      ) : (
                        <img src={qrCodeUrl} alt="Deposit QR" className="qr-image" />
                      )}
                    </div>
                  </div>

                  <div className="address-info">
                    <div className="address-header">
                      <Text strong>{currentWallet?.label} Address</Text>
                      <span className="network-badge">Mainnet</span>
                    </div>
                    
                    <div className="address-copy">
                      <Text code className="address-text">{currentWallet?.address}</Text>
                      <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        className="copy-button"
                        onClick={() => {
                          if (currentWallet?.address) {
                            navigator.clipboard.writeText(currentWallet.address);
                            message.success('Address copied to clipboard!');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Space className="action-buttons" vertical size={18}>
          <Button 
            type="primary" 
            onClick={handleSaveWithdrawalSettings}
            loading={loading}
            size="large"
            block
            className="submit-button"
          >
            Save Settings
          </Button>
          <Button 
            type="default"
            onClick={() => setWithdrawalSettings({
              autoWithdrawal: false,
              triggerDay: 1,
              profitThreshold: 100,
              amountThreshold: 500,
              timeInterval: 24,
              withdrawalAmount: 100
            })}
            size="large"
            block
            className="reset-button"
          >
            Reset to Defaults
          </Button>
        </Space>
      </div>
    </Drawer>
  );
}
