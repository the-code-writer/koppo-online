import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Alert, Button, Space } from 'antd';
import { MailOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

/**
 * Email verification page that handles token verification from email links
 */
export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Verification token is missing. Please check the verification link in your email.');
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.verifyEmail(token);
        
        if (response.success) {
          setSuccess(true);
          
          // Check if there's pending verification data
          const pendingVerification = localStorage.getItem('pendingVerification');
          if (pendingVerification) {
            const { user, tokens } = JSON.parse(pendingVerification);
            setAuthData(response.user || user, tokens);
            localStorage.removeItem('pendingVerification');
          }
        } else {
          setError(response.message || 'Email verification failed. Please try again.');
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        setError(error.response?.data?.message || 'Email verification failed. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate, setAuthData]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <LoadingOutlined style={{ fontSize: 48, color: '#aa58e3', marginBottom: 16 }} />
          <Title level={3}>Verifying Your Email...</Title>
          <Text>Please wait while we verify your email address.</Text>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <Title level={3}>Email Verified!</Title>
          <Text>Your email address has been successfully verified.</Text>
          
          <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 24 }}>
            <Button
              type="primary"
              onClick={handleGoToHome}
              size="large"
              block
            >
              Go to Home
            </Button>
            
            <Button
              type="default"
              onClick={handleGoToLogin}
              size="large"
              block
            >
              Back to Login
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, textAlign: 'center' }}>
        <MailOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
        <Title level={3}>Verification Failed</Title>
        
        {error && (
          <Alert
            message="Verification Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16, textAlign: 'left' }}
          />
        )}
        
        <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 16 }}>
          <Button
            type="primary"
            onClick={handleGoToLogin}
            size="large"
            block
          >
            Back to Login
          </Button>
        </Space>
      </Card>
    </div>
  );
}
