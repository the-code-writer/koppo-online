import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Space,
  Steps,
  Row,
  Col,
  Switch,
  Divider,
  Alert,
  Spin,
  message,
  Tag,
  Modal,
  Flex
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BulbOutlined,
  MoonOutlined,
  LockOutlined,
  EyeOutlined,
  HomeOutlined,
  SecurityScanOutlined,
  MobileOutlined,
  DesktopOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { collectDeviceInfo } from '../utils/deviceHash';
import { useServerKeys, rsaEncryptWithPem } from '../utils/deviceKeys';
import { deviceEncryption } from '../utils/deviceKeys';
import { authAPI } from '../services/api';
import logoSvg from '../assets/logo.png';
import '../styles/login.scss';
import '../styles/device-registration.scss';
import { QrcodeOutlined } from '@ant-design/icons';
import { useFirebaseMessaging } from '../hooks/useFirebaseMessaging';
import Confetti from 'react-confetti-boom';
import { CookieUtils } from '../utils/use-cookies';
import * as PusherPushNotifications from "@pusher/push-notifications-web";
import { envConfig } from '../config/env.config';
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface DeviceRegistrationData {
  theme: string;
  sessionId: string;
  pusherDeviceId: string;
  serverPublicKey: string;
  devicePublicKey: string;
  deviceId: string;
  deviceHash: string;
  deviceData: any;
  notificationsEnabled: boolean;
  mfa: string;
}

