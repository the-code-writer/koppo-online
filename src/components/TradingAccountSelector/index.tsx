import React, { useState } from 'react';
import { Button, Flex, Typography } from 'antd';
import { RightOutlined, CheckCircleFilled } from '@ant-design/icons';
import { CurrencyDemoIcon, CurrencyBtcIcon, CurrencyEthIcon, CurrencyLtcIcon, CurrencyUsdIcon, CurrencyUsdcIcon, CurrencyUsdtIcon, CurrencyXrpIcon, IconSize } from '@deriv/quill-icons';
import { BottomActionSheet } from '../BottomActionSheet';
import { useDeriv } from '../../hooks/useDeriv';
import './styles.scss';

const { Text } = Typography;

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
      return <CurrencyUsdIcon fill='#000000' iconSize={size} />;
  }
};

export interface SelectedAccount {
  id: string;
  currency: string;
  token: string;
  balance: number;
  isVirtual: boolean;
}

interface TradingAccountSelectorProps {
  value?: SelectedAccount | null;
  onChange?: (account: SelectedAccount) => void;
}

export const TradingAccountSelector: React.FC<TradingAccountSelectorProps> = ({
  value,
  onChange,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { accounts, isLoading } = useDeriv();

  const activeAccounts = accounts.filter((account: any) =>
    account.isActive && !account.isDisabled
  );

  const handleAccountSelect = (account: any) => {
    const selected: SelectedAccount = {
      id: account.id,
      currency: account.currency,
      token: account.token,
      balance: account.balance || 0,
      isVirtual: account.isVirtual,
    };
    onChange?.(selected);
    setDrawerOpen(false);
  };

  const openDerivOauthLink = () => {
    window.location.href = "https://oauth.deriv.com/oauth2/authorize?app_id=111480";
  };

  return (
    <>
      <div className="trading-account-selector" onClick={() => setDrawerOpen(true)}>
        <div className="trading-account-selector__icon">
          {value ? getCurrencyIcon(value.currency, 'lg') : (
            <div className="trading-account-selector__icon-placeholder">
              <CurrencyUsdIcon fill='#999999' iconSize='lg' />
            </div>
          )}
        </div>
        <div className="trading-account-selector__info">
          <Text strong className="trading-account-selector__title">
            {value ? value.id : 'Select Trading Account'}
          </Text>
          <Text type="secondary" className="trading-account-selector__description">
            {value
              ? `${value.currency} ${value.isVirtual ? '(Demo)' : '(Real)'} • ${value.balance.toFixed(2)}`
              : 'Tap to choose a Deriv account'}
          </Text>
        </div>
        <div className="trading-account-selector__arrow">
          <RightOutlined />
        </div>
      </div>

      <BottomActionSheet
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        height="50vh"
      >
        <div className="trading-account-list">
          <div className="trading-account-list__header">
            <h3>Select Trading Account</h3>
          </div>

          {isLoading ? (
            <div className="trading-account-list__loading">
              <Text type="secondary">Loading accounts...</Text>
            </div>
          ) : activeAccounts.length > 0 ? (
            <div className="trading-account-list__items">
              {activeAccounts.map((account: any) => {
                const isSelected = value?.id === account.id;
                return (
                  <div
                    key={account.id}
                    className={`trading-account-list__item ${isSelected ? 'trading-account-list__item--selected' : ''}`}
                    onClick={() => handleAccountSelect(account)}
                  >
                    <div className="trading-account-list__item-icon">
                      {getCurrencyIcon(account.currency, 'lg')}
                    </div>
                    <div className="trading-account-list__item-info">
                      <Text strong className="trading-account-list__item-title">
                        {account.id}
                      </Text>
                      <Text type="secondary" className="trading-account-list__item-desc">
                        {account.currency} {account.isVirtual ? '(Demo)' : '(Real)'}
                      </Text>
                    </div>
                    <Flex align="center" gap={8}>
                      <Text strong className="trading-account-list__item-balance">
                        {(account.balance || 0).toFixed(2)}
                      </Text>
                      {isSelected && (
                        <CheckCircleFilled className="trading-account-list__item-check" />
                      )}
                    </Flex>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="trading-account-list__empty">
              <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
                No Deriv accounts linked
              </Text>
              <Button type="primary" block onClick={openDerivOauthLink}>
                Link Account With Deriv
              </Button>
            </div>
          )}
        </div>
      </BottomActionSheet>
    </>
  );
};
