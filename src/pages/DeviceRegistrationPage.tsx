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
import { useOAuth } from "../contexts/OAuthContext";
import {
  useDeviceUtils,
  rsaEncryptWithPem,
  rsaDecryptWithPem,
  //generateDeviceRSAKeys,
  RSAKeyPair,
  //ServerPublicKeyData,
  //DeviceInfoData,
  //DeviceIdData,
  //PusherDeviceIdData,
} from "../utils/deviceUtils";
import { authAPI } from "../services/api";
import logoSvg from "../assets/logo.png";
import "../styles/login.scss";
import "../styles/device-registration.scss";
import { QrcodeOutlined } from "@ant-design/icons";
import Confetti from "react-confetti-boom";
const { Title, Text, Paragraph } = Typography;

export default function DeviceRegistrationPage() {
  const navigate = useNavigate();
  useOAuth();

  const {
    serverPublicKey,
    deviceKeys,
    deviceId,
    pusherDeviceId,
    deviceToken,
    deviceInfo,
    //devicePayload,
    deviceHashData,
    browserFingerPrint,
    getPusherId,
    getDevice,
    //getDeviceToken,
    refreshDevice,
    //clearDeviceKeys,
    storeServerPublicKey,
    //clearServerPublicKey,
    storeDeviceId,
    //clearDeviceId
  } = useDeviceUtils();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [, setIsCompletingHandshake] = useState(false);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const [deviceRegistrationError, setDeviceRegistrationError] = useState<
    string | null
  >(null);
  const [takingLong, setTakingLong] = useState(false);
  const [, setSessionId] = useState<string>("NULL");
  const [deviceHash, setDeviceHash] = useState<string>("0x00000 ... 00000");
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false);
  const [notificationsGranted, setNotificationsGranted] =
    useState<boolean>(false);

  const [theme, setTheme] = useState<string>("dark");

  const [privacyVisible, setPrivacyVisible] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const [deviceData, setDeviceData] = useState({
    serverPublicKey,
    deviceKeys,
    deviceId,
    deviceToken,
    deviceInfo,
    pusherDeviceId,
    deviceHashData,
    browserFingerPrint,
  });

  const setupDeviceData = useCallback(async () => {
    try {
      if (
        !deviceData.serverPublicKey ||
        !deviceData.deviceKeys ||
        !deviceData.deviceInfo
      ) {
        const refreshedDevice = await refreshDevice();
        const payload: any = {
          serverPublicKey: refreshedDevice._serverPublicKey,
          deviceKeys: refreshedDevice._deviceKeys,
          deviceId: refreshedDevice._deviceId,
          deviceToken: refreshedDevice._deviceToken,
          deviceInfo: refreshedDevice._deviceInfo,
          pusherDeviceId: refreshedDevice._pusherDeviceId,
          deviceHashData: refreshedDevice._deviceHashData,
          browserFingerPrint: refreshedDevice._browserFingerPrint,
        };
        setDeviceData(payload);
        return payload;
      }
    } catch (error: any) {
      console.warn("REFRESH DEVICE", { error });
    }
  }, [
    deviceData.deviceInfo,
    deviceData.deviceKeys,
    deviceData.serverPublicKey,
    refreshDevice,
  ]);

  useEffect(() => {
    setupDeviceData();
  }, [setupDeviceData]);

  useEffect(() => {
    if (currentStep === 2) {
      setTimeout(() => {
        setTakingLong(true);
      }, 15000);
    } else {
      setTakingLong(false);
    }
  }, [currentStep]);

  const completeHandshake = useCallback(
    async (_sessionId: string, _serverPublicKey: string, _deviceData: any) => {
      if (_sessionId && _sessionId.length < 5) {
        return;
      }

      if (!_serverPublicKey) {
        return;
      }

      if (!_deviceData) {
        _deviceData = await setupDeviceData();
      }

      if (!_deviceData) {
        return;
      }

      if (!_deviceData.deviceInfo) {
        return;
      }

      if (!_deviceData.deviceToken) {
        return;
      }

      if (!_deviceData.deviceKeys) {
        return;
      }

      console.warn("DO_SAY_HELLO_005B_RESPONSE_SUCCESS", {
        _sessionId,
        _serverPublicKey,
        _deviceData,
      });

      if (!_deviceData.browserFingerPrint) {
        return;
      }

      if (!_deviceData.pusherDeviceId) {
        return;
      }

      setIsCompletingHandshake(true);

      const encryptedDeviceToken = await rsaEncryptWithPem(
        String(_deviceData?.deviceToken),
        String(_serverPublicKey),
      );

      const deviceMeta = {
        ..._deviceData?.deviceInfo,
        language: navigator.language || "en-US",
        meta: {
          notificationsEnabled,
          browserFingerPrint: _deviceData?.browserFingerPrint,
          pusherDeviceId:
            typeof _deviceData?.pusherDeviceId === "string"
              ? _deviceData?.pusherDeviceId
              : _deviceData?.pusherDeviceId?.pusherDeviceId,
        },
      };

      console.error("INIT :: completeHandshake ::", {
        _sessionId,
        serverPublicKey: _deviceData?.serverPublicKey?.publicKey,
        devicePublicKey: _deviceData?.deviceKeys?.publicKey,
        encryptedDeviceToken,
        deviceMeta,
        device: getDevice(),
      });

      const handshake: any = await authAPI.completeHandshake(
        _sessionId,
        String(_deviceData?.deviceKeys?.publicKey),
        encryptedDeviceToken,
        deviceMeta,
      );

      const encryptedDeviceId = handshake?.data.deviceId;

      console.log("Handshake response:", { encryptedDeviceId, handshake });

      // Decrypt the fingerprint using device private key
      try {
        const decryptedDeviceId = await rsaDecryptWithPem(
          String(encryptedDeviceId),
          String(_deviceData?.deviceKeys?.privateKey),
        );
        console.info("Device ID decrypted successfully:", {
          decryptedDeviceId,
        });
        storeDeviceId(decryptedDeviceId);
        setDeviceHash(handshake.data.deviceHash);
        setDeviceRegistered(handshake.data.handshakeCompleted);
        setIsCompletingHandshake(false);
      } catch (decryptError) {
        console.error("Failed to decrypt Device ID:", {
          decryptError,
          encryptedDeviceId,
        });
        setIsCompletingHandshake(false);
      } finally {
        setIsCompletingHandshake(false);
      }
    },
    [notificationsEnabled, getDevice, setupDeviceData, storeDeviceId],
  );

  const serverHello = useCallback(async () => {
    // Prevent multiple concurrent executions

    setDeviceRegistrationError(null);
    setTakingLong(false);

    if (loading) return;

    console.log("SEVER HELLO", { loading });

    try {
      console.log("SEVER HELLO BEFORE REFRESH AWAIT", { loading });

      await refreshDevice();

      console.log("SEVER HELLO AFTER REFRESH AWAIT", { loading });
      
    } catch (error: any) {
      console.log("SEVER HELLO ERROR", { error });
    } finally {
      console.log("SEVER HELLO FINALLY", { loading });
    }

    console.log("SEVER HELLO2", { loading });

    setLoading(true);
    setDeviceRegistered(false);
    setDeviceRegistrationError(null);

    console.log("DO_SAY_HELLO_001", { deviceData });

    try {
      let _deviceKeys: RSAKeyPair | null = deviceData?.deviceKeys;
      let _devicePublicKey: string | undefined;
      let _deviceData: any;

      if (!_deviceKeys) {
        _deviceData = await setupDeviceData();
        setDeviceData(_deviceData);
        _deviceKeys = _deviceData?.deviceKeys;
        _devicePublicKey = _deviceKeys?.publicKey;
        // Wait 3 seconds before proceeding
        await new Promise((resolve) => setTimeout(resolve, 3000));
        console.log("DO_SAY_HELLO_001A", { _deviceData });
      } else {
        _devicePublicKey = deviceData?.deviceKeys?.publicKey;
        _deviceData = deviceData;
        console.log("DO_SAY_HELLO_001B", { deviceData });
      }

      console.log("DO_SAY_HELLO_002", { _devicePublicKey });

      const serverHello: any = await authAPI.initiateHandshake(
        String(_devicePublicKey),
      );

      if (serverHello.success) {
        console.warn("DO_SAY_HELLO_003_RESPONSE_SUCCESS", {
          _deviceData,
          serverHello,
        });
        const sessionId: string = serverHello.data.sessionId;
        setSessionId(sessionId);
        const serverPublicKey: string = serverHello.data.serverPublicKey;
        storeServerPublicKey(serverPublicKey);
        const nextStep: string = serverHello.data.nextStep;
        console.warn("DO_SAY_HELLO_004_RESPONSE_SUCCESS", {
          sessionId,
          serverPublicKey,
          nextStep,
        });
        if (nextStep === "complete_handshake") {
          console.warn("DO_SAY_HELLO_005A_RESPONSE_SUCCESS", {
            sessionId,
            serverPublicKey,
            _deviceData,
          });
          completeHandshake(sessionId, serverPublicKey, _deviceData);
        } else {
          console.warn("DO_SAY_HELLO_005_RESPONSE_SUCCESS", { nextStep });
        }
      } else {
        console.error("DO_SAY_HELLO_003_RESPONSE_ERROR", {
          _deviceData,
          serverHello,
        });
        setDeviceRegistrationError(serverHello.message);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error fingerprinting device:", error);
      setDeviceRegistrationError("Failed to fingerprint device");
    }
  }, [
    /*
    completeHandshake,
    deviceData,
    loading,
    refreshDevice,
    setupDeviceData,
    storeServerPublicKey,
    */
  ]);

  useEffect(() => {
    if (currentStep === 2) {
      serverHello();
    }
  }, [currentStep, serverHello]);

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
        await getPusherId(checked);
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
          <SecurityScanOutlined style={{ fontSize: 64, color: "#3b82f6" }} />
        </div>
        <Title level={2} className="device-registration-title">
          Device Setup
        </Title>
        <Paragraph type="secondary">
          Get real-time alerts for your trading activities.
        </Paragraph>
        <div className="device-registration-features">
          <div className="feature-item">
            <BellOutlined className="feature-icon" />
            <div className="feature-content">
              <Title level={4}>Push Notifications (Optional)</Title>
              <Text type="secondary">
                Get real-time trade alerts across your devices. You can
                enable/disable anytime.
              </Text>
            </div>
          </div>

          <div className="feature-item">
            <SecurityScanOutlined className="feature-icon" />
            <div className="feature-content">
              <Title level={4}>Device Registration</Title>
              <Text type="secondary">
                Secure, anonymous device identifier to protect against
                unauthorized access.
              </Text>
            </div>
          </div>

          <div className="feature-item">
            <LockOutlined className="feature-icon" />
            <div className="feature-content">
              <Title level={4}>Your Control</Title>
              <Text type="secondary">
                View and manage all devices in Privacy Center. You can change
                settings anytime.
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
          <BellOutlined style={{ fontSize: 64, color: "#3b82f6" }} />
        </div>
        <Title level={2} className="device-registration-title">
          Push Notifications
        </Title>
        <Paragraph type="secondary">
          Get real-time alerts for your trading activities. You can change this
          anytime in settings.
        </Paragraph>

        <Alert
          title={
            <Flex
              justify="space-between"
              align="center"
              style={{ width: "100%" }}
            >
              <span>
                <small>{notificationsGranted ? "🔔":"🔕"}</small> <strong>{notificationsGranted ? "Notifications Enabled" : "Notifications Blocked"}</strong>
              </span>
              <Switch
                checked={notificationsGranted}
                onChange={handleNotificationsState}
              />
            </Flex>
          }
          description={notificationsGranted ? "You will receive instant updates about your trades, account activity, and important alerts." : "You will not be able to receive notifications during your trading sessions."}
          type={notificationsGranted ? "info" : "warning"}
        />
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
                  {deviceId?.deviceId}
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
                  Error Registering Device
                </Title>
                <Space vertical style={{ width: "100%" }}>
                  <Alert
                    title={
                      <>
                        <small>🔴</small> <strong>Device setup error</strong>
                      </>
                    }
                    description={deviceRegistrationError}
                    type="error"
                  />
                  <div className="privacy-link">
                    <Button
                      type="default"
                      block
                      icon={<QrcodeOutlined />}
                      loading={loading}
                      onClick={() => serverHello()}
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
                      style={{ fontSize: 64, color: "#3b82f6" }}
                    />
                  ) : (
                    <DesktopOutlined
                      style={{ fontSize: 64, color: "#3b82f6" }}
                    />
                  )}
                </div>
                <Title level={2} className="device-registration-title">
                  Registering Device...
                </Title>
                <Space vertical>
                  <div style={{ textAlign: "center", padding: 32 }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                      {takingLong ? (
                        <Text type="secondary">
                          <strong>⚠️ Generating device identifier...</strong>
                          <br/>
                          Device registration seems to be taking long. <br />
                          Click{" "}
                          <a href="#" onClick={() => serverHello()}>
                            here
                          </a>{" "}
                          to retry.
                        </Text>
                      ) : (
                        <Text type="secondary">
                          <strong>ℹ️ Generating device identifier...</strong>
                          <br/>
                          We are now fingerprinting your device. We have only collected your Device brand, model and browser user Agent.
                        </Text>
                      )}
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
                  <UserOutlined style={{ marginRight: 8 }} /> KYC Compliance
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
        <Steps
          style={{ width: "100%", marginBottom: 32 }}
          current={currentStep}
          items={[
            { title: "Welcome" },
            { title: "Consent" },
            { title: "Device" },
            { title: "Complete" },
          ]}
          className="device-steps"
          orientation="horizontal"
          size="small"
          titlePlacement="vertical"
          responsive={false}
        />
        <Card className="device-registration-card">
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