export default function DeviceRegistrationPage() {
  const navigate = useNavigate();
  useAuth();
  const { storeServerKeys } = useServerKeys();
  const {
    token,
    requestPermission,
    getFirebaseToken,
  } = useFirebaseMessaging();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const [deviceId, setDeviceId] = useState("xxxx-xxxx-xxxx-xxxx");
  const [deviceHash, setDeviceHash] = useState("0x00000 ... 00000");
  const [deviceInfo, setDeviceInfo] = useState<any>({ device: { vendor: '', type: '', model: '' } });
  const [deviceRegistrationData, setDeviceRegistrationData] = useState<DeviceRegistrationData>({
    sessionId: '',
    pusherDeviceId: '',
    serverPublicKey: '',
    devicePublicKey: '',
    deviceId: '',
    deviceHash: '',
    deviceData: { device: { userAgent: '', vendor: '', type: '', model: '' } },
    notificationsEnabled: false,
    mfa: '',
    theme: 'dark'
  });
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const fingerprintDevice = useCallback(async () => {

    setLoading(true);
    setDeviceRegistered(false);
    const fullDeviceInfo = collectDeviceInfo();
    setDeviceInfo(fullDeviceInfo);
    const devicePrivateKeyEnc: string = CookieUtils.getCookie('devicePrivateKey')?.toString() || "";
    const devicePrivateKey: string = atob(devicePrivateKeyEnc);
    const devicePublicKeyEnc: string = CookieUtils.getCookie('devicePublicKey')?.toString() || "";
    const devicePublicKey: string = atob(devicePublicKeyEnc);
    console.info({ devicePrivateKey, devicePrivateKeyEnc, devicePublicKeyEnc, devicePublicKey });

    try {

      setDeviceRegistrationData(prev => ({ ...prev, devicePublicKey: devicePublicKey, devicePrivateKeyEncrypted: devicePrivateKeyEnc }));
      const deviceData = { device: { type: fullDeviceInfo.device.type, vendor: fullDeviceInfo.device.vendor, model: fullDeviceInfo.device.model } };
      const deviceMFAToken: string | undefined = await getFirebaseToken();
      setDeviceRegistrationData(prev => ({ ...prev, devicePublicKey: devicePublicKey, devicePrivateKeyEncrypted: devicePrivateKeyEnc, deviceData: deviceData, deviceMFAToken: deviceMFAToken }));

      const serverHello: any = await authAPI.initiateHandshake(devicePublicKey);
      console.info('Server Hello response:', { serverHello });
      const sessionId = serverHello.data.sessionId;
      const serverPublicKey = serverHello.data.serverPublicKey;
      setDeviceRegistrationData(prev => ({ ...prev, sessionId: sessionId, serverPublicKey: serverPublicKey }));
      await new Promise(resolve => setTimeout(resolve, 1000));
      storeServerKeys(serverPublicKey);
      const encryptedDeviceToken = await rsaEncryptWithPem(String(deviceMFAToken), serverPublicKey);
      console.log({deviceRegistrationData});
      console.debug('Handshake data:', { sessionId, devicePublicKey, encryptedDeviceToken, deviceData });
      const handshake: any = await authAPI.completeHandshake(sessionId, devicePublicKey, encryptedDeviceToken, deviceData);
      console.log('Handshake response:', { handshake });
      const fingerprint = handshake?.data.deviceId;

      // Decrypt the fingerprint using device private key
      try {
        const decryptedFingerprint = await deviceEncryption.rsaDecrypt(fingerprint, devicePrivateKey);
        console.info('Fingerprint decrypted successfully:', { decryptedFingerprint });
        setDeviceId(decryptedFingerprint);
      } catch (decryptError) {
        console.error('Failed to decrypt fingerprint:', decryptError);
        // Fallback: use the encrypted fingerprint if decryption fails
        setDeviceId(fingerprint);
      }

      setDeviceHash(handshake.data.deviceHash);
      setDeviceRegistrationData(prev => ({
        ...prev,
        deviceHash: fingerprint.hash,
      }));
      setDeviceRegistered(handshake.data.handshakeCompleted);
      setLoading(false);
    } catch (error) {
      console.error('Error fingerprinting device:', error);
      setLoading(false);
    }
  }, [getFirebaseToken, storeServerKeys, deviceRegistrationData])

  useEffect(() => {
    if (currentStep === 2) {
      fingerprintDevice();
    }
  }, [currentStep, fingerprintDevice, token])

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipeGesture();
  };

  const handleSwipeGesture = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0 && currentStep < 3) {
        // Swipe left - next step
        handleNext();
      } else if (diff < 0 && currentStep > 0) {
        // Swipe right - previous step
        handlePrevious();
      }
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Ensure authentication state is fresh before navigation
      await new Promise(resolve => setTimeout(resolve, 3000));
      message.success('DeviceRegistration completed successfully!');
      // Navigate with a small delay to ensure state is settled
      setTimeout(() => {
        navigate('/discover', { replace: true });
      }, 500);
    } catch (error: any) {
      console.error('DeviceRegistration completion error:', error);
      message.error('Failed to complete device-registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [notificationsGranted, setNotificationsGranted] = useState<boolean>(false);

  const handleNotificationsState = async(checked: boolean): Promise<void> => {
    setNotificationsGranted(checked);
    setDeviceRegistrationData(prev => ({ ...prev, notificationsEnabled: checked }));
    try {
      if (checked) {

        requestPermission();
        
        console.log('Pusher Beams: Starting initialization...');
        console.log('Pusher Beams: PusherPushNotifications available:', !!PusherPushNotifications);
        console.log('Pusher Beams: PusherPushNotifications.Client:', !!PusherPushNotifications.Client);

        const beamsClient = new PusherPushNotifications.Client({
          instanceId: envConfig.VITE_PUSHER_INSTANCE_ID || '',
        });

        console.log('Pusher Beams: Client created, starting...');

        await beamsClient.start();
        console.log('Pusher Beams: Started successfully');

        await beamsClient.addDeviceInterest('debug-hello');
        console.log('Pusher Beams: Added interest "debug-hello"');

        // Get device ID for debugging
        const pusherDeviceId = await beamsClient.getDeviceId();
        console.log('Pusher Beams: Device ID:', pusherDeviceId);
        setDeviceRegistrationData(prev => ({ ...prev, pusherDeviceId: pusherDeviceId }));
        // List all interests
        const interests = await beamsClient.getDeviceInterests();
        console.log('Pusher Beams: Current interests:', interests);
        console.log('Koppo Notifications: GRANTED');
      } else {
        console.log('Koppo Notifications: BLOCKED');
      }

    } catch (error: any) {
      console.error('Pusher Beams: Error during initialization:', error);
    }

  }


  // Welcome Screen
  const WelcomeScreen = () => (
    <div className="device-registration-screen welcome-screen">
      <div className="device-registration-content">
        <div className="device-registration-icon">
          <SecurityScanOutlined style={{ fontSize: 64, color: '#aa58e3' }} />
        </div>
        <Title level={2} className="device-registration-title">
          Welcome! Let's secure your trading account
        </Title>

        <div className="device-registration-features">
          <div className="feature-item">
            <BellOutlined className="feature-icon" />
            <div className="feature-content">
              <Title level={4}>Push Notifications (Optional)</Title>
              <Text type="secondary">
                Get real-time trade alerts. You can enable/disable anytime.
              </Text>
            </div>
          </div>

          <div className="feature-item">
            <SecurityScanOutlined className="feature-icon" />
            <div className="feature-content">
              <Title level={4}>Device Registration</Title>
              <Text type="secondary">
                We'll create a secure, anonymous identifier for this device
                to protect against unauthorized access.
              </Text>
            </div>
          </div>

          <div className="feature-item">
            <LockOutlined className="feature-icon" />
            <div className="feature-content">
              <Title level={4}>Your Control</Title>
              <Text type="secondary">
                View and manage all devices in Privacy Center.
              </Text>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  // Notifications Screen
  const NotificationsScreen = () => (
    <div className="device-registration-screen notifications-screen">
      <div className="device-registration-content">
        <div className="device-registration-icon">
          <BellOutlined style={{ fontSize: 64, color: '#aa58e3' }} />
        </div>
        <Title level={2} className="device-registration-title">
          Push Notifications
        </Title>
        <Paragraph type="secondary">
          Get real-time alerts for your trading activities. You can change this anytime in settings.
        </Paragraph>

        {!deviceRegistrationData.notificationsEnabled && (<Alert
                title="Notifications Blocked"
                description="You will not be able to receive notifications during your trading sessions."
                type="warning"
                showIcon
                style={{ marginBottom: 24, textAlign: 'left' }}
              />)}

        <div className="notification-options">
          <Card size="small" className={`notification-card ${deviceRegistrationData.notificationsEnabled ? 'selected' : ''}`}>
            <div className="notification-option">
              <div className="option-content">
                <Title level={4}>Enable Notifications</Title>
                <Text type="secondary">
                  Receive instant updates about your trades, account activity, and important alerts.
                </Text>
              </div>
              <Switch
                checked={notificationsGranted}
                onChange={handleNotificationsState}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  // Device Registration Screen
  const DeviceRegistrationScreen = () => (
    <div className="device-registration-screen device-screen">
      <div className="device-registration-content">
        {deviceRegistered ? (<>
          <div className="device-registration-icon">
            <SecurityScanOutlined style={{ fontSize: 64, color: '#52c41a' }} />
          </div>
          <Title level={2} className="device-registration-title">
            Device Registered
          </Title>

          <Card title={<Title level={4}>{deviceInfo?.device.type.toLowerCase() === 'mobile' ? <MobileOutlined className="feature-icon" /> : <DesktopOutlined className="feature-icon" />} {deviceInfo?.device.vendor || ''} {deviceInfo?.device.model || ''} <sup><Tag color="blue">{deviceInfo?.device.type || ''}</Tag></sup></Title>}>
            <span className="device-id-text"><small>Device ID:</small><br />{deviceId}</span>
          </Card>
          <Text>
            <code style={{ marginTop: 16, fontSize: 16, display: 'block', textAlign: 'center' }}>
              <small>Device Hash:</small><br />0x{deviceHash.substring(0, 8)}....{deviceHash.substring(deviceHash.length - 8)}
            </code>
          </Text>
          <Confetti />
          <div className="privacy-link">
            <Button
              type="default" block
              icon={<QrcodeOutlined />} loading={loading}
              onClick={() => fingerprintDevice()} size="large"
            >
              Regenerate Hash
            </Button>
          </div></>
        ) : (
          <>

            <div className="device-registration-icon">
              {deviceInfo?.device.type.toLowerCase() === 'mobile' ? <MobileOutlined style={{ fontSize: 64, color: '#aa58e3' }} /> : <DesktopOutlined style={{ fontSize: 64, color: '#aa58e3' }} />}
            </div>
            <Title level={2} className="device-registration-title">
              Registering Device...
            </Title>
            <Space vertical >

              <Alert
                title="Privacy Protected"
                description="We are now fingerprinting your device. We have only collected your Device brand and model commonly known as the User Agent."
                type="info"
                showIcon
                style={{ marginBottom: 24, textAlign: 'left' }}
              /><div style={{ textAlign: 'center', padding: 32 }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Generating device identifier...</Text>
                </div>
              </div>
            </Space>
          </>

        )}

      </div>
    </div>
  );

  // Completion Screen
  const CompletionScreen = () => (
    <div className="device-registration-screen completion-screen">
      <div className="device-registration-content">
        <div className="device-registration-icon">
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
        </div>
        <Title level={2} className="device-registration-title">
          Setup Complete!
        </Title>
        <Paragraph type="secondary">
          Your trading account is now secure and ready to use. You can modify these settings anytime in your profile.
        </Paragraph>

        <div className="completion-summary">
          <Card size="small" title="Configuration Summary">
            <div className="summary-item">
              <SecurityScanOutlined /> Device Registered
            </div>
            <div className="summary-item">
              {deviceRegistrationData.notificationsEnabled ? <BellOutlined /> : <BellOutlined style={{ opacity: 0.3 }} />}
              Notifications {deviceRegistrationData.notificationsEnabled ? 'Enabled' : 'Disabled'}
            </div>
            <div className="summary-item">
              {deviceRegistrationData.theme === 'dark' ? <MoonOutlined /> : <BulbOutlined />}
              {deviceRegistrationData.theme === 'dark' ? 'Dark' : 'Light'} Theme
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const screens = [
    WelcomeScreen,
    NotificationsScreen,
    DeviceRegistrationScreen,
    CompletionScreen
  ];

  const CurrentScreen = screens[currentStep];

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img style={{ height: 48 }} src={logoSvg} alt="Koppo Logo" />
        </div>

        <Card className="device-registration-card">
          <div className="device-registration-header">
            <Steps current={currentStep} size="small" style={{ marginBottom: 24 }}>
              <Step title="Welcome" />
              <Step title="Notifications" />
              <Step title="Device" />
              <Step title="Complete" />
            </Steps>
          </div>

          <div
            className="device-registration-screens"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <CurrentScreen />
          </div>

          <Flex justify="center" align="center">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => setPrivacyVisible(true)}
            >
              View Privacy Policy
            </Button>
          </Flex>

          <div className="device-registration-navigation">
            <Row justify="space-between" align="top">
              <Col>
                {currentStep > 0 && (
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handlePrevious}
                    disabled={loading}
                  >
                    Previous
                  </Button>
                )}
              </Col>
              <Col>
                {currentStep < 3 ? (
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />} iconPlacement="end"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<HomeOutlined />}
                    onClick={handleComplete}
                    loading={loading}
                  >
                    Proceed Home
                  </Button>
                )}
              </Col>
            </Row>
          </div>
        </Card>
      </div>

      {/* Privacy Policy Modal */}
      <Modal
        title="Device & Session Data Collection"
        open={privacyVisible}
        onCancel={() => setPrivacyVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPrivacyVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <div className="privacy-content">
          <Title level={4}>What We Collect:</Title>

          <div className="privacy-section">
            <Title level={5}>1. Device Identifier (Hashed)</Title>
            <Paragraph>
              <strong>Purpose:</strong> Recognize trusted devices, prevent account takeover<br />
              <strong>What:</strong> Anonymous hash of device characteristics<br />
              <strong>NOT collected:</strong> Serial numbers, IMEI, MAC addresses
            </Paragraph>
          </div>

          <div className="privacy-section">
            <Title level={5}>2. Push Notification Tokens</Title>
            <Paragraph>
              <strong>Purpose:</strong> Send trading alerts (only with your consent)<br />
              <strong>Storage:</strong> Encrypted, deleted when consent revoked<br />
              <strong>Control:</strong> Toggle in Settings → Notifications
            </Paragraph>
          </div>

          <div className="privacy-section">
            <Title level={5}>3. Login Session Logs</Title>
            <Paragraph>
              <strong>Purpose:</strong> Security audit trail, detect intrusions<br />
              <strong>Data:</strong> Timestamp, success/failure, general location (country)<br />
              <strong>Retention:</strong> 90 days, then automatic deletion
            </Paragraph>
          </div>

          <Divider />

          <Title level={4}>Your Controls:</Title>
          <ul>
            <li>View all active devices in Privacy Center</li>
            <li>Revoke any device instantly (terminates all sessions)</li>
            <li>Export all session history</li>
            <li>Disable push notifications per-device</li>
            <li>Request deletion of historical session logs</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}
