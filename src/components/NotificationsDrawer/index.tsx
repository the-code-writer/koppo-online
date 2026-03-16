import {
  Drawer,
  List,
  Typography,
  Button,
  Tag,
  Empty,
  Flex,
  Badge,
  message,
} from "antd";
import {
  BellOutlined,
  TrophyOutlined,
  DollarOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import "./styles.scss";
import {
  Notification as NotificationType,
  NotificationType as NotificationTypeEnum,
} from "../../types/notifications";
import { useOAuth } from "../../contexts/OAuthContext";
import { NotificationAPIService } from "../../services/notificationAPIService";
import { useState } from "react";
import { useEventPublisher } from "../../hooks/useEventManager";

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
  onMarkAsRead,
}: NotificationsDrawerProps) {
  const { user } = useOAuth();
  const [loadingNotificationId, setLoadingNotificationId] = useState<
    string | null
  >(null);
  const { publish } = useEventPublisher();
  // Initialize notification service
  const notificationService = new NotificationAPIService(
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3051",
  );
  const getNotificationIcon = (
    type: NotificationTypeEnum,
    icon?: React.ReactNode,
  ) => {
    if (icon) return icon;

    switch (type) {
      case "achievement":
        return (
          <TrophyOutlined
            className="notification-icon achievement"
            style={{ fontSize: "32px" }}
          />
        );
      case "trade":
        return (
          <DollarOutlined
            className="notification-icon trade"
            style={{ fontSize: "32px" }}
          />
        );
      case "system":
        return (
          <InfoCircleOutlined
            className="notification-icon system"
            style={{ fontSize: "32px" }}
          />
        );
      case "alert":
        return (
          <WarningOutlined
            className="notification-icon alert"
            style={{ fontSize: "32px" }}
          />
        );
      case "info":
        return (
          <InfoCircleOutlined
            className="notification-icon info"
            style={{ fontSize: "32px" }}
          />
        );
      case "profit":
        return (
          <DollarOutlined
            className="notification-icon profit"
            style={{ fontSize: "32px" }}
          />
        );
      case "loss":
        return (
          <DollarOutlined
            className="notification-icon loss"
            style={{ fontSize: "32px" }}
          />
        );
      default:
        return (
          <BellOutlined
            className="notification-icon default"
            style={{ fontSize: "32px" }}
          />
        );
    }
  };

  const getNotificationTag = (type: NotificationTypeEnum) => {
    switch (type) {
      case "achievement":
        return <Tag color="gold">Achievement</Tag>;
      case "trade":
        return <Tag color="cyan">Trade</Tag>;
      case "system":
        return <Tag color="default">System</Tag>;
      case "alert":
        return <Tag color="red">Alert</Tag>;
      case "info":
        return <Tag color="blue">Info</Tag>;
      case "profit":
        return <Tag color="green">Profit</Tag>;
      case "loss":
        return <Tag color="orange">Loss</Tag>;
      default:
        return <Tag color="default">Notification</Tag>;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleNotificationClick = async (notification: NotificationType) => {
    // Mark as read if needed
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }

    // Fetch full notification data for profit/loss notifications
    if (notification.type === "profit" || notification.type === "loss") {
      if (!user?.uuid) {
        message.error("User not authenticated");
        return;
      }

      try {
        setLoadingNotificationId(notification._id);

        // Fetch full notification data from server
        const response = await notificationService.getNotification(
          notification._id,
          user.uuid,
        );

        if (response.success && response.data) {
          console.log("Full notification data:", response.data);

          publish("SHOW_BOT_SUMMARY", response.data.pusher.payload);

          // Here you can trigger the bot summary popup or handle the full data
          // For now, we'll just log it and show a success message
          if (response.data.payload.amount > 0) {
            message.success(response.data.pusher.payload.summary.sessionId);
          } else {
            message.error(response.data.pusher.payload.summary.sessionId);
          }

          // TODO: Integrate with bot summary popup if needed
          // Example: publish("SHOW_BOT_SUMMARY", response.data);
        } else {
          message.error("Failed to fetch notification details");
        }
      } catch (error) {
        console.error("Error fetching notification details:", error);
        message.error("Error loading notification details");
      } finally {
        setLoadingNotificationId(null);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Drawer
      title={
        <Flex justify="space-between" align="center">
          <div className="header-title">
            <BellOutlined className="header-icon" />{" "}
            <span style={{ marginRight: 12 }}>Notifications</span>
            {unreadCount > 0 && (
              <Badge
                count={unreadCount}
                style={{
                  transform: "translate(-1px, -2px)",
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
              <span className="empty-description">No notifications yet</span>
            }
            className="notifications-empty"
          />
        ) : (
          <List
            className="notifications-list"
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                className={`notification-item ${!notification?.read ? "unread" : ""}`}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: "pointer" }}
              >
                <div className="notification-content">
                  <div className="notification-left">
                    <div className="notification-icon-wrapper">
                      <Badge
                        dot={!notification?.read}
                        style={{
                          transform: "translate(6px, -3px)",
                          width: 8,
                          height: 8,
                        }}
                      >
                        {getNotificationIcon(
                          notification?.type,
                          notification?.icon,
                        )}
                      </Badge>
                    </div>
                    <div className="notification-details">
                      <div className="notification-header">
                        <div className="title-section">
                          <Text
                            className="notification-title"
                            strong={!notification?.read}
                          >
                            {notification.title}
                          </Text>
                        </div>
                      </div>
                      <Text className="notification-message">
                        {notification.message || notification?.description}
                        {notification?.payload?.amount && (
                          <span
                            className={`notification-amount ${notification?.payload?.amount > 0 ? "profit" : "loss"}`}
                          >
                            {notification?.payload?.amount > 0
                              ? "Profit:"
                              : "Loss:"}{" "}
                            {formatAmount(notification?.payload?.amount)}
                          </span>
                        )}
                      </Text>
                      <Flex justify="space-between" align="center">
                        <div className="notification-tag-wrapper">
                          {getNotificationTag(notification?.type)}{" "}
                          {notification?.payload.tags?.map(
                            (tag: any, tagIndex: number) => (
                              <Tag
                                style={{ marginRight: 8 }}
                                key={tagIndex}
                                color="default"
                              >
                                {tag}
                              </Tag>
                            ),
                          )}
                        </div>
                        <Text
                          className="notification-time"
                          style={{ marginTop: -6 }}
                        >
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
