import React, { useMemo } from "react";
import { Avatar, Badge, Button, Flex, Typography } from "antd";
import {
  BellOutlined,
} from "@ant-design/icons";

import { useEventPublisher } from "../../hooks/useEventManager";
import { useOAuth } from "../../contexts/OAuthContext";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
const { Title, Text } = Typography;

export const HomeHeader: React.FC = () => {

  const { user } = useOAuth();
  const { publish } = useEventPublisher();
  const { notifications } = useDiscoveryContext();

  const unreadNotifications = useMemo(() =>
    notifications.filter(n => !n.read).length, [notifications]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <header className="hs2-header">
      <div className="header-content">
        <Flex align="center" justify="space-between" gap={8}>
          <Avatar style={{ backgroundColor: '#4d2b84ff', borderRadius: '35%' }} size={48} src={user?.photoURL || undefined} />
          <div className="greeting-section">
            <Text className="greeting-text">{greeting},</Text>
            <Title level={3} className="user-name">{user?.displayName} 👋</Title>
          </div>
        </Flex>
        <div className="header-actions">
          <Badge count={unreadNotifications} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              className="header-btn"
              size="large"
              onClick={() => publish('OPEN_NOTIFICATION_DRAWER', {})}
            />
          </Badge>
        </div>
      </div>
    </header>
  );
};
