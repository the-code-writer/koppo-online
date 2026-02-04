import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Alert, Button, Space, message } from 'antd';
import { MailOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { authAPI } from '../services/api';
import { useOAuth } from '../contexts/OAuthContext';
import logoSvg from '../assets/logo.png';
import '../styles/login.scss';

const { Title, Text } = Typography;

/**
 * Email verification page that handles token verification from email links
 */
export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useOAuth();
  
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
          message.success('Email verified.');

          // Refresh profile data to get updated email verification status
          await refreshProfile();
          
          // Redirect to device-registration after successful email verification
          setTimeout(() => {
            navigate('/device-registration');
          }, 3000);
        } else {
          setError(response.message || 'Email verification failed. Please try again.');
          message.error('Email verification failed.');
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        setError(error.response?.data?.message || 'Email verification failed. The link may have expired.');
        message.error('Email verification failed.');
      } finally {
        setLoading(false);
      }
    };
    verifyEmail();
  }, [searchParams, navigate, refreshProfile]);

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
        message.success('Email sent.');
      } else {
        setVerificationError(response.message || 'Failed to send verification email');
        message.error('Email sending failed.');
      }
    } catch (error: any) {
      console.error('Send verification email error:', error);
      setVerificationError(error.response?.data?.message || 'Failed to send verification email');
      message.error('Email sending failed.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleProceedWithoutVerification = async () => {
    // Get pending verification data from secure cookies
    await refreshProfile();
    // Navigate to home page
    navigate("/home");
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
              📧 Email Verification
            </Title>
            
            {(!verificationSuccess && !verificationError) && (
              <Alert
                title={<><small>🔵</small> <strong>Verify Your Email</strong></>}
                description="Please verify your email address to continue. Click the button below to get the email verification link."
                type="info" style={{borderRadius: 12, textAlign: "left"}}
              />
            )}
            
            {verificationSuccess && (
              <Alert
                title={<><small>🟢</small> <strong>Verification Email Sent</strong></>}
                description="A new verification email has been sent to your email address. Please check your inbox and click the verification link."
                type="success" style={{borderRadius: 12, textAlign: "left"}}
              />
            )}
            
            {verificationError && (
              <Alert
                title={<><small>🔴</small> <strong>Verification Error</strong></>}
                description={verificationError}
                type="error" style={{borderRadius: 12, textAlign: "left"}}
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
                type="default"
                onClick={handleBackToLogin}
                className="back-to-login-button"
                block
                size="large"
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
          <LoadingOutlined style={{ fontSize: 48, color: '#3b82f6', marginBottom: 16 }} />
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
                title={<><small>🟢</small> <strong>Verification Complete</strong></>}
                description="Your email verification is complete and your account is now fully activated."
                type="success" style={{borderRadius: 12, textAlign: "left"}}
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
                title={<><small>🔴</small> <strong>Verification Error</strong></>}
                description={error}
                type="error" style={{borderRadius: 12, textAlign: "left"}}
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
