import React, { useEffect } from 'react';
import { Button, Card, Typography, Space, Alert, Badge } from 'antd';
import { BellOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFirebaseMessaging } from '../hooks/useFirebaseMessaging';

const { Title, Text, Paragraph } = Typography;

export const FirebaseMessaging: React.FC = () => {
  const {
    token,
    permission,
    isLoading,
    error,
    requestPermission,
    getFirebaseToken,
    deleteCurrentToken,
    checkPermissionStatus,
  } = useFirebaseMessaging();

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const handleGetToken = async () => {
    await getFirebaseToken();
  };

  const handleDeleteToken = async () => {
    await deleteCurrentToken();
  };

  const handleCheckPermission = () => {
    checkPermissionStatus();
  };

  useEffect(()=>{
if (token) {
        // ✅ Token is valid and generated successfully
        console.log('FCM Token retrieved successfully:', token);
      } else {
        // ❌ Token generation failed
        console.log('No registration token available. Request permission to generate one.');
      }
  },[token])

  return (
    <Card title="Firebase Cloud Messaging" style={{ maxWidth: 600, margin: '20px auto' }}>
      <Space vertical={true} size="middle" style={{ width: '100%' }}>
        
        {/* Permission Status */}
        <div>
          <Title level={5}>Notification Permission</Title>
          <Space vertical={true} >
            <Badge 
              status={permission === 'granted' ? 'success' : permission === 'denied' ? 'error' : 'warning'}
              text={permission.toUpperCase()}
            />
            <Text>Current permission: {permission}</Text>
            <Button 
              size="small" 
              onClick={handleCheckPermission}
              icon={<ReloadOutlined />}
            >
              Check Status
            </Button>
            <Button 
              size="small" 
              onClick={handleGetToken}
              icon={<ReloadOutlined />}
            >
              Get Token
            </Button>
          </Space>
        </div>

        {/* Permission Request */}
        {permission !== 'granted' && (
          <div>
            <Title level={5}>Request Permission</Title>
            <Paragraph>
              Click the button below to enable push notifications for this application.
            </Paragraph>
            <Button 
              type="primary" 
              onClick={handleRequestPermission}
              loading={isLoading}
              icon={<BellOutlined />}
              size="large"
            >
              {isLoading ? 'Requesting...' : 'Enable Notifications'}
            </Button>
          </div>
        )}

        {/* Token Management */}
        {token && (
          <div>
            <Title level={5}>FCM Token</Title>
            <Alert
              message="Push Notification Token"
              description={
                <div>
                  <Text code style={{ fontSize: '10px', wordBreak: 'break-all' }}>
                    {token}
                  </Text>
                  <Paragraph style={{ marginTop: '8px', fontSize: '12px' }}>
                    <Text strong>Important:</Text> Save this token securely and use it to send push notifications 
                    to this specific device.
                  </Paragraph>
                  <div style={{ marginTop: '12px' }}>
                    <Button 
                      size="small" 
                      onClick={() => {
                        console.log('FCM Token:', token);
                        // Copy to clipboard
                        navigator.clipboard.writeText(token).then(() => {
                          console.log('Token copied to clipboard');
                        }).catch(err => {
                          console.error('Failed to copy token:', err);
                        });
                      }}
                    >
                      Copy Token
                    </Button>
                  </div>
                </div>
              }
              type="info"
              showIcon
              action={
                <Space>
                  <Button 
                    size="small" 
                    icon={<ReloadOutlined />}
                    onClick={handleGetToken}
                    loading={isLoading}
                  >
                    Refresh
                  </Button>
                  <Button 
                    size="small" 
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteToken}
                    loading={isLoading}
                  >
                    Delete
                  </Button>
                </Space>
              }
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginTop: '16px' }}
          />
        )}

        {/* Instructions */}
        <div>
          <Title level={5}>Instructions</Title>
          <Alert
            message="How to Use"
            description={
              <div>
                <Paragraph>
                  <Text strong>1. Enable Notifications:</Text> Click "Enable Notifications" to grant permission.
                </Paragraph>
                <Paragraph>
                  <Text strong>2. Get Token:</Text> The FCM token will be generated automatically.
                </Paragraph>
                <Paragraph>
                  <Text strong>3. Send Test:</Text> Use the token with your push notification service.
                </Paragraph>
              </div>
            }
            type="info"
            showIcon
          />
        </div>

      </Space>
    </Card>
  );
};

export default FirebaseMessaging;
