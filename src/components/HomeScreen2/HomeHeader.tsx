import React from "react";
import { Typography } from "antd";
import {
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FieldTimeOutlined,
  BarChartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { CountDownTimer } from "../Composite/CountDownTimer";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
const { Title } = Typography;

export const HomeHeader: React.FC = () => {
  
  const { botHeartbeat } = useDiscoveryContext();

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
            <Badge count={unreadCount} size="small">
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
