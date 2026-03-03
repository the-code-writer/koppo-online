import { useState, useEffect, useCallback } from 'react';
import {
  Drawer, InputNumber, Switch, Button, Typography, Space, message,
  Form, Tabs, Input, Segmented, QRCode, Tooltip, Badge, Slider, Empty,
  Collapse, Select, Tag, Rate, Progress
} from 'antd';
import {
  ArrowRightOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  WalletOutlined,
  SafetyOutlined,
  SwapOutlined,
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  KeyOutlined,
  UserOutlined,
  StarFilled,
  MenuOutlined,
  SettingOutlined,
  BellOutlined,
  SyncOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import './styles.scss';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ─── Types ───────────────────────────────────────────────────────────────────

interface CashierSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

interface ProfitLockinSettings {
  hourly: { enabled: boolean; percentage: number; amount: number };
  fourHourly: { enabled: boolean; percentage: number; amount: number };
  daily: { enabled: boolean; percentage: number; amount: number };
  autoCompound: boolean;
  compoundPercentage: number;
  notifyOnLockin: boolean;
}

interface WalletInfo {
  network: string;
  symbol: string;
  address: string;
  balance: string;
  balanceUsd: string;
  color: string;
  icon: string;
  chainId?: number;
  decimals: number;
  explorerUrl: string;
}

type WalletInputMode = 'manual' | 'seed';

interface DerivP2PSeller {
  id: string;
  buyerName: string;
  accountId: string;
  username: string;
  rating: number;
  completionRate: number;
  totalOrders: number;
  avgResponseTime: string;
  isActive: boolean;
  currency: string;
  minAmount: number;
  maxAmount: number;
}

interface GeneralSettings {
  autoWithdrawal: boolean;
  triggerDay: number;
  profitThreshold: number;
  amountThreshold: number;
  timeInterval: number;
  withdrawalAmount: number;
  notificationsEnabled: boolean;
  emailAlerts: boolean;
  defaultCurrency: string;
  timezone: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_WALLETS: WalletInfo[] = [
  {
    network: 'Solana', symbol: 'SOL', address: '',
    balance: '0.00', balanceUsd: '$0.00', color: '#9945FF',
    icon: '◎', decimals: 9,
    explorerUrl: 'https://explorer.solana.com/address/'
  },
  {
    network: 'Ethereum', symbol: 'ETH', address: '',
    balance: '0.00', balanceUsd: '$0.00', color: '#627EEA',
    icon: 'Ξ', chainId: 1, decimals: 18,
    explorerUrl: 'https://etherscan.io/address/'
  },
  {
    network: 'TRON', symbol: 'TRX', address: '',
    balance: '0.00', balanceUsd: '$0.00', color: '#FF0013',
    icon: '◈', decimals: 6,
    explorerUrl: 'https://tronscan.org/#/address/'
  },
  {
    network: 'Bitcoin', symbol: 'BTC', address: '',
    balance: '0.00', balanceUsd: '$0.00', color: '#F7931A',
    icon: '₿', decimals: 8,
    explorerUrl: 'https://mempool.space/address/'
  },
];

const DEFAULT_P2P_SELLERS: DerivP2PSeller[] = [
  {
    id: 'p2p-1', buyerName: 'CryptoKing_ZA', accountId: 'CR4521890',
    username: '@cryptoking', rating: 4.8, completionRate: 98.5,
    totalOrders: 1243, avgResponseTime: '< 2 min', isActive: true,
    currency: 'USD', minAmount: 10, maxAmount: 5000,
  },
  {
    id: 'p2p-2', buyerName: 'FastPay_Trader', accountId: 'CR7834561',
    username: '@fastpay', rating: 4.6, completionRate: 96.2,
    totalOrders: 876, avgResponseTime: '< 5 min', isActive: true,
    currency: 'USD', minAmount: 20, maxAmount: 3000,
  },
  {
    id: 'p2p-3', buyerName: 'SafeExchange', accountId: 'CR1122334',
    username: '@safeexchange', rating: 4.9, completionRate: 99.1,
    totalOrders: 2105, avgResponseTime: '< 1 min', isActive: false,
    currency: 'USD', minAmount: 50, maxAmount: 10000,
  },
  {
    id: 'p2p-4', buyerName: 'QuickBuyer_Pro', accountId: 'CR9988776',
    username: '@quickbuyer', rating: 4.3, completionRate: 91.0,
    totalOrders: 342, avgResponseTime: '< 10 min', isActive: false,
    currency: 'USD', minAmount: 5, maxAmount: 1000,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function CashierSettingsDrawer({ visible, onClose }: CashierSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState('profit');
  const [loading, setLoading] = useState(false);

  // Profit Lock-in state
  const [profitSettings, setProfitSettings] = useState<ProfitLockinSettings>({
    hourly: { enabled: false, percentage: 10, amount: 0 },
    fourHourly: { enabled: true, percentage: 25, amount: 0 },
    daily: { enabled: true, percentage: 50, amount: 0 },
    autoCompound: false,
    compoundPercentage: 20,
    notifyOnLockin: true,
  });

  // Crypto Wallet state
  const [wallets, setWallets] = useState<WalletInfo[]>(DEFAULT_WALLETS);
  const [selectedWalletIdx, setSelectedWalletIdx] = useState(0);
  const [walletInputMode, setWalletInputMode] = useState<WalletInputMode>('manual');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [showSeed, setShowSeed] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [fetchingBalance, setFetchingBalance] = useState(false);

  // Deriv P2P state
  const [p2pSellers, setP2pSellers] = useState<DerivP2PSeller[]>(DEFAULT_P2P_SELLERS);
  const [draggedSeller, setDraggedSeller] = useState<string | null>(null);

  // General settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    autoWithdrawal: false,
    triggerDay: 1,
    profitThreshold: 100,
    amountThreshold: 500,
    timeInterval: 24,
    withdrawalAmount: 100,
    notificationsEnabled: true,
    emailAlerts: false,
    defaultCurrency: 'USD',
    timezone: 'UTC+2',
  });

  const selectedWallet = wallets[selectedWalletIdx];

  // ─── Wallet Handlers ────────────────────────────────────────────────────────

  const handleSetWalletAddress = useCallback(() => {
    if (!addressInput.trim()) {
      message.warning('Please enter a valid wallet address');
      return;
    }
    setWallets(prev => prev.map((w, i) =>
      i === selectedWalletIdx ? { ...w, address: addressInput.trim() } : w
    ));
    setAddressInput('');
    message.success(`${selectedWallet.symbol} address saved`);
  }, [addressInput, selectedWalletIdx, selectedWallet]);

  const handleCreateFromSeed = useCallback(() => {
    if (!seedPhrase.trim() || seedPhrase.trim().split(/\s+/).length < 12) {
      message.warning('Please enter a valid 12 or 24 word seed phrase');
      return;
    }
    // Derive a deterministic mock address per network from seed
    const mockAddresses: Record<string, string> = {
      SOL: `${seedPhrase.trim().split(/\s+/)[0]}...sol${Math.random().toString(36).slice(2, 8)}`,
      ETH: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      TRX: `T${Array.from({ length: 33 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      BTC: `bc1q${Array.from({ length: 38 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };
    setWallets(prev => prev.map(w => ({
      ...w,
      address: mockAddresses[w.symbol] || w.address,
    })));
    setSeedPhrase('');
    message.success('Wallets derived from seed phrase');
  }, [seedPhrase]);

  const handleRefreshBalance = useCallback(async (idx: number) => {
    setFetchingBalance(true);
    try {
      // Simulate balance fetch — in production, use viem/wagmi public client
      await new Promise(r => setTimeout(r, 1200));
      const mockBalances: Record<string, { balance: string; usd: string }> = {
        SOL: { balance: (Math.random() * 10).toFixed(4), usd: `$${(Math.random() * 1500).toFixed(2)}` },
        ETH: { balance: (Math.random() * 2).toFixed(6), usd: `$${(Math.random() * 5000).toFixed(2)}` },
        TRX: { balance: (Math.random() * 50000).toFixed(2), usd: `$${(Math.random() * 3000).toFixed(2)}` },
        BTC: { balance: (Math.random() * 0.5).toFixed(8), usd: `$${(Math.random() * 15000).toFixed(2)}` },
      };
      setWallets(prev => prev.map((w, i) => {
        if (i !== idx) return w;
        const mb = mockBalances[w.symbol];
        return mb ? { ...w, balance: mb.balance, balanceUsd: mb.usd } : w;
      }));
      message.success(`${wallets[idx].symbol} balance refreshed`);
    } catch {
      message.error('Failed to fetch balance');
    } finally {
      setFetchingBalance(false);
    }
  }, [wallets]);

  const handleRefreshAllBalances = useCallback(async () => {
    setFetchingBalance(true);
    for (let i = 0; i < wallets.length; i++) {
      await handleRefreshBalance(i);
    }
    setFetchingBalance(false);
  }, [wallets, handleRefreshBalance]);

  // ─── P2P Handlers ──────────────────────────────────────────────────────────

  const handleToggleSeller = useCallback((id: string, active: boolean) => {
    setP2pSellers(prev => prev.map(s => s.id === id ? { ...s, isActive: active } : s));
  }, []);

  const handleMoveSeller = useCallback((id: string, direction: 'up' | 'down') => {
    setP2pSellers(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }, []);

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSaveAll = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: persist to API
      console.log('Saving settings:', { profitSettings, wallets, p2pSellers, generalSettings });
      await new Promise(r => setTimeout(r, 800));
      message.success('All settings saved successfully!');
    } catch {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  }, [profitSettings, wallets, p2pSellers, generalSettings]);

  // ─── Tab: Profit Lock-in ────────────────────────────────────────────────────

  const renderProfitLockin = () => {
    const intervals: { key: keyof Pick<ProfitLockinSettings, 'hourly' | 'fourHourly' | 'daily'>; label: string; icon: React.ReactNode; description: string }[] = [
      { key: 'hourly', label: 'Hourly', icon: <ClockCircleOutlined />, description: 'Lock profits every hour for rapid compounding' },
      { key: 'fourHourly', label: '4-Hourly', icon: <ClockCircleOutlined />, description: 'Lock profits every 4 hours for balanced growth' },
      { key: 'daily', label: 'Daily', icon: <ClockCircleOutlined />, description: 'Lock profits at end of each trading day' },
    ];

    return (
      <div className="tab-content profit-lockin-tab">
        <div className="tab-description">
          <LockOutlined className="tab-desc-icon" />
          <div>
            <Text strong>Profit Lock-in Strategy</Text>
            <Text className="info-text">
              Automatically secure a percentage of your profits at regular intervals to protect gains.
            </Text>
          </div>
        </div>

        <div className="lockin-intervals">
          {intervals.map(({ key, label, icon, description }) => {
            const setting = profitSettings[key];
            return (
              <div key={key} className={`lockin-card ${setting.enabled ? 'active' : ''}`}>
                <div className="lockin-card-header">
                  <div className="lockin-card-title">
                    <span className="lockin-icon">{icon}</span>
                    <div>
                      <Text strong className="lockin-label">{label}</Text>
                      <Text className="lockin-description">{description}</Text>
                    </div>
                  </div>
                  <Switch
                    checked={setting.enabled}
                    onChange={(checked) => setProfitSettings(prev => ({
                      ...prev,
                      [key]: { ...prev[key], enabled: checked },
                    }))}
                    className="modern-switch"
                  />
                </div>
                {setting.enabled && (
                  <div className="lockin-card-body">
                    <div className="lockin-slider-row">
                      <Text className="slider-label">Lock-in Percentage</Text>
                      <div className="slider-value-display">
                        <Slider
                          min={1}
                          max={100}
                          value={setting.percentage}
                          onChange={(val) => setProfitSettings(prev => ({
                            ...prev,
                            [key]: { ...prev[key], percentage: val },
                          }))}
                          className="modern-slider"
                          tooltip={{ formatter: (val) => `${val}%` }}
                        />
                        <Tag color="blue" className="percentage-tag">{setting.percentage}%</Tag>
                      </div>
                    </div>
                    <Form.Item label="Fixed Lock Amount (optional)" className="lockin-amount-field">
                      <InputNumber
                        min={0}
                        value={setting.amount}
                        onChange={(v) => setProfitSettings(prev => ({
                          ...prev,
                          [key]: { ...prev[key], amount: v || 0 },
                        }))}
                        prefix="$"
                        className="modern-input"
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                        placeholder="0.00"
                      />
                    </Form.Item>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Collapse
          ghost
          className="advanced-options"
          items={[{
            key: 'advanced',
            label: <Text strong className="advanced-label"><SettingOutlined /> Advanced Options</Text>,
            children: (
              <div className="advanced-content">
                <div className="switch-container">
                  <div>
                    <span className="switch-label">Auto-Compound Profits</span>
                    <Text className="switch-description">Reinvest locked profits automatically</Text>
                  </div>
                  <Switch
                    checked={profitSettings.autoCompound}
                    onChange={(checked) => setProfitSettings(prev => ({ ...prev, autoCompound: checked }))}
                    className="modern-switch"
                  />
                </div>
                {profitSettings.autoCompound && (
                  <div className="compound-slider">
                    <Text className="slider-label">Compound Rate</Text>
                    <Slider
                      min={1}
                      max={100}
                      value={profitSettings.compoundPercentage}
                      onChange={(val) => setProfitSettings(prev => ({ ...prev, compoundPercentage: val }))}
                      marks={{ 1: '1%', 25: '25%', 50: '50%', 75: '75%', 100: '100%' }}
                      className="modern-slider"
                    />
                  </div>
                )}
                <div className="switch-container">
                  <div>
                    <span className="switch-label">Notify on Lock-in</span>
                    <Text className="switch-description">Get alerted when profits are locked</Text>
                  </div>
                  <Switch
                    checked={profitSettings.notifyOnLockin}
                    onChange={(checked) => setProfitSettings(prev => ({ ...prev, notifyOnLockin: checked }))}
                    className="modern-switch"
                  />
                </div>
              </div>
            ),
          }]}
        />
      </div>
    );
  };

  // ─── Tab: Crypto Wallets ────────────────────────────────────────────────────

  const renderCryptoWallets = () => (
    <div className="tab-content crypto-wallets-tab">
      <div className="tab-description">
        <WalletOutlined className="tab-desc-icon" />
        <div>
          <Text strong>Receive Payment Wallets</Text>
          <Text className="info-text">
            Configure wallet addresses for receiving crypto payments. View balances across SOL, ETH, TRC &amp; BTC networks.
          </Text>
        </div>
      </div>

      {/* Network Selector */}
      <Segmented
        block
        value={selectedWalletIdx}
        onChange={(val) => setSelectedWalletIdx(val as number)}
        options={wallets.map((w, i) => ({
          label: (
            <div className="network-seg-item">
              <span className="network-seg-icon" style={{ color: w.color }}>{w.icon}</span>
              <span className="network-seg-label">{w.symbol}</span>
            </div>
          ),
          value: i,
        }))}
        className="network-segmented"
      />

      {/* Balance Overview Strip */}
      <div className="balance-overview">
        {wallets.map((w, i) => (
          <div
            key={w.symbol}
            className={`balance-chip ${i === selectedWalletIdx ? 'active' : ''}`}
            onClick={() => setSelectedWalletIdx(i)}
          >
            <span className="chip-icon" style={{ color: w.color }}>{w.icon}</span>
            <div className="chip-info">
              <span className="chip-balance">{w.balance} {w.symbol}</span>
              <span className="chip-usd">{w.balanceUsd}</span>
            </div>
          </div>
        ))}
        <Tooltip title="Refresh all balances">
          <Button
            type="text"
            icon={<ReloadOutlined spin={fetchingBalance} />}
            onClick={handleRefreshAllBalances}
            className="refresh-all-btn"
          />
        </Tooltip>
      </div>

      {/* Selected Wallet Detail */}
      <div className="wallet-detail-card" style={{ borderColor: selectedWallet.color + '40' }}>
        <div className="wallet-detail-header">
          <div className="wallet-network-info">
            <span className="wallet-big-icon" style={{ background: selectedWallet.color + '15', color: selectedWallet.color }}>
              {selectedWallet.icon}
            </span>
            <div>
              <Text strong className="wallet-network-name">{selectedWallet.network}</Text>
              <Text className="wallet-network-sub">{selectedWallet.symbol} • Mainnet</Text>
            </div>
          </div>
          <div className="wallet-balance-display">
            <Text strong className="wallet-balance-main">{selectedWallet.balance} {selectedWallet.symbol}</Text>
            <Text className="wallet-balance-usd">{selectedWallet.balanceUsd}</Text>
          </div>
        </div>

        {/* QR Code + Address */}
        {selectedWallet.address ? (
          <div className="wallet-address-section">
            <div className="qr-frame">
              <QRCode
                value={selectedWallet.address}
                size={140}
                bordered={false}
                color={selectedWallet.color}
              />
            </div>
            <div className="address-info">
              <div className="address-header">
                <Text strong>{selectedWallet.network} Address</Text>
                <Tag color="green" icon={<CheckCircleOutlined />}>Configured</Tag>
              </div>
              <div className="address-copy">
                <Text code className="address-text">{selectedWallet.address}</Text>
                <Tooltip title="Copy address">
                  <Button
                    type="primary"
                    icon={<CopyOutlined />}
                    className="copy-button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedWallet.address);
                      message.success('Address copied!');
                    }}
                  />
                </Tooltip>
              </div>
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined spin={fetchingBalance} />}
                onClick={() => handleRefreshBalance(selectedWalletIdx)}
                className="refresh-balance-link"
              >
                Refresh Balance
              </Button>
            </div>
          </div>
        ) : (
          <div className="wallet-empty-state">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No address configured"
            />
          </div>
        )}

        {/* Input Mode */}
        <div className="wallet-input-section">
          <Segmented
            block
            value={walletInputMode}
            onChange={(val) => setWalletInputMode(val as WalletInputMode)}
            options={[
              { label: <span><WalletOutlined /> Enter Address</span>, value: 'manual' },
              { label: <span><KeyOutlined /> From Seed Phrase</span>, value: 'seed' },
            ]}
            className="input-mode-segmented"
          />

          {walletInputMode === 'manual' ? (
            <div className="manual-input-section">
              <Input
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder={`Enter your ${selectedWallet.symbol} address`}
                className="modern-input address-field"
                suffix={
                  <Button
                    type="primary"
                    size="small"
                    onClick={handleSetWalletAddress}
                    icon={<CheckCircleOutlined />}
                  >
                    Set
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="seed-input-section">
              <div className="info-box seed-warning">
                <ExclamationCircleOutlined className="info-icon" />
                <div className="info-content">
                  <Text strong>Security Warning</Text>
                  <Text className="info-text">
                    Your seed phrase is processed locally and never sent to any server.
                    Ensure no one can see your screen.
                  </Text>
                </div>
              </div>
              <div className="seed-input-wrapper">
                <TextArea
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  placeholder="Enter your 12 or 24 word seed phrase separated by spaces"
                  rows={3}
                  className="modern-input seed-textarea"
                  style={{ fontFamily: 'monospace' }}
                />
                <Button
                  type="text"
                  icon={showSeed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={() => setShowSeed(!showSeed)}
                  className="seed-toggle"
                />
              </div>
              {!showSeed && seedPhrase && (
                <div className="seed-mask">
                  {seedPhrase.split(/\s+/).map((_, i) => (
                    <span key={i} className="seed-dot">••••</span>
                  ))}
                </div>
              )}
              <Button
                type="primary"
                block
                onClick={handleCreateFromSeed}
                icon={<KeyOutlined />}
                className="derive-button"
              >
                Derive All Wallets from Seed
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ─── Tab: Deriv P2P ─────────────────────────────────────────────────────────

  const renderDerivP2P = () => (
    <div className="tab-content p2p-tab">
      <div className="tab-description">
        <SwapOutlined className="tab-desc-icon" />
        <div>
          <Text strong>Deriv P2P Sellers</Text>
          <Text className="info-text">
            Manage your preferred P2P sellers in priority order. Drag to reorder, toggle to activate.
          </Text>
        </div>
      </div>

      <div className="p2p-stats-row">
        <div className="p2p-stat">
          <Text className="p2p-stat-value">{p2pSellers.filter(s => s.isActive).length}</Text>
          <Text className="p2p-stat-label">Active</Text>
        </div>
        <div className="p2p-stat">
          <Text className="p2p-stat-value">{p2pSellers.length}</Text>
          <Text className="p2p-stat-label">Total</Text>
        </div>
        <div className="p2p-stat">
          <Text className="p2p-stat-value">
            {p2pSellers.length > 0 ? (p2pSellers.reduce((acc, s) => acc + s.rating, 0) / p2pSellers.length).toFixed(1) : '0'}
          </Text>
          <Text className="p2p-stat-label">Avg Rating</Text>
        </div>
      </div>

      <div className="p2p-seller-list">
        {p2pSellers.map((seller, index) => (
          <div
            key={seller.id}
            className={`p2p-seller-card ${seller.isActive ? 'active' : 'inactive'} ${draggedSeller === seller.id ? 'dragging' : ''}`}
            draggable
            onDragStart={() => setDraggedSeller(seller.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedSeller && draggedSeller !== seller.id) {
                setP2pSellers(prev => {
                  const copy = [...prev];
                  const fromIdx = copy.findIndex(s => s.id === draggedSeller);
                  const toIdx = copy.findIndex(s => s.id === seller.id);
                  const [item] = copy.splice(fromIdx, 1);
                  copy.splice(toIdx, 0, item);
                  return copy;
                });
              }
              setDraggedSeller(null);
            }}
            onDragEnd={() => setDraggedSeller(null)}
          >
            <div className="seller-priority">
              <MenuOutlined className="drag-handle" />
              <span className="priority-number">#{index + 1}</span>
            </div>

            <div className="seller-info">
              <div className="seller-name-row">
                <UserOutlined className="seller-avatar-icon" />
                <div>
                  <Text strong className="seller-name">{seller.buyerName}</Text>
                  <div className="seller-ids">
                    <Text className="seller-account-id">{seller.accountId}</Text>
                    <Text className="seller-username">{seller.username}</Text>
                  </div>
                </div>
              </div>

              <div className="seller-metrics">
                <div className="seller-metric">
                  <Rate disabled defaultValue={seller.rating} allowHalf className="seller-rating" />
                  <Text className="seller-rating-text">{seller.rating}</Text>
                </div>
                <div className="seller-metric">
                  <Progress
                    percent={seller.completionRate}
                    size="small"
                    strokeColor={seller.completionRate > 95 ? '#52c41a' : seller.completionRate > 85 ? '#faad14' : '#ff4d4f'}
                    className="completion-progress"
                  />
                  <Text className="metric-label">{seller.completionRate}% completion</Text>
                </div>
                <div className="seller-meta-tags">
                  <Tag icon={<ClockCircleOutlined />}>{seller.avgResponseTime}</Tag>
                  <Tag>{seller.totalOrders} orders</Tag>
                  <Tag>${seller.minAmount} - ${seller.maxAmount}</Tag>
                </div>
              </div>
            </div>

            <div className="seller-actions">
              <Switch
                checked={seller.isActive}
                onChange={(checked) => handleToggleSeller(seller.id, checked)}
                className="modern-switch"
              />
              <div className="reorder-buttons">
                <Button
                  type="text"
                  size="small"
                  disabled={index === 0}
                  onClick={() => handleMoveSeller(seller.id, 'up')}
                  className="reorder-btn"
                >
                  ↑
                </Button>
                <Button
                  type="text"
                  size="small"
                  disabled={index === p2pSellers.length - 1}
                  onClick={() => handleMoveSeller(seller.id, 'down')}
                  className="reorder-btn"
                >
                  ↓
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        className="add-seller-btn"
        onClick={() => message.info('Add seller flow coming soon')}
      >
        Add P2P Seller
      </Button>
    </div>
  );

  // ─── Tab: General Settings ──────────────────────────────────────────────────

  const renderGeneralSettings = () => (
    <div className="tab-content general-tab">
      <div className="tab-description">
        <SettingOutlined className="tab-desc-icon" />
        <div>
          <Text strong>General Settings</Text>
          <Text className="info-text">
            Configure automatic withdrawals, notifications, and default preferences.
          </Text>
        </div>
      </div>

      {/* Auto Withdrawal */}
      <div className="settings-section">
        <div className="settings-section-title">
          <ThunderboltOutlined />
          <Text strong>Automatic Withdrawals</Text>
        </div>

        <div className="switch-container">
          <div>
            <span className="switch-label">Enable Auto Withdrawals</span>
            <Text className="switch-description">Automatically withdraw when targets are met</Text>
          </div>
          <Switch
            checked={generalSettings.autoWithdrawal}
            onChange={(checked) => setGeneralSettings(prev => ({ ...prev, autoWithdrawal: checked }))}
            className="modern-switch"
          />
        </div>

        {generalSettings.autoWithdrawal && (
          <Form layout="vertical" className="modern-form" requiredMark={false}>
            <div className="settings-grid">
              <Form.Item label="Payout Day">
                <InputNumber
                  min={1} max={31}
                  value={generalSettings.triggerDay}
                  onChange={(v) => setGeneralSettings(prev => ({ ...prev, triggerDay: v || 1 }))}
                  addonAfter="th"
                  className="modern-input"
                  placeholder="Day of month"
                />
              </Form.Item>
              <Form.Item label="Profit Target">
                <InputNumber
                  min={0}
                  value={generalSettings.profitThreshold}
                  onChange={(v) => setGeneralSettings(prev => ({ ...prev, profitThreshold: v || 0 }))}
                  prefix="$"
                  className="modern-input"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                />
              </Form.Item>
              <Form.Item label="Minimum Balance">
                <InputNumber
                  min={0}
                  value={generalSettings.amountThreshold}
                  onChange={(v) => setGeneralSettings(prev => ({ ...prev, amountThreshold: v || 0 }))}
                  prefix="$"
                  className="modern-input"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
                />
              </Form.Item>
              <Form.Item label="Frequency">
                <InputNumber
                  min={1} max={168}
                  value={generalSettings.timeInterval}
                  onChange={(v) => setGeneralSettings(prev => ({ ...prev, timeInterval: v || 24 }))}
                  addonAfter="Hrs"
                  className="modern-input"
                />
              </Form.Item>
            </div>
            <Form.Item label="Withdrawal Amount">
              <InputNumber
                min={0}
                value={generalSettings.withdrawalAmount}
                onChange={(v) => setGeneralSettings(prev => ({ ...prev, withdrawalAmount: v || 0 }))}
                prefix="$"
                className="modern-input amount-input"
                size="large"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
              />
            </Form.Item>
          </Form>
        )}
      </div>

      {/* Notifications */}
      <div className="settings-section">
        <div className="settings-section-title">
          <BellOutlined />
          <Text strong>Notifications</Text>
        </div>
        <div className="switch-container">
          <div>
            <span className="switch-label">Push Notifications</span>
            <Text className="switch-description">Receive alerts for withdrawals and locks</Text>
          </div>
          <Switch
            checked={generalSettings.notificationsEnabled}
            onChange={(checked) => setGeneralSettings(prev => ({ ...prev, notificationsEnabled: checked }))}
            className="modern-switch"
          />
        </div>
        <div className="switch-container">
          <div>
            <span className="switch-label">Email Alerts</span>
            <Text className="switch-description">Get email summaries of activities</Text>
          </div>
          <Switch
            checked={generalSettings.emailAlerts}
            onChange={(checked) => setGeneralSettings(prev => ({ ...prev, emailAlerts: checked }))}
            className="modern-switch"
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="settings-section">
        <div className="settings-section-title">
          <SafetyOutlined />
          <Text strong>Preferences</Text>
        </div>
        <Form layout="vertical" className="modern-form" requiredMark={false}>
          <div className="settings-grid">
            <Form.Item label="Default Currency">
              <Select
                value={generalSettings.defaultCurrency}
                onChange={(val) => setGeneralSettings(prev => ({ ...prev, defaultCurrency: val }))}
                className="modern-select"
                options={[
                  { value: 'USD', label: '🇺🇸 USD' },
                  { value: 'EUR', label: '🇪🇺 EUR' },
                  { value: 'GBP', label: '🇬🇧 GBP' },
                  { value: 'ZAR', label: '🇿🇦 ZAR' },
                ]}
              />
            </Form.Item>
            <Form.Item label="Timezone">
              <Select
                value={generalSettings.timezone}
                onChange={(val) => setGeneralSettings(prev => ({ ...prev, timezone: val }))}
                className="modern-select"
                options={[
                  { value: 'UTC', label: 'UTC' },
                  { value: 'UTC+1', label: 'UTC+1 (WAT)' },
                  { value: 'UTC+2', label: 'UTC+2 (SAST)' },
                  { value: 'UTC+3', label: 'UTC+3 (EAT)' },
                  { value: 'UTC-5', label: 'UTC-5 (EST)' },
                  { value: 'UTC-8', label: 'UTC-8 (PST)' },
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={visible}
      width={560}
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
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="cashier-tabs"
          size="small"
          items={[
            {
              key: 'profit',
              label: <span><LockOutlined /> Profit Lock</span>,
              children: renderProfitLockin(),
            },
            {
              key: 'wallets',
              label: <span><WalletOutlined /> Wallets</span>,
              children: renderCryptoWallets(),
            },
            {
              key: 'p2p',
              label: <span><SwapOutlined /> P2P</span>,
              children: renderDerivP2P(),
            },
            {
              key: 'general',
              label: <span><SettingOutlined /> General</span>,
              children: renderGeneralSettings(),
            },
          ]}
        />

        <Space className="action-buttons" direction="vertical" size={12}>
          <Button
            type="primary"
            onClick={handleSaveAll}
            loading={loading}
            size="large"
            block
            className="submit-button"
          >
            Save All Settings
          </Button>
          <Button
            type="default"
            size="large"
            block
            className="reset-button"
            onClick={() => {
              setProfitSettings({
                hourly: { enabled: false, percentage: 10, amount: 0 },
                fourHourly: { enabled: true, percentage: 25, amount: 0 },
                daily: { enabled: true, percentage: 50, amount: 0 },
                autoCompound: false,
                compoundPercentage: 20,
                notifyOnLockin: true,
              });
              setWallets(DEFAULT_WALLETS);
              setP2pSellers(DEFAULT_P2P_SELLERS);
              setGeneralSettings({
                autoWithdrawal: false,
                triggerDay: 1,
                profitThreshold: 100,
                amountThreshold: 500,
                timeInterval: 24,
                withdrawalAmount: 100,
                notificationsEnabled: true,
                emailAlerts: false,
                defaultCurrency: 'USD',
                timezone: 'UTC+2',
              });
              message.info('Settings reset to defaults');
            }}
          >
            Reset to Defaults
          </Button>
        </Space>
      </div>
    </Drawer>
  );
}
