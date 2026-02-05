import { useState, useEffect } from "react";
import { Drawer, Button, Typography, Spin, Empty, Card, Tag, Space, Popconfirm } from "antd";
import { 
  LaptopOutlined, 
  MobileOutlined, 
  TabletOutlined, 
  DeleteOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  GlobalOutlined
} from "@ant-design/icons";
import { apiDevicesService, Device } from '../../services/apiDevicesService';
import "./styles.scss";

const { Title, Text } = Typography;

interface TokenSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function TokenSettingsDrawer({ visible, onClose }: TokenSettingsDrawerProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchDevices();
    }
  }, [visible]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await apiDevicesService.getDevices();
      setDevices(response.data.devices);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    setRevoking(deviceId);
    try {
      await apiDevicesService.revokeDevice(deviceId);
      // Remove device from list
      setDevices(devices.filter(d => d.deviceId !== deviceId));
    } catch (error) {
      console.error('Failed to revoke device:', error);
      alert('Failed to revoke device. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      await apiDevicesService.revokeAllDevices();
      // Refresh devices list
      await fetchDevices();
    } catch (error) {
      console.error('Failed to revoke all devices:', error);
      alert('Failed to revoke all devices. Please try again.');
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'mobile':
        return <MobileOutlined />;
      case 'tablet':
        return <TabletOutlined />;
      default:
        return <LaptopOutlined />;
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    try {
      const date = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Drawer
      title="Active Sessions & Devices"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      className="token-settings-drawer"
    >
      <div className="token-content">
        {/* Header Section */}
        <div className="header-section">
          <Title level={4} style={{ margin: 0 }}>Manage Your Devices</Title>
          <Text type="secondary">
            These are the devices currently logged into your account. Remove any devices you don't recognize.
          </Text>
        </div>

        {/* Revoke All Button */}
        {devices.length > 1 && (
          <div style={{ marginBottom: 24 }}>
            <Popconfirm
              title="Revoke all other sessions?"
              description="This will log you out from all other devices except this one."
              onConfirm={handleRevokeAll}
              okText="Yes, revoke all"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                loading={revokingAll}
                icon={<DeleteOutlined />}
              >
                Revoke All Other Sessions
              </Button>
            </Popconfirm>
          </div>
        )}

        {/* Devices List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Loading devices...</Text>
            </div>
          </div>
        ) : devices.length === 0 ? (
          <Empty
            description="No devices found"
            style={{ marginTop: 60 }}
          />
        ) : (
          <div className="devices-list">
            {devices.map((device, index) => {
              const isCurrentDevice = index === 0; // Simplified logic
              
              return (
                <Card
                  key={device._id}
                  className={`device-card ${isCurrentDevice ? 'current-device' : ''}`}
                  hoverable={!isCurrentDevice}
                >
                  <div className="device-card-content">
                    <div className="device-icon">
                      {getDeviceIcon(device.device.type)}
                    </div>
                    
                    <div className="device-info">
                      <div className="device-header">
                        <Space>
                          <Text strong className="device-name">
                            {device.device.type} - {device.device.model !== 'Unknown' ? device.device.model : device.device.vendor}
                          </Text>
                          {isCurrentDevice && (
                            <Tag color="green" icon={<CheckCircleFilled />}>
                              Current Device
                            </Tag>
                          )}
                          {device.isActive && !isCurrentDevice && (
                            <Tag color="blue">Active</Tag>
                          )}
                        </Space>
                      </div>

                      <div className="device-details">
                        <Space direction="vertical" size={4}>
                          <Text type="secondary" className="detail-item">
                            <GlobalOutlined /> {device.userAgent.substring(0, 80)}...
                          </Text>
                          <Text type="secondary" className="detail-item">
                            <ClockCircleOutlined /> Last seen {formatLastSeen(device.lastSeen)}
                          </Text>
                          <Text type="secondary" className="detail-item">
                            Device ID: {device.deviceId}
                          </Text>
                        </Space>
                      </div>

                      {!isCurrentDevice && (
                        <div className="device-actions">
                          <Popconfirm
                            title="Revoke this device?"
                            description="This will log out this device from your account."
                            onConfirm={() => handleRevokeDevice(device.deviceId)}
                            okText="Yes, revoke"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              loading={revoking === device.deviceId}
                            >
                              Revoke Access
                            </Button>
                          </Popconfirm>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="info-section" style={{ marginTop: 32, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            <strong>Security Tip:</strong> If you see a device you don't recognize, revoke it immediately and change your password.
          </Text>
        </div>
      </div>
    </Drawer>
  );
}
