import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Typography,
  Space,
  Flex,
  Spin,
  Tooltip,
  Badge,
  Input,
  message,
  Avatar,
} from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  FileSearchOutlined,
  SyncOutlined,
  TrophyOutlined as SearchIcon,
  SearchOutlined,
} from "@ant-design/icons";
import { botAPI } from "../../services/api";
import "./styles.scss";
import botIcon from "../../assets/bot.png";
import { BottomActionSheet } from "../BottomActionSheet/index";
import { useLocalStorage } from "../../utils/use-local-storage";
import { useEventPublisher } from "../../hooks/useEventManager";
import { Strategy, STORAGE_KEYS, TradingBotConfig } from "../../types/strategy";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import { BotConfig } from "../trader/types";
import tradingBotAPIService from "../../services/tradingBotAPIService";
import { Drawer, Divider, Descriptions } from 'antd';
import { SettingOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

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
}

// Strategy Selection Component for Action Sheet
const StrategiesList = ({
  onSelectedStrategy,
}: {
  onSelectedStrategy: (strategy: Strategy) => void;
}) => {
  const { strategies, refreshStrategies, strategiesLoading } =
    useDiscoveryContext();

  // Handle scroll events for header positioning
  useEffect(() => {
    refreshStrategies();
  }, []);

  return (
    <div className="modern-action-sheet-list">
      <div className="modern-action-sheet-header">
        <h3 style={{marginBottom: 0}}>🎯 Trading Strategies</h3>
      </div>
      <div className="modern-action-sheet-list">
        {strategiesLoading ? (
          <span>Loading ...</span>
        ) : (
          <>
            {strategies.map((strategy: Strategy) => (
              <div
                key={strategy.strategyId}
                className="modern-action-sheet-item"
                onClick={() => onSelectedStrategy(strategy)}
              >
                <div className="modern-action-sheet-icon">
                  <Avatar
                    src={strategy.coverPhoto}
                    shape="square"
                    className="strategy-selection-avatar"
                  />
                </div>
                <div className="modern-action-sheet-content">
                  <div>
                    <div className="modern-action-sheet-label">
                      {strategy.title}
                    </div>
                    <div className="modern-action-sheet-description">
                      {strategy.description}
                    </div>
                  </div>
                  <div className="modern-action-sheet-right">
                    <span className="modern-action-sheet-arrow">→</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const staticBots: any = [
  {
    id: "bot1",
    botName: "Volatility Master",
    botDescription:
      "Advanced bot for trading volatility indices with high precision",
    marketName: "Volatility 100 (1s) Index",
    contractType: "Rise/Fall",
    strategyName: "Momentum Reversal",
    startedAt: "2026-02-03T00:57:27.733Z",
    netProfit: 3046.58872326326,
    baseStake: 25,
    numberOfWins: 346,
    numberOfLosses: 118,
    state: "PLAY",
    botMetadata: {
      version: "2.1.0",
      algorithm: "neural_network",
      riskLevel: "medium",
    },
    isActive: true,
    totalTrades: 464,
    winRate: 75,
    averageProfit: 21.93,
    maxDrawdown: 150,
    lastRunAt: "2026-02-07T23:14:26.724Z",
    settings: {
      maxConcurrentTrades: 3,
      stopLoss: 15,
      takeProfit: 30,
      riskPerTrade: 5,
    },
    performance: {
      dailyProfit: 85.2,
      weeklyProfit: 425,
      monthlyProfit: 1250.5,
      allTimeHigh: 1450,
      allTimeLow: -200,
    },
    params: [
      {
        key: "repeat_trade",
        label: "Repeat trade",
        value: 10,
      },
      {
        key: "initial_stake",
        label: "Initial stake",
        value: 25,
      },
      {
        key: "risk_level",
        label: "Risk level",
        value: 5,
      },
    ],
    runningTime: 11997,
  },
  {
    id: "bot2",
    botName: "Forex Scalper Pro",
    botDescription: "High-frequency forex trading bot for quick profits",
    marketName: "EUR/USD",
    contractType: "Higher/Lower",
    strategyName: "Scalping Strategy",
    startedAt: "2026-01-27T00:57:27.734Z",
    netProfit: 890.25,
    baseStake: 15,
    numberOfWins: 38,
    numberOfLosses: 18,
    state: "PAUSE",
    botMetadata: {
      version: "1.8.5",
      algorithm: "technical_analysis",
      riskLevel: "low",
    },
    isActive: true,
    totalTrades: 56,
    winRate: 67.9,
    averageProfit: 15.9,
    maxDrawdown: 95,
    lastRunAt: "2026-02-02T22:57:27.734Z",
    settings: {
      maxConcurrentTrades: 2,
      stopLoss: 10,
      takeProfit: 20,
      riskPerTrade: 3,
    },
    performance: {
      dailyProfit: 45.5,
      weeklyProfit: 320,
      monthlyProfit: 890.25,
      allTimeHigh: 950,
      allTimeLow: -120,
    },
    params: [
      {
        key: "repeat_trade",
        label: "Repeat trade",
        value: 15,
      },
      {
        key: "initial_stake",
        label: "Initial stake",
        value: 15,
      },
      {
        key: "timeframe",
        label: "Timeframe",
        value: 1,
      },
    ],
  },
  {
    id: "bot3",
    botName: "Crypto Hunter",
    botDescription:
      "Cryptocurrency trading bot optimized for BTC and ETH pairs",
    marketName: "BTC/USD",
    contractType: "Touch/No Touch",
    strategyName: "Breakout Hunter",
    startedAt: "2026-01-20T00:57:27.734Z",
    netProfit: 4112.583284868174,
    baseStake: 50,
    numberOfWins: 369,
    numberOfLosses: 140,
    state: "PLAY",
    botMetadata: {
      version: "3.0.1",
      algorithm: "sentiment_analysis",
      riskLevel: "high",
    },
    isActive: true,
    totalTrades: 509,
    winRate: 72,
    averageProfit: 27.54,
    maxDrawdown: 280,
    lastRunAt: "2026-02-07T23:14:26.724Z",
    settings: {
      maxConcurrentTrades: 5,
      stopLoss: 20,
      takeProfit: 40,
      riskPerTrade: 8,
    },
    performance: {
      dailyProfit: 125.3,
      weeklyProfit: 875,
      monthlyProfit: 2340.75,
      allTimeHigh: 2500,
      allTimeLow: -350,
    },
    params: [
      {
        key: "repeat_trade",
        label: "Repeat trade",
        value: 20,
      },
      {
        key: "initial_stake",
        label: "Initial stake",
        value: 50,
      },
      {
        key: "leverage",
        label: "Leverage",
        value: 10,
      },
    ],
    runningTime: 11997,
  },
];

export function Bots2() {
  const { publish } = useEventPublisher();

  const {
    myBots,
    //activityHistoryItems,
    //loading,
    //error,
    refreshMyBots,
    myBotsLoading,
  } = useDiscoveryContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [updatingStats, setUpdatingStats] = useState<Set<string>>(new Set());

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<TradingBotConfig | null>(null);

  const [bots, setBots] = useLocalStorage<TradingBotConfig[]>("my_bots", {
    defaultValue: myBots,
  });

  useEffect(()=>{
    setBots(myBots);
    console.warn({myBots});
  }, [myBots])

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
  const botList = Array.isArray(bots) ? bots : [];

  const filteredBots = botList.filter(
    (bot: TradingBotConfig) =>
      bot.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.botDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.strategyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.botTags.includes(searchQuery.toLowerCase()),
  );

  // Format running time to HH:MM:SS
  const formatTime = (seconds: number | string): string => {
    if(typeof seconds === "string"){
      seconds = new Date(seconds).getSeconds();
    }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate net profit
  const getNetProfit = (bot: TradingBotConfig): number => {
    return bot?.realtimePerformance?.totalStake || 0 - bot?.realtimePerformance?.totalPayout || 0;
  };

  // Calculate win rate
  const getWinRate = (bot: TradingBotConfig): number => {
    if (bot.totalTrades === 0) return 0;
    return Math.round((bot?.realtimePerformance?.numberOfWins / bot?.realtimePerformance?.totalRuns) * 100);
  };

  // Get status configuration
  const getStatusConfig = (state: string) => {
    switch (state) {
      case "START":
        return { color: "#36a100ff", label: "Running", icon: "🟢" };
      case "PAUSE":
        return {
          color: "#faad14",
          label: "Paused",
          icon: <PauseCircleOutlined />,
        };
      case "STOP":
        return { color: "#ff4d4f", label: "Stopped", icon: <StopOutlined /> };
      default:
        return {
          color: "#d9d9d9",
          label: "Unknown",
          icon: <ClockCircleOutlined />,
        };
    }
  };

  // Handle bot audit action
  const handleAuditBot = (botUUID: string) => {
    const bot = (bots || []).find(b => b.botUUID === botUUID);
    if (bot) {
      setSelectedBot(bot);
      setAuditDrawerOpen(true);
    }
  };

  // Handle bot control actions
  const handleBotAction = async (
    botUUID: string,
    action: "START" | "PAUSE" | "RESUME" | "STOP" | "IDLE" | "ERROR",
  ) => {

    try {
      let response: any;
      switch (action) {
        case "START":
          response = await tradingBotAPIService.startBot(botUUID);
          break;
        case "PAUSE":
          response = await tradingBotAPIService.pauseBot(botUUID);
          break;
        case "RESUME":
          response = await tradingBotAPIService.resumeBot(botUUID);
          break;
        case "STOP":
          response = await tradingBotAPIService.stopBot(botUUID);
          break;
      }

      if (response.success) {
        message.success(response.message);
      } else {
        message.error(response.message || `Failed to ${action} bot`);
      }

      refreshMyBots();

    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      message.error(errorMessage);
    }
  };

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
            <Text type="secondary">Updating your bot status...</Text>
          </div>
        ) : filteredBots.length > 0 ? (
          <div className="bots2-list">
            <Row gutter={[24, 24]}>
              {filteredBots.map((bot:TradingBotConfig) => {
                const statusConfig = getStatusConfig(bot?.status);
                const netProfit = getNetProfit(bot);
                const winRate = getWinRate(bot);
                const isProfit = netProfit >= 0;

                return (
                  <Col
                    xs={24}
                    sm={24}
                    md={12}
                    lg={12}
                    xl={8}
                    key={bot?.botUUID}
                    className="bot-card-wrapper"
                  >
                    <Card
                      className={`bot-card ${bot?.status === "START" ? "running" : ""}`}
                      hoverable
                      size="small"
                    >
                      {/* Card Header */}
                      <Space className="bot-card-header" vertical>
                        <Flex
                          className="bot-info"
                          align="center"
                          justify="space-between"
                        >
                          <Title level={5} className="bot-name">
                            {bot?.botName}
                          </Title>
                          <Tag
                            color={statusConfig.color}
                            className="status-tag"
                          >
                            {statusConfig.icon}{" "}
                            <span>{statusConfig.label}</span>
                          </Tag>
                        </Flex>
                        <Text type="secondary" className="bot-market">
                          {String(bot?.strategyId).toUpperCase()} • {bot?.contract?.market?.displayName} • {bot?.contract?.contractType}
                        </Text>
                      </Space>

                      {/* Bot Stats */}
                      <div className="bot-stats">
                        <div className="stat-item">
                          <div className="stat-icon">
                            <ClockCircleOutlined />
                            <span className="stat-label">Runtime</span>
                          </div>
                          <div className="stat-content">
                            <span className={`stat-value`}>
                              {formatTime(bot.realtimePerformance?.startedAt || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <DollarOutlined />
                            <span className="stat-label">
                              Profit{" "}
                              {bot?.status === "START" && (
                                <span className="live-indicator" />
                              )}
                            </span>
                          </div>
                          <div className="stat-content">
                            <span
                              className={`stat-value ${isProfit ? "profit" : "loss"} ${updatingStats.has(bot?.botUUID) ? "updating" : ""}`}
                            >
                              {isProfit ? "+" : ""}
                              {netProfit.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <ThunderboltOutlined />
                            <span className="stat-label">Stake</span>
                          </div>
                          <div className="stat-content">
                            <span className="stat-value">
                              {String(bot?.amounts?.base_stake || 0)} <br />
                              <small>{bot.botCurrency}</small>
                            </span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <TrophyOutlined />
                            <span className="stat-label">Win Rate</span>
                          </div>
                          <div className="stat-content">
                            <span className={`stat-value`}>
                              {winRate}% <br />
                              <small>{bot?.realtimePerformance?.numberOfWins}/{bot?.realtimePerformance?.totalRuns}</small>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="bot-controls">
                        <div className="control-buttons">
                          <Tooltip
                            title={bot?.status === "START" ? "Running" : "Start"}
                          >
                            <Button
                              className={`control-btn start-btn ${bot?.status === "START" ? "current-state" : ""}`}
                              onClick={() => handleBotAction(bot?.botUUID, "START")}
                              disabled={bot?.status === "START"}
                            >
                              <PlayCircleOutlined />
                            </Button>
                          </Tooltip>
                          <Tooltip
                            title={bot.state === "PAUSE" ? "Paused" : "Pause"}
                          >
                            <Button
                              className={`control-btn pause-btn ${bot.status === "PAUSE" ? "current-state" : ""}`}
                              onClick={() => handleBotAction(bot?.botUUID, "PAUSE")}
                              disabled={bot?.status !== "START"}
                            >
                              <PauseCircleOutlined />
                            </Button>
                          </Tooltip>
                          <Tooltip
                            title={bot.state === "STOP" ? "Stopped" : "Stop"}
                          >
                            <Button
                              className={`control-btn stop-btn ${bot?.status === "STOP" ? "current-state" : ""}`}
                              onClick={() => handleBotAction(bot?.botUUID, "STOP")}
                              disabled={bot?.status === "STOP"}
                            >
                              <StopOutlined />
                            </Button>
                          </Tooltip>
                          <Button
                            className="control-btn audit-btn"
                            onClick={() => handleAuditBot(bot?.botUUID)}
                          >
                            <FileSearchOutlined /> Audit
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
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

      {/* Bot Details Drawer */}
      <Drawer
        title={selectedBot?.botName}
        open={auditDrawerOpen}
        onClose={() => setAuditDrawerOpen(false)}
        width="100%"
        placement="right"
        className="bot-details-drawer"
        extra={
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => message.info('Settings coming soon')}
          />
        }
      >
        {selectedBot && (
          <div className="strategy-card">
            {/* Banner Image */}
            <div className="strategy-card-image">
              <img
                src={selectedBot.botBanner || '/logo.png'}
                alt={selectedBot.botName}
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
              />
            </div>

            {/* Content */}
            <div className="strategy-card-content">
              {/* Title */}
              <h3 className="strategy-name">{selectedBot.botName}</h3>

              {/* Description */}
              <p className="strategy-description">
                {selectedBot.botDescription || 'No description available'}
              </p>

              <Divider />
              <h3 style={{marginBottom: 0}}>Contract Details</h3>
              <div className="strategy-metrics">
                <div className="metric-item contract-details">
                  <div className="contract-info">
                    <div className="contract-icon">
                      <FileTextOutlined />
                    </div>
                    <div className="contract-details-content">
                      <div className="contract-name">
                        {String(selectedBot.marketName || 'Unknown Market')}
                      </div>
                      <div className="contract-type">
                        {String(selectedBot.contractType || 'Unknown Type')}
                      </div>
                      <div className="contract-predictions">
                        {String(selectedBot.strategyName || 'No strategy')}
                      </div>
                      <div className="contract-strategy-id">
                        Strategy ID: {String(selectedBot.id || 'N/A')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="strategy-metrics">
                <div className="metric-item">
                  <span className="metric-value">{selectedBot.contract?.duration || 0} {selectedBot.contract.durationUnits}</span>
                  <span className="metric-label">Duration</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{selectedBot.contract?.delay || 0} sec</span>
                  <span className="metric-label">Delay</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{selectedBot.contract?.multiplier|| 1}x</span>
                  <span className="metric-label">Multiplier</span>
                </div>
              </div>

              <Divider/>

              {/* Amounts Section */}
              <h3 style={{marginBottom: 0}}>Stake, Take Profit, Stop Loss</h3>
              <div className="strategy-metrics">
                <div className="metric-item">
                  <span className="metric-value">{String((selectedBot.amounts?.base_stake as any)?.value || selectedBot.amounts?.base_stake || selectedBot.baseStake || 0)}</span>
                  <span className="metric-label">Stake</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String((selectedBot.amounts?.take_profit as any)?.value || selectedBot.amounts?.take_profit || 0)}</span>
                  <span className="metric-label">Take Profit</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String((selectedBot.settings as any)?.stopLoss || 0)}</span>
                  <span className="metric-label">Stop Loss</span>
                </div>
              </div>

              <Divider />

              {/* Realtime Performance */}
              <h3 style={{marginBottom: 0}}>Realtime Performance</h3>
              <div className="strategy-metrics">
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.realtimePerformance?.numberOfWins || selectedBot.numberOfWins || 0)}</span>
                  <span className="metric-label">No. of Wins</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.realtimePerformance?.numberOfLosses || selectedBot.numberOfLosses || 0)}</span>
                  <span className="metric-label">No. of Losses</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{selectedBot.realtimePerformance?.totalRuns || 0}</span>
                  <span className="metric-label">Total Runs</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String((selectedBot.amounts?.base_stake as any)?.value || selectedBot.amounts?.base_stake || selectedBot.baseStake || 0)}</span>
                  <span className="metric-label">Base Stake</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.realtimePerformance?.currentStake || selectedBot.currentStake || 0)}</span>
                  <span className="metric-label">Current Stake</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.realtimePerformance?.highestStake || selectedBot.highestStake || 0)}</span>
                  <span className="metric-label">Highest Stake</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.realtimePerformance?.totalStake || selectedBot.totalStake || 0)}</span>
                  <span className="metric-label">Total Stake</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.realtimePerformance?.totalPayout || selectedBot.totalPayout || 0)}</span>
                  <span className="metric-label">Total Payout</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.netProfit || selectedBot.totalProfit || 0)}</span>
                  <span className="metric-label">Total Profit</span>
                </div>
              </div>

              <Divider />

              {/* Statistics */}
              <h3 style={{marginBottom: 0}}>Lifetime Stastistics</h3>
              <div className="strategy-metrics">
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.statistics?.lifetimeWins || selectedBot.numberOfWins || 0)}</span>
                  <span className="metric-label">No. of Wins</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.statistics?.lifetimeLosses || selectedBot.numberOfLosses || 0)}</span>
                  <span className="metric-label">No. of Losses</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{selectedBot.statistics?.winRate || 0}%</span>
                  <span className="metric-label">Win Rate</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.statistics?.longestWinStreak || 0)}</span>
                  <span className="metric-label">Win Streak</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.statistics?.longestLossStreak || 0)}</span>
                  <span className="metric-label">Loss Streak</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.statistics?.profitFactor || 0)}</span>
                  <span className="metric-label">Profit Factor</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.statistics?.totalStake || selectedBot.totalStake || 0)}</span>
                  <span className="metric-label">Total Stake</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.statistics?.totalPayout || selectedBot.totalPayout || 0)}</span>
                  <span className="metric-label">Total Payout</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{String(selectedBot.statistics?.totalProfit || selectedBot.netProfit || selectedBot.totalProfit || 0)}</span>
                  <span className="metric-label">Total Profit</span>
                </div>
              </div>

              <Divider />

              {/* Advanced Settings Section */}
              <h3 className="advanced-settings-header">Advanced Settings</h3>
              
              {/* General Settings */}
              <div style={{marginTop: '16px', marginBottom: '24px'}}>
                <h4 className="metric-section-header">⚙️ General Settings</h4>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{borderRadius: '8px'}}
                >
                  <Descriptions.Item label="Max Trades">
                    {selectedBot.advanced_settings?.general_settings_section?.maximum_number_of_trades || 'Unlimited'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Runtime">
                    {selectedBot.advanced_settings?.general_settings_section?.maximum_running_time || 'Unlimited'} min
                  </Descriptions.Item>
                  <Descriptions.Item label="Cooldown">
                    {selectedBot.advanced_settings?.general_settings_section?.cooldown_period ? 
                      `${selectedBot.advanced_settings.general_settings_section.cooldown_period.duration} ${selectedBot.advanced_settings.general_settings_section.cooldown_period.unit}` : 
                      'None'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Recovery Type">
                    {selectedBot.advanced_settings?.general_settings_section?.recovery_type || 'None'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Compound Stake">
                    {selectedBot.advanced_settings?.general_settings_section?.compound_stake ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Auto Restart">
                    {selectedBot.advanced_settings?.general_settings_section?.auto_restart ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {/* Risk Management */}
              <div style={{marginBottom: '24px'}}>
                <h4 className="metric-section-header">🛡️ Risk Management</h4>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{borderRadius: '8px'}}
                >
                  <Descriptions.Item label="Max Daily Loss">
                    {String(selectedBot.advanced_settings?.risk_management_section?.max_daily_loss || 'Not set')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Daily Profit">
                    {String(selectedBot.advanced_settings?.risk_management_section?.max_daily_profit || 'Not set')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Consecutive Losses">
                    {String(selectedBot.advanced_settings?.risk_management_section?.max_consecutive_losses || 'Not set')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Drawdown">
                    {selectedBot.advanced_settings?.risk_management_section?.max_drawdown_percentage ? 
                      `${selectedBot.advanced_settings.risk_management_section.max_drawdown_percentage}%` : 
                      'Not set'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Risk Per Trade">
                    {selectedBot.advanced_settings?.risk_management_section?.risk_per_trade ? 
                      `${selectedBot.advanced_settings.risk_management_section.risk_per_trade}%` : 
                      'Not set'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Position Sizing">
                    {selectedBot.advanced_settings?.risk_management_section?.position_sizing ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Emergency Stop">
                    {selectedBot.advanced_settings?.risk_management_section?.emergency_stop ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {/* Volatility Controls */}
              <div style={{marginBottom: '24px'}}>
                <h4 className="metric-section-header">📊 Volatility Controls</h4>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{borderRadius: '8px'}}
                >
                  <Descriptions.Item label="Volatility Filter">
                    {selectedBot.advanced_settings?.volatility_controls_section?.volatility_filter ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Min Volatility">
                    {selectedBot.advanced_settings?.volatility_controls_section?.min_volatility || 'Not set'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Volatility">
                    {selectedBot.advanced_settings?.volatility_controls_section?.max_volatility || 'Not set'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Volatility Adjustment">
                    {selectedBot.advanced_settings?.volatility_controls_section?.volatility_adjustment ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Pause on High Volatility">
                    {selectedBot.advanced_settings?.volatility_controls_section?.pause_on_high_volatility ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lookback Period">
                    {selectedBot.advanced_settings?.volatility_controls_section?.volatility_lookback_period || 'Not set'}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {/* Market Conditions */}
              <div style={{marginBottom: '24px'}}>
                <h4 className="metric-section-header">🌍 Market Conditions</h4>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{borderRadius: '8px'}}
                >
                  <Descriptions.Item label="Trend Detection">
                    {selectedBot.advanced_settings?.market_conditions_section?.trend_detection ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trend Strength Threshold">
                    {selectedBot.advanced_settings?.market_conditions_section?.trend_strength_threshold || 'Not set'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Avoid Ranging Market">
                    {selectedBot.advanced_settings?.market_conditions_section?.avoid_ranging_market ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Market Correlation Check">
                    {selectedBot.advanced_settings?.market_conditions_section?.market_correlation_check ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Time of Day Filter">
                    {selectedBot.advanced_settings?.market_conditions_section?.time_of_day_filter ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Preferred Trading Hours">
                    {selectedBot.advanced_settings?.market_conditions_section?.preferred_trading_hours || 'Not set'}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {/* Recovery Settings */}
              <div style={{marginBottom: '24px'}}>
                <h4 className="metric-section-header">🔄 Recovery Settings</h4>
                <Descriptions
                  bordered
                  column={1}
                  size="small"
                  style={{borderRadius: '8px'}}
                >
                  <Descriptions.Item label="Progressive Recovery">
                    {selectedBot.advanced_settings?.recovery_settings_section?.progressive_recovery ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Recovery Multiplier">
                    {selectedBot.advanced_settings?.recovery_settings_section?.recovery_multiplier || 'Not set'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Recovery Attempts">
                    {selectedBot.advanced_settings?.recovery_settings_section?.max_recovery_attempts || 'Not set'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Recovery Cooldown">
                    {selectedBot.advanced_settings?.recovery_settings_section?.recovery_cooldown ? 
                      `${selectedBot.advanced_settings.recovery_settings_section.recovery_cooldown.duration} ${selectedBot.advanced_settings.recovery_settings_section.recovery_cooldown.unit}` : 
                      'None'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Partial Recovery">
                    {selectedBot.advanced_settings?.recovery_settings_section?.partial_recovery ? '✅ Enabled' : '❌ Disabled'}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {/* Footer with Creator and Control Button */}
              <div className="strategy-footer">
                <div className="author-info">
                  <Avatar size="small" icon={<UserOutlined />} />
                  <div className="author-details">
                    <strong>{selectedBot.createdBy}</strong>
                    <span>Bot Creator</span>
                  </div>
                </div>
                <Button
                  type="primary"
                  className="create-btn"
                  onClick={() => handleBotAction(selectedBot.botUUID, selectedBot.status === 'START' ? 'STOP' : 'START')}
                >
                  {selectedBot.status === 'START' ? 'Stop' : 'Start'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

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
