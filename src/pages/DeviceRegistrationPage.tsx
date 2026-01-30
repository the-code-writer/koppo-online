import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Modal,
  Flex,
} from "antd";
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
  DesktopOutlined,
  UserOutlined,
  MailOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { collectDeviceInfo } from "../utils/deviceHash";
import {
  useDeviceUtils,
  rsaEncryptWithPem,
  rsaDecryptWithPem,
  DeviceIdData,
  generateDeviceRSAKeys,
} from "../utils/deviceUtils";
import { authAPI } from "../services/api";
import logoSvg from "../assets/logo.png";
import "../styles/login.scss";
import "../styles/device-registration.scss";
import { QrcodeOutlined } from "@ant-design/icons";
import { useFirebaseMessaging } from "../hooks/useFirebaseMessaging";
import Confetti from "react-confetti-boom";
import { getCurrentBrowserFingerPrint } from "@rajesh896/broprint.js";
import * as PusherPushNotifications from "@pusher/push-notifications-web";
import { envConfig } from "../config/env.config";
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const fullDeviceInfo = collectDeviceInfo();

export default function DeviceRegistrationPage() {
  const navigate = useNavigate();
  useAuth();
  const {
    storeServerPublicKey,
    serverKeys,
    deviceKeys,
    storeDeviceId,
    parsedDeviceId,
  } = useDeviceUtils();
  const { token, requestPermission, getFirebaseToken } = useFirebaseMessaging();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const [deviceRegistrationError, setDeviceRegistrationError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>("NULL");
  const [deviceId, setDeviceId] = useState<DeviceIdData | undefined>(
    parsedDeviceId?.deviceId || "DVC:00000000-XXXXXX",
  );
  const [pusherDeviceId, setPusherDeviceId] = useState<string>("NULL");
  const [devicePublicKey, setDevicePublicKey] = useState<string>(deviceKeys?.publicKey);
  const [deviceHash, setDeviceHash] = useState<string>("0x00000 ... 00000");
  const [deviceInfo, setDeviceInfo] = useState<any>({
    device: { userAgent: "", vendor: "", type: "Mobile", model: "" },
  });
  const [deviceData, setDeviceData] = useState<any>({
    device: { userAgent: "", vendor: "", type: "Mobile", model: "" },
  });
  const [deviceMFAToken, setDeviceMFAToken] = useState<string>("NULL");
  const [deviceFingerprint, setDeviceFingerprint] = useState<number>(0);
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false);
  const [notificationsGranted, setNotificationsGranted] =
    useState<boolean>(false);

  const [theme, setTheme] = useState<string>("dark");

  const [privacyVisible, setPrivacyVisible] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const fingerprintDevice = useCallback(async () => {
    // Prevent multiple concurrent executions
    if (loading) return;

    setLoading(true);
    setDeviceRegistered(false);
    setDeviceRegistrationError(null);
    setDeviceInfo(fullDeviceInfo);

    let devicePublicKey = deviceKeys?.publicKey;

    if(!devicePublicKey){
      const keys = await generateDeviceRSAKeys(true);
      devicePublicKey = keys.publicKey;
      setDevicePublicKey(devicePublicKey);
      console.warn(keys);
    }

    try {
      const mfa: string | undefined =
        (await getFirebaseToken()) || String(token);
      setDeviceMFAToken(mfa);
      const serverHello: any = await authAPI.initiateHandshake(devicePublicKey);
      if (serverHello.success) {
        console.info("Server Hello response:", {
          devicePublicKey,
          serverHello,
        });
        const sessionId: string = serverHello.data.sessionId;
        setSessionId(sessionId);
        const serverPublicKey: string = serverHello.data.serverPublicKey;
        storeServerPublicKey(serverPublicKey);
      } else {
        setDeviceRegistrationError(serverHello.message);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fingerprinting device:", error);
      setLoading(false);
      setDeviceRegistrationError("Failed to fingerprint device");
    }
  }, []); // Empty dependency array - function won't be recreated

  const completeHandshake = async () => {
    const encryptedDeviceToken = await rsaEncryptWithPem(
      String(deviceMFAToken),
      serverKeys?.publicKey,
    );
    console.debug("Handshake data:", {
      sessionId,
      devicePublicKey: deviceKeys?.publicKey,
      encryptedDeviceToken,
      deviceData,
    });
    if(sessionId && sessionId.length < 5){
      return;
    }
    const handshake: any = await authAPI.completeHandshake(
      sessionId,
      String(deviceKeys?.publicKey),
      encryptedDeviceToken,
      deviceData,
    );
    console.log("Handshake response:", { handshake });
    const encryptedDeviceId = handshake?.data.deviceId;
    // Decrypt the fingerprint using device private key
    try {
      const decryptedDeviceId = await rsaDecryptWithPem(
        encryptedDeviceId,
        deviceKeys?.privateKey,
      );
      console.info("Device ID decrypted successfully:", { decryptedDeviceId });
      setDeviceId(decryptedDeviceId);
      storeDeviceId(decryptedDeviceId);
      setDeviceHash(handshake.data.deviceHash);
      setDeviceRegistered(handshake.data.handshakeCompleted);
    } catch (decryptError) {
      console.error("Failed to decrypt Device ID:", {
        decryptError,
        encryptedDeviceId,
      });
      // Fallback: use the encrypted fingerprint if decryption fails
      setDeviceId(encryptedDeviceId);
    }
  };

  useEffect(() => {
    if (currentStep === 2) {
      fingerprintDevice();
    }
  }, [currentStep]);

  useEffect(() => {
    if (
      sessionId &&
      deviceKeys?.publicKey &&
      deviceData &&
      deviceData?.device?.userAgent?.length > 0
    ) {
      console.log({
        sessionId,
        devicePublicKey: deviceKeys?.publicKey,
        deviceData,
      });
      completeHandshake();
    }
  }, [sessionId, deviceKeys, deviceData]);

  useEffect(() => {
    console.log({ parsedDeviceId });
  }, [parsedDeviceId]);

  useEffect(() => {
    console.log("XXXX DEVICE INFO", deviceInfo);
    const device = {
      meta: { pusherDeviceId, notificationsEnabled, deviceFingerprint },
      device: {
        userAgent: deviceInfo?.userAgent,
        type: deviceInfo?.device?.type,
        vendor: deviceInfo?.device?.vendor,
        model: deviceInfo?.device?.model,
      },
    };
    setDeviceData(device);
  }, [deviceInfo, pusherDeviceId, notificationsEnabled, deviceFingerprint]);

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
      await new Promise((resolve) => setTimeout(resolve, 3000));
      message.success("DeviceRegistration completed successfully!");
      // Navigate with a small delay to ensure state is settled
      setTimeout(() => {
        navigate("/discover", { replace: true });
      }, 500);
    } catch (error: any) {
      console.error("DeviceRegistration completion error:", error);
      message.error(
        "Failed to complete device-registration. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };
  const handleGotoLogin = async () => {
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 500);
  };
  const handleNotificationsState = async (checked: boolean): Promise<void> => {
    setNotificationsGranted(checked);
    setNotificationsEnabled(checked);
    try {
      if (checked) {
        requestPermission();

        console.log("Pusher Beams: Starting initialization...");
        console.log(
          "Pusher Beams: PusherPushNotifications available:",
          !!PusherPushNotifications,
        );
        console.log(
          "Pusher Beams: PusherPushNotifications.Client:",
          !!PusherPushNotifications.Client,
        );

        const beamsClient = new PusherPushNotifications.Client({
          instanceId: envConfig.VITE_PUSHER_INSTANCE_ID || "",
        });

        console.log("Pusher Beams: Client created, starting...");

        await beamsClient.start();
        console.log("Pusher Beams: Started successfully");

        await beamsClient.addDeviceInterest("debug-hello");
        console.log('Pusher Beams: Added interest "debug-hello"');

        // Get device ID for debugging
        const pdid = await beamsClient.getDeviceId();
        setPusherDeviceId(pdid);
        console.log("Pusher Beams: Device ID:", pdid);
        const dfprnt = await getCurrentBrowserFingerPrint();
        setDeviceFingerprint(dfprnt);
        console.log("Device Fingerprint:", dfprnt);
        // List all interests
        const interests = await beamsClient.getDeviceInterests();
        console.log("Pusher Beams: Current interests:", interests);
        console.log("Koppo Notifications: GRANTED");
      } else {
        console.log("Koppo Notifications: BLOCKED");
      }
    } catch (error: any) {
      console.error("Pusher Beams: Error during initialization:", error);
    }
  };

  // Welcome Screen
  const WelcomeScreen = () => (
    <div className="device-registration-screen welcome-screen">
      <div className="device-registration-content">
        <div className="device-registration-icon">
          <SecurityScanOutlined style={{ fontSize: 64, color: "#aa58e3" }} />
        </div>
        <Title level={2} className="device-registration-title">
          Device Setup
        </Title>
        <Paragraph type="secondary">
          Get real-time alerts for your trading activities. You can change this
          anytime in settings.
        </Paragraph>
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
                We'll create a secure, anonymous identifier for this device to
                protect against unauthorized access.
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
          <BellOutlined style={{ fontSize: 64, color: "#aa58e3" }} />
        </div>
        <Title level={2} className="device-registration-title">
          Push Notifications
        </Title>
        <Paragraph type="secondary">
          Get real-time alerts for your trading activities. You can change this
          anytime in settings.
        </Paragraph>

        {!notificationsEnabled && (
          <Alert
            title={
              <>
                <small>🟡</small> <strong>Notifications Blocked</strong>
              </>
            }
            description="You will not be able to receive notifications during your trading sessions."
            type="warning"
          />
        )}

        <div className="notification-options">
          <Card
            size="small"
            className={`notification-card ${notificationsEnabled ? "selected" : ""}`}
          >
            <div className="notification-option">
              <div className="option-content">
                <Title level={4}>Enable Notifications</Title>
                <Text type="secondary">
                  Receive instant updates about your trades, account activity,
                  and important alerts.
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
        {deviceRegistered ? (
          <>
            <div className="device-registration-icon">
              <SecurityScanOutlined
                style={{ fontSize: 64, color: "#52c41a" }}
              />
            </div>
            <Title level={2} className="device-registration-title">
              Device Registered
            </Title>

            <Card
              title={
                <strong>
                  {deviceInfo?.device?.type.toLowerCase() === "mobile"
                    ? "📱"
                    : "💻"}{" "}
                  {deviceInfo?.device.vendor || ""}{" "}
                  {deviceInfo?.device.model || ""}
                </strong>
              }
            >
              <Text>
                <code
                  style={{
                    marginTop: -24,
                    fontSize: 16,
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  <small>{deviceInfo?.device.type || ""} Device ID:</small>
                  <br />
                  {parsedDeviceId?.deviceId || deviceId}
                </code>

                <code
                  style={{
                    marginTop: 16,
                    fontSize: 16,
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  <small>{deviceInfo?.device.type || ""} Device Hash:</small>
                  <br />
                  0x{deviceHash.substring(0, 8)}....
                  {deviceHash.substring(deviceHash.length - 8)}
                </code>
              </Text>
            </Card>
            <Confetti />
          </>
        ) : (
          <>
            {deviceRegistrationError ? (
              <>
                <div className="device-registration-icon">
                  <WarningOutlined
                      style={{ fontSize: 64, color: "#f9004fff" }}
                    />
                </div>
                <Title level={2} className="device-registration-title">
                  Error!
                </Title>
                <Space vertical style={{width: "100%"}}>
                  <Alert
                    title={
                      <>
                        <small>🔴</small> <strong>Device setup error</strong>
                      </>
                    }
                    description={deviceRegistrationError}
                    type="error"
                  />
                  <div className="privacy-link" >
              <Button
                type="default"
                block
                icon={<QrcodeOutlined />}
                loading={loading}
                onClick={() => fingerprintDevice(true)}
                size="large"
              >
                Regenerate Hash
              </Button>
            </div>
                </Space>
              </>
            ) : (
              <>
                <div className="device-registration-icon">
                  {deviceInfo?.device?.type.toLowerCase() === "mobile" ? (
                    <MobileOutlined
                      style={{ fontSize: 64, color: "#aa58e3" }}
                    />
                  ) : (
                    <DesktopOutlined
                      style={{ fontSize: 64, color: "#aa58e3" }}
                    />
                  )}
                </div>
                <Title level={2} className="device-registration-title">
                  Registering Device...
                </Title>
                <Space vertical>
                  <Alert
                    title={
                      <>
                        <small>🔵</small> <strong>Privacy Protected</strong>
                      </>
                    }
                    description="We are now fingerprinting your device. We have only collected your Device brand, model and browser user Agent."
                    type="info"
                  />
                  <div style={{ textAlign: "center", padding: 32 }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      <Text type="secondary">
                        Generating device identifier...
                      </Text>
                    </div>
                  </div>
                </Space>
              </>
            )}
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
          <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a" }} />
        </div>
        <Title level={2} className="device-registration-title">
          Setup Complete!
        </Title>
        <Paragraph type="secondary">
          This device has been securely registered and ready to use with our
          platform. You can modify these device settings anytime in your
          profile. Below is the device configuration summary.
        </Paragraph>

        <div className="completion-summary">
          <Card>
            <div className="summary-item">
              <Flex
                align="center"
                justify="space-between"
                style={{ width: "100%" }}
              >
                <span>
                  <BellOutlined style={{ marginRight: 8 }} /> Notifications{" "}
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </span>
                <span>✅</span>
              </Flex>
            </div>
            <div className="summary-item">
              <Flex
                align="center"
                justify="space-between"
                style={{ width: "100%" }}
              >
                <span>
                  <SecurityScanOutlined style={{ marginRight: 8 }} /> Device
                  Registered
                </span>
                <span>✅</span>
              </Flex>
            </div>
            <div className="summary-item">
              <Flex
                align="center"
                justify="space-between"
                style={{ width: "100%" }}
              >
                <span>
                  <UserOutlined style={{ marginRight: 8 }} /> User Profile Setup
                </span>
                <span>⚠️</span>
              </Flex>
            </div>
            <div className="summary-item">
              <Flex
                align="center"
                justify="space-between"
                style={{ width: "100%" }}
              >
                <span>
                  <MailOutlined style={{ marginRight: 8 }} /> User Email
                  Activated
                </span>
                <span>⚠️</span>
              </Flex>
            </div>
            <div className="summary-item">
              <Flex
                align="center"
                justify="space-between"
                style={{ width: "100%" }}
              >
                <span>
                  {theme === "dark" ? (
                    <MoonOutlined style={{ marginRight: 8 }} />
                  ) : (
                    <BulbOutlined style={{ marginRight: 8 }} />
                  )}{" "}
                  {theme === "dark" ? "Dark" : "Light"} Theme (
                  <span>click to toggle</span>)
                </span>
                <span>
                  <Switch
                    size="small"
                    checked={theme === "dark"}
                    onClick={() => {
                      setTheme(theme === "dark" ? "light" : "dark");
                    }}
                  />
                </span>
              </Flex>
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
    CompletionScreen,
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
            <Steps current={currentStep}>
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
                  <>
                    {currentStep < 3 ? (
                      <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handlePrevious}
                        disabled={loading}
                      >
                        Previous
                      </Button>
                    ) : (
                      <Button
                        type="default"
                        icon={<LockOutlined />}
                        onClick={handleGotoLogin}
                        loading={loading}
                      >
                        Login
                      </Button>
                    )}
                  </>
                )}
              </Col>
              <Col>
                {currentStep < 3 ? (
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    iconPlacement="end"
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
                    Home
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
          </Button>,
        ]}
        width={800}
      >
        <div className="privacy-content">
          <Title level={4}>What We Collect:</Title>

          <div className="privacy-section">
            <Title level={5}>1. Device Identifier (Hashed)</Title>
            <Paragraph>
              <strong>Purpose:</strong> Recognize trusted devices, prevent
              account takeover
              <br />
              <strong>What:</strong> Anonymous hash of device characteristics
              <br />
              <strong>NOT collected:</strong> Serial numbers, IMEI, MAC
              addresses
            </Paragraph>
          </div>

          <div className="privacy-section">
            <Title level={5}>2. Push Notification Tokens</Title>
            <Paragraph>
              <strong>Purpose:</strong> Send trading alerts (only with your
              consent)
              <br />
              <strong>Storage:</strong> Encrypted, deleted when consent revoked
              <br />
              <strong>Control:</strong> Toggle in Settings → Notifications
            </Paragraph>
          </div>

          <div className="privacy-section">
            <Title level={5}>3. Login Session Logs</Title>
            <Paragraph>
              <strong>Purpose:</strong> Security audit trail, detect intrusions
              <br />
              <strong>Data:</strong> Timestamp, success/failure, general
              location (country)
              <br />
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
