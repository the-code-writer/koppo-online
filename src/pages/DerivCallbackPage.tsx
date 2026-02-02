import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Alert, Button, Space, Divider, Progress, Badge } from 'antd';
import { WalletOutlined, CheckCircleOutlined, LoadingOutlined, LinkOutlined } from '@ant-design/icons';
import { CurrencyDemoIcon, CurrencyBtcIcon, CurrencyEthIcon, CurrencyLtcIcon, CurrencyUsdIcon, CurrencyUsdcIcon, CurrencyUsdtIcon, CurrencyXrpIcon } from '@deriv/quill-icons';
import { useDeriv } from '../hooks/useDeriv';
import { useLocalStorage } from '../utils/use-local-storage';
import { authAPI } from '../services/api';
import { useOAuth } from '../contexts/OAuthContext';

const { Title, Text, Paragraph } = Typography;

/**
 * Deriv callback page that handles account parsing from Deriv OAuth callback
 */
export default function DerivCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshProfile } = useOAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const hasProcessed = useRef(false);
  
  // Use useLocalStorage for derivAccounts
  const [, setDerivAccounts] = useLocalStorage('derivAccounts');

  // Use the new useDeriv hook
  const { 
    parseAndAuthorizeFromUrl, 
    enhancedAccounts, 
    fullAccount,
    error: derivError 
  } = useDeriv();

  useEffect(() => {
    const processDerivCallback = async () => {
      // Prevent multiple simultaneous calls and cyclic processing
      if (!loading || hasProcessed.current) return;
      
      try {
        // Get the current URL which should contain the account parameters
        const currentUrl = window.location.href;
        console.log('Processing Deriv callback with URL:', currentUrl);

        // Use the hook to parse and authorize from URL
        const result: { fullAccount: any; enhancedAccounts: any[] } = await parseAndAuthorizeFromUrl(currentUrl);

        console.log('Finished Processing Deriv callback with URL: result:', result);

        // Call API to link Deriv Account
        if (result?.fullAccount) {
          try {

            const payload = result?.fullAccount;

            payload.isAccountLinked = true;
            payload.accountLinkedTime = Date.now();
            
            const linkResult = await authAPI.linkDerivAccount(payload);
            
            await refreshProfile();

            if (linkResult?.enhancedAccounts) {
              console.log('Successfully linked Deriv account:', linkResult);
            } else {
              console.warn('Failed to link Deriv account:', linkResult);
            }
          } catch (linkError) {
            console.error('Error linking Deriv account:', linkError);
            console.error('Error Result:', result);
          }
        }
        
        if (result) {
          console.log('Successfully processed Deriv callback', result);
          setSuccess(true);
          hasProcessed.current = true;
          
          // Save to local storage using useLocalStorage hook
          setDerivAccounts({
            accounts: result.enhancedAccounts,
            enhancedAccounts: result.enhancedAccounts,
            fullAccount: result.fullAccount,
            parsedAt: new Date().toISOString(),
            userId: user?.id || 'unknown',
            url: currentUrl
          });
        } else {
          throw new Error('Failed to process Deriv callback');
        }

        // Simulate processing progress
        for (let i = 0; i <= 100; i += 10) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error: any) {
        console.error('Deriv callback processing error:', error);
        setError(error.message || derivError || 'Failed to process Deriv callback. Please try again.');
        hasProcessed.current = true; // Mark as processed even on error
      } finally {
        setLoading(false);
      }
    };

    processDerivCallback();
  }, [searchParams, navigate, user, parseAndAuthorizeFromUrl, setDerivAccounts, derivError]);

  const handleGoToSettings = () => {
    navigate('/menu');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

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

  const getCountryFlag = (countryCode?: string) => {
    const flags: Record<string, string> = {
      'zw': '🇿🇼', // Zimbabwe
      'us': '🇺🇸', // United States
      'gb': '🇬🇧', // United Kingdom
      'de': '🇩🇪', // Germany
      'fr': '🇫🇷', // France
      'it': '🇮🇹', // Italy
      'es': '🇪🇸', // Spain
      'nl': '🇳🇱', // Netherlands
      'ca': '🇨🇦', // Canada
      'au': '🇦🇺', // Australia
      'jp': '🇯🇵', // Japan
      'cn': '🇨🇳', // China
      'in': '🇮🇳', // India
      'br': '🇧🇷', // Brazil
      'mx': '🇲🇽', // Mexico
      'ru': '🇷🇺', // Russia
      'za': '🇿🇦', // South Africa
      'sg': '🇸🇬', // Singapore
      'hk': '🇭🇰', // Hong Kong
    };
    return flags[countryCode?.toLowerCase() || ''] || '🌍';
  };

  const getCountryName = (countryCode?: string) => {
    const countries: Record<string, string> = {
      'zw': 'Zimbabwe',
      'us': 'United States',
      'gb': 'United Kingdom',
      'de': 'Germany',
      'fr': 'France',
      'it': 'Italy',
      'es': 'Spain',
      'nl': 'Netherlands',
      'ca': 'Canada',
      'au': 'Australia',
      'jp': 'Japan',
      'cn': 'China',
      'in': 'India',
      'br': 'Brazil',
      'mx': 'Mexico',
      'ru': 'Russia',
      'za': 'South Africa',
      'sg': 'Singapore',
      'hk': 'Hong Kong',
    };
    return countries[countryCode?.toLowerCase() || ''] || 'Unknown';
  };

  const getScopeColor = (scope: string) => {
    const colors: Record<string, string> = {
      'read': 'blue',
      'trade': 'green',
      'payments': 'orange',
      'admin': 'purple',
      'trading_information': 'cyan',
      'account': 'geekblue'
    };
    return colors[scope] || 'default';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent'
      }}>
        <Card style={{ width: '100%', marginLeft: 32, marginRight: 32, maxWidth: 500, textAlign: 'center' }}>
          <LoadingOutlined style={{ fontSize: 48, color: '#dc4446', marginBottom: 16 }} />
          <Title level={3}>Please wait...</Title>
          <Text>Please wait while we process your trading accounts.</Text>

          <div style={{ marginTop: 24 }}>
            <Progress
              percent={progress}
              status="active"
              strokeColor={{
                '0%': '#dc4446',
                '100%': '#ff6b6b',
              }}
            />
            <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
              Parsing account data and saving to secure storage...
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    const realAccounts = enhancedAccounts.filter(acc => !acc.isVirtual);
    const demoAccounts = enhancedAccounts.filter(acc => acc.isVirtual);
    const currencies = [...new Set(enhancedAccounts.map(acc => acc.currency))];

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent'
      }}>
        <Card style={{ width: '100%', maxWidth: 600, textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <Title level={3}>Deriv Accounts Connected!</Title>
          <Text>Your trading accounts have been successfully processed and saved.</Text>

          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>

              <Alert
                title="Accounts Saved"
                description="All account data has been securely saved and is ready to use in your settings."
                type="success"
                showIcon
              />
              <div>
                <Title level={5}>Account Summary</Title>
                <div style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'transparent',
                  marginTop: 16
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div>
                        <Text strong style={{ fontSize: '16px' }}>{fullAccount?.fullname || 'Loading...'}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary" style={{ fontSize: '14px' }}>{fullAccount?.email || 'Loading...'}</Text>
                        </div>
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '16px' }}>{getCountryFlag(fullAccount?.country)}</span>
                          <Text type="secondary" style={{ fontSize: '13px' }}>{getCountryName(fullAccount?.country)}</Text>
                        </div>
                      </div>
                    </div>
                    
                    <Divider style={{ margin: '8px 0' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Account ID</Text>
                        <div style={{ marginTop: 2 }}>
                          <Text strong>{fullAccount?.loginId || 'Loading...'}</Text>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Currency</Text>
                        <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                          {getCurrencyIcon(fullAccount?.currency)}
                          <Text strong>{fullAccount?.currency || 'Loading...'}</Text>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Created Date</Text>
                        <div style={{ marginTop: 2 }}>
                          <Text strong>{fullAccount?.createdAt ? new Date(fullAccount.createdAt * 1000).toLocaleDateString() : 'Loading...'}</Text>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Real Accounts</Text>
                        <div style={{ marginTop: 2 }}>
                          <Text strong>{realAccounts.length}</Text>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Demo Accounts</Text>
                        <div style={{ marginTop: 2 }}>
                          <Text strong>{demoAccounts.length}</Text>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Total Currencies</Text>
                        <div style={{ marginTop: 2 }}>
                          <Text strong>{currencies.length}</Text>
                        </div>
                      </div>
                    </div>
                    
                    <Divider style={{ margin: '8px 0' }} />
                    
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Scopes</Text>
                      <Space wrap size="small">
                        {fullAccount?.scopes?.map((scope: string) => (
                          <Badge key={scope} color={getScopeColor(scope)} text={scope} />
                        )) || <Text type="secondary">Loading scopes...</Text>}
                      </Space>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Title level={5}>Account List</Title>
                <div style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backgroundColor: 'transparent',
                  marginTop: 16
                }}>
                  <div style={{}}>
                    {enhancedAccounts.map((account) => (
                      <div key={account.id}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {getCurrencyIcon(account.currency)}
                            <Text strong>{account.id}</Text>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text> {account.currency}</Text>
                          </div>
                        </div>
                        <Divider style={{ margin: '8px 0 8px 0' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </Space>
          </div>

          <Space orientation="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>
            <Button
              type="primary"
              onClick={handleGoToSettings}
              size="large"
              block
              icon={<LinkOutlined />}
              style={{ backgroundColor: '#dc4446', borderColor: '#dc4446' }}
            >
              Go to Settings
            </Button>

            <Button
              type="default"
              onClick={handleGoToHome}
              size="large"
              block
            >
              Go to Home
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #dc4446 0%, #ff6b6b 100%)'
    }}>
      <Card style={{ width: 400, textAlign: 'center' }}>
        <WalletOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
        <Title level={3}>Connection Failed</Title>

        {error && (
          <Alert
            message="Deriv Callback Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16, textAlign: 'left' }}
          />
        )}

        <Paragraph type="secondary">
          Please ensure you're accessing this page from a valid Deriv OAuth callback with the correct account parameters.
        </Paragraph>

        <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 16 }}>
          <Button
            type="primary"
            onClick={handleGoToSettings}
            size="large"
            block
          >
            Back to Settings
          </Button>
        </Space>
      </Card>
    </div>
  );
}
