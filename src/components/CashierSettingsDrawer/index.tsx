import { useState, useEffect } from 'react';
import { Drawer, InputNumber, Switch, Button, Typography, Divider, Tooltip, Tag, message, Space } from 'antd';
import { QRCodeGenerator } from '../../utils/AuthenticatorApp';
import { 
  ArrowUpOutlined,
  CalendarOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  SecurityScanOutlined,
  RocketOutlined,
  CheckCircleFilled,
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
      title={
        <div className="drawer-header-premium">
          <div className="title-section">
            <WalletOutlined className="header-icon" />
            <Title level={4}>Cashier Settings</Title>
          </div>
          <Text type="secondary">Manage your funds and automate payouts</Text>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={550}
      className="cashier-settings-drawer-premium"
      closeIcon={<ArrowUpOutlined rotate={-90} />}
    >
      <div className="cashier-content-premium">
          <div className="tab-pane-content animate-fade-in">
            {/* Withdrawal Section */}
            <div className="feature-intro-minimal">
              <Title level={3} className="intro-title">Automated Payouts</Title>
              <Text className="intro-description">
                Configure your smart withdrawal settings to automatically secure your profits.
              </Text>
            </div>

            <div className="premium-glass-card withdrawal-status-card">
              <div className="status-header-premium">
                <div className={`status-glow-icon ${withdrawalSettings.autoWithdrawal ? 'active' : ''}`}>
                  <ThunderboltOutlined />
                </div>
                <div className="status-meta">
                  <Title level={4}>Auto-Withdrawal</Title>
                  <Text type="secondary">{withdrawalSettings.autoWithdrawal ? 'System is active and monitoring' : 'System is currently paused'}</Text>
                </div>
                <Switch
                  checked={withdrawalSettings.autoWithdrawal}
                  onChange={(checked) => handleWithdrawalSettingsChange('autoWithdrawal', checked)}
                  className="premium-toggle-switch"
                />
              </div>

              {withdrawalSettings.autoWithdrawal && (
                <div className="settings-panel-premium">
                  <Divider className="panel-divider" />
                  
                  <div className="settings-input-grid">
                    <div className="input-group-premium">
                      <label className="input-label"><CalendarOutlined /> Payout Day</label>
                      <InputNumber
                        min={1} max={31}
                        value={withdrawalSettings.triggerDay}
                        onChange={(v) => handleWithdrawalSettingsChange('triggerDay', v)}
                        addonAfter="th"
                        className="input-field-premium"
                      />
                    </div>
                    
                    <div className="input-group-premium">
                      <label className="input-label"><RocketOutlined /> Profit Target</label>
                      <InputNumber
                        min={0}
                        value={withdrawalSettings.profitThreshold}
                        onChange={(v) => handleWithdrawalSettingsChange('profitThreshold', v)}
                        prefix="$"
                        className="input-field-premium"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                      />
                    </div>

                    <div className="input-group-premium">
                      <label className="input-label"><SafetyOutlined /> Min. Balance</label>
                      <InputNumber
                        min={0}
                        value={withdrawalSettings.amountThreshold}
                        onChange={(v) => handleWithdrawalSettingsChange('amountThreshold', v)}
                        prefix="$"
                        className="input-field-premium"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                      />
                    </div>

                    <div className="input-group-premium">
                      <label className="input-label"><HistoryOutlined /> Frequency</label>
                      <InputNumber
                        min={1} max={168}
                        value={withdrawalSettings.timeInterval}
                        onChange={(v) => handleWithdrawalSettingsChange('timeInterval', v)}
                        addonAfter="Hrs"
                        className="input-field-premium"
                      />
                    </div>
                  </div>

                  <div className="amount-focus-section">
                    <div className="section-label-premium">
                      <DollarOutlined />
                      <span>Target Withdrawal Amount</span>
                    </div>
                    <InputNumber
                      min={0}
                      value={withdrawalSettings.withdrawalAmount}
                      onChange={(v) => handleWithdrawalSettingsChange('withdrawalAmount', v)}
                      prefix="$"
                      className="amount-input-premium"
                      size="large"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="premium-footer-actions">
              <Button 
                type="primary" 
                size="large" 
                onClick={handleSaveWithdrawalSettings}
                loading={loading}
                disabled={!withdrawalSettings.autoWithdrawal}
                className="save-button-premium"
              >
                Update Configuration
              </Button>
              <Button 
                size="large"
                onClick={() => setWithdrawalSettings({
                  autoWithdrawal: false,
                  triggerDay: 1,
                  profitThreshold: 100,
                  amountThreshold: 500,
                  timeInterval: 24,
                  withdrawalAmount: 100
                })}
                className="reset-button-premium"
              >
                Reset to Defaults
              </Button>
            </div>

            {!withdrawalSettings.autoWithdrawal && (
              <div className="premium-alert warning">
                <HistoryOutlined className="alert-icon" />
                <div className="alert-body">
                  <Text strong>Auto-Withdrawal Paused</Text>
                  <Text className="alert-text">Enable smart payouts to secure your earnings automatically based on your targets.</Text>
                </div>
              </div>
            )}

            {/* Divider between sections */}
            <Divider className="section-divider-large" />

            {/* Crypto Deposit Section */}
            <div className="premium-glass-card crypto-deposit-card">
              <div className="feature-intro-minimal">
                <Title level={3} className="intro-title">Receive Crypto</Title>
                <Text className="intro-description">
                  Select a network to view your unique deposit address and QR code.
                </Text>
              </div>

              <div className="content-section">
                <div className="section-header">
                  <GlobalOutlined />
                  <Title level={5}>1. Select Network</Title>
                </div>
                <div className="network-grid-premium">
                  {walletChains.map(chain => (
                    <div 
                      key={chain.value}
                      className={`network-card-premium ${selectedChain === chain.value ? 'active' : ''}`}
                      onClick={() => handleChainChange(chain.value)}
                    >
                      <div className="network-card-body">
                        <div className="network-info">
                          <span className="network-dot" style={{ backgroundColor: chain.color }} />
                          <span className="network-name">{chain.label}</span>
                        </div>
                        {selectedChain === chain.value && <CheckCircleFilled className="check-icon" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-header">
                <SecurityScanOutlined />
                <Title level={5}>2. Deposit Details</Title>
              </div>

              <div className="address-section">
                <div className="qr-wrapper-premium">
                  <div className="qr-frame">
                    {loading ? (
                      <div className="qr-placeholder-loading" />
                    ) : (
                      <img src={qrCodeUrl} alt="Deposit QR" className="qr-image-premium" />
                    )}
                  </div>
                </div>
                
                <div className="address-info-premium">
                  <div className="info-header">
                    <Title level={5}>{currentWallet?.label} Address</Title>
                    <Tag color="blue" className="chain-tag">Mainnet</Tag>
                  </div>
                  
                  <div className="copy-box-premium">
                    <Text code className="address-code">{currentWallet?.address}</Text>
                    <Tooltip title="Copy Address">
                      <Button 
                        type="primary" 
                        icon={<CopyOutlined />} 
                        className="copy-btn-premium"
                        onClick={() => {
                          if (currentWallet?.address) {
                            navigator.clipboard.writeText(currentWallet.address);
                            message.success('Address copied to clipboard!');
                          }
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="premium-alert info">
                <InfoCircleOutlined className="alert-icon" />
                <div className="alert-body">
                  <Text strong>Security Notice</Text>
                  <Text className="alert-text">Ensure you are sending assets compatible with the {currentWallet?.label} network. Sending incorrect assets may lead to permanent loss.</Text>
                </div>
              </div>
            </div>
        </div>
      </div>
    </Drawer>
  );
}
