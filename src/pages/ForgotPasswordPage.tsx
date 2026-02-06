import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Alert, 
  Button, 
  Space, 
  Form, 
  Input, 
  Spin
} from 'antd';
import { 
  MailOutlined, 
  LockOutlined, 
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { authAPI, ForgotPasswordData } from '../services/api';
import logoSvg from '../assets/logo.png';
import '../styles/login.scss';

const { Title } = Typography;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasCapital: false,
    hasLowercase: false,
    hasDigit: false,
    hasSymbol: false,
    minLength: false
  });

  // Password validation function
  const validatePassword = (password: string) => {
    const validation = {
      hasCapital: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasDigit: /\d/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      minLength: password.length >= 8
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  // Check for token in URL on component mount
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setValidatingToken(true);
      // Basic token validation - you might want to decode and validate the JWT here
      try {
        // Simple check if token looks like a JWT
        const parts = urlToken.split('.');
        if (parts.length === 3) {
          setToken(urlToken);
        } else {
          setError('Invalid reset token. Please request a new password reset.');
        }
      } catch (err) {
        setError('Invalid reset token. Please request a new password reset.');
      } finally {
        setValidatingToken(false);
      }
    }
  }, [searchParams]);

  const handleResetPassword = async (values: { password: string; confirmPassword: string }) => {
    setLoading(true);
    setError(null);

    try {
      if (!token) {
        setError('No reset token provided. Please request a new password reset.');
        return;
      }

      // Validate password
      if (!validatePassword(values.password)) {
        setError('Password does not meet all requirements.');
        return;
      }

      // Call reset password API with token
      await authAPI.resetPasswordWithNew(values.password, token);
      
      setResetSuccess(true);
      setToken(null); // Clear token after successful reset
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (values: { email: string }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate email
      if (!values.email) {
        setError("Please enter your email address");
        return;
      }

      // Prepare forgot password data
      const forgotPasswordData: ForgotPasswordData = {
        email: values.email
      };

      // Call forgot password API
      const response = await authAPI.forgotPassword(forgotPasswordData);
      
      if (response.success) {
        // Forgot password successful - show success message
        console.log('Password reset token sent:', response.data);
        setSuccess(true);
        setEmail("");
      } else {
        setError(response.message || 'Failed to send reset token. Please try again.');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      // Handle different error scenarios
      if (error.response) {
        // Server responded with error status
        const errorMessage = error.response.data?.message || 'Failed to send reset token. Please try again.';
        setError(errorMessage);
      } else if (error.request) {
        // Network error
        setError('Network error. Please check your connection and try again.');
      } else {
        // Other error
        setError('Failed to send reset token. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validatePassword(e.target.value);
  };

  // Show loading spinner while validating token
  if (validatingToken) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-logo">
            <img style={{height: 48}} src={logoSvg} alt="Koppo Logo" />
          </div>
          
          <Card className="forgot-password-card">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
              <Title level={4} style={{ marginTop: 20, marginBottom: 0 }}>
                Validating reset token...
              </Title>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show password reset form if token is present
  if (token && !resetSuccess) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-logo">
            <img style={{height: 48}} src={logoSvg} alt="Koppo Logo" />
          </div>
          
          <Card className="forgot-password-card">
            <Title level={3} className="forgot-password-title">
              🔐 Reset Your Password
            </Title>
            
            <Alert
              message="Create New Password"
              description="Please enter your new password below. Make sure it meets all the security requirements."
              type="info"
              showIcon
              style={{ marginBottom: 20, textAlign: 'left' }}
            />
            
            {error && (
              <Alert
                message="Reset Error"
                description={error}
                type="error"
                showIcon
                className="forgot-password-error"
                style={{ marginBottom: 20 }}
              />
            )}
            
            <Form
              layout="vertical"
              onFinish={handleResetPassword}
              className="forgot-password-form"
              size="large"
            >
              <Form.Item
                name="password"
                label="New Password"
                rules={[
                  { required: true, message: "Please enter your new password" },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.reject(new Error('Please enter your new password'));
                      if (!validatePassword(value)) {
                        return Promise.reject(new Error('Password must meet all requirements'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your new password"
                  onChange={handlePasswordChange}
                  size="large"
                  autoFocus
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['password']}
                rules={[
                  { required: true, message: "Please confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirm your new password"
                  size="large"
                />
              </Form.Item>

              {/* Password Requirements */}
              <div style={{ marginBottom: 20, padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                <Typography.Text strong>Password Requirements:</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    {passwordValidation.hasCapital ? 
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> : 
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    }
                    <Typography.Text>At least one capital letter</Typography.Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    {passwordValidation.hasLowercase ? 
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> : 
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    }
                    <Typography.Text>At least one lowercase letter</Typography.Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    {passwordValidation.hasDigit ? 
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> : 
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    }
                    <Typography.Text>At least one digit</Typography.Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    {passwordValidation.hasSymbol ? 
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> : 
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    }
                    <Typography.Text>At least one symbol</Typography.Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {passwordValidation.minLength ? 
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> : 
                      <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    }
                    <Typography.Text>At least 8 characters long</Typography.Text>
                  </div>
                </div>
              </div>

              <Form.Item>
                <Space orientation="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="forgot-password-button"
                    block
                    size="large"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                  
                  <Button
                    type="link"
                    onClick={handleBackToLogin}
                    icon={<ArrowLeftOutlined />}
                    style={{ padding: 0, height: 'auto', marginTop: 32 }}
                    size="large"
                  >
                    Back to login
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    );
  }

  // Show success message after password reset
  if (resetSuccess) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-logo">
            <img style={{height: 48}} src={logoSvg} alt="Koppo Logo" />
          </div>
          
          <Card className="forgot-password-card">
            <Alert
              message="Password Reset Successful"
              description="Your password has been successfully reset. You can now log in with your new password."
              type="success"
              showIcon
              className="forgot-password-success"
              style={{ marginBottom: 20 }}
            />
            
            <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
              <Button
                type="primary"
                onClick={handleBackToLogin}
                block
                size="large"
              >
                Go to Login
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  // Default forgot password form (no token present)

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img style={{height: 48}} src={logoSvg} alt="Koppo Logo" />
        </div>
        
        <Card className="forgot-password-card">
          <Title level={3} className="forgot-password-title">
            🔐 Reset Password
          </Title>
          
          {success ? (
            <Alert
              message="Reset Token Sent"
              description="A password reset token has been sent to your email address. Please check your inbox and follow the instructions to reset your password."
              type="success"
              showIcon
              className="forgot-password-success"
              style={{ marginBottom: 20 }}
            />
          ) : (
            <>
              <Alert
                message="Reset Your Password"
                description="Enter your email address below and we'll send you a password reset token."
                type="info"
                showIcon
                style={{ marginBottom: 20, textAlign: 'left' }}
              />
              
              {error && (
                <Alert
                  message="Reset Error"
                  description={error}
                  type="error"
                  showIcon
                  className="forgot-password-error"
                  style={{ marginBottom: 20 }}
                />
              )}
              
              <Form
                layout="vertical"
                onFinish={handleForgotPassword}
                className="forgot-password-form"
                size="large"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: "Please enter your email address" },
                    { type: 'email', message: 'Please enter a valid email address' }
                  ]}
                  initialValue={email}
                >
                  <Input
                    prefix={<MailOutlined />}
                    placeholder="Enter your email address"
                    onChange={handleEmailChange}
                    size="large"
                    autoFocus
                  />
                </Form.Item>

                <Form.Item>
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="forgot-password-button"
                      block
                      size="large"
                    >
                      {loading ? "Sending..." : "Send Reset Token"}
                    </Button>
                    
                    <Button
                      type="link"
                      onClick={handleBackToLogin}
                      icon={<ArrowLeftOutlined />}
                      style={{ padding: 0, height: 'auto', marginTop: 32 }}
                      size="large"
                    >
                      Back to login
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </>
          )}
          
          {success && (
            <Space direction="vertical" style={{ width: '100%', marginTop: 20 }}>
              <Button
                type="default"
                onClick={handleBackToLogin}
                block
                size="large"
                style={{ marginTop: 32 }}
              >
                Back to Login
              </Button>
              
              <Button
                type="primary"
                onClick={() => {
                  setSuccess(false);
                  setError(null);
                }}
                block
                size="large"
              >
                Send Another Reset Token
              </Button>
            </Space>
          )}
        </Card>
      </div>
    </div>
  );
}
