import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Alert, Button, Space, Divider, Badge, Progress } from 'antd';
import { WalletOutlined, CheckCircleOutlined, LoadingOutlined, LinkOutlined } from '@ant-design/icons';
import { DerivAuth } from '../utils/DerivAuth';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

/**
 * Deriv callback page that handles account parsing from Deriv OAuth callback
 */
export default function DerivCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [parsedAccounts, setParsedAccounts] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const processDerivCallback = async () => {
      try {
        // Get the current URL which should contain the account parameters
        const currentUrl = window.location.href;
        
        console.log('Processing Deriv callback with URL:', currentUrl);
        
        // Parse the accounts from the URL
        const result = DerivAuth.parseAccountUrl(currentUrl);
        
        if (!result.success) {
          setError(result.error || 'Failed to parse Deriv accounts from URL');
          setLoading(false);
          return;
        }

        const accounts = result.accounts || [];
        setParsedAccounts(accounts);
        
        console.log(`Successfully parsed ${accounts.length} Deriv accounts:`, accounts);
        
        // Save to local storage
        localStorage.setItem('derivAccounts', JSON.stringify({
          accounts: accounts,
          parsedAt: new Date().toISOString(),
          userId: user?.id || 'unknown',
          url: currentUrl
        }));

        // Simulate processing progress
        for (let i = 0; i <= 100; i += 10) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setSuccess(true);
        
      } catch (error: any) {
        console.error('Deriv callback processing error:', error);
        setError(error.message || 'Failed to process Deriv callback. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    processDerivCallback();
  }, [searchParams, navigate, user]);

  const handleGoToSettings = () => {
    navigate('/settings');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  const getAccountTypeColor = (type: string) => {
    return type === 'real' ? '#52c41a' : '#faad14';
  };

  const getCurrencyIcon = (currency: string) => {
    // Simple currency mapping - you can expand this
    const currencyIcons: { [key: string]: string } = {
      'USD': '$',
      'USDC': '$',
      'BTC': '₿',
      'ETH': 'Ξ',
      'LTC': 'Ł',
      'XRP': 'Ʀ',
      'eUSDT': '₮',
      'tUSDT': '₮'
    };
    return currencyIcons[currency] || currency;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dc4446 0%, #ff6b6b 100%)'
      }}>
        <Card style={{ width: 500, textAlign: 'center' }}>
          <LoadingOutlined style={{ fontSize: 48, color: '#dc4446', marginBottom: 16 }} />
          <Title level={3}>Processing Deriv Accounts...</Title>
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
    const realAccounts = parsedAccounts.filter(acc => acc.accountType === 'real');
    const demoAccounts = parsedAccounts.filter(acc => acc.accountType === 'demo');
    const currencies = [...new Set(parsedAccounts.map(acc => acc.currency))];

    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dc4446 0%, #ff6b6b 100%)'
      }}>
        <Card style={{ width: 600, textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <Title level={3}>Deriv Accounts Connected!</Title>
          <Text>Your trading accounts have been successfully processed and saved.</Text>
          
          <div style={{ marginTop: 24, textAlign: 'left' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={5}>Connection Summary</Title>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Badge count={`${realAccounts.length} Real`} style={{ backgroundColor: '#52c41a' }} />
                  <Badge count={`${demoAccounts.length} Demo`} style={{ backgroundColor: '#faad14' }} />
                  <Badge count={`${currencies.length} Currencies`} style={{ backgroundColor: '#1890ff' }} />
                </div>
              </div>

              <Divider />

              <div>
                <Title level={5}>Connected Accounts ({parsedAccounts.length})</Title>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {parsedAccounts.map((account, index) => (
                    <div 
                      key={account.id}
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'transparent',
                        borderRadius: 4
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <WalletOutlined style={{ color: getAccountTypeColor(account.accountType) }} />
                        <Text strong>{account.id}</Text>
                        <Badge 
                          count={account.accountType} 
                          style={{ 
                            backgroundColor: getAccountTypeColor(account.accountType),
                            fontSize: 10
                          }} 
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text code>{getCurrencyIcon(account.currency)} {account.currency}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {account.token.substring(0, 8)}...
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Alert
                message="Accounts Saved"
                description="All account data has been securely saved to local storage and is ready to use in your settings."
                type="success"
                showIcon
              />
            </Space>
          </div>
          
          <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>
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
