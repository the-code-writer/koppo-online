import { useState, useEffect, useMemo, useCallback } from "react";
import { Drawer, Button, Typography, Switch, Badge, Tooltip, Modal, Alert, notification, Popconfirm, ConfigProvider, Space } from "antd";
import { User, authAPI, LinkGoogleAccountData } from '../../services/api';
import { GoogleAuth } from '../../utils/GoogleAuth';
import { DerivAuth } from '../../utils/DerivAuth';
import { useDeriv, EnhancedAccount } from '../../hooks/useDeriv';
import derivLogo from '../../assets/deriv-logo.svg';
import derivIcon from '../../assets/deriv-icon.webp';
import googleIcon from '../../assets/google-icon.webp';
import telegramIcon from '../../assets/telegram-icon.webp';
import {
  MessageOutlined,
  GoogleOutlined,
  WalletOutlined,
  CheckCircleFilled,
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  LinkOutlined as LinkIcon,
  TagsOutlined,
  GlobalOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import {
  CurrencyDemoIcon,
  CurrencyBtcIcon,
  CurrencyEthIcon,
  CurrencyLtcIcon,
  CurrencyUsdIcon,
  CurrencyUsdcIcon,
  CurrencyUsdtIcon,
  CurrencyXrpIcon
} from '@deriv/quill-icons';
import "./styles.scss";
import { getCurrentDateTimeFormatted } from "../../utils/TimeUtils";
import { useOAuth } from "../../contexts/OAuthContext";
import { createStyles } from 'antd-style';
import { envConfig } from "../../config/env.config";

const { Title, Text } = Typography;

const COLOR_BG = 'linear-gradient(135deg,#6253e1, #04befe)';

const useStyle = createStyles(({ prefixCls, css }) => ({
  linearGradientButton: css`
    &.${prefixCls}-btn-primary:not([disabled]):not(.${prefixCls}-btn-dangerous) {
      > span {
        position: relative;
      }

      &::before {
        content: '';
        background: ${COLOR_BG};
        position: absolute;
        inset: -1px;
        opacity: 1;
        transition: all 0.3s;
        border-radius: inherit;
      }

      &:hover::before {
        opacity: 0;
      }
    }
  `,
}));

interface LinkedAccountsSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function LinkedAccountsSettingsDrawer({ visible, onClose, user }: LinkedAccountsSettingsDrawerProps) {
  const { styles } = useStyle();
  const { refreshProfile } = useOAuth();
  const { accounts: derivAccounts, hasData: hasDerivData, updateAccountStatus, fullAccount } = useDeriv();

  const [api, contextHolder] = notification.useNotification();

  const [telegramLinked, setTelegramLinked] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [derivLinked, setDerivLinked] = useState(false);

  const userAccounts = useMemo(() => user?.accounts as any, [user]);

  // Update states when user prop or deriv data changes
  useEffect(() => {
    setTelegramLinked(userAccounts?.telegram?.isAccountLinked || false);
    setGoogleLinked(userAccounts?.google?.isAccountLinked || false);
    setDerivLinked(hasDerivData || userAccounts?.deriv?.isAccountLinked || false);
  }, [userAccounts, hasDerivData]);

  // UI States
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [googleAuthModalVisible, setGoogleAuthModalVisible] = useState(false);
  const [telegramAuthLoading, setTelegramAuthLoading] = useState(false);
  const [telegramAuthModalVisible, setTelegramAuthModalVisible] = useState(false);
  const [telegramAuthData, setTelegramAuthData] = useState<{ code: string; expires: number; token: string } | null>(null);
  const [telegramAuthStep, setTelegramAuthStep] = useState<'request' | 'waiting' | 'success' | 'error'>('request');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [derivAuthLoading, setDerivAuthLoading] = useState(false);
  const [derivAuthModalVisible, setDerivAuthModalVisible] = useState(false);
  const [accountsDrawerVisible, setAccountsDrawerVisible] = useState(false);

  const openGoogleNotification = useCallback((message: string) => {
    api.open({
      message: 'Google',
      description: message,
      icon: <img alt="Google" src={googleIcon} style={{ height: 24 }} />,
      duration: 5,
    });
  }, [api]);

  const openTelegramNotification = useCallback((message: string) => {
    api.open({
      message: 'Telegram',
      description: message,
      icon: <img alt="Telegram" src={telegramIcon} style={{ height: 24 }} />,
      duration: 5,
    });
  }, [api]);

  const openDerivNotification = useCallback((message: string) => {
    api.open({
      message: 'Deriv',
      description: message,
      icon: <img alt="Deriv" src={derivLogo} style={{ height: 24 }} />,
      duration: 5,
    });
  }, [api]);

  const getCurrencyIcon = (currency: string) => {
    const normalizedCurrency = currency?.toLowerCase();
    switch (normalizedCurrency) {
      case 'demo':
      case 'virtual':
        return <CurrencyDemoIcon fill='currentColor' iconSize='md' />;
      case 'btc':
        return <CurrencyBtcIcon fill='currentColor' iconSize='md' />;
      case 'eth':
        return <CurrencyEthIcon fill='currentColor' iconSize='md' />;
      case 'ltc':
        return <CurrencyLtcIcon fill='currentColor' iconSize='md' />;
      case 'usd':
        return <CurrencyUsdIcon fill='currentColor' iconSize='md' />;
      case 'usdc':
        return <CurrencyUsdcIcon fill='currentColor' iconSize='md' />;
      case 'usdt':
      case 'eusdt':
      case 'tusdt':
        return <CurrencyUsdtIcon fill='currentColor' iconSize='md' />;
      case 'xrp':
        return <CurrencyXrpIcon fill='currentColor' iconSize='md' />;
      default:
        return <CurrencyUsdIcon fill='currentColor' iconSize='md' />;
    }
  };

  const handleLinkTelegram = async (checked: boolean) => {
    if (!checked) {
      try {
        const linkResult = await authAPI.unLinkTelegramAccount();
        if (linkResult?.success || (typeof ((linkResult as any)?.accounts?.telegram?.isAccountLinked) === 'boolean' && (linkResult as any)?.accounts?.telegram?.isAccountLinked === false)) {
          await refreshProfile();
          setTelegramLinked(false);
          openTelegramNotification(`Successfully disconnected your Telegram account`);
        } else {
          openTelegramNotification(linkResult.message || 'Failed to disconnect Telegram account');
        }
      } catch (apiError: any) {
        console.error('API error disconnecting Telegram account:', apiError);
        openTelegramNotification(apiError.response?.data?.message || 'Failed to disconnect Telegram account');
      }
    }
  };

  const handleLinkGoogle = async (checked: boolean) => {
    if (!checked) {
      try {
        const linkResult = await authAPI.unLinkGoogleAccount();
        if (linkResult?.success || (typeof ((linkResult as any)?.accounts?.google?.isAccountLinked) === 'boolean' && (linkResult as any)?.accounts?.google?.isAccountLinked === false)) {
          await refreshProfile();
          setGoogleLinked(false);
          openGoogleNotification(`Successfully disconnected your Google account`);
        } else {
          openGoogleNotification(linkResult.message || 'Failed to disconnect Google account');
        }
      } catch (apiError: any) {
        console.error('API error disconnecting Google account:', apiError);
        openGoogleNotification(apiError.response?.data?.message || 'Failed to disconnect Google account');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleAuthLoading(true);
    try {
      const result = await GoogleAuth.signInWithPopup();
      if (result.success && result.user) {
        const formattedData = GoogleAuth.getFormattedUserData(result.user);
        const payload: any = {
          ...formattedData.basic,
          ...formattedData.timestamps,
          isAccountLinked: true,
          linkedTime: getCurrentDateTimeFormatted(),
          isAnonymous: false,
          providerId: 'google.com',
          token: 'google_oauth_token'
        };

        delete payload.createdAt;
        delete payload.lastLoginAt;

        try {
          const linkResult = await authAPI.linkGoogleAccount(payload as LinkGoogleAccountData);
          if (linkResult?.success || (linkResult as any)?.accounts?.google?.isAccountLinked) {
            await refreshProfile();
            setGoogleLinked(true);
            setGoogleAuthModalVisible(false);
            openGoogleNotification(`Successfully connected Google account: ${result.user.email}`);
          } else {
            openGoogleNotification(linkResult.message || 'Failed to link Google account');
          }
        } catch (apiError: any) {
          console.error('API error linking Google account:', apiError);
          openGoogleNotification(apiError.response?.data?.message || 'Failed to link Google account');
        }
      } else {
        openGoogleNotification(result.error || 'Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      openGoogleNotification('An unexpected error occurred. Please try again.');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const startTelegramSignIn = async () => {
    setTelegramAuthLoading(true);
    try {
      const response: any = await authAPI.requestTelegramAuthorization();
      setTelegramAuthData(response);
      setTelegramAuthStep('waiting');
      setTimeRemaining(Math.floor((response.expires * 1000 - Date.now()) / 1000));

      const countdownInterval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setTelegramAuthStep('request');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      console.error('Error requesting Telegram authorization:', error);
      openTelegramNotification('Failed to generate authorization code. Please try again.');
      setTelegramAuthStep('error');
    } finally {
      setTelegramAuthLoading(false);
    }
  };

  const handleTelegramSignIn = useCallback(async (success: boolean) => {
    setTelegramAuthLoading(true);
    try {
      if (success) {
        await refreshProfile();
        setTelegramLinked(true);
        setTelegramAuthModalVisible(false);
        openTelegramNotification(`Successfully connected Telegram account`);
      } else {
        openTelegramNotification('Failed to link Telegram account');
      }
    } catch (error: any) {
      console.error('Telegram sign-in error:', error);
      openTelegramNotification(error.message || 'Failed to initiate Telegram authentication. Please try again.');
    } finally {
      setTelegramAuthLoading(false);
    }
  }, [refreshProfile, openTelegramNotification]);

  const pollTelegramAuthorization = useCallback(async () => {
    if (!telegramAuthData?.code) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await authAPI.checkTelegramAuthorization(telegramAuthData.code);
        if (response.isAuthorized) {
          clearInterval(pollInterval);
          setTelegramAuthStep('success');
          handleTelegramSignIn(true);
        } else if (Date.now() > response.expires * 1000) {
          clearInterval(pollInterval);
          setTelegramAuthStep('request');
          handleTelegramSignIn(false);
        }
      } catch (error: any) {
        console.error('Error checking Telegram authorization:', error);
        clearInterval(pollInterval);
        setTelegramAuthStep('error');
        handleTelegramSignIn(false);
      }
    }, 2000);
  }, [telegramAuthData, handleTelegramSignIn]);

  const openTelegramLink = async () => {
    if (telegramAuthData?.code) {
      const telegramUrl = `https://t.me/${envConfig.VITE_TELEGRAM_BOT_USERNAME}?start=/auth:${telegramAuthData.code}`;
      window.open(telegramUrl, '_blank');
      pollTelegramAuthorization();
    }
  };

  const handleLinkDeriv = async (checked: boolean) => {
    if (!checked) {
      try {
        const linkResult = await authAPI.unLinkDerivAccount();
        if (linkResult?.success || (typeof ((linkResult as any)?.accounts?.deriv?.isAccountLinked) === 'boolean' && (linkResult as any)?.accounts?.deriv?.isAccountLinked === false)) {
          await refreshProfile();
          setDerivLinked(false);
          openDerivNotification(`Successfully disconnected your Deriv account`);
        } else {
          openDerivNotification(linkResult.message || 'Failed to disconnect Deriv account');
        }
      } catch (apiError: any) {
        console.error('API error disconnecting Deriv account:', apiError);
        openDerivNotification(apiError.response?.data?.message || 'Failed to disconnect Deriv account');
      }
    } else {
      setDerivAuthModalVisible(true);
    }
  };

  const handleDerivSignIn = async () => {
    setDerivAuthLoading(true);
    try {
      DerivAuth.initialize('111480', window.location.origin + '/deriv/callback');
      const userData = {
        uid: (user as any)?.identities?.uid || 'demo_uid',
        mid: user?.id?.toString() || 'demo_mid',
        fid: (user as any)?.identities?.fid || 'demo_fid',
        uuid: user?.uuid || DerivAuth.generateUUID()
      };

      const result = DerivAuth.authenticateWithUrl(userData);
      if (result.success) {
        const mockDerivData = {
          uid: userData.uid,
          email: user?.email || 'trader@example.com',
          emailVerified: true,
          isAnonymous: false,
          providerId: 'deriv.com',
          token: DerivAuth.generateAuthorizationCode(),
          displayName: 'Deriv Trader',
          photoURL: undefined,
          accountId: 'CR123456',
          accountType: 'real',
          currency: 'USD',
          balance: 1000.50,
          isAccountLinked: true,
          linkedTime: getCurrentDateTimeFormatted(),
          lastSignInTime: getCurrentDateTimeFormatted(),
          creationTime: getCurrentDateTimeFormatted()
        };

        const linkResult = await authAPI.linkDerivAccount(mockDerivData);
        if (linkResult?.success || (typeof ((linkResult as any)?.accounts?.deriv?.isAccountLinked) === 'boolean' && (linkResult as any)?.accounts?.deriv?.isAccountLinked === true)) {
          await refreshProfile();
          setDerivLinked(true);
          setDerivAuthModalVisible(false);
          openDerivNotification(`Successfully connected Deriv account: ${mockDerivData.accountId}`);
        } else {
          openDerivNotification(linkResult.message || 'Failed to link Deriv account');
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Deriv sign-in error:', error);
      openDerivNotification(error.message || 'Failed to initiate Deriv authentication. Please try again.');
    } finally {
      setDerivAuthLoading(false);
    }
  };

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance);
  };

  const handleUpdateAccountStatusWithNotify = async (accountId: string, status: 'active' | 'disabled') => {
    const success = await updateAccountStatus(accountId, status);
    if (success) {
      api.success({
        message: 'Account Status Updated',
        description: `Account ${accountId} is now ${status}`,
      });
    } else {
      api.error({
        message: 'Update Failed',
        description: 'Failed to update account status. Please try again.',
      });
    }
  };

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={visible}
      size={600}
      className="linked-accounts-settings-drawer"
      closeIcon={null}
    >
      <div className="drawer-header">
        <Button
          type="text"
          icon={<ArrowRightOutlined rotate={180} />}
          onClick={onClose}
          className="back-button"
        />
        <Title level={4} className="drawer-title">Linked Accounts</Title>
      </div>
      <ConfigProvider
        button={{
          className: styles.linearGradientButton,
        }}
        theme={{
          components: {
            Notification: {
              progressBg: COLOR_BG,
            },
          },
        }}
      >
        {contextHolder}
        <div className="drawer-content">
          <div className="drawer-sections">
            {/* Telegram Account Section */}
            <div className="drawer-section">
              <div className="drawer-section-header">
                <img src={telegramIcon} alt="Telegram" className="section-icon-img" />
                <h3 className="drawer-section-title">Telegram</h3>
                <div className="drawer-section-status">
                  <Badge status={telegramLinked ? 'success' : 'default'} />
                  <Tooltip title={telegramLinked ? 'Disconnect Telegram' : 'Connect Telegram'}>
                    {telegramLinked ? (
                      <Popconfirm placement="left" title={<>Are you sure you want to <br />unlink your Telegram Account?</>} onConfirm={() => handleLinkTelegram(false)}>
                        <Switch checked={telegramLinked} size="small" />
                      </Popconfirm>
                    ) : (
                      <Switch checked={telegramLinked} onChange={() => setTelegramAuthModalVisible(true)} size="small" />
                    )}
                  </Tooltip>
                </div>
              </div>

              <div className="drawer-section-content">
                <Text className="section-description">
                  Connect your Telegram account to receive notifications and manage your trading bots through chat.
                </Text>

                {!telegramLinked && (
                  <Space className="action-buttons" vertical size={18}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<MessageOutlined />}
                    onClick={() => setTelegramAuthModalVisible(true)}
                    loading={telegramAuthLoading}
                    block
                    className="action-button connect-button"
                  >
                    Connect with Telegram
                  </Button>
                  </Space>
                )}

                {telegramLinked && (
                  <div className="account-details-grid">
                    <div className="detail-row">
                      <div className="detail-label">
                        <UserOutlined />
                        <span>Username</span>
                      </div>
                      <code className="detail-value">@{userAccounts?.telegram?.username || 'telegram_user'}</code>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">
                        <MessageOutlined />
                        <span>Display Name</span>
                      </div>
                      <code className="detail-value">{userAccounts?.telegram?.displayName || 'Telegram User'}</code>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">
                        <LinkIcon />
                        <span>Connected</span>
                      </div>
                      <code className="detail-value">{userAccounts?.telegram?.linkedTime}</code>
                    </div>
                    <div className="detail-row features-row">
                      <div className="detail-label">
                        <TagsOutlined />
                        <span>Features</span>
                      </div>
                      <div className="feature-badges">
                        <Badge count="Notifications" className="feature-badge telegram" />
                        <Badge count="Bot Control" className="feature-badge success" />
                        <Badge count="Alerts" className="feature-badge warning" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Google Account Section */}
            <div className="drawer-section">
              <div className="drawer-section-header">
                <img src={googleIcon} alt="Google" className="section-icon-img" />
                <h3 className="drawer-section-title">Google</h3>
                <div className="drawer-section-status">
                  <Badge status={googleLinked ? 'success' : 'default'} />
                  <Tooltip title={googleLinked ? 'Disconnect Google' : 'Connect Google'}>
                    {googleLinked ? (
                      <Popconfirm placement="left" title={<>Are you sure you want to <br />unlink your Google Account?</>} onConfirm={() => handleLinkGoogle(false)}>
                        <Switch checked={googleLinked} size="small" />
                      </Popconfirm>
                    ) : (
                      <Switch checked={googleLinked} onChange={() => setGoogleAuthModalVisible(true)} size="small" />
                    )}
                  </Tooltip>
                </div>
              </div>

              <div className="drawer-section-content">
                <Text className="section-description">
                  Link your Google account for seamless authentication and data synchronization across devices.
                </Text>

                {!googleLinked && (
                  <Space className="action-buttons" vertical size={18}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<GoogleOutlined />}
                    onClick={() => setGoogleAuthModalVisible(true)}
                    loading={googleAuthLoading}
                    block
                    className="action-button google-button"
                  >
                    Sign in with Google
                  </Button>
                  </Space>
                )}

                {googleLinked && (
                  <div className="account-details-grid">
                    <div className="detail-row">
                      <div className="detail-label">
                        <UserOutlined />
                        <span>Name</span>
                      </div>
                      <code className="detail-value">{userAccounts?.google?.displayName || user?.displayName || 'N/A'}</code>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">
                        <MailOutlined />
                        <span>Email</span>
                      </div>
                      <code className="detail-value email-text">{userAccounts?.google?.email || user?.email || 'N/A'}</code>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">
                        <CalendarOutlined />
                        <span>Created</span>
                      </div>
                      <code className="detail-value">{userAccounts?.google?.creationTime || 'N/A'}</code>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">
                        <LinkIcon />
                        <span>Connected</span>
                      </div>
                      <code className="detail-value">{userAccounts?.google?.linkedTime}</code>
                    </div>
                    <div className="detail-row">
                      <div className="detail-label">
                        <ClockCircleOutlined />
                        <span>Last Login</span>
                      </div>
                      <code className="detail-value">{userAccounts?.google?.lastSignInTime || 'N/A'}</code>
                    </div>
                    <div className="detail-row features-row">
                      <div className="detail-label">
                        <TagsOutlined />
                        <span>Features</span>
                      </div>
                      <div className="feature-badges">
                        <Badge count="SSO" className="feature-badge google" />
                        <Badge count="Data Sync" className="feature-badge success" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Connected Accounts Section (Deriv) */}
            <div className="drawer-section">
              <div className="drawer-section-header">
                <img src={derivIcon} alt="Deriv" className="section-icon-img" />
                <h3 className="drawer-section-title">Connected Accounts</h3>
                <div className="drawer-section-status">
                  <Badge count={derivAccounts.length} style={{ backgroundColor: '#52c41a' }} />
                  <Tooltip title={derivLinked ? 'Disconnect Deriv' : 'Connect Deriv'}>
                    {derivLinked ? (
                      <Popconfirm placement="left" title={<>Are you sure you want to <br />unlink your Deriv Account?</>} onConfirm={() => handleLinkDeriv(false)}>
                        <Switch checked={derivLinked} size="small" />
                      </Popconfirm>
                    ) : (
                      <Switch checked={derivLinked} onChange={() => setDerivAuthModalVisible(true)} size="small" />
                    )}
                  </Tooltip>
                </div>
              </div>

              <div className="drawer-section-content">
                <Text className="section-description">
                  Manage your connected trading accounts and monitor their performance.
                </Text>

                {derivAccounts.length === 0 && (
                  <Space className="action-buttons" vertical size={18}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<WalletOutlined />}
                    onClick={() => setDerivAuthModalVisible(true)}
                    loading={derivAuthLoading}
                    block
                    className="action-button deriv-button"
                  >
                    {derivAuthLoading ? 'Connecting...' : 'Add Deriv Account'}
                  </Button>
                  </Space>
                )}

                {derivAccounts.length > 0 && (
                  <>
                    {fullAccount && (
                      <div className="account-details-grid">
                        <div className="detail-row">
                          <div className="detail-label">
                            <UserOutlined />
                            <span>Name</span>
                          </div>
                          <code className="detail-value">{fullAccount.fullname || 'Deriv User'}</code>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">
                            <MailOutlined />
                            <span>Email</span>
                          </div>
                          <code className="detail-value email-text">{fullAccount.email || 'N/A'}</code>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">
                            <WalletOutlined />
                            <span>Account ID</span>
                          </div>
                          <code className="detail-value">{fullAccount.loginId || 'N/A'}</code>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">
                            <GlobalOutlined />
                            <span>Country</span>
                          </div>
                          <code className="detail-value">{fullAccount.country}</code>
                        </div>
                      </div>
                    )}
                  <div className="deriv-summary-box" onClick={() => setAccountsDrawerVisible(true)}>

                      <div className="balance-summary-card">
                        <div className="balance-item">
                          <span className="balance-label">Total Balance</span>
                          <span className="balance-value primary">
                            {formatBalance(
                              derivAccounts
                                .filter(acc => acc.status === 'active')
                                .reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0),
                              derivAccounts[0]?.currency || 'USD'
                            )}
                          </span>
                        </div>
                        <div className="balance-item right">
                          <span className="balance-label">Active Accounts</span>
                          <span className="balance-value success">
                            {derivAccounts.filter(acc => acc.status === 'active').length}/{derivAccounts.length}
                          </span>
                        </div>
                      </div>

                      <div className="view-more-hint">
                        <span>Click to view all accounts</span>
                        <ArrowRightOutlined />
                      </div>
                    </div></>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Google Auth Modal */}
        <Modal
          title={null}
          open={googleAuthModalVisible}
          onCancel={() => setGoogleAuthModalVisible(false)}
          footer={null}
          width={440}
          centered
          className="auth-premium-modal"
          closeIcon={null}
        >
          <div className="auth-modal-glass-container">

            <div className="auth-modal-body">
              <div className="platform-logo-wrapper google">
                <img alt="Google" src={googleIcon} style={{ height: 80, width: 80, objectFit: 'contain' }} />
              </div>

              <h2 className="modal-title">Google Account</h2>
              <p className="modal-subtitle">
                Sign in to enable seamless authentication and secure data synchronization across all your devices.
              </p>
              
              <div className="feature-list">
                <div className="feature-item">
                  <CheckCircleFilled />
                  <span>Single Sign-On (SSO) Support</span>
                </div>
                <div className="feature-item">
                  <CheckCircleFilled />
                  <span>Cloud Data Synchronization</span>
                </div>
                <div className="feature-item">
                  <CheckCircleFilled />
                  <span>Secure Encrypted Connection</span>
                </div>
              </div>

              <Space className="action-buttons" vertical size={18}>

              <Button
                type="primary"
                size="large"
                icon={<GoogleOutlined />}
                onClick={handleGoogleSignIn}
                loading={googleAuthLoading}
                block
                className="action-button google-button"
              >
                {googleAuthLoading ? 'Connecting...' : 'Sign in with Google'}
              </Button>

              <Button
                type="default"
                onClick={() => setGoogleAuthModalVisible(false)}
                className="modal-link-button"
                block
              >
                Maybe Later
              </Button>

              </Space>
            </div>
          </div>
        </Modal>

        {/* Telegram Auth Modal */}
        <Modal
          title={null}
          open={telegramAuthModalVisible}
          onCancel={() => {
            setTelegramAuthModalVisible(false);
            setTelegramAuthStep('request');
            setTelegramAuthData(null);
            setTimeRemaining(0);
          }}
          footer={null}
          width={440}
          centered
          className="auth-premium-modal"
          closeIcon={null}
        >
          <div className="auth-modal-glass-container">


            <div className="auth-modal-body">
              <div className="platform-logo-wrapper telegram">
                <img alt="Telegram" src={telegramIcon} style={{ height: 80, width: 80, objectFit: 'contain' }} />
              </div>

              <h2 className="modal-title">Telegram Auth</h2>
              <p className="modal-subtitle">
                {telegramAuthStep === 'request' && 'Generate a unique authorization code to link your Telegram account securely.'}
                {telegramAuthStep === 'waiting' && 'Complete the connection by sending the code below to our official bot.'}
                {telegramAuthStep === 'success' && 'Your account has been successfully linked. You can now use Telegram features.'}
                {telegramAuthStep === 'error' && 'We encountered an issue during authentication. Please try the process again.'}
              </p>

              {telegramAuthStep === 'request' && (
                <>
                  <div className="feature-list">
                    <div className="feature-item">
                      <CheckCircleFilled />
                      <span>Real-time Trading Notifications</span>
                    </div>
                    <div className="feature-item">
                      <CheckCircleFilled />
                      <span>Remote Bot Management</span>
                    </div>
                    <div className="feature-item">
                      <CheckCircleFilled />
                      <span>Secure End-to-End Encryption</span>
                    </div>
                  </div>
                  <Space className="action-buttons" vertical size={18}>
                    <Button
                      type="primary"
                      icon={<MessageOutlined />}
                      onClick={startTelegramSignIn}
                      loading={telegramAuthLoading}
                      block
                      className="action-button connect-button"
                    >
                      {telegramAuthLoading ? 'Generating Code...' : 'Generate Auth Code'}
                    </Button>
                    <Button
                      type="default"
                      onClick={() => {
                        setTelegramAuthModalVisible(false);
                        setTelegramAuthStep('request');
                        setTelegramAuthData(null);
                        setTimeRemaining(0);
                      }}
                      loading={telegramAuthLoading}
                      block
                      className="action-button connect-button"
                    >
                      Cancel
                    </Button>
                  </Space>
                </>
              )}

              {telegramAuthStep === 'waiting' && telegramAuthData && (
                <div style={{ width: '100%' }}>
                  <div className="telegram-code-display">
                    <code>{telegramAuthData.code}</code>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Expires in: <Text strong style={{ color: timeRemaining < 60 ? '#ff4d4f' : '#0088cc' }}>
                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                      </Text>
                    </Text>
                  </div>

                  <Space className="action-buttons" vertical size={18}>

                  <Button
                    type="primary"
                    size="large"
                    icon={<MessageOutlined />}
                    onClick={openTelegramLink}
                    block
                    className="action-button connect-button"
                  >
                    Open Telegram Bot
                  </Button>

                  <Button
                    type="default"
                    onClick={() => {
                      setTelegramAuthStep('request');
                      setTelegramAuthData(null);
                      setTimeRemaining(0);
                    }}
                    block
                    className="modal-link-button"
                  >
                    Generate New Code
                  </Button></Space>
                </div>
              )}

              {telegramAuthStep === 'success' && (
                <div style={{ width: '100%', textAlign: 'center' }}>
                  <div className="auth-info-card" style={{ textAlign: 'center', background: 'rgba(82, 196, 26, 0.05)', borderColor: 'rgba(82, 196, 26, 0.2)' }}>
                    <CheckCircleFilled style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                    <h3 style={{ color: '#52c41a', margin: 0 }}>Connection Verified</h3>
                  </div>
                  <Space className="action-buttons" vertical size={18}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      setTelegramAuthModalVisible(false);
                      setTelegramAuthStep('request');
                      setTelegramAuthData(null);
                      setTimeRemaining(0);
                    }}
                    block
                    className="action-button success-button"
                  >
                    Dismiss
                  </Button></Space>
                </div>
              )}

              {telegramAuthStep === 'error' && (
                <div style={{ width: '100%' }}>
                  <div className="auth-info-card">
                    <Alert
                      title="Connection Failed"
                      description="There was an unexpected error. Please check your internet connection and try again."
                      type="error" style={{margin: 0}}
                      showIcon
                    />
                  </div>
                  <Space className="action-buttons" vertical size={18}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      setTelegramAuthStep('request');
                      setTelegramAuthData(null);
                      setTimeRemaining(0);
                    }}
                    block
                    className="action-button connect-button"
                  >
                    Try Again
                  </Button></Space>
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* Deriv Auth Modal */}
        <Modal
          title={null}
          open={derivAuthModalVisible}
          onCancel={() => setDerivAuthModalVisible(false)}
          footer={null}
          width={440}
          centered
          className="auth-premium-modal"
          closeIcon={null}
        >
          <div className="auth-modal-glass-container">

            <div className="auth-modal-body">
              <div className="platform-logo-wrapper deriv">
                <img alt="Deriv" src={derivLogo} style={{ height: 80, objectFit: 'contain' }} />
              </div>

              <h2 className="modal-title">Deriv Connection</h2>
              <p className="modal-subtitle">
                Securely connect your Deriv trading account using high-level OAuth2 authentication. We use Base64 encoded payloads and unique authorization codes to ensure your trading data remains private.
              </p>

              <div className="feature-list">
                <div className="feature-item">
                  <CheckCircleFilled />
                  <span>Verified OAuth2 Integration</span>
                </div>
                <div className="feature-item">
                  <CheckCircleFilled />
                  <span>Read-only Balance Access</span>
                </div>
                <div className="feature-item">
                  <CheckCircleFilled />
                  <span>Encrypted Payload Transfer</span>
                </div>
              </div>

              <div className="deriv-endpoint-card">
                <span className="endpoint-label">Authentication Endpoint</span>
                <code>https://oauth.deriv.com/oauth2/authorize?app_id=111480</code>
              </div>

              <Space className="action-buttons" vertical size={18}>

              <Button
                type="primary"
                size="large"
                icon={<WalletOutlined />}
                onClick={handleDerivSignIn}
                loading={derivAuthLoading}
                block
                className="action-button deriv-button"
              >
                {derivAuthLoading ? 'Connecting...' : 'Connect Deriv Account'}
              </Button>

              <Button
                type="default"
                onClick={() => setDerivAuthModalVisible(false)}
                className="modal-link-button"
                block
              >
                Maybe Later
              </Button>

              </Space>
            </div>
          </div>
        </Modal>

        {/* Connected Accounts List Drawer */}
        <Drawer
          title={null}
          placement="right"
          onClose={() => setAccountsDrawerVisible(false)}
          open={accountsDrawerVisible}
          size={window.innerWidth > 500 ? 500 : "default"}
          className="linked-accounts-settings-drawer nested-drawer"
          closeIcon={null}
        >
          <div className="drawer-header">
            <Button
              type="text"
              icon={<ArrowRightOutlined rotate={180} />}
              onClick={() => setAccountsDrawerVisible(false)}
              className="back-button"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={derivIcon} alt="Deriv" style={{ width: 24, height: 24 }} />
              <Title level={4} className="drawer-title">Connected Accounts</Title>
            </div>
          </div>
          <div className="drawer-content">
            <div className="account-list-container">
              {(derivAccounts as any[]).map((account: EnhancedAccount) => (
                <div key={account.id} className="account-item-card">
                  <div className="account-item-header">
                    <div className="account-title-wrapper">
                      {getCurrencyIcon(account.currency)}
                      <Text strong className="account-currency">{account.currency} Account</Text>
                    </div>
                    <Badge status={account.status === 'active' ? 'success' : 'default'} />
                  </div>
                  <div className="account-item-details">
                    <div className="detail-row">
                      <span className="label">Account ID</span>
                      <code className="value">{account.id}</code>
                    </div>
                    <div className="detail-row">
                      <span className="label">Type</span>
                      <span className="value">{account.isVirtual ? 'Demo' : 'Real'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Balance</span>
                      <span className="value">{formatBalance(account.balance || 0, account.currency)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Active Status</span>
                      <Switch
                        checked={account.status === 'active'}
                        onChange={(checked) => handleUpdateAccountStatusWithNotify(account.id, checked ? 'active' : 'disabled')}
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Drawer>
      </ConfigProvider>
    </Drawer>
  );
}
