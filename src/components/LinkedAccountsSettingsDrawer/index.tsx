import { useState, useEffect } from "react";
import { Drawer, Button, Avatar, Space, Typography, Switch, Card, Badge, Tooltip, Divider, Modal, Alert, notification, Popconfirm, ConfigProvider, Flex } from "antd";
import { User, authAPI } from '../../services/api';
import { GoogleAuth } from '../../utils/GoogleAuth';
import { TelegramAuth } from '../../utils/TelegramAuth';
import { DerivAuth } from '../../utils/DerivAuth';
import { useDeriv } from '../../hooks/useDeriv';
import derivLogo from '../../assets/deriv-logo.svg';
import googleLogo from '../../assets/google-logo.svg';
import telegramLogo from '../../assets/telegram-logo.svg';
import { CurrencyDemoIcon, CurrencyBtcIcon, CurrencyEthIcon, CurrencyLtcIcon, CurrencyUsdIcon, CurrencyUsdcIcon, CurrencyUsdtIcon, CurrencyXrpIcon } from '@deriv/quill-icons';
import googleIcon from '../../assets/google-icon.webp';
import telegramIcon from '../../assets/telegram-icon.webp';
import { MessageOutlined, GoogleOutlined, WalletOutlined, LinkOutlined, CheckCircleFilled, UserOutlined, MailOutlined, CalendarOutlined, ClockCircleOutlined, LinkOutlined as LinkIcon, TagsOutlined } from "@ant-design/icons";
import "./styles.scss";
import { getCurrentDateTimeFormatted } from "../../utils/TimeUtils";
import { useAuth } from "../../contexts/AuthContext";
import { createStyles } from 'antd-style';
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

interface ProfileSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function LinkedAccountsSettingsDrawer({ visible, onClose, user }: ProfileSettingsDrawerProps) {

  const { styles } = useStyle();
  const { refreshProfile } = useAuth();
  const { accounts: derivAccounts, hasData: hasDerivData, isLoading: derivLoading } = useDeriv();

  // Currency icon conditional rendering function
  const getCurrencyIcon = (currency: string) => {
    const normalizedCurrency = currency?.toLowerCase();
    
    switch (normalizedCurrency) {
      case 'demo':
      case 'virtual':
        return <CurrencyDemoIcon fill='#000000' iconSize='md'/>;
      case 'btc':
        return <CurrencyBtcIcon fill='#000000' iconSize='md'/>;
      case 'eth':
        return <CurrencyEthIcon fill='#000000' iconSize='md'/>;
      case 'ltc':
        return <CurrencyLtcIcon fill='#000000' iconSize='md'/>;
      case 'usd':
        return <CurrencyUsdIcon fill='#000000' iconSize='md'/>;
      case 'usdc':
        return <CurrencyUsdcIcon fill='#000000' iconSize='md'/>;
      case 'usdt':
        return <CurrencyUsdtIcon fill='#000000' iconSize='md'/>;
      case 'eusdt':
        return <CurrencyUsdtIcon fill='#000000' iconSize='md'/>;
      case 'tusdt':
        return <CurrencyUsdtIcon fill='#000000' iconSize='md'/>;
      case 'xrp':
        return <CurrencyXrpIcon fill='#000000' iconSize='md'/>;
      default:
        return <CurrencyUsdIcon fill='#000000' iconSize='md'/>; // Default to USD icon
    }
  };

  const [api, contextHolder] = notification.useNotification();

  const [telegramLinked, setTelegramLinked] = useState(user?.accounts?.telegram?.isAccountLinked || false);
  const [googleLinked, setGoogleLinked] = useState(user?.accounts?.google?.isAccountLinked || false);
  const [derivLinked, setDerivLinked] = useState(hasDerivData || user?.accounts?.deriv?.isAccountLinked || false);

  // Update states when user prop or deriv data changes
  useEffect(() => {
    setTelegramLinked(user?.accounts?.telegram?.isAccountLinked || false);
    setGoogleLinked(user?.accounts?.google?.isAccountLinked || false);
    setDerivLinked(hasDerivData || user?.accounts?.deriv?.isAccountLinked || false);
  }, [user, hasDerivData]);

