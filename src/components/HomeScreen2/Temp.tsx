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

export const MarketSentiment: React.FC = () => {
  
  const { botHeartbeat } = useDiscoveryContext();

  return (
    
  );
};
