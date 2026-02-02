/**
 * @file: Header/index.tsx
 * @description: Application header component that displays authentication state,
 *               account information, and provides login/deposit functionality.
 *
 * @components: Header - Main header component with conditional rendering based on auth state
 * @dependencies:
 *   - antd: Button, Space, Dropdown components
 *   - assets/logo.png: Logo image
 *   - styles.scss: Component styling
 * @usage:
 *   <Header
 *     isLoggedIn={true}
 *     accountType="Real"
 *     balance="1000.00"
 *     currency="USD"
 *     onDepositClick={() => {}}
 *   />
 *
 * @architecture: Presentational component with conditional rendering
 * @relationships:
 *   - Used by: App.tsx
 *   - Related to: AccountHeader component
 * @dataFlow: Receives auth state and account data as props, triggers login/deposit actions
 *
 * @ai-hints: This component uses conditional rendering based on isLoggedIn prop
 *            to display different UI states. The component is purely presentational
 *            and doesn't manage its own state.
 */
import { Button, Dropdown, Avatar, Flex } from "antd";
import type { MenuProps } from "antd";
import { UserOutlined, LogoutOutlined, CheckCircleFilled, BellOutlined } from "@ant-design/icons";
import DerivLogo from "../../assets/logo.png";
import "./styles.scss";
import { useState } from "react";
import { useDeriv } from "../../hooks/useDeriv";
import { CurrencyDemoIcon, CurrencyBtcIcon, CurrencyEthIcon, CurrencyLtcIcon, CurrencyUsdIcon, CurrencyUsdcIcon, CurrencyUsdtIcon, CurrencyXrpIcon, IconSize } from '@deriv/quill-icons';
import { NotificationsDrawer } from "../NotificationsDrawer";
import { useEventPublisher } from '../../hooks/useEventManager';
import { useOAuth } from "../../contexts/OAuthContext";

const getCurrencyIcon = (currency?: string, size: IconSize | undefined = 'sm') => {
    const normalizedCurrency = currency?.toLowerCase();

    switch (normalizedCurrency) {
      case 'demo':
      case 'virtual':
        return <CurrencyDemoIcon fill='#000000' iconSize={size} />;
      case 'btc':
        return <CurrencyBtcIcon fill='#000000' iconSize={size} />;
      case 'eth':
        return <CurrencyEthIcon fill='#000000' iconSize={size} />;
      case 'ltc':
        return <CurrencyLtcIcon fill='#000000' iconSize={size} />;
      case 'usd':
        return <CurrencyUsdIcon fill='#000000' iconSize={size} />;
      case 'usdc':
        return <CurrencyUsdcIcon fill='#000000' iconSize={size} />;
      case 'usdt':
      case 'eusdt':
      case 'tusdt':
        return <CurrencyUsdtIcon fill='#000000' iconSize={size} />;
      case 'xrp':
        return <CurrencyXrpIcon fill='#000000' iconSize={size} />;
      default:
        return <CurrencyUsdIcon fill='#000000' iconSize={size} />; // Default to USD icon
    }
  };

// Selected Deriv Account Component
const SelectedDerivAccount = ({ account }: { account: any }) => {
  

  if (!account) return null;

  return (<Flex gap={8}>
    <Flex vertical style={{ textAlign: "right" }}>
      <code style={{ fontSize: 14, letterSpacing: 1 }}><strong>{account?.account || ''}</strong></code>
      <code style={{ fontSize: 12 }}>{account.currency} • {account.balance.toFixed(2)}</code>
    </Flex>
    <Avatar
      src={getCurrencyIcon(account.currency, 'lg')}
      icon={<UserOutlined />} size={40}
    />
  </Flex>
  );
};

const mockData = {
  user: {
    name: 'Trader',
    avatar: null,
    level: 'Pro',
    memberSince: '2024'
  },
  portfolio: {
    totalValue: 2048.35,
    dailyChange: 2847.50,
    dailyChangePercent: 0.62,
    weeklyChange: 12450.80,
    weeklyChangePercent: 2.79,
    weeklyPerformance: [
      { day: 'Mon', profit: 2340.50 },
      { day: 'Tue', profit: 1890.25 },
      { day: 'Wed', profit: -520.15 },
      { day: 'Thu', profit: 3450.80 },
      { day: 'Fri', profit: 2890.40 },
      { day: 'Sat', profit: 1560.20 }
    ] // as WeeklyPerformance[]
  },
  quickStats: {
    activeBots: 8,
    totalBots: 12,
    winRate: 73.4,
    totalTrades: 1,
    profitToday: 246.17,
    profitThisMonth: 12562.12,
    commissionsThisMonth: 2332.50,
    streak: 7
  },
  topPerformers: [
    { id: 1, name: 'Alpha Momentum', profit: 12450.20, change: 8.5, status: 'running', icon: '🚀' },
    { id: 2, name: 'Beta Scalper', profit: 8920.15, change: 5.2, status: 'running', icon: '⚡' },
    { id: 3, name: 'Gamma Swing', profit: 6540.80, change: 3.8, status: 'paused', icon: '🎯' }
  ],
  recentActivity: [
    { id: 1, type: 'win', bot: 'Alpha Momentum', amount: 245.50, time: '2 min ago' },
    { id: 2, type: 'win', bot: 'Beta Scalper', amount: 180.25, time: '5 min ago' },
    { id: 3, type: 'loss', bot: 'Gamma Swing', amount: -85.15, time: '12 min ago' },
    { id: 4, type: 'win', bot: 'Alpha Momentum', amount: 320.80, time: '18 min ago' }
  ],
  marketSentiment: 'bullish',
  notifications: 3,
  notificationsList: [
    {
      id: '1',
      type: 'profit' as const,
      title: 'Profit Alert',
      message: 'Alpha Momentum bot generated profit',
      time: '2 min ago',
      read: false,
      amount: 245.50
    },
    {
      id: '2',
      type: 'achievement' as const,
      title: 'New Achievement',
      message: 'You\'ve reached 7-day win streak!',
      time: '1 hour ago',
      read: false
    },
    {
      id: '3',
      type: 'bot' as const,
      title: 'Bot Status',
      message: 'Gamma Swing bot has been paused',
      time: '3 hours ago',
      read: true
    }
  ]
};

