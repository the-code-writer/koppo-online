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
import { UserOutlined, SettingOutlined, LogoutOutlined } from "@ant-design/icons";
import DerivLogo from "../../assets/logo.png";
import "./styles.scss";
import { useState } from "react";
import { User } from "../../services/api";
import { getDerivDataFromLocalStorage } from "../../utils/derivUrlParser";

// Selected Deriv Account Component
const SelectedDerivAccount = ({ account }: { account: any }) => {
  const getCurrencyIcon = (currency: string) => {
    const currencyIcons: { [key: string]: string } = {
      'USD': '$',
      'USDC': '$',
      'BTC': '₿',
      'ETH': 'Ξ',
      'LTC': 'Ł',
      'XRP': 'X',
      'eUSDT': '₮',
      'tUSDT': '₮',
    };
    return currencyIcons[currency] || currency;
  };

  if (!account) return null;

  return (
    <div style={{ textAlign: "right" }}>
      <span className="app-header__username"><strong>{account?.account || ''}</strong><br />
        <sup>{getCurrencyIcon(account.currency)} {account.currency} • {account.balance.toFixed(2)}</sup></span>
    </div>
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

  // Get real Deriv accounts data from localStorage
  const derivData = getDerivDataFromLocalStorage();
  const derivAccounts = derivData?.accounts || [];

  // Get currency icon function (same as in Settings component)
  const getCurrencyIcon = (currency: string) => {
    const currencyIcons: { [key: string]: string } = {
      'USD': '$',
      'USDC': '$',
      'BTC': '₿',
      'ETH': 'Ξ',
      'LTC': 'Ł',
      'XRP': 'X',
      'eUSDT': '₮',
      'tUSDT': '₮',
    };
    return currencyIcons[currency] || currency;
  };

  // Handle account selection
  const handleAccountClick = (account: any) => {
    setSelectedDerivAccount(account);
    onSelectedAccount?.(account);
  };

  // User profile dropdown menu items
  const userProfileMenuItems: MenuProps["items"] = [
    // Deriv Accounts Section
    {
      type: 'group',
      label: 'Deriv Accounts',
      children: derivAccounts.length > 0 ? derivAccounts.map((account, index) => ({
        key: account.account || index,
        label: (
          <div onClick={() => handleAccountClick(account)} style={{ width: '100%' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: '20px',
              paddingBottom: index < derivAccounts.length - 1 ? '8px' : '0',
              borderBottom: index < derivAccounts.length - 1 ? '1px dotted var(--card-border)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '50%',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  {getCurrencyIcon(account.currency)}
                </span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px', lineHeight: '1.1' }}>
                    {account.account}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: '1.1' }}>
                    {account.currency}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
                {account.balance.toFixed(2)}
              </span>
            </div>
          </div>
        ),
      })) : [{
        key: 'no-accounts',
        label: (
          <div style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No Deriv accounts found
          </div>
        ),
      }]
    },
    {
      type: 'divider',
    },
    // Profile Settings
    {
      key: 'profile-settings',
      label: (
        <div onClick={onProfileSettingsClick}>
          <SettingOutlined /> Profile Settings
        </div>
      ),
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
                  )}<Avatar
                    src={user.accounts?.firebase?.photoURL || undefined}
                    icon={<UserOutlined />} size={40}
                  />

                </Flex>
              </Dropdown>
            )}
          </Space>
        </>
      )}
    </header>
  );
}
