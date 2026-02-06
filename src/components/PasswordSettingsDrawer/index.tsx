import { useState } from "react";
import { Drawer, Form, Input, Button, Typography, Space, message } from "antd";
import { User, authAPI } from '../../services/api';
import { LockOutlined, MailOutlined, SafetyCertificateOutlined, ArrowRightOutlined } from "@ant-design/icons";
import "./styles.scss";

const { Title, Text } = Typography;


interface PasswordSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user?: User | null;
}

export function PasswordSettingsDrawer({ visible, onClose, user }: PasswordSettingsDrawerProps) {
  const [passwordForm] = Form.useForm();
  const [resetLoading, setResetLoading] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const handleSendPasswordReset = async () => {
    if (!user?.email) {
      message.error('User email not found');
      return;
    }

    setResetLoading(true);
    try {
      await authAPI.resetPassword({ email: user.email });
      message.success('Password reset link sent to your email');
    } catch (error: any) {
      message.error(error.message || 'Failed to send reset link');
    } finally {
      setResetLoading(false);
    }
  };

  const handleChangePassword = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    setChangePasswordLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      message.success('Password changed successfully');
      passwordForm.resetFields();
      onClose();
    } catch (error: any) {
      message.error(error.message || 'Failed to change password');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <Drawer
      title={null}
      placement="right"
      onClose={onClose}
      open={visible}
      size={window.innerWidth > 600 ? 500 : "default"}
      className="password-settings-drawer"
      closeIcon={null}
    >
      <div className="drawer-header">
        <Button 
          type="text" 
          icon={<ArrowRightOutlined rotate={180} />} 
          onClick={onClose}
          className="back-button"
        />
        <Title level={4} className="drawer-title">My Passwords</Title>
      </div>

      <div className="drawer-content">
        <div className="drawer-sections">
          {/* Password Reset Section */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <MailOutlined className="section-icon" />
              <h3 className="drawer-section-title">Password Reset</h3>
            </div>
            <div className="drawer-section-content">
              <Space vertical size={18}>
              <Text className="info-text">
                  Lost your password? We'll send a secure link to your email to help you get back into your account.
                </Text>
                <Button 
                  type="primary" 
                  onClick={handleSendPasswordReset}
                  loading={resetLoading}
                  size="large"
                  block
                  icon={<MailOutlined />}
                >
                  Send Reset Link
                </Button></Space>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <LockOutlined className="section-icon" />
              <h3 className="drawer-section-title">Change Password</h3>
            </div>
            <div className="drawer-section-content">
              <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handleChangePassword}
                className="modern-form"
                requiredMark={false}
              >
                <Form.Item
                  label="Current Password"
                  name="currentPassword"
                  rules={[
                    { required: true, message: 'Please enter your current password' },
                    { min: 8, message: 'Password must be at least 8 characters' }
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                    placeholder="Enter current password" 
                    size="large" 
                    className="modern-input"
                  />
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
                  <Input.Password 
                    prefix={<SafetyCertificateOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                    placeholder="Enter new password" 
                    size="large" 
                    className="modern-input"
                  />
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
                  <Input.Password 
                    prefix={<SafetyCertificateOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                    placeholder="Confirm new password" 
                    size="large" 
                    className="modern-input"
                  />
                </Form.Item>

                <div className="action-buttons">
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={changePasswordLoading}
                    size="large"
                  >
                    Update Password
                  </Button>
                  <Button 
                  type="default"
                    onClick={() => passwordForm.resetFields()} 
                    size="large"
                  >
                    Clear Fields
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
