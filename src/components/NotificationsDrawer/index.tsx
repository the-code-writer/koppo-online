import { Drawer, List, Typography, Button, Tag, Empty, Flex, Badge } from 'antd';
import { 
  BellOutlined,
  TrophyOutlined,
  DollarOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import './styles.scss';
import { Notification as NotificationType, NotificationType as NotificationTypeEnum } from '../../types/notifications';

const { Text } = Typography;

interface NotificationsDrawerProps {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationType[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  onMarkAsRead?: (id: string) => void;
}

export function NotificationsDrawer({ 
  visible, 
  onClose, 
  notifications, 
  onDismiss, 
  onClearAll,
  onMarkAsRead 
}: NotificationsDrawerProps) {
  const getNotificationIcon = (type: NotificationTypeEnum, icon?: React.ReactNode) => {
    if (icon) return icon;
    
    switch (type) {
      case 'achievement':
        return <TrophyOutlined className="notification-icon achievement" style={{ fontSize: '32px' }} />;
      case 'trade':
        return <DollarOutlined className="notification-icon trade" style={{ fontSize: '32px' }} />;
      case 'system':
        return <InfoCircleOutlined className="notification-icon system" style={{ fontSize: '32px' }} />;
      case 'alert':
        return <WarningOutlined className="notification-icon alert" style={{ fontSize: '32px' }} />;
      case 'info':
        return <InfoCircleOutlined className="notification-icon info" style={{ fontSize: '32px' }} />;
      case 'profit':
        return <DollarOutlined className="notification-icon profit" style={{ fontSize: '32px' }} />;
      case 'loss':
        return <WarningOutlined className="notification-icon loss" style={{ fontSize: '32px' }} />;
      default:
        return <BellOutlined className="notification-icon default" style={{ fontSize: '32px' }} />;
    }
  };

  const getNotificationTag = (type: NotificationTypeEnum) => {
    switch (type) {
      case 'achievement':
        return <Tag color="gold">Achievement</Tag>;
      case 'trade':
        return <Tag color="cyan">Trade</Tag>;
      case 'system':
        return <Tag color="default">System</Tag>;
      case 'alert':
        return <Tag color="red">Alert</Tag>;
      case 'info':
        return <Tag color="blue">Info</Tag>;
      case 'profit':
        return <Tag color="green">Profit</Tag>;
      case 'loss':
        return <Tag color="orange">Loss</Tag>;
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

  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
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
              <Badge 
                count={unreadCount} 
                style={{ 
                  transform: 'translate(-1px, -2px)'
                }}
              />
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
                className={`notification-item ${!notification?.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: 'pointer' }}
              >
                <div className="notification-content">
                  <div className="notification-left">
                    <div className="notification-icon-wrapper">
                      <Badge 
                        dot={!notification?.read}
                        style={{ 
                          transform: 'translate(6px, -3px)',
                          width: 8, height: 8
                        }}
                      >
                        {getNotificationIcon(notification?.type, notification?.icon)}
                      </Badge>
                    </div>
                    <div className="notification-details">
                      <div className="notification-header">
                        <div className="title-section">
                          <Text className="notification-title" strong={!notification?.read}>
                            {notification.title}
                          </Text>
                        </div>
                      </div>
                      <Text className="notification-message">
                        {notification.message || notification?.description}
                        {notification?.amount && (
                          <span className="notification-amount">
                            {formatAmount(notification?.amount)}
                          </span>
                        )}
                      </Text>
                      <Flex justify="space-between" align="center">
                        <div className="notification-tag-wrapper">
                          {getNotificationTag(notification?.type)}
                        </div>
                        <Text className="notification-time">
                          {notification?.time}
                        </Text>
                      </Flex>
                    </div>
                  </div>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => onDismiss(notification?._id)}
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
