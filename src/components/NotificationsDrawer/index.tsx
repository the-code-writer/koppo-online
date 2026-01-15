import { Drawer, List, Typography, Button, Tag, Empty, Flex, Badge } from 'antd';
import { 
  BellOutlined,
  TrophyOutlined,
  DollarOutlined,
  RobotOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import './styles.scss';

const { Text } = Typography;

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'achievement' | 'profit' | 'bot';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon?: React.ReactNode;
  amount?: number;
}

interface NotificationsDrawerProps {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationsDrawer({ 
  visible, 
  onClose, 
  notifications, 
  onDismiss, 
  onClearAll 
}: NotificationsDrawerProps) {
  const getNotificationIcon = (type: Notification['type'], icon?: React.ReactNode) => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return <CheckCircleOutlined className="notification-icon success" style={{ fontSize: '32px' }} />;
      case 'warning':
        return <WarningOutlined className="notification-icon warning" style={{ fontSize: '32px' }} />;
      case 'info':
        return <InfoCircleOutlined className="notification-icon info" style={{ fontSize: '32px' }} />;
      case 'achievement':
        return <TrophyOutlined className="notification-icon achievement" style={{ fontSize: '32px' }} />;
      case 'profit':
        return <DollarOutlined className="notification-icon profit" style={{ fontSize: '32px' }} />;
      case 'bot':
        return <RobotOutlined className="notification-icon bot" style={{ fontSize: '32px' }} />;
      default:
        return <BellOutlined className="notification-icon default" style={{ fontSize: '32px' }} />;
    }
  };

  const getNotificationTag = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <Tag color="success">Success</Tag>;
      case 'warning':
        return <Tag color="warning">Warning</Tag>;
      case 'info':
        return <Tag color="blue">Info</Tag>;
      case 'achievement':
        return <Tag color="gold">Achievement</Tag>;
      case 'profit':
        return <Tag color="green">Profit</Tag>;
      case 'bot':
        return <Tag color="purple">Bot</Tag>;
      default:
        return <Tag color="default">Notification</Tag>;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Drawer
      title={
        <Flex justify='space-between' align='center'>
          <div className="header-title">
            <BellOutlined className="header-icon" />
            {" "}
            <span style={{marginRight: 12}}>Notifications</span>
            {unreadCount > 0 && (
              <Badge count={unreadCount ? 25 : 0} />
            )}
          </div>
          <Button 
            type="text" 
            icon={<DeleteOutlined />}
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="clear-all-btn"
            size="large"
          >
            Clear all
          </Button>
        </Flex>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      size={400}
      className="notifications-drawer"
    >
      <div className="notifications-content">
        {notifications.length === 0 ? (
          <Empty
            image={<BellOutlined className="empty-icon" />}
            description={
              <span className="empty-description">
                No notifications yet
              </span>
            }
            className="notifications-empty"
          />
        ) : (
          <List
            className="notifications-list"
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div className="notification-content">
                  <div className="notification-left">
                    <div className="notification-icon-wrapper">
                      {getNotificationIcon(notification.type, notification.icon)}
                    </div>
                    <div className="notification-details">
                      <div className="notification-header">
                        <div className="title-section">
                          <Text className="notification-title" strong={!notification.read}>
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <div className="notification-indicator" />
                          )}
                        </div>
                      </div>
                      <Text className="notification-message">
                        {notification.message}
                        {notification.amount && (
                          <span className="notification-amount">
                            {formatAmount(notification.amount)}
                          </span>
                        )}
                      </Text>
                      <div className="notification-tag-wrapper">
                        {getNotificationTag(notification.type)}
                      </div>
                      <Text className="notification-time">
                        {notification.time}
                      </Text>
                    </div>
                  </div>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => onDismiss(notification.id)}
                    className="dismiss-btn"
                    size="large"
                  />
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
    </Drawer>
  );
}
