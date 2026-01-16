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
import { Button, Space, Dropdown, Avatar, Flex } from "antd";
import type { MenuProps } from "antd";
import { UserOutlined, SettingOutlined, LogoutOutlined, CheckCircleFilled } from "@ant-design/icons";
import DerivLogo from "../../assets/logo.png";
import "./styles.scss";
import { useState } from "react";
import { User } from "../../services/api";
import { useDeriv } from "../../hooks/useDeriv";
import { CurrencyDemoIcon, CurrencyBtcIcon, CurrencyEthIcon, CurrencyLtcIcon, CurrencyUsdIcon, CurrencyUsdcIcon, CurrencyUsdtIcon, CurrencyXrpIcon } from '@deriv/quill-icons';

// Selected Deriv Account Component
const SelectedDerivAccount = ({ account }: { account: any }) => {
  const getCurrencyIcon = (currency?: string) => {
    const normalizedCurrency = currency?.toLowerCase();

    switch (normalizedCurrency) {
      case 'demo':
      case 'virtual':
        return <CurrencyDemoIcon fill='#000000' iconSize='lg' />;
      case 'btc':
        return <CurrencyBtcIcon fill='#000000' iconSize='lg' />;
      case 'eth':
        return <CurrencyEthIcon fill='#000000' iconSize='lg' />;
      case 'ltc':
        return <CurrencyLtcIcon fill='#000000' iconSize='lg' />;
      case 'usd':
        return <CurrencyUsdIcon fill='#000000' iconSize='lg' />;
      case 'usdc':
        return <CurrencyUsdcIcon fill='#000000' iconSize='lg' />;
      case 'usdt':
      case 'eusdt':
      case 'tusdt':
        return <CurrencyUsdtIcon fill='#000000' iconSize='lg' />;
      case 'xrp':
        return <CurrencyXrpIcon fill='#000000' iconSize='lg' />;
      default:
        return <CurrencyUsdIcon fill='#000000' iconSize='lg' />; // Default to USD icon
    }
  };

  if (!account) return null;

  return (<Flex gap={8}>
    <Flex vertical style={{ textAlign: "right" }}>
      <code style={{fontSize: 14, letterSpacing: 1}}><strong>{account?.account || ''}</strong></code>
      <code style={{fontSize: 12}}>{account.currency} • {account.balance.toFixed(2)}</code>
    </Flex>
    <Avatar
                    src={getCurrencyIcon(account.currency)}
                    icon={<UserOutlined />} size={40}
                  />
    </Flex>
  );
};

interface Account {
  account: string;
  token: string;
  currency: string;
  balance: any;
}

interface HeaderProps {
  isLoggedIn?: boolean;
  user?: User | null;
  onLogin?: () => void;
  onLogout?: () => void;
  onDepositClick?: () => void;
  onSelectedAccount?: (account: Account) => void;
  onProfileSettingsClick?: () => void;
}

export function Header({
  isLoggedIn = false,
  user,
  onLogin,
  onLogout,
  onSelectedAccount,
  onProfileSettingsClick,
}: HeaderProps) {

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

  // Get currency icon function (same as Callback page)
  const getCurrencyIcon = (currency?: string) => {
    const normalizedCurrency = currency?.toLowerCase();

    switch (normalizedCurrency) {
      case 'demo':
      case 'virtual':
        return <CurrencyDemoIcon fill='#000000' iconSize='sm' />;
      case 'btc':
        return <CurrencyBtcIcon fill='#000000' iconSize='sm' />;
      case 'eth':
        return <CurrencyEthIcon fill='#000000' iconSize='sm' />;
      case 'ltc':
        return <CurrencyLtcIcon fill='#000000' iconSize='sm' />;
      case 'usd':
        return <CurrencyUsdIcon fill='#000000' iconSize='sm' />;
      case 'usdc':
        return <CurrencyUsdcIcon fill='#000000' iconSize='sm' />;
      case 'usdt':
      case 'eusdt':
      case 'tusdt':
        return <CurrencyUsdtIcon fill='#000000' iconSize='sm' />;
      case 'xrp':
        return <CurrencyXrpIcon fill='#000000' iconSize='sm' />;
      default:
        return <CurrencyUsdIcon fill='#000000' iconSize='sm' />; // Default to USD icon
    }
  };

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
    onSelectedAccount?.(compatibleAccount);
  };

  // User profile dropdown menu items
  const userProfileMenuItems: MenuProps["items"] = [
    // Profile Settings
    {
      key: 'profile-settings',
      type: 'group',
      label: 'Profile Settings',children: [{key: '', label: (<div onClick={onProfileSettingsClick} style={{ width: '100%' }}>
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
          </div>)}]
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
            {derivLoading ? 'Loading accounts...' : 'No active accounts found'}
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
        <div onClick={onLogout}>
          <LogoutOutlined /> Logout
        </div>
      ),
    },
  ];

  return (
    <header className="app-header">
      {!isLoggedIn ? (
        // Not logged in - show logo and login button
        <>
          <div className="app-header__logo-section">
            <img
              src={DerivLogo}
              alt="Deriv Logo"
              className="app-header__logo"
            />
          </div>
          <Space>
            {onLogin && (
              <Button
                type="default"
                onClick={onLogin}
                className="app-header__deposit-btn"
              >
                Log in
              </Button>
            )}
          </Space>
        </>
      ) : (
        // Logged in - show account info and actions
        <>
          <div className="app-header__user-section">
            <div className="app-header__logo-section">
              <img
                src={DerivLogo}
                alt="Deriv Logo"
                className="app-header__logo"
              />
            </div>
          </div>

          {/* User profile dropdown when authenticated */}<Space>
            {isLoggedIn && user && (
              <Dropdown
                menu={{ items: userProfileMenuItems }}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Flex justify="align-center" align="center" gap={8}>

                  {/* Selected Deriv Account */}
                  {selectedDerivAccount && (
                    <SelectedDerivAccount account={selectedDerivAccount} />
                  )}

                </Flex>
              </Dropdown>
            )}
          </Space>
        </>
      )}
    </header>
  );
}