  // Connected Accounts State - Convert Deriv accounts to connected accounts format
  const connectedAccounts = derivAccounts.map(account => ({
    id: account.id,
    type: 'deriv',
    name: `${account.accountType === 'real' ? 'Real' : 'Demo'} Account`,
    accountId: account.id,
    accountType: account.accountType === 'real' ? 'Real Money' : 'Demo',
    currency: account.currency,
    balance: account.balance || 0,
    status: account.status || 'active',
    connectedAt: new Date().toISOString(), // You might want to store this in localStorage
    platform: 'Deriv'
  }));

  // Google Auth State
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [googleAuthModalVisible, setGoogleAuthModalVisible] = useState(false);

  // Telegram Auth State
  const [telegramAuthLoading, setTelegramAuthLoading] = useState(false);
  const [telegramAuthModalVisible, setTelegramAuthModalVisible] = useState(false);
  const [telegramAuthData, setTelegramAuthData] = useState<{ code: string; expires: number; token: string } | null>(null);
  const [telegramAuthStep, setTelegramAuthStep] = useState<'request' | 'waiting' | 'success' | 'error'>('request');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Deriv Auth State
  const [derivAuthLoading, setDerivAuthLoading] = useState(false);
  const [derivAuthModalVisible, setDerivAuthModalVisible] = useState(false);

  // Connected Accounts Drawer State
  const [accountsDrawerVisible, setAccountsDrawerVisible] = useState(false);

  const openGoogleNotification = (message:string) => {
    api.open({
      title: 'Google',
      description: message,
      icon: <img alt="Google" src={googleIcon} style={{ height: 24 }} />,
      showProgress: true,
      duration: 20,
      className: 'glass-effect'
    });
  };

  const openTelegramNotification = (message:string) => {
    api.open({
      title: 'Telegram',
      description: message,
      icon: <img alt="Telegram" src={telegramIcon} style={{ height: 24 }} />,
      showProgress: true,
      duration: 20,
      className: 'glass-effect'
    });
  };

  const openDerivNotification = (message:string) => {
    api.open({
      title: 'Deriv',
      description: message,
      icon: <img alt="Deriv" src={derivLogo} style={{ height: 24 }} />,
      showProgress: true,
      duration: 20,
      className: 'glass-effect'
    });
  };

