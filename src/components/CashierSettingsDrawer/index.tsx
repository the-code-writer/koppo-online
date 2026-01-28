import { Drawer, Tabs, InputNumber, Switch, Button, Typography, Divider, Tooltip, Tag, message } from 'antd';
import { QRCodeGenerator } from '../../utils/AuthenticatorApp';
import { 
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  SecurityScanOutlined,
  RocketOutlined,
  CheckCircleFilled,
  WalletOutlined
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
      title={
        <div className="drawer-header-content">
          <DollarOutlined className="title-icon" />
          <span>Cashier Settings</span>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="cashier-settings-drawer"
      closeIcon={<ArrowUpOutlined rotate={-90} />}
    >
      <div className="cashier-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="premium-tabs"
          items={[
            {
              key: 'deposits',
              label: (
                <span className="tab-label">
                  <ArrowDownOutlined /> Deposits
                </span>
              ),
              children: (
                <div className="deposits-content animate-fade-in">
                  {/* Network Selector Section */}
                  <div className="section-group">
                    <Text className="section-label">Blockchain Network</Text>
                    <div className="network-selector-grid">
                      {walletChains.map(chain => (
                        <div 
                          key={chain.value}
                          className={`network-option ${selectedChain === chain.value ? 'active' : ''}`}
                          onClick={() => handleChainChange(chain.value)}
                        >
                          <div className={`chain-dot ${chain.value}`} />
                          <span className="chain-name">{chain.label}</span>
                          {selectedChain === chain.value && <CheckCircleFilled className="active-icon" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="premium-card address-card-premium">
                    <div className="qr-container-wrapper">
                      <div className="qr-box-premium">
                        {loading ? (
                          <div className="qr-shimmer" />
                        ) : (
                          <img src={qrCodeUrl} alt="Deposit QR" className="qr-img" />
                        )}
                      </div>
                      <div className="address-details">
                        <Title level={5} className="address-title">Your Deposit Address</Title>
                        <Text type="secondary" className="address-desc">
                          Send only {currentWallet?.label} assets to this address.
                        </Text>
                        
                        <div className="copyable-address">
                          <Text code className="address-hash">{currentWallet?.address}</Text>
                          <Button 
                            type="primary" 
                            icon={<CopyOutlined />} 
                            className="copy-button-premium"
                            onClick={() => {
                              if (currentWallet?.address) {
                                navigator.clipboard.writeText(currentWallet.address);
                                alert('Address copied to clipboard!');
                              }
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="alert-glass info">
                    <InfoCircleOutlined className="alert-icon" />
                    <div className="alert-text">
                      <Text strong>Network Safety</Text>
                      <Text size="small">Ensure the network matches your wallet to avoid loss of funds. Deposits are usually confirmed within 10-20 minutes.</Text>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'withdrawal',
              label: (
                <span className="tab-label">
                  <ArrowUpOutlined /> Withdrawal
                </span>
              ),
              children: (
                <div className="withdrawal-content animate-fade-in">
                  <div className="premium-card status-card">
                    <div className="status-main">
                      <div className={`glow-icon ${withdrawalSettings.autoWithdrawal ? 'active' : ''}`}>
                        <ThunderboltOutlined />
                      </div>
                      <div className="status-text">
                        <Title level={4}>Smart Payouts</Title>
                        <Text type="secondary">Automated profit withdrawals</Text>
                      </div>
                      <Switch
                        checked={withdrawalSettings.autoWithdrawal}
                        onChange={(checked) => handleWithdrawalSettingsChange('autoWithdrawal', checked)}
                        className="premium-switch"
                      />
                    </div>

                    {withdrawalSettings.autoWithdrawal && (
                      <div className="settings-expansion">
                        <Divider className="glass-divider" />
                        
                        <div className="premium-input-wrapper">
                          <Text className="input-label">Payout Day</Text>
                          <InputNumber
                            value={withdrawalSettings.triggerDay}
                            onChange={(value) => handleWithdrawalSettingsChange('triggerDay', value)}
                            min={1} max={31}
                            className="premium-input-number"
                            addonAfter="Day"
                          />
                        </div>

                        <div className="premium-input-wrapper">
                          <Text className="input-label">Profit Target</Text>
                          <InputNumber
                            value={withdrawalSettings.profitThreshold}
                            onChange={(value) => handleWithdrawalSettingsChange('profitThreshold', value)}
                            min={0}
                            className="premium-input-number"
                            prefix="$"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                          />
                        </div>

                        <div className="premium-input-wrapper">
                          <Text className="input-label">Min. Balance</Text>
                          <InputNumber
                            value={withdrawalSettings.amountThreshold}
                            onChange={(value) => handleWithdrawalSettingsChange('amountThreshold', value)}
                            min={0}
                            className="premium-input-number"
                            prefix="$"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                          />
                        </div>

                        <div className="premium-input-wrapper">
                          <Text className="input-label">Frequency</Text>
                          <InputNumber
                            value={withdrawalSettings.timeInterval}
                            onChange={(value) => handleWithdrawalSettingsChange('timeInterval', value)}
                            min={1} max={168}
                            className="premium-input-number"
                            addonAfter="Hrs"
                          />
                        </div>

                        <div className="premium-input-wrapper full-width">
                          <Text className="input-label">Fixed Amount per Withdrawal</Text>
                          <InputNumber
                            value={withdrawalSettings.withdrawalAmount}
                            onChange={(value) => handleWithdrawalSettingsChange('withdrawalAmount', value)}
                            min={0}
                            className="premium-input-number"
                            prefix="$"
                            size="large"
                            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="actions-footer">
                    <Button 
                      type="primary" 
                      size="large" 
                      onClick={handleSaveWithdrawalSettings}
                      loading={loading}
                      disabled={!withdrawalSettings.autoWithdrawal}
                      className="confirm-btn"
                    >
                      Confirm Settings
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
                  </div>

                  {!withdrawalSettings.autoWithdrawal && (
                    <div className="alert-glass warning">
                      <HistoryOutlined className="alert-icon" />
                      <div className="alert-text">
                        <Text strong>Auto-Withdrawal Paused</Text>
                        <Text size="small">Enable smart payouts to automatically secure your earnings according to your schedule.</Text>
                      </div>
                    </div>
                  )}
                </div>
              ),
            }
          ]}
        />
      </div>
    </Drawer>
  );
}

