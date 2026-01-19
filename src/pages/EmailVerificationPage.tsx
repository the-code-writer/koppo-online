import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Alert, Button, Space, message } from 'antd';
import { MailOutlined, CheckCircleOutlined, LoadingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useAuthCookies } from '../utils/use-cookies';
import logoSvg from '../assets/logo.png';
import '../styles/login.scss';

const { Title, Text } = Typography;

/**
 * Email verification page that handles token verification from email links
 */
export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData, refreshProfile } = useAuth();
  
  // Use secure cookies for pending verification data
  const [pendingVerificationCookie, setPendingVerificationCookie] = useAuthCookies('pendingVerification', {
    defaultValue: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [showTokenVerification, setShowTokenVerification] = useState(!!searchParams.get('token'));

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
          
          // Check if there's pending verification data in secure cookies
          const pendingVerification = pendingVerificationCookie;
          if (pendingVerification) {
            const { user, tokens } = pendingVerification;
            setAuthData(response.user || user, tokens);
            setPendingVerificationCookie(null);
          }
          
          // Refresh profile data to get updated email verification status
          await refreshProfile();
          
          // Redirect to onboarding after successful email verification
          setTimeout(() => {
            navigate('/onboarding');
          }, 3000);
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
  }, [searchParams, navigate, setAuthData, refreshProfile]);

  const handleSendVerificationEmail = async () => {
    setVerificationLoading(true);
    setVerificationError(null);
    setVerificationSuccess(false);

    try {
      const response = await authAPI.sendVerificationEmail();
      
      if (response.success) {
        // Add 3-second delay for better UX during transition
        await new Promise(resolve => setTimeout(resolve, 3000));
        setVerificationSuccess(true);
      } else {
        setVerificationError(response.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      console.error('Send verification email error:', error);
      setVerificationError(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleProceedWithoutVerification = () => {
    // Get pending verification data from secure cookies
    const pendingVerification = pendingVerificationCookie;
    if (pendingVerification) {
      try {
        const { user, tokens } = pendingVerification;
        // Set auth data and proceed to app
        setAuthData(user, tokens);
        // Clear pending verification data
        setPendingVerificationCookie(null);
      } catch (error) {
        console.error('Error parsing pending verification data:', error);
        setPendingVerificationCookie(null);
      }
    }
    // Navigate to home page
    navigate("/onboarding");
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  // If no token in URL, show verification request UI
  if (!showTokenVerification) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-logo">
            <img style={{height: 48}} src={logoSvg} alt="Koppo Logo" />
          </div>
          
          <Card className="email-verification-card">
            <Title level={3} className="email-verification-title">
              📧 Email Verification Required
            </Title>
            
            {!verificationSuccess && (
              <Alert
                message="Verify Your Email"
                description="Please verify your email address to continue. We've sent a verification email to your registered email address."
                type="info"
                showIcon
                style={{ marginBottom: 20, textAlign: 'left' }}
              />
            )}
            
            {verificationSuccess && (
              <Alert
                message="Verification Email Sent"
                description="A new verification email has been sent to your email address. Please check your inbox and click the verification link."
                type="success"
                showIcon
                className="email-verification-success"
              />
            )}
            
            {verificationError && (
              <Alert
                message="Send Error"
                description={verificationError}
                type="error"
                showIcon
                className="email-verification-error"
              />
            )}
            
            <Space orientation="vertical" size="large" style={{ width: '100%', marginTop: 20 }}>
              <Button
                type="primary"
                onClick={handleSendVerificationEmail}
                loading={verificationLoading}
                className="send-verification-button"
                block
                size="large"
              >
                {verificationLoading ? "Sending..." : (verificationSuccess ? "Resend Verification Email" : "Send Verification Email")}
              </Button>
              
              <Button
                type="default"
                onClick={handleProceedWithoutVerification}
                className="proceed-button"
                block
                size="large"
              >
                Proceed to App
              </Button>
              
              <Button
                type="text"
                onClick={handleBackToLogin}
                className="back-to-login-button"
                block
                size="large"
                style={{ marginTop: 32 }}
              >
                Back to Login
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading for token verification
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
          <Title level={3}>Email Successfully Verified!</Title>
          <Text>Your email address has been successfully verified. You can now proceed to the app.</Text>
          
          <Alert
            message="Verification Complete"
            description="Your email verification is complete and your account is now fully activated."
            type="success"
            showIcon
            style={{ marginTop: 16, marginBottom: 24, textAlign: 'left' }}
          />
          
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Button
              type="primary"
              onClick={handleProceedWithoutVerification}
              size="large"
              block
            >
              Proceed to App
            </Button>
            
            <Button
              type="default"
              onClick={handleBackToLogin}
              size="large"
              block
              style={{ marginTop: 32 }}
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
            onClick={handleBackToLogin}
            size="large"
            block
            style={{ marginTop: 32 }}
          >
            Back to Login
          </Button>
        </Space>
      </Card>
    </div>
  );
}
