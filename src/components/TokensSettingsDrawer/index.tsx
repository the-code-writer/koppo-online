import { useState, useEffect, useCallback } from "react";
import { Drawer, Button, Typography, Tag, Tooltip, Row, Col, Popconfirm, Alert, Badge, message } from "antd";
import { 
  SafetyOutlined, 
  KeyOutlined, 
  GlobalOutlined, 
  ArrowLeftOutlined,
  DeleteOutlined,
  HistoryOutlined,
  LockOutlined,
  QuestionCircleOutlined,
  LoadingOutlined
} from "@ant-design/icons";
import { User } from '../../services/api';
import { apiDevicesService, Device } from '../../services/apiDevicesService';
import { useDeviceUtils } from '../../utils/deviceUtils';
import "./styles.scss";
import mobileIcon from "../../assets/Mobile.png";
import desktopIcon from "../../assets/Desktop.png";

const { Title, Paragraph, Text } = Typography; 

interface TokensSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function TokensSettingsDrawer({ visible, onClose, user }: TokensSettingsDrawerProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [revokingDevice, setRevokingDevice] = useState<string | null>(null);
  const { deviceId } = useDeviceUtils();

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiDevicesService.getDevices(1, 20);
      if (response.success) {
        // Sort devices to put current device first
        const sortedDevices = [...response.data.devices].sort((a, b) => {
          const isCurrentA = a.deviceId === deviceId?.deviceId;
          const isCurrentB = b.deviceId === deviceId?.deviceId;
          
          // Current device comes first
          if (isCurrentA && !isCurrentB) return -1;
          if (!isCurrentA && isCurrentB) return 1;
          
          // If both are current or neither, maintain original order
          return 0;
        });
        
        setDevices(sortedDevices);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      message.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Fetch devices when drawer opens
  useEffect(() => {
    if (visible && user) {
      fetchDevices();
    }
  }, [visible, user, fetchDevices]);

  const handleRevokeDevice = async (deviceId: string) => {
    setRevokingDevice(deviceId);
    try {
      const response = await apiDevicesService.endSession(deviceId);
      if (response.success) {
        message.success('Device session ended successfully');
        await fetchDevices(); // Refresh devices list
      } else {
        message.error(response.message || 'Failed to end session');
      }
    } catch (error) {
      console.error('Error revoking device:', error);
      message.error('Failed to end session');
    } finally {
      setRevokingDevice(null);
    }
  };

  const handleRevokeAllDevices = async () => {
    if (!user?.id) return;
    
    try {
      const response = await apiDevicesService.endAllSessions(user.id);
      if (response.success) {
        message.success(`All sessions ended (${response.data?.count || 0} sessions)`);
        await fetchDevices(); // Refresh devices list
      } else {
        message.error(response.message || 'Failed to end all sessions');
      }
    } catch (error) {
      console.error('Error revoking all devices:', error);
      message.error('Failed to end all sessions');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDeviceIcon = (deviceType: string) => {
    return deviceType.toLowerCase() === 'mobile' ? mobileIcon : desktopIcon;
  };

  const getDeviceName = (device: Device) => {
    // Extract browser and OS info from userAgent
    const userAgent = device.userAgent;
    let deviceName = 'Unknown Device';

    if(!userAgent){
      return deviceName;
    }
    
    if (userAgent.includes('Chrome')) {
      deviceName = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      deviceName = 'Firefox';
    } else if (userAgent.includes('Safari')) {
      deviceName = 'Safari';
    }
    
    if (device.device.type === 'Mobile') {
      deviceName = `Mobile - ${deviceName}`;
    } else {
      deviceName = `Desktop - ${deviceName}`;
    }
    
    return deviceName;
  };

        
  return (
    <Drawer
      placement="right"
      onClose={onClose}
      open={visible}
      size={600}
      closable={false}
      className="tokens-settings-drawer"
    >
      <div className="drawer-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={onClose}
          className="back-button"
        />
        <div className="header-text">
          <Title level={4} className="drawer-title">Device Sessions</Title>
          {user?.displayName && <Text type="secondary" className="drawer-subtitle">Manage device access and session tokens</Text>}
        </div>
      </div>

      <div className="drawer-content">
        {/* Active Sessions Section */}
        <section className="tokens-section">
          <div className="tokens-section-header">
            {devices.length > 0 && (<>
            <div className="header-title">
              <div className="section-icon">
                <HistoryOutlined />
              </div>
              <h3>Active Sessions</h3>
            </div>
              <Popconfirm
                title="Revoke all sessions?"
                description="This will log you out from all other devices."
                onConfirm={handleRevokeAllDevices}
                okText="Yes, Revoke All"
                cancelText="No"
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
              >
                <Button 
                  danger 
                  type="text"
                  icon={<DeleteOutlined />}
                  className="revoke-all-btn"
                >
                  Revoke All
                </Button>
              </Popconfirm></>
            )}
          </div>

          {loading ? (
            <div className="loading-container">
              <LoadingOutlined spin />
              <Text>Loading devices...</Text>
            </div>
          ) : devices.length === 0 ? (
            <div className="security-tips-container">
              <div className="security-card premium-card">
              <div className="tip-icon"><KeyOutlined /></div>
              <div className="tip-content">
                <h5>Device Management</h5>
                <Paragraph>
                  No active sessions found. Your account is secure with no logged-in devices.
                </Paragraph>
              </div>
            </div>
            </div>
          ) : (
            <div className="tokens-grid-container">
              {devices.map((device) => {
                const isCurrentDevice = device.deviceId === deviceId?.deviceId;
                
                return (
                  <Badge.Ribbon 
                    key={device._id}
                    text="Current"
                    color="green"
                    placement="start"
                    // Only show ribbon for current device
                    style={{ display: isCurrentDevice ? 'block' : 'none' }}
                  >
                    <div className="token-card premium-card">
                      <div className="token-main">
                        <div className="token-title-wrapper">
                          <span className="token-name">
                            {getDeviceName(device)} 
                            <span style={{ marginLeft: '24px' }}>
                              {device?.meta?.notificationsEnabled ? '🔔' : '🔕'}
                            </span>
                          </span>
                        </div>
                        {!isCurrentDevice && (
                          <Popconfirm
                            title="Revoke this session?"
                            description="Access from this device will be immediately terminated."
                            onConfirm={() => handleRevokeDevice(device.deviceId)}
                            okText="Revoke"
                            cancelText="Cancel"
                            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                          >
                            <Tooltip title="Revoke access">
                              <Button
                                danger
                                type="text"
                                icon={<DeleteOutlined />}
                                className="revoke-btn"
                                loading={revokingDevice === device._id}
                              />
                            </Tooltip>
                          </Popconfirm>
                        )}
                      </div>

                  <div className="token-details-grid">
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                        <Alert type="info" 
                        title={<span><strong>{getDeviceName(device)}</strong></span>}
                        description={<><small><strong>{device.deviceId}</strong></small><br/>
                            <small><strong>{device.userAgent?.split(' ').slice(-2).join(' ')}</strong></small>
                        </>}
                        
                        showIcon icon={<img src={getDeviceIcon(device.device.type)} width={36} height={36} />} />

                        </Col>
                        <Col span={12}>
                          <div className="token-info-box">
                            <label>Last Seen</label>
                            <span>{formatDate(device.lastSeen)}</span>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="token-info-box">
                            <label>Language</label>
                            <span>{device.language || 'Unknown'}</span>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="token-info-box">
                            <label>Created</label>
                            <span>{formatDate(device.createdAt)}</span>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="token-info-box">
                            <label>Logged In At</label>
                            <span>{formatDate(device.registeredAt)}</span>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="token-info-box">
                            <label>IP Address</label>
                            <span>{device.ipAddress || 'Unknown'}</span>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="token-info-box">
                            <label>Location</label>
                            <span>{device.location ? `${device.location.city || ''}, ${device.location.country || ''}`.replace(/^[,\s]+|[,\s]+$/g, '') || 'Unknown' : 'Unknown'}</span>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="token-info-box">
                            <label>Status</label>
                            <Tag className={`status-badge ${device.isActive ? 'online' : 'offline'}`}>
                              <span className="status-emoji">
                                {device.isActive ? '🟢' : '⚪'}
                              </span>
                              <span className="status-text">
                                {device.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </Tag>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="token-info-box">
                            <label>Risk Score</label>
                            <Tag className={`risk-score-badge ${(device.riskScore || 0) > 50 ? 'high' : (device.riskScore || 0) > 20 ? 'medium' : 'low'}`}>
                              <span className="risk-emoji">
                                {(device.riskScore || 0) > 50 ? '🔴' : (device.riskScore || 0) > 20 ? '🟡' : '🟢'}
                              </span>
                              <span className="risk-text">
                                {(device.riskScore || 0) > 50 ? 'High' : (device.riskScore || 0) > 20 ? 'Medium' : 'Low'} : {device.riskScore || 0}
                              </span>
                            </Tag>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="token-info-box">
                            <label>Flags</label>
                            <div className="flags-container">
                              {device.flags?.suspiciousLogin && <Tag className="flag-badge suspicious">🚨 Suspicious</Tag>}
                              {device.flags?.newDevice && <Tag className="flag-badge new-device">📱 New Device</Tag>}
                              {device.flags?.newLocation && <Tag className="flag-badge new-location">� New Location</Tag>}
                              {device.flags?.bruteForceAttempt && <Tag className="flag-badge brute-force">⚠️ Brute Force</Tag>}
                              {device.flags?.concurrentSession && <Tag className="flag-badge concurrent">👥 Concurrent</Tag>}
                              {(!device.flags?.suspiciousLogin && !device.flags?.newDevice && !device.flags?.newLocation && !device.flags?.bruteForceAttempt && !device.flags?.concurrentSession) && (
                                <Tag className="flag-badge clean">✅ Clean</Tag>
                              )}
                            </div>
                          </div>
                        </Col>
                        </Row>
                    </div>
                  </div>
                </Badge.Ribbon>
                );
              })}
            </div>
          )}
        </section>

        {/* Security Tips Section */}
        <section className="tokens-section">
          <div className="tokens-section-header">
            <div className="header-title">
              <div className="section-icon">
                <LockOutlined />
              </div>
              <h3>Security Best Practices</h3>
            </div>
          </div>

          <div className="security-tips-container">
            <div className="security-card premium-card">
              <div className="tip-icon"><SafetyOutlined /></div>
              <div className="tip-content">
                <h5>Regular Session Review</h5>
                <Paragraph>
                  Periodically review your active sessions and revoke any that you don't recognize to maintain account integrity.
                </Paragraph>
              </div>
            </div>

            <div className="security-card premium-card">
              <div className="tip-icon"><KeyOutlined /></div>
              <div className="tip-content">
                <h5>Token Management</h5>
                <Paragraph>
                  Create tokens with minimal required permissions and revoke them immediately when they are no longer needed.
                </Paragraph>
              </div>
            </div>

            <div className="security-card premium-card">
              <div className="tip-icon"><GlobalOutlined /></div>
              <div className="tip-content">
                <h5>Secure Access</h5>
                <Paragraph>
                  Always use trusted networks and ensure your account has two-factor authentication enabled for maximum protection.
                </Paragraph>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  );
}