  const handleLinkTelegram = async (checked: boolean) => {
    if (!checked) {
      // Handle unlinking
      try {
        const linkResult = await authAPI.unLinkTelegramAccount();
        console.log('unLinkResult:', linkResult);

         console.log('unLinkResult:', linkResult);

          if (linkResult?.success || (typeof (linkResult?.accounts?.telegram?.isAccountLinked) === 'boolean' && linkResult?.accounts?.telegram?.isAccountLinked === false)) {

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
    setGoogleLinked(checked);
    // TODO: Implement Google OAuth flow
    console.log('Linking Google account:', checked);
    if(!checked){
      
        // Call API to link Google account
        try {
          
          const linkResult = await authAPI.unLinkGoogleAccount();

         console.log('unLinkResult:', linkResult);

          if (linkResult?.success || (typeof (linkResult?.accounts?.google?.isAccountLinked) === 'boolean' && linkResult?.accounts?.google?.isAccountLinked === false)) {

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

  // Google Auth Functions
  const handleGoogleSignIn = async () => {
    setGoogleAuthLoading(true);
    try {
      const result = await GoogleAuth.signInWithPopup();

      if (result.success && result.user) {
        console.log('Google sign-in successful:', result.user);
        // Get comprehensive user data
        // const userData = GoogleAuth.decodeUserData(result.user);
        // console.log('User Data:', userData);

        // Get formatted data for display
        const formattedData = GoogleAuth.getFormattedUserData(result.user);
        // console.log('Formatted Data:', formattedData);

        const payload = {...formattedData.basic, ...formattedData.timestamps}

        delete payload.createdAt;
        delete payload.lastLoginAt;

        payload.isAccountLinked = true;
        payload.linkedTime = getCurrentDateTimeFormatted();

        console.log('Payload Data:', payload);

        // Call API to link Google account
        try {
          
          const linkResult = await authAPI.linkGoogleAccount(payload);

         console.log('linkResult:', linkResult);

          if (linkResult?.accounts?.google?.isAccountLinked) {

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
        console.error('Google sign-in failed:', result.error);
        openGoogleNotification(result.error || 'Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
        openGoogleNotification('An unexpected error occurred. Please try again.');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const openGoogleAuthModal = () => {
    setGoogleAuthModalVisible(true);
  };

  // Telegram Auth Functions
  const startTelegramSignIn = async () => {
    setTelegramAuthLoading(true);
    try {
      const response = await authAPI.requestTelegramAuthorization();
      response.sessionStarted = Date.now();
      setTelegramAuthData(response);
      setTelegramAuthStep('waiting');
      setTimeRemaining(Math.floor((response.expires * 1000 - Date.now()) / 1000));
      
      // Start countdown
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

      // Auto-open Telegram link after getting code
      setTimeout(() => {
        //openTelegramLink();
      }, 500);
      
    } catch (error: any) {
      console.error('Error requesting Telegram authorization:', error);
      openTelegramNotification('Failed to generate authorization code. Please try again.');
      setTelegramAuthStep('error');
    } finally {
      setTelegramAuthLoading(false);
    }
  };

  const openTelegramLink = async () => {
    if (telegramAuthData?.code) {
      const telegramUrl = `https://t.me/koppo_ai_bot?start=/auth:${telegramAuthData.code}`;
      window.open(telegramUrl, '_blank');
      console.log("OPEN URL", telegramUrl, [Date.now() , telegramAuthData])
      // Start polling after opening Telegram
      pollTelegramAuthorization();
    }
  };

  const pollTelegramAuthorization = async () => {
    console.log("POLL")
    if (!telegramAuthData?.code) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await authAPI.checkTelegramAuthorization(telegramAuthData.code);
        

        console.log("EXPIRES", {response, dateNow: Date.now() , telegramAuthData, elapsed: [Date.now() , response.expires * 1000, Date.now() > response.expires * 1000]})

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
    }, 2000); // Poll every 2 seconds
  };

  // Telegram Auth Functions
  const handleTelegramSignIn = async (success: boolean) => {
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
  };

  const openTelegramAuthModal = () => {
    setTelegramAuthModalVisible(true);
  };

  const handleLinkDeriv = async (checked: boolean) => {
    if (!checked) {
      // Handle unlinking
      try {
        const linkResult = await authAPI.unLinkDerivAccount();
        console.log('unLinkResult:', linkResult);
        
        if (linkResult?.success || (typeof (linkResult?.accounts?.deriv?.isAccountLinked) === 'boolean' && linkResult?.accounts?.deriv?.isAccountLinked === false)) {
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
      // Handle linking - open auth modal
      openDerivAuthModal();
    }
  };

  // Deriv Auth Functions
  const handleDerivSignIn = async () => {
    setDerivAuthLoading(true);
    try {
      // Initialize Deriv Auth with app ID 111480
      DerivAuth.initialize('111480', window.location.origin + '/deriv/callback');

      // Create user data for payload
      const userData = {
        uid: user?.identities?.uid || 'demo_uid',
        mid: user?.id?.toString() || 'demo_mid',
        fid: user?.identities?.fid || 'demo_fid',
        uuid: user?.uuid || DerivAuth.generateUUID()
      };

      console.log('Initiating Deriv sign-in with URL...');

      // Generate auth URL and open in new tab
      const result = DerivAuth.authenticateWithUrl(userData);

      if (result.success) {
        // For now, simulate successful connection
        // In a real implementation, you would handle the OAuth callback
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

        // Call API to link Deriv account
        const linkResult = await authAPI.linkDerivAccount(mockDerivData);
        console.log('linkResult:', linkResult);

        if (linkResult?.success || (typeof (linkResult?.accounts?.deriv?.isAccountLinked) === 'boolean' && linkResult?.accounts?.deriv?.isAccountLinked === true)) {
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

  const openDerivAuthModal = () => {
    setDerivAuthModalVisible(true);
  };

  const handleDisconnectAccount = (accountId: string) => {
    setConnectedAccounts(prev => prev.filter(account => account.id !== accountId));
    console.log('Disconnected account:', accountId);
  };

  const getActiveAccountsCount = () => {
    return connectedAccounts.filter(account => account.status === 'active').length;
  };

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Drawer
      title="Linked Accounts"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="profile-settings-drawer"
    ><ConfigProvider
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
      <div className="tokens-content">
        <div className="tokens-grid">
          {/* Telegram Account Card */}
          <Card
            className="tokens-card"
            hoverable
          >
            <div className="account-card-header">
              <div className="account-icon-container">
                <img
                    src={telegramIcon}
                    alt="Deriv"
                    style={{
                      height: 48,
                      objectFit: 'contain'
                    }}
                  />
                <div className="account-badge">
                  <Badge status={telegramLinked ? 'success' : 'default'} />
                </div>
              </div>
              <div className="account-status">
                <Tooltip title={telegramLinked ? 'Disconnect Telegram' : 'Connect Telegram'}>
                  {telegramLinked ? (
                  <Popconfirm placement="left" title={<>Are you sure you want to <br/>unlink your Telegram Account?</>} onConfirm={()=>handleLinkTelegram(false)}>
                  <Switch
                    checked={telegramLinked}
                  />
                  </Popconfirm>):(<Switch
                    checked={telegramLinked}
                    onChange={openTelegramAuthModal}
                  />)}
                </Tooltip>
              </div>
            </div>

            <div className="account-card-body">
              <Title level={5} className="account-title">Telegram</Title>
              <Text className="account-description">
                Connect your Telegram account to receive notifications and manage your trading bots through chat
              </Text>

              {/* Telegram Login Button - Only show when not linked */}
              {!telegramLinked && (
                <Button
                  type="primary"
                  size="large"
                  icon={<MessageOutlined />}
                  onClick={openTelegramAuthModal}
                  loading={telegramAuthLoading}
                  style={{
                    width: '100%',
                    height: 40,
                    backgroundColor: '#0088cc',
                    borderColor: '#0088cc',
                    marginTop: 12,
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  Connect with Telegram
                </Button>
              )}

              {telegramLinked && (
                <div className="account-details">
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <UserOutlined style={{ color: '#0088cc', fontSize: 14 }} />
                      <Text strong>Username</Text>
                    </Flex>
                    <code>@{user?.accounts?.telegram?.username || 'telegram_user'}</code>
                  </Flex>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <MessageOutlined style={{ color: '#0088cc', fontSize: 14 }} />
                      <Text strong>Display Name</Text>
                    </Flex>
                    <code>{user?.accounts?.telegram?.displayName || 'Telegram User'}</code>
                  </Flex>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <MailOutlined style={{ color: '#0088cc', fontSize: 14 }} />
                      <Text strong>Email</Text>
                    </Flex>
                    <code className="email-text" style={{ 
                      maxWidth: '200px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      display: 'inline-block'
                    }}>
                      {user?.accounts?.telegram?.email || user?.email || 'N/A'}
                    </code>
                  </Flex>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <CalendarOutlined style={{ color: '#0088cc', fontSize: 14 }} />
                      <Text strong>Created</Text>
                    </Flex>
                    <code>{user?.accounts?.telegram?.creationTime || 'N/A'}</code>
                  </Flex>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <LinkIcon style={{ color: '#0088cc', fontSize: 14 }} />
                      <Text strong>Connected</Text>
                    </Flex>
                    <code>{user?.accounts?.telegram?.linkedTime}</code>
                  </Flex>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <ClockCircleOutlined style={{ color: '#0088cc', fontSize: 14 }} />
                      <Text strong>Last Login</Text>
                    </Flex>
                    <code>{user?.accounts?.telegram?.lastSignInTime || 'N/A'}</code>
                  </Flex>
                  <Flex justify="space-between" align="start" style={{ marginBottom: 8 }}>
                    <Flex align="center" gap={8}>
                      <TagsOutlined style={{ color: '#0088cc', fontSize: 14 }} />
                      <Text strong>Features</Text>
                    </Flex>
                    <div className="feature-tags">
                      <Badge count="Notifications" style={{ backgroundColor: '#0088cc' }} />
                      <Badge count="Bot Control" style={{ backgroundColor: '#52c41a' }} />
                      <Badge count="Alerts" style={{ backgroundColor: '#fa8c16' }} />
                      <Badge count="Chat Commands" style={{ backgroundColor: '#722ed1' }} />
                    </div>
                  </Flex>
                </div>
              )}
            </div>
          </Card>

          {/* Google Account Card */}
          <Card
            className="tokens-card"
            hoverable
          >
            <div className="account-card-header">
              <div className="account-icon-container">
                <img
                    src={googleIcon}
                    alt="Deriv"
                    style={{
                      height: 48,
                      objectFit: 'contain'
                    }}
                  />
                <div className="account-badge">
                  <Badge status={googleLinked ? 'success' : 'default'} />
                </div>
              </div>
              <div className="account-status">
                <Tooltip title={googleLinked ? 'Disconnect Google' : 'Connect Google'}>
                  {googleLinked ? (
                  <Popconfirm placement="left" title={<>Are you sure you want to <br/>unlink your Google Account?</>} onConfirm={()=>handleLinkGoogle(false)}>
                  <Switch
                    checked={googleLinked}
                  />
                  </Popconfirm>):(<Switch
                    checked={googleLinked}
                    onChange={openGoogleAuthModal}
                  />)}
                </Tooltip>
              </div>
            </div>

            <div className="account-card-body">
              <Title level={5} className="account-title">Google</Title>
              <Text className="account-description">
                Link your Google account for seamless authentication and data synchronization across devices
              </Text>

              {/* Google Login Button - Only show when not linked */}
              {!googleLinked && (
                <Button
                  type="primary"
                  size="large"
                  icon={<GoogleOutlined />}
                  onClick={openGoogleAuthModal}
                  loading={googleAuthLoading}
                  style={{
                    width: '100%',
                    height: 40,
                    backgroundColor: '#4285f4',
                    borderColor: '#4285f4',
                    marginTop: 12,
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  Sign in with Google
                </Button>
              )}

              {googleLinked && (
                <div className="account-details">
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <UserOutlined style={{ color: '#4285f4', fontSize: 14 }} />
                      <Text strong>Name</Text>
                    </Flex>
                    <code>{user?.accounts?.google?.displayName || user?.displayName || 'N/A'}</code>
                  </Flex>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <MailOutlined style={{ color: '#4285f4', fontSize: 14 }} />
                      <Text strong>Email</Text>
                    </Flex>
                    <code className="email-text" style={{ 
                      maxWidth: '200px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      display: 'inline-block'
                    }}>
                      {user?.accounts?.google?.email || user?.email || 'N/A'}
                    </code>
                  </Flex>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <CalendarOutlined style={{ color: '#4285f4', fontSize: 14 }} />
                      <Text strong>Created</Text>
                    </Flex>
                    <code>{user?.accounts?.google?.creationTime || 'N/A'}</code>
                  </Flex>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <LinkIcon style={{ color: '#4285f4', fontSize: 14 }} />
                      <Text strong>Connected</Text>
                    </Flex>
                    <code>{user?.accounts?.google?.linkedTime}</code>
                  </Flex>
                  <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                    <Flex align="center" gap={8}>
                      <ClockCircleOutlined style={{ color: '#4285f4', fontSize: 14 }} />
                      <Text strong>Last Login</Text>
                    </Flex>
                    <code>{user?.accounts?.google?.lastSignInTime || 'N/A'}</code>
                  </Flex>
                  <Flex justify="space-between" align="start" style={{ marginBottom: 8 }}>
                    <Flex align="center" gap={8}>
                      <TagsOutlined style={{ color: '#4285f4', fontSize: 14 }} />
                      <Text strong>Features</Text>
                    </Flex>
                    <div className="feature-tags">
                      <Badge count="Display Name" style={{ backgroundColor: '#4285f4' }} />
                      <Badge count="Email" style={{ backgroundColor: '#34a853' }} />
                      <Badge count="Phone" style={{ backgroundColor: '#f85205ff' }} />
                    </div>
                  </Flex>
                </div>
              )}
            </div>
          </Card>

          {/* Connected Accounts Card */}
          <Card
            className="tokens-card"
            hoverable
          >
            <div className="account-card-header">
              <div className="account-icon-container">
                <img
                    src={derivLogo}
                    alt="Deriv"
                    style={{
                      height: 48,
                      objectFit: 'contain'
                    }}
                  />
                <div className="account-badge">
                  <Badge
                    count={derivAccounts.length}
                    style={{
                      backgroundColor: '#52c41a',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      minWidth: '24px',
                      height: '24px',
                      lineHeight: '24px',
                      borderRadius: 24
                    }}
                  />
                </div>
              </div>
              <div className="account-status">
                <Tooltip title={derivLinked ? 'Disconnect Deriv' : 'Connect Deriv'}>
                  {derivLinked ? (
                  <Popconfirm placement="left" title={<>Are you sure you want to <br/>unlink your Deriv Account?</>} onConfirm={()=>handleLinkDeriv(false)}>
                  <Switch
                    checked={derivLinked}
                  />
                  </Popconfirm>):(<Switch
                    checked={derivLinked}
                    onChange={openDerivAuthModal}
                  />)}
                </Tooltip>
              </div>
            </div>

            <div className="account-card-body">
              <Title level={5} className="account-title">Connected Accounts</Title>
              <Text className="account-description">
                Manage your connected trading accounts and monitor their performance
              </Text>


              {/* Add Deriv Account Button - Hidden */}
              {/*  */}

              {!derivLinked || derivAccounts.length === 0 && (<>
                <div style={{ marginTop: 16, padding: 16, textAlign: 'center' }}>
                  No Deriv accounts connected.
                </div><Button
                type="primary"
                size="large"
                icon={<WalletOutlined />}
                onClick={openDerivAuthModal}
                loading={derivAuthLoading}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#dc4446',
                  borderColor: '#dc4446',
                  fontSize: 16,
                  fontWeight: 500,
                  marginTop: 16
                }}
              >
                {derivAuthLoading ? 'Connecting...' : 'Add Deriv Account'}
              </Button></>
              )}

              {/* Summary Stats - Clickable to open drawer */}
              {connectedAccounts.length > 0 && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 16,
                    backgroundColor: 'transparent',
                    borderRadius: 8,
                    border: '1px solid #bae7ff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setAccountsDrawerVisible(true)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e6f7ff';
                    e.currentTarget.style.borderColor = '#91d5ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                    e.currentTarget.style.borderColor = '#bae7ff';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                        Total Balance
                      </Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}><code>
                        {formatBalance(
                          derivAccounts
                            .filter(acc => acc.status === 'active')
                            .reduce((sum, acc) => sum + (acc.balance || 0), 0),
                          derivAccounts[0]?.currency || 'USD'
                        )}</code>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text strong style={{ fontSize: 14, color: '#52c41a' }}>
                        Active Accounts
                      </Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                        <code>
                        {derivAccounts.filter(acc => acc.status === 'active').length}/{derivAccounts.length}</code>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                      Click to view all accounts →
                    </Text>
                  </div>
                </div>
              )}

              {connectedAccounts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <img
                    src={derivLogo}
                    alt="Deriv"
                    style={{
                      width: 72,
                      height: 40,
                      objectFit: 'contain',
                      opacity: 0.3,
                      marginBottom: 16
                    }}
                  />
                  <Text type="secondary">
                    No connected accounts yet. Connect your first trading account to get started.
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      {/* Connected Accounts Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={derivLogo}
              alt="Deriv"
              style={{
                width: 24,
                height: 24,
                objectFit: 'contain'
              }}
            />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Connected Accounts
              </Title>
            </div>
          </div>
        }
        placement="right"
        onClose={() => setAccountsDrawerVisible(false)}
        open={accountsDrawerVisible}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          {/* Account Summary */}
          <div style={{
            padding: 16,
            backgroundColor: 'transparent',
            borderRadius: 8,
            border: '1px solid #bae7ff',
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                      <Text strong style={{ fontSize: 14, color: '#1890ff' }}>
                        Total Balance
                      </Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}><code>
                        {formatBalance(
                          derivAccounts
                            .filter(acc => acc.status === 'active')
                            .reduce((sum, acc) => sum + (acc.balance || 0), 0),
                          derivAccounts[0]?.currency || 'USD'
                        )}</code>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text strong style={{ fontSize: 14, color: '#52c41a' }}>
                        Active Accounts
                      </Text>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                        <code>
                        {derivAccounts.filter(acc => acc.status === 'active').length}/{derivAccounts.length}</code>
                      </div>
                    </div>
            </div>
          </div>

          {/* Account List */}
          <div style={{ maxHeight: 'calc(100vh - 270px)', overflowY: 'auto', margin: "0px -24px", padding: "0px 24px" }}>
            {derivAccounts.map((account, index) => (
              <Card
                key={account.id} style={{marginBottom: 24}}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 24 }}>
                        {account.currency} Account
                      </Text>
                      {getCurrencyIcon(account.currency)}
                    </Flex>

                    <div key={account.id} style={{ marginBottom: 16, padding: '12px', backgroundColor: 'transparent', borderRadius: 8 }}>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                        <Flex align="center" gap={8}>
                          <WalletOutlined style={{ color: '#dc4446', fontSize: 14 }} />
                          <Text strong>Account ID</Text>
                        </Flex>
                        <code>{account.id}</code>
                      </Flex>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                        <Flex align="center" gap={8}>
                          <UserOutlined style={{ color: '#dc4446', fontSize: 14 }} />
                          <Text strong>Account Type</Text>
                        </Flex>
                        <code>{account.accountType === 'real' ? 'Real Money' : 'Demo'}</code>
                      </Flex>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                        <Flex align="center" gap={8}>
                          <WalletOutlined style={{ color: '#dc4446', fontSize: 14 }} />
                          <Text strong>Currency</Text>
                        </Flex>
                        <code>{account.currency}</code>
                      </Flex>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                        <Flex align="center" gap={8}>
                          <WalletOutlined style={{ color: '#dc4446', fontSize: 14 }} />
                          <Text strong>Balance</Text>
                        </Flex>
                        <code>{account.currency} {account.balance?.toFixed(2) || '0.00'}</code>
                      </Flex>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px dotted rgba(217, 217, 217, 0.5)' }}>
                        <Flex align="center" gap={8}>
                          <LinkIcon style={{ color: '#dc4446', fontSize: 14 }} />
                          <Text strong>Status</Text>
                        </Flex>
                        <code>{account.status || 'active'}</code>
                      </Flex>
                      <Flex justify="space-between" align="start" style={{ marginBottom: 8 }}>
                        <div className="feature-tags">
                          <Badge count="Trading" style={{ backgroundColor: '#dc4446' }} />
                          <Badge count="Analytics" style={{ backgroundColor: '#52c41a' }} />
                          <Badge count="API Access" style={{ backgroundColor: '#722ed1' }} />
                          {account.accountType === 'real' && (
                            <Badge count="Live Trading" style={{ backgroundColor: '#ff4d4f' }} />
                          )}
                        </div>
                      </Flex>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Drawer>

      {/* Google Auth Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img alt="Google" src={googleIcon} style={{ height: 24 }} />
            <span>Google Authentication</span>
          </div>
        }
        open={googleAuthModalVisible}
        onCancel={() => setGoogleAuthModalVisible(false)}
        footer={null}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 24 }}>
            <img alt="Google" src={googleLogo} style={{ height: 72, marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0, color: '#4285f4' }}>
              Connect Your Google Account
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Sign in to enable seamless authentication and data synchronization
            </Text>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Alert
              message="Secure Authentication"
              description="We use Firebase Auth to securely connect your Google account. Your credentials are never stored on our servers."
              type="info"
              showIcon
              style={{ textAlign: 'left' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Single Sign-On (SSO)</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Cloud Data Sync</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Calendar Integration</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Secure & Encrypted</Text>
              </div>
            </Space>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<GoogleOutlined />}
            onClick={handleGoogleSignIn}
            loading={googleAuthLoading}
            style={{
              width: '100%',
              height: 48,
              backgroundColor: '#4285f4',
              borderColor: '#4285f4',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            {googleAuthLoading ? 'Connecting...' : 'Sign in with Google'}
          </Button>

          <div style={{ marginTop: 16 }}>
            <Button
              type="link"
              onClick={() => setGoogleAuthModalVisible(false)}
              style={{ width: '100%' }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Telegram Auth Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img alt="Telegram" src={telegramLogo} style={{ height: 24 }} />
            <span>Telegram Authentication</span>
          </div>
        }
        open={telegramAuthModalVisible}
        onCancel={() => {
          setTelegramAuthModalVisible(false);
          setTelegramAuthStep('request');
          setTelegramAuthData(null);
          setTimeRemaining(0);
        }}
        footer={null}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 24 }}>
            <img alt="Telegram" src={telegramLogo} style={{ height: 72, marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0, color: '#0088cc' }}>
              Connect Your Telegram Account
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {telegramAuthStep === 'request' && 'Click the button below to generate your unique authorization code'}
              {telegramAuthStep === 'waiting' && 'Open our bot @koppo_ai_bot and send the code below'}
              {telegramAuthStep === 'success' && 'Successfully connected!'}
              {telegramAuthStep === 'error' && 'Something went wrong. Please try again.'}
            </Text>
            <Divider />
          </div>

          {telegramAuthStep === 'request' && (
            <Button
              type="primary"
              size="large"
              icon={<MessageOutlined />}
              onClick={startTelegramSignIn}
              loading={telegramAuthLoading}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: '#0088cc',
                borderColor: '#0088cc',
                fontSize: 16,
                fontWeight: 500
              }}
            >
              {telegramAuthLoading ? 'Generating Code...' : 'Generate Authorization Code'}
            </Button>
          )}

          {telegramAuthStep === 'waiting' && telegramAuthData && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div style={{ display: 'inline-block', alignItems: 'center', margin: 24 }}>
                    <Text><code style={{ fontSize: 32, padding: '12px 24px', letterSpacing: 2, borderRadius: 8 }}>{telegramAuthData.code}</code></Text>
                  </div>
                  <div>
                    <Text type="secondary">
                      Code expires in: <Text strong style={{ color: timeRemaining < 60 ? '#ff4d4f' : '#0088cc' }}>
                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                      </Text>
                    </Text>
                  </div>
                </Space>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<MessageOutlined />}
                onClick={openTelegramLink}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#0088cc',
                  borderColor: '#0088cc',
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                Open Telegram Bot
              </Button>

              <div style={{ marginTop: 16 }}>
                <Button
                  type="link"
                  onClick={() => {
                    setTelegramAuthStep('request');
                    setTelegramAuthData(null);
                    setTimeRemaining(0);
                  }}
                  style={{ width: '100%' }}
                >
                  Generate New Code
                </Button>
              </div>
            </div>
          )}

          {telegramAuthStep === 'success' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <CheckCircleFilled style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                  Successfully Connected!
                </Title>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Your Telegram account has been linked successfully.
                </Text>
              </div>
              <Button
                type="primary"
                onClick={() => {
                  setTelegramAuthModalVisible(false);
                  setTelegramAuthStep('request');
                  setTelegramAuthData(null);
                  setTimeRemaining(0);
                }}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a',
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                Done
              </Button>
            </div>
          )}

          {telegramAuthStep === 'error' && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <Alert
                  message="Authentication Failed"
                  description="There was an error connecting your Telegram account. Please try again."
                  type="error"
                  showIcon
                />
              </div>
              <Button
                type="primary"
                onClick={() => {
                  setTelegramAuthStep('request');
                  setTelegramAuthData(null);
                  setTimeRemaining(0);
                }}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#0088cc',
                  borderColor: '#0088cc',
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                Try Again
              </Button>
              <div style={{ marginTop: 16 }}>
                <Button
                  type="link"
                  onClick={() => {
                    setTelegramAuthModalVisible(false);
                    setTelegramAuthStep('request');
                    setTelegramAuthData(null);
                    setTimeRemaining(0);
                  }}
                  style={{ width: '100%' }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {telegramAuthStep === 'request' && (
            <div style={{ marginTop: 16 }}>
              <Button
                type="link"
                onClick={() => {
                  setTelegramAuthModalVisible(false);
                  setTelegramAuthStep('request');
                  setTelegramAuthData(null);
                  setTimeRemaining(0);
                }}
                style={{ width: '100%' }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Deriv Auth Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img alt="Deriv" src={derivLogo} style={{ height: 24 }} />
            <span>Deriv Authentication</span>
          </div>
        }
        open={derivAuthModalVisible}
        onCancel={() => setDerivAuthModalVisible(false)}
        footer={null}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 24 }}>
            <img alt="Deriv" src={derivLogo} style={{ height: 72, marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0, color: '#dc4446' }}>
              Connect Your Deriv Account
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              We'll generate a secure authentication link to connect your Deriv trading account
            </Text>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Alert
              message="Secure OAuth Authentication"
              description="We'll create a unique authentication URL with your user data encoded in base64 and open it in a new tab for secure Deriv OAuth connection."
              type="info"
              showIcon
              style={{ textAlign: 'left' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Base64 Encoded Payload</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Unique Authorization Code</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>Deriv OAuth2 Integration</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircleFilled style={{ color: '#52c41a' }} />
                <Text>New Tab Authentication</Text>
              </div>
            </Space>
          </div>

          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
            <Text strong style={{ color: '#dc4446', display: 'block', marginBottom: 4 }}>OAuth Endpoint:</Text>
            <Text code style={{ fontSize: 10, color: '#dc4446' }}>https://oauth.deriv.com/oauth2/authorize?app_id=111480</Text>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<WalletOutlined />}
            onClick={handleDerivSignIn}
            loading={derivAuthLoading}
            style={{
              width: '100%',
              height: 48,
              backgroundColor: '#dc4446',
              borderColor: '#dc4446',
              fontSize: 16,
              fontWeight: 500
            }}
          >
            {derivAuthLoading ? 'Generating URL...' : 'Connect with Deriv'}
          </Button>

          <div style={{ marginTop: 16 }}>
            <Button
              type="link"
              onClick={() => setDerivAuthModalVisible(false)}
              style={{ width: '100%' }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
</ConfigProvider>
    </Drawer>
  );
}
