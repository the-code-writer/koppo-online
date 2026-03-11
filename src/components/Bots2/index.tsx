import React, { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Input,
  Row,
  Col,
  Flex,
  Spin,
  Typography,
} from "antd";
import {
  PlusOutlined,
  SyncOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import "./styles.scss";
import botIcon from "../../assets/bot.png";
import { BottomActionSheet } from "../BottomActionSheet/index";
import { useEventPublisher } from "../../hooks/useEventManager";
import { Strategy } from "../../types/strategy";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import { BotItem } from "./BotItem";
import { StrategiesList } from "../Composite/StrategiesList";

interface BotParam {
  key: string;
  label: string;
  value: number;
}

export interface Bot {
  id: string;
  botName: string;
  botDescription: string;
  marketName: string;
  contractType: string;
  strategyName: string;
  startedAt: Date;
  netProfit: number;
  baseStake: number;
  numberOfWins: number;
  numberOfLosses: number;
  state: "PLAY" | "PAUSE" | "STOP";
  botTags: string[];
  botMetadata: {
    version: string;
    algorithm: string;
    riskLevel: string;
  };
  isActive: boolean;
  totalTrades: number;
  winRate: number;
  averageProfit: number;
  maxDrawdown: number;
  lastRunAt: Date;
  runningTime?: number;
  settings: {
    maxConcurrentTrades: number;
    stopLoss: number;
    takeProfit: number;
    riskPerTrade: number;
  };
  performance: {
    dailyProfit: number;
    weeklyProfit: number;
    monthlyProfit: number;
    allTimeHigh: number;
    allTimeLow: number;
  };
  params: BotParam[];
  // Add missing properties from TradingBotConfig
  botAccount?: {
    currency: string;
    account: string;
    token: string;
  };
  amounts?: {
    base_stake: {
      type: string;
      value: number;
      min?: number | null;
      max?: number | null;
    };
    maximum_stake: {
      type: string;
      value: number;
      min?: number | null;
      max?: number | null;
    };
    take_profit: {
      type: string;
      value: number;
      min?: number | null;
      max?: number | null;
    };
    stop_loss: {
      type: string;
      value: number;
      min?: number | null;
      max?: number | null;
    };
  };
  realtimePerformance?: {
    current_stake?: number;
  };
}

export function Bots2() {
  const { publish } = useEventPublisher();
  
  const {
    myBots,
    refreshMyBots,
    myBotsLoading,
  } = useDiscoveryContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const reloadBots = async () => {
    refreshMyBots();
  };

  const closeActionSheet = () => {
    setIsActionSheetOpen(false);
  };

  const onSelectedStrategyHandler = (strategy: Strategy) => {
    closeActionSheet();
    publish("CREATE_BOT", {
      strategy,
    });
  };

  // Handle scroll events for header positioning
  useEffect(() => {
    refreshMyBots();

    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 57) {
        setIsHeaderFixed(true);
      } else {
        setIsHeaderFixed(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter bots based on search query
  const botList = Array.isArray(myBots) ? myBots : [];

  const filteredBots = botList.filter(
    (bot: any) =>
      (bot.botName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (bot.botDescription?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (bot.strategyId?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (bot.botTags?.some((tag: string) => tag?.toLowerCase().includes(searchQuery.toLowerCase())) || false),
  );

  return (
    <div className="bots2-container">
      {/* Fixed Search Header */}
      <div className={`bots2-search-header ${isHeaderFixed ? "fixed" : ""}`}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Flex
              align="center"
              justify="space-between"
              style={{ width: "100%" }}
            >
              <h1 className="screen-title">
                Bots <Badge count={botList.length} showZero />
              </h1>
              <Flex
                align="center"
                justify="flex-end"
                style={{ width: "100%" }}
                gap={16}
              >
                <Button
                  size="large"
                  type="text"
                  icon={<PlusOutlined />}
                  className="action-btn"
                  onClick={() => setIsActionSheetOpen(true)}
                />
                <Button
                  size="large"
                  type="text"
                  className="action-btn"
                  icon={<SyncOutlined />}
                  onClick={() => reloadBots()}
                />
              </Flex>
            </Flex>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Input
              placeholder="Search bots..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={
                <SearchOutlined style={{ fontSize: 24, marginLeft: 8 }} />
              }
              className="text-input"
              allowClear
              size="large"
            />
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div className="bots2-main-content">
        {myBotsLoading ? (
          <div className="loading-state">
            <Spin size="large" />
            <Typography.Text type="secondary">Updating your bot status...</Typography.Text>
          </div>
        ) : filteredBots.length > 0 ? (
          <div className="bots2-list">
            <Row gutter={[24, 24]}>
              {filteredBots.map((bot: any) => 
              (<BotItem bot={bot} />))}
            </Row>
          </div>
        ) : (
          <div className="empty-state">
            <img src={botIcon} width="200" alt="No bots" />
            <span className="empty-text">
              {searchQuery
                ? "No bots found matching your search."
                : "No bots yet. Create your first trading bot!"}
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="create-first-btn"
              onClick={() => setIsActionSheetOpen(true)}
            >
              Create Your First Bot
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Action Sheet */}
      <BottomActionSheet
        isOpen={isActionSheetOpen}
        onClose={closeActionSheet}
        height="80vh"
      >
        <StrategiesList onSelectedStrategy={onSelectedStrategyHandler} />
      </BottomActionSheet>
    </div>
  );
}
