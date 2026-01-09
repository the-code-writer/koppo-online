import { useState, useEffect } from 'react';
import { Drawer, Tabs, Select, Card, InputNumber, Switch, Button, Space, Typography, Alert, Divider } from 'antd';
import { QRCodeGenerator } from '../../utils/AuthenticatorApp';
import { 
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  DollarOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import './styles.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

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
  { value: 'ethereum', label: 'Ethereum', address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45' },
  { value: 'polygon', label: 'Polygon', address: '0x8ba1f109551bD432803012645Hac136c22C57B' },
  { value: 'bsc', label: 'BSC', address: '0x1234567890123456789012345678901234567890' },
  { value: 'arbitrum', label: 'Arbitrum', address: '0x9876543210987654321098765432109876543210' }
];

export function CashierSettingsDrawer({ visible, onClose }: CashierSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState('deposits');
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
      // Show success message
    } catch (error) {
      console.error('Error saving withdrawal settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentWallet = walletChains.find(c => c.value === selectedChain);

  return (
    <Drawer
      title="Cashier Settings"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="cashier-settings-drawer"
    >
      <div className="cashier-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="cashier-tabs"
          size="large"
        >
          <TabPane 
            tab={
              <span className="tab-label">
                <ArrowDownOutlined /> Deposits
              </span>
            } 
            key="deposits"
          >
            <div className="deposits-content">
              {/* Wallet Chain Selection */}
              <Card className="chain-card" title="Select Wallet Chain" size="small">
                <div className="chain-selection">
                  <Text className="selection-label">Choose blockchain network:</Text>
                  <Select
                    value={selectedChain}
                    onChange={handleChainChange}
                    className="chain-select"
                    size="large"
                  >
                    {walletChains.map(chain => (
                      <Select.Option key={chain.value} value={chain.value}>
                        <div className="chain-option">
                          <WalletOutlined className="chain-icon" />
                          <span>{chain.label}</span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </Card>

              {/* QR Code Display */}
              <Card className="qr-card" title="Deposit Address" size="small">
                <div className="qr-content">
                  <div className="qr-container">
                    {loading ? (
                      <div className="qr-loading">
                        <div className="loading-spinner"></div>
                      </div>
                    ) : (
                      <img src={qrCodeUrl} alt="QR Code" className="qr-image" />
                    )}
                  </div>
                  <div className="address-info">
                    <div className="address-label">
                      <WalletOutlined /> {currentWallet?.label} Address
                    </div>
                    <div className="address-value">
                      {currentWallet?.address}
                    </div>
                    <Button 
                      type="primary" 
                      size="small" 
                      className="copy-btn"
                      onClick={() => {
                        if (currentWallet?.address) {
                          navigator.clipboard.writeText(currentWallet.address);
                        }
                      }}
                    >
                      Copy Address
                    </Button>
                  </div>
                </div>
              </Card>

              <Alert
                message="Deposit Information"
                description="Send funds to the address above. Make sure to select the correct blockchain network to avoid losing your funds."
                type="info"
                showIcon
                className="deposit-alert"
              />
            </div>
          </TabPane>

          <TabPane 
            tab={
              <span className="tab-label">
                <ArrowUpOutlined /> Withdrawal
              </span>
            } 
            key="withdrawal"
          >
            <div className="withdrawal-content">
              {/* Auto Withdrawal Toggle */}
              <Card className="withdrawal-card" title="Auto Withdrawal Settings" size="small">
                <div className="toggle-section">
                  <div className="toggle-info">
                    <Title level={5} className="toggle-title">
                      <ThunderboltOutlined /> Enable Auto Withdrawal
                    </Title>
                    <Text className="toggle-description">
                      Automatically withdraw profits based on your configured settings
                    </Text>
                  </div>
                  <Switch
                    checked={withdrawalSettings.autoWithdrawal}
                    onChange={(checked) => handleWithdrawalSettingsChange('autoWithdrawal', checked)}
                    className="auto-withdrawal-toggle"
                    size="default"
                  />
                </div>

                {withdrawalSettings.autoWithdrawal && (
                  <div className="withdrawal-settings">
                    <Divider className="settings-divider" />
                    
                    {/* Trigger Settings */}
                    <div className="settings-group">
                      <Title level={5} className="group-title">
                        <CalendarOutlined /> Trigger Conditions
                      </Title>
                      
                      <div className="setting-item">
                        <Text className="setting-label">Day of Month</Text>
                        <InputNumber
                          value={withdrawalSettings.triggerDay}
                          onChange={(value) => handleWithdrawalSettingsChange('triggerDay', value)}
                          min={1}
                          max={31}
                          className="setting-input"
                          addonAfter="day"
                        />
                      </div>

                      <div className="setting-item">
                        <Text className="setting-label">Profit Threshold</Text>
                        <InputNumber
                          value={withdrawalSettings.profitThreshold}
                          onChange={(value) => handleWithdrawalSettingsChange('profitThreshold', value)}
                          min={0}
                          className="setting-input"
                          addonBefore="$"
                          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                        />
                      </div>

                      <div className="setting-item">
                        <Text className="setting-label">Amount Threshold</Text>
                        <InputNumber
                          value={withdrawalSettings.amountThreshold}
                          onChange={(value) => handleWithdrawalSettingsChange('amountThreshold', value)}
                          min={0}
                          className="setting-input"
                          addonBefore="$"
                          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                        />
                      </div>

                      <div className="setting-item">
                        <Text className="setting-label">Time Interval</Text>
                        <InputNumber
                          value={withdrawalSettings.timeInterval}
                          onChange={(value) => handleWithdrawalSettingsChange('timeInterval', value)}
                          min={1}
                          max={168}
                          className="setting-input"
                          addonAfter="hours"
                        />
                      </div>
                    </div>

                    <Divider className="settings-divider" />

                    {/* Withdrawal Amount Settings */}
                    <div className="settings-group">
                      <Title level={5} className="group-title">
                        <DollarOutlined /> Withdrawal Amount
                      </Title>
                      
                      <div className="setting-item">
                        <Text className="setting-label">Amount per Withdrawal</Text>
                        <InputNumber
                          value={withdrawalSettings.withdrawalAmount}
                          onChange={(value) => handleWithdrawalSettingsChange('withdrawalAmount', value)}
                          min={0}
                          className="setting-input"
                          addonBefore="$"
                          formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Save Button */}
              <div className="withdrawal-actions">
                <Space>
                  <Button 
                    type="primary" 
                    size="large" 
                    loading={loading}
                    onClick={handleSaveWithdrawalSettings}
                    className="save-btn"
                    disabled={!withdrawalSettings.autoWithdrawal}
                  >
                    Save Settings
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
                    className="reset-btn"
                  >
                    Reset
                  </Button>
                </Space>
              </div>

              {!withdrawalSettings.autoWithdrawal && (
                <Alert
                  message="Auto Withdrawal Disabled"
                  description="Enable auto withdrawal to configure automatic profit withdrawal settings."
                  type="warning"
                  showIcon
                  className="withdrawal-alert"
                />
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>
    </Drawer>
  );
}

