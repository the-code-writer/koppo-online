import { useState, useEffect } from "react";
import { Drawer, Form, Input, Button, Avatar, Upload, Space, Typography, Switch, Tabs, Divider, Card, Badge, Tooltip, Alert, List, Tag } from "antd";
import { UserOutlined, LinkOutlined, GoogleOutlined, MessageOutlined, AlertFilled, WarningTwoTone, WarningFilled } from "@ant-design/icons";
import { User, authAPI } from '../../services/api';
import "./styles.scss";

const { Title, Text } = Typography;

interface ProfileSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function ProfileSettingsDrawer({ visible, onClose, user }: ProfileSettingsDrawerProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [derivLinked, setDerivLinked] = useState(false);
  const [passwordForm] = Form.useForm();
  const [resetLoading, setResetLoading] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [activeTokens, setActiveTokens] = useState([
    {
      id: 'token_1',
      name: 'Web Session - Chrome',
      createdAt: '2024-01-05T10:30:00Z',
      expiresAt: '2024-01-12T10:30:00Z',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      isActive: true,
      lastUsed: '2024-01-06T08:15:00Z'
    },
    {
      id: 'token_2', 
      name: 'Mobile App - iOS',
      createdAt: '2024-01-03T14:20:00Z',
      expiresAt: '2024-01-17T14:20:00Z',
      token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
      isActive: true,
      lastUsed: '2024-01-05T22:45:00Z'
    }
  ]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber
      });
    }
  }, [user, form]);

  const handleProfileImageUpload = (info: any) => {
    if (info.file.status === 'done') {
      // Get the base64 or URL of the uploaded image
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      // TODO: Implement API call to update profile
      console.log('Updating profile:', values);
      // await authAPI.updateProfile(values);
      
      // Show success message
      // You can use antd message here
      console.log('Profile updated successfully');
      
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message
      console.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkTelegram = (checked: boolean) => {
    setTelegramLinked(checked);
    // TODO: Implement Telegram OAuth flow
    console.log('Linking Telegram account:', checked);
  };

  const handleLinkGoogle = (checked: boolean) => {
    setGoogleLinked(checked);
    // TODO: Implement Google OAuth flow
    console.log('Linking Google account:', checked);
  };

  const handleLinkDeriv = (checked: boolean) => {
    setDerivLinked(checked);
    // TODO: Implement Deriv OAuth flow
    console.log('Linking Deriv account:', checked);
  };

  const handleSendPasswordReset = async () => {
    setResetLoading(true);
    try {
      // TODO: Implement API call to send password reset link
      console.log('Sending password reset link');
      // Show success message
    } catch (error) {
      console.error('Error sending password reset:', error);
    } finally {
      setResetLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    setChangePasswordLoading(true);
    try {
      // TODO: Implement API call to change password
      console.log('Changing password:', {values, currentPassword: '***', newPassword: '***' });
      passwordForm.resetFields();
      // Show success message
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleRevokeToken = (tokenId: string) => {
    setActiveTokens(prev => prev.filter(token => token.id !== tokenId));
    // TODO: Implement API call to revoke token
    console.log('Revoking token:', tokenId);
  };

  const handleRevokeAllTokens = () => {
    setActiveTokens([]);
    // TODO: Implement API call to revoke all tokens
    console.log('Revoking all tokens');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTokenPreview = (token: string) => {
    if (token.length <= 20) return token;
    return token.substring(0, 10) + '...' + token.substring(token.length - 10);
  };

  const sendEmailVerificationLink = async () => {
    const response = await authAPI.sendVerificationEmail();
    console.log("EMAIL VERIFICATION LINK SENT RESPONSE", response);
  }

  return (
    <Drawer
      title="My Profile Settings"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="profile-settings-drawer"
    >
      <Tabs
        defaultActiveKey="profile"
        items={[
          {
            key: 'profile',
            label: 'User Profile',
            children: (
              <div className="profile-settings-content">
                {/* Profile Picture Section */}
                <div className="profile-picture-section">
                  <div className="profile-picture-upload">
                    <Upload
                      name="avatar"
                      listType="picture-card"
                      className="avatar-uploader"
                      showUploadList={false}
                      beforeUpload={() => false}
                      onChange={handleProfileImageUpload}
                    >
                      {profileImage ? (
                        <Avatar src={profileImage} size={80} />
                      ) : (
                        <Avatar icon={<UserOutlined />} size={80} />
                      )}
                    </Upload>
                    <Title level={4} style={{fontSize: 24, margin: 0}}>{user?.displayName}</Title>
                    <Text style={{fontSize: 16, margin: 0}}><code>Koppo ID: {user?.uuid.split('-')[0].toUpperCase()}</code></Text>
                  </div>
                </div>

                <Divider />

                {/* Profile Information Form */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  className="profile-form"
                >
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[{ required: true, message: 'Please enter your first name' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[{ required: true, message: 'Please enter your last name' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label="Display Name"
                    name="displayName"
                    rules={[{ required: true, message: 'Please enter your display name' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label="Username"
                    name="username"
                    rules={[{ required: true, message: 'Please enter your username' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label={<>Email Address {user?.isEmailActivated ? (<code style={{backgroundColor: "#00be9fff", fontSize: 8, padding: "3px 8px", marginLeft: 12, borderRadius: 8, textTransform: 'uppercase'}}>Verified</code>):(<Button onClick={()=>sendEmailVerificationLink()} size="small" style={{marginLeft: 12}}><WarningFilled color="yellow" /> Send Email verification email</Button>)}</>}
                    name="email"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' }
                    ]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item
                    label={<>Phone Number</>}
                    name="phoneNumber"
                    rules={[{ required: true, message: 'Please enter your phone number' }]}
                  >
                    <Input size="large" />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        Update Profile
                      </Button>
                      <Button onClick={onClose}>
                        Cancel
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </div>
            ),
          },
          {
            key: 'linked',
            label: 'Accounts',
            children: (
              <div className="tokens-content">
                <div className="tokens-grid">
                  {/* Telegram Account Card */}
                  <Card
                    className="tokens-card"
                    hoverable
                  >
                    <div className="account-card-header">
                      <div className="account-icon-container">
                        <div className="account-icon telegram-icon">
                          <MessageOutlined />
                        </div>
                        <div className="account-badge">
                          <Badge status={telegramLinked ? 'success' : 'default'} />
                        </div>
                      </div>
                      <div className="account-status">
                        <Tooltip title={telegramLinked ? 'Disconnect Telegram' : 'Connect Telegram'}>
                          <Switch
                            checked={telegramLinked}
                            onChange={handleLinkTelegram}
                            size="small"
                          />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="account-card-body">
                      <Title level={5} className="account-title">Telegram</Title>
                      <Text className="account-description">
                        Connect your Telegram account to receive notifications and manage your trading bots through chat
                      </Text>
                      
                      {telegramLinked && (
                        <div className="account-details">
                          <Divider className="details-divider" />
                          <div className="token-info">
                            <Text strong>Username:</Text>
                            <Text>@your_telegram_user</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Connected:</Text>
                            <Text>2 days ago</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Features:</Text>
                            <div className="feature-tags">
                              <Badge count="Notifications" style={{ backgroundColor: '#0088cc' }} />
                              <Badge count="Bot Control" style={{ backgroundColor: '#52c41a' }} />
                              <Badge count="Alerts" style={{ backgroundColor: '#fa8c16' }} />
                            </div>
                          </div>
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
                        <div className="account-icon google-icon">
                          <GoogleOutlined />
                        </div>
                        <div className="account-badge">
                          <Badge status={googleLinked ? 'success' : 'default'} />
                        </div>
                      </div>
                      <div className="account-status">
                        <Tooltip title={googleLinked ? 'Disconnect Google' : 'Connect Google'}>
                          <Switch
                            checked={googleLinked}
                            onChange={handleLinkGoogle}
                            size="small"
                          />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="account-card-body">
                      <Title level={5} className="account-title">Google</Title>
                      <Text className="account-description">
                        Link your Google account for seamless authentication and data synchronization across devices
                      </Text>
                      
                      {googleLinked && (
                        <div className="account-details">
                          <Divider className="details-divider" />
                          <div className="token-info">
                            <Text strong>Email:</Text>
                            <Text>user@gmail.com</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Connected:</Text>
                            <Text>1 week ago</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Features:</Text>
                            <div className="feature-tags">
                              <Badge count="SSO Login" style={{ backgroundColor: '#4285f4' }} />
                              <Badge count="Cloud Sync" style={{ backgroundColor: '#34a853' }} />
                              <Badge count="Calendar" style={{ backgroundColor: '#ea4335' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Deriv Account Card */}
                  <Card
                    className="tokens-card"
                    hoverable
                  >
                    <div className="account-card-header">
                      <div className="account-icon-container">
                        <div className="account-icon deriv-icon">
                          <LinkOutlined />
                        </div>
                        <div className="account-badge">
                          <Badge status={derivLinked ? 'success' : 'default'} />
                        </div>
                      </div>
                      <div className="account-status">
                        <Tooltip title={derivLinked ? 'Disconnect Deriv' : 'Connect Deriv'}>
                          <Switch
                            checked={derivLinked}
                            onChange={handleLinkDeriv}
                            size="small"
                          />
                        </Tooltip>
                      </div>
                    </div>
                    
                    <div className="account-card-body">
                      <Title level={5} className="account-title">Deriv</Title>
                      <Text className="account-description">
                        Connect your Deriv trading account to execute trades and access real-time market data
                      </Text>
                      
                      {derivLinked && (
                        <div className="account-details">
                          <Divider className="details-divider" />
                          <div className="token-info">
                            <Text strong>Account ID:</Text>
                            <Text>DRV1234567</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Account Type:</Text>
                            <Text>Real Money</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Connected:</Text>
                            <Text>3 hours ago</Text>
                          </div>
                          <div className="token-info">
                            <Text strong>Features:</Text>
                            <div className="feature-tags">
                              <Badge count="Live Trading" style={{ backgroundColor: '#ff4d4f' }} />
                              <Badge count="API Access" style={{ backgroundColor: '#722ed1' }} />
                              <Badge count="Analytics" style={{ backgroundColor: '#13c2c2' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            key: 'security',
            label: 'Security',
            children: (
              <div className="security-content">
                {/* Password Reset Section */}
                <Card className="security-card" title="Password Reset" size="small">
                  <div className="password-reset-section">
                    <Alert
                      message="Password Reset"
                      description="Send a password reset link to your email address to reset your password."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Button 
                      type="primary" 
                      onClick={handleSendPasswordReset}
                      loading={resetLoading}
                      block
                    >
                      Send Password Reset Link
                    </Button>
                  </div>
                </Card>

                {/* Change Password Section */}
                <Card className="security-card" title="Change Password" size="small">
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    className="password-form"
                  >
                    <Form.Item
                      label="Current Password"
                      name="currentPassword"
                      rules={[
                        { required: true, message: 'Please enter your current password' },
                        { min: 8, message: 'Password must be at least 8 characters' }
                      ]}
                    >
                      <Input.Password placeholder="Enter current password" />
                    </Form.Item>

                    <Form.Item
                      label="New Password"
                      name="newPassword"
                      rules={[
                        { required: true, message: 'Please enter your new password' },
                        { min: 8, message: 'Password must be at least 8 characters' },
                        { 
                          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Password must contain uppercase, lowercase, and number'
                        }
                      ]}
                    >
                      <Input.Password placeholder="Enter new password" />
                    </Form.Item>

                    <Form.Item
                      label="Confirm New Password"
                      name="confirmPassword"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: 'Please confirm your new password' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Passwords do not match'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password placeholder="Confirm new password" />
                    </Form.Item>

                    <Form.Item>
                      <Space>
                        <Button 
                          type="primary" 
                          htmlType="submit" 
                          loading={changePasswordLoading}
                        >
                          Change Password
                        </Button>
                        <Button onClick={() => passwordForm.resetFields()}>
                          Clear
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            ),
          },
          {
            key: 'tokens',
            label: 'Tokens',
            children: (
              <div className="tokens-content">
                <Card 
                  className="tokens-card" 
                  title="Active Sessions & Tokens" 
                  extra={
                    <Button 
                      danger 
                      size="small" 
                      onClick={handleRevokeAllTokens}
                      disabled={activeTokens.length === 0}
                    >
                      Revoke All
                    </Button>
                  }
                >
                  <div className="token-management">
                    {activeTokens.length === 0 ? (
                      <Alert
                        message="No Active Sessions"
                        description="You have no active sessions or tokens."
                        type="info"
                        showIcon
                      />
                    ) : (
                      <List
                        dataSource={activeTokens}
                        renderItem={(token) => (
                          <List.Item
                            actions={[
                              <Button
                                key="revoke"
                                danger
                                size="small"
                                onClick={() => handleRevokeToken(token.id)}
                              >
                                Revoke
                              </Button>
                            ]}
                          >
                            <List.Item.Meta
                              title={
                                <Space>
                                  <span>{token.name}</span>
                                  <Tag color={token.isActive ? 'green' : 'red'}>
                                    {token.isActive ? 'Active' : 'Inactive'}
                                  </Tag>
                                </Space>
                              }
                              description={
                                <div className="token-details">
                                  <div className="token-info">
                                    <Text strong>Token: </Text>
                                    <Text code>{getTokenPreview(token.token)}</Text>
                                  </div>
                                  <div className="token-info">
                                    <Text strong>Created: </Text>
                                    <Text>{formatDate(token.createdAt)}</Text>
                                  </div>
                                  <div className="token-info">
                                    <Text strong>Expires: </Text>
                                    <Text>{formatDate(token.expiresAt)}</Text>
                                  </div>
                                  <div className="token-info">
                                    <Text strong>Last Used: </Text>
                                    <Text>{formatDate(token.lastUsed)}</Text>
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
}
