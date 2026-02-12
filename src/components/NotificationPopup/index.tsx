import React, { useEffect, useState } from 'react';
import { Button, Typography } from 'antd';
import { 
  BellOutlined,
  TrophyOutlined,
  DollarOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Notification as NotificationType, NotificationType as NotificationTypeEnum } from '../../types/notifications';
import './styles.scss';

const { Text } = Typography;

interface NotificationPopupProps {
  notification: NotificationType;
  onClose?: () => void;
  duration?: number;
}

export function NotificationPopup({ 
  notification, 
  onClose, 
  duration = 4.5 
}: NotificationPopupProps) {
  const [visible, setVisible] = useState(true);

  const getNotificationIcon = (type: NotificationTypeEnum) => {
    switch (type) {
      case 'achievement':
        return <TrophyOutlined style={{ color: '#faad14', fontSize: '20px' }} />;
      case 'trade':
        return <DollarOutlined style={{ color: '#13c2c2', fontSize: '20px' }} />;
      case 'system':
        return <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '20px' }} />;
      case 'alert':
        return <WarningOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff', fontSize: '20px' }} />;
      case 'profit':
        return <DollarOutlined style={{ color: '#52c41a', fontSize: '20px' }} />;
      case 'loss':
        return <WarningOutlined style={{ color: '#faad14', fontSize: '20px' }} />;
      default:
        return <BellOutlined style={{ color: '#1890ff', fontSize: '20px' }} />;
    }
  };

  const getNotificationColor = (type: NotificationTypeEnum) => {
    switch (type) {
      case 'achievement':
        return '#faad14';
      case 'trade':
        return '#13c2c2';
      case 'system':
        return '#1890ff';
      case 'alert':
        return '#ff4d4f';
      case 'info':
        return '#1890ff';
      case 'profit':
        return '#52c41a';
      case 'loss':
        return '#faad14';
      default:
        return '#1890ff';
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

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration * 1000);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  return (
    <div 
      className={`notification-popup notification-popup--${notification.type}`}
      style={{ borderColor: getNotificationColor(notification.type) }}
    >
      <div className="notification-popup__content">
        <div className="notification-popup__icon">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="notification-popup__body">
          <div className="notification-popup__header">
            <Text strong className="notification-popup__title">
              {notification.title}
            </Text>
            <Button
              type="text"
              size="small"
              onClick={handleClose}
              className="notification-popup__close"
            >
              ×
            </Button>
          </div>
          
          <Text className="notification-popup__message">
            {notification.message || notification.description}
            {notification.amount && (
              <span className="notification-popup__amount">
                {formatAmount(notification.amount)}
              </span>
            )}
          </Text>
          
          <Text className="notification-popup__time">
            {notification.time}
          </Text>
        </div>
      </div>
    </div>
  );
}

// Hook to show notification popup
export function useNotificationPopup() {
  const showNotification = async (notification: NotificationType, duration?: number) => {
    // Create a container if it doesn't exist
    let container = document.getElementById('notification-popup-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-popup-container';
      container.className = 'notification-popup-container';
      document.body.appendChild(container);
    }

    // Create notification element
    const notificationElement = document.createElement('div');
    container.appendChild(notificationElement);

    // Render the notification
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(notificationElement);
    
    const handleClose = () => {
      root.unmount();
      notificationElement.remove();
      
      // Remove container if it's empty
      if (container.children.length === 0) {
        container.remove();
      }
    };

    root.render(
      <NotificationPopup 
        notification={notification} 
        onClose={handleClose}
        duration={duration}
      />
    );
  };

  return { showNotification };
}

export default NotificationPopup;