export function Header() {

  const { publish } = useEventPublisher();

  const { user } = useOAuth();

  const [notificationsDrawerVisible, setNotificationsDrawerVisible] = useState(false);
  const [notifications, setNotifications] = useState(mockData.notificationsList);

  const handleOpenNotifications = () => {
    setNotificationsDrawerVisible(true);
  };

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    publish('LOGOUT', {});
  }

  const [selectedDerivAccount, setSelectedDerivAccount] = useState({
    account: "CR-000-000",
    currency: "USD",
    token: "",
    balance: 0
  });

  // Get real Deriv accounts data from useDeriv hook
  const { accounts: derivAccounts, isLoading: derivLoading } = useDeriv();

  // Filter out inactive and disabled accounts
  const activeAccounts = derivAccounts.filter((account: any) =>
    account.isActive && !account.isDisabled
  );



  // Handle account selection
  const handleAccountClick = (account: any) => {
    // Convert the new account structure to the old format for compatibility
    const compatibleAccount = {
      account: account.id,
      currency: account.currency,
      token: account.token,
      balance: account.balance
    };
    setSelectedDerivAccount(compatibleAccount);
  };

    const handleProfileSettingsClick = () => {
    
  };


  const openDerivOauthLink = () => {
    window.location.href = "https://oauth.deriv.com/oauth2/authorize?app_id=111480";
  };

  // User profile dropdown menu items
  const userProfileMenuItems: MenuProps["items"] = [
    // Profile Settings
    {
      key: 'profile-settings',
      type: 'group',
      label: 'Profile Settings', children: [{
        key: '', label: (<div onClick={handleProfileSettingsClick} style={{ width: '100%' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar src={user?.photoURL} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '13px', lineHeight: '1.1' }}>
                  {user?.displayName}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.1' }}>
                  {user?.email}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
              <CheckCircleFilled />
            </span>
          </div>
        </div>)
      }]
    },
    {
      type: 'divider',
    },
    // Deriv Accounts Section
    {
      type: 'group',
      label: 'Deriv Accounts',
      children: activeAccounts.length > 0 ? activeAccounts.map((account, index) => ({
        key: account.id || index,
        label: (
          <div onClick={() => handleAccountClick(account)} style={{ width: '100%' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px',
              paddingBottom: index < activeAccounts.length - 1 ? '8px' : '0',
              borderBottom: index < activeAccounts.length - 1 ? '1px dotted var(--card-border)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getCurrencyIcon(account.currency)}
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px', lineHeight: '1.1' }}>
                    {account.id}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.1' }}>
                    {account.currency} {(account as any).isVirtual ? '(Demo)' : '(Real)'}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
                {(account.balance || 0).toFixed(2)}
              </span>
            </div>
          </div>
        ),
      })) : [{
        key: 'no-accounts',
        label: (
          <div style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {derivLoading ? 'Loading accounts...' : <Button type="primary" block onClick={openDerivOauthLink} >Link Account With Deriv</Button>}
          </div>
        ),
      }]
    },
    {
      type: 'divider',
    },
    // Logout
    {
      key: 'logout',
      label: (
        <div onClick={handleLogout}>
          <LogoutOutlined /> Logout
        </div>
      ),
    },
  ];

  return (
    <header className="app-header">
      <Flex align="center" justify="space-between" style={{ width: "100%" }}>
        <div className="app-header__user-section">
          <div className="app-header__logo-section">
            <img
              src={DerivLogo}
              alt="Deriv Logo"
              className="app-header__logo" style={{ width: "auto" }}
            />
          </div>
        </div>
        <Button size="large" type="text" style={{ marginLeft: 32, border: "none" }} badge={{ count: unreadCount, overflowCount: 999 }} icon={<BellOutlined />} onClick={() => handleOpenNotifications()} />
        <Dropdown
          menu={{ items: userProfileMenuItems }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Flex justify="flex-end" align="center" gap={8} style={{ width: "100%" }}>

            {/* Selected Deriv Account */}
            {selectedDerivAccount && (
              <SelectedDerivAccount account={selectedDerivAccount} />
            )}

          </Flex>
        </Dropdown>
      </Flex>
      <NotificationsDrawer
        visible={notificationsDrawerVisible}
        onClose={() => setNotificationsDrawerVisible(false)}
        notifications={notifications}
        onDismiss={handleDismiss}
        onClearAll={handleClearAll}
      />
    </header>
  );
}
