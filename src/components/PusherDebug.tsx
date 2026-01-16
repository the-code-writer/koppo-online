import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, Alert, Divider } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import * as PusherPushNotifications from '@pusher/push-notifications-web';

const { Title, Text, Paragraph } = Typography;

interface PusherStatus {
  isInitialized: boolean;
  deviceId?: string;
  interests: string[];
  error?: string;
  lastUpdate: Date;
}

export const PusherDebug: React.FC = () => {
  const [status, setStatus] = useState<PusherStatus>({
    isInitialized: false,
    interests: [],
    lastUpdate: new Date()
  });

  const [isLoading, setIsLoading] = useState(false);

  const testPusherBeams = async () => {
    setIsLoading(true);
    try {
      console.log('Pusher Beams Test: PusherPushNotifications available:', !!PusherPushNotifications);
      console.log('Pusher Beams Test: PusherPushNotifications.Client:', !!PusherPushNotifications.Client);
      
      const beamsClient = new PusherPushNotifications.Client({
        instanceId: import.meta.env.VITE_PUSHER_INSTANCE_ID || '806a24f8-2cd2-4711-9a8c-2de7e2588fd5',
      });

      await beamsClient.start();
      
      const deviceId = await beamsClient.getDeviceId();
      
      // Add test interest
      await beamsClient.addDeviceInterest('debug-hello');
      const updatedInterests = await beamsClient.getDeviceInterests();
      
      setStatus({
        isInitialized: true,
        deviceId,
        interests: updatedInterests,
        lastUpdate: new Date()
      });
      
      console.log('Pusher Beams Test - Success:', { deviceId, interests: updatedInterests });
    } catch (error) {
      console.error('Pusher Beams Test - Error:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdate: new Date()
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const clearInterests = async () => {
    try {
      console.log('Pusher Beams Clear: PusherPushNotifications available:', !!PusherPushNotifications);
      
      const beamsClient = new PusherPushNotifications.Client({
        instanceId: import.meta.env.VITE_PUSHER_INSTANCE_ID || '806a24f8-2cd2-4711-9a8c-2de7e2588fd5',
      });

      await beamsClient.start();
      
      // Clear all interests
      await beamsClient.clearDeviceInterests();
      
      // Re-add debug interest
      await beamsClient.addDeviceInterest('debug-hello');
      
      const interests = await beamsClient.getDeviceInterests();
      
      setStatus(prev => ({
        ...prev,
        interests,
        lastUpdate: new Date()
      }));
      
      console.log('Pusher Beams - Interests cleared and reset');
    } catch (error) {
      console.error('Pusher Beams - Clear interests error:', error);
    }
  };

  useEffect(() => {
    // Auto-test on mount
    testPusherBeams();
  }, []);

  return (
    <Card title="Pusher Beams Debug" style={{ maxWidth: 600, margin: '20px auto' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        
        {/* Status */}
        <div>
          <Title level={5}>Status</Title>
          <Space>
            {status.isInitialized ? (
              <>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text strong>Initialized</Text>
              </>
            ) : (
              <>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                <Text>Not Initialized</Text>
              </>
            )}
            <Text type="secondary">
              Last updated: {status.lastUpdate.toLocaleTimeString()}
            </Text>
          </Space>
        </div>

        {/* Error Display */}
        {status.error && (
          <Alert
            message="Error"
            description={status.error}
            type="error"
            showIcon
            closable
          />
        )}

        {/* Device Info */}
        {status.deviceId && (
          <div>
            <Title level={5}>Device Information</Title>
            <Paragraph>
              <Text strong>Device ID: </Text>
              <Text code>{status.deviceId}</Text>
            </Paragraph>
          </div>
        )}

        {/* Interests */}
        <div>
          <Title level={5}>Current Interests</Title>
          <Space wrap>
            {status.interests.length > 0 ? (
              status.interests.map((interest, index) => (
                <Text key={index} code>{interest}</Text>
              ))
            ) : (
              <Text type="secondary">No interests registered</Text>
            )}
          </Space>
        </div>

        <Divider />

        {/* Actions */}
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={isLoading}
            onClick={testPusherBeams}
          >
            Test Connection
          </Button>
          <Button
            onClick={clearInterests}
            disabled={!status.isInitialized}
          >
            Clear & Reset Interests
          </Button>
        </Space>

        {/* Instructions */}
        <Alert
          message="Testing Instructions"
          description={
            <div>
              <p>1. Click "Test Connection" to initialize Pusher Beams</p>
              <p>2. Check the browser console for detailed logs</p>
              <p>3. Use the Device ID to send test notifications from Pusher dashboard</p>
              <p>4. Make sure your environment variables are set correctly</p>
            </div>
          }
          type="info"
          showIcon
        />

      </Space>
    </Card>
  );
};

export default PusherDebug;
