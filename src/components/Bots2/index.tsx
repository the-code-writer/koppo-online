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
import { Strategy, STORAGE_KEYS } from "../../types/strategy";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";

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
        <h3>🎯 Trading Strategies</h3>
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
    //myBots,
    freeBots,
    premiumBots,
    strategies,
    //activityHistoryItems,
    //loading,
    //error,
    //createBot,
    refreshAll,
    //refreshMyBots,
    refreshStrategies,
    //refreshActivityHistory,
    refreshFreeBots,
    refreshPremiumBots,
    premiumBotsLoading,
    freeBotsLoading,
    //myBotsLoading,
    strategiesLoading,
  } = useDiscoveryContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [updatingStats, setUpdatingStats] = useState<Set<string>>(new Set());

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const [bots, setBots] = useLocalStorage<Bot[]>("my_bots", {
    defaultValue: myBots,
  });

  const reloadBots = async () => {
    setBotsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBots(staticBots);
      setBotsLoading(false);
      message.success("Bots updated successfully");
    }, 1500);
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

  useEffect(() => {
    const heartbeat = setInterval(() => {
      setBots((prevBots: Bot[]) => {
        if (!Array.isArray(prevBots)) return prevBots;

        return prevBots.map((bot) => {
          if (bot.state !== "PLAY") return bot;

          // Trigger animation for this bot
          setUpdatingStats((prev) => new Set(prev).add(bot.id));
          setTimeout(() => {
            setUpdatingStats((prev) => {
              const newSet = new Set(prev);
              newSet.delete(bot.id);
              return newSet;
            });
          }, 400);

          // Random profit fluctuation (-0.5 to +0.8)
          const fluctuation = Math.random() * 1.3 - 0.5;
          const newProfit = bot.netProfit + fluctuation;

          // Increment running time
          const newRunningTime = (bot.runningTime || 0) + 1;

          // Occasionally update trades (1 in 30 chance per heartbeat)
          let newWins = bot.numberOfWins;
          let newLosses = bot.numberOfLosses;
          let newTotal = bot.totalTrades;

          if (Math.random() < 0.033) {
            newTotal += 1;
            if (Math.random() > 0.3) {
              // 70% win chance for mock
              newWins += 1;
            } else {
              newLosses += 1;
            }
          }

          const newWinRate =
            newTotal > 0 ? Math.round((newWins / newTotal) * 100) : 0;

          return {
            ...bot,
            netProfit: newProfit,
            runningTime: newRunningTime,
            numberOfWins: newWins,
            numberOfLosses: newLosses,
            totalTrades: newTotal,
            winRate: newWinRate,
            lastRunAt: new Date(),
          };
        });
      });
    }, 1000); // Update every second

    return () => clearInterval(heartbeat);
  }, [setBots]);

  useEffect(() => {
    console.log("MY BOTS", bots);
    setBots(myBots);
  }, [myBots]);

  // Handle scroll events for header positioning
  useEffect(() => {
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
    (bot: Bot) =>
      bot.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.marketName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.strategyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.contractType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Format running time to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate net profit
  const getNetProfit = (bot: Bot): number => {
    return bot.netProfit || 0;
  };

  // Calculate win rate
  const getWinRate = (bot: Bot): number => {
    if (bot.totalTrades === 0) return 0;
    return Math.round((bot.numberOfWins / bot.totalTrades) * 100);
  };

  // Get status configuration
  const getStatusConfig = (state: string) => {
    switch (state) {
      case "PLAY":
        return { color: "#52c41a", label: "Running", icon: "🟢" };
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
  const handleAuditBot = (botId: string) => {
    message.info(`Auditing bot ${botId}`);
    // TODO: Implement audit functionality
  };

  // Handle bot control actions
  const handleBotAction = async (
    botId: string,
    action: "start" | "pause" | "stop",
  ) => {
    try {
      let response;
      switch (action) {
        case "start":
          response = await botAPI.startBot(botId);
          break;
        case "pause":
          response = await botAPI.pauseBot(botId);
          break;
        case "stop":
          response = await botAPI.stopBot(botId);
          break;
      }

      if (response.success) {
        message.success(`Bot ${action}ed successfully`);
      } else {
        message.error(response.error || `Failed to ${action} bot`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      message.error(`Failed to ${action} bot: ${errorMessage}`);
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
              {filteredBots.map((bot) => {
                const statusConfig = getStatusConfig(bot.state);
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
                    key={bot.id}
                    className="bot-card-wrapper"
                  >
                    <Card
                      className={`bot-card ${bot.state === "PLAY" ? "running" : ""}`}
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
                            {bot.botName}
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
                          {bot.marketName} • {bot.strategyName}
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
                              {formatTime(bot.runningTime || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <DollarOutlined />
                            <span className="stat-label">
                              Profit{" "}
                              {bot.state === "PLAY" && (
                                <span className="live-indicator" />
                              )}
                            </span>
                          </div>
                          <div className="stat-content">
                            <span
                              className={`stat-value ${isProfit ? "profit" : "loss"} ${updatingStats.has(bot.id) ? "updating" : ""}`}
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
                              {bot.baseStake}.05 <br />
                              <small>tUSDT</small>
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
                              <small>835/7,899</small>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="bot-controls">
                        <div className="control-buttons">
                          <Button
                            className="control-btn audit-btn"
                            onClick={() => handleAuditBot(bot.id)}
                          >
                            <FileSearchOutlined /> Audit
                          </Button>
                          <Tooltip
                            title={bot.state === "PLAY" ? "Running" : "Start"}
                          >
                            <Button
                              className={`control-btn start-btn ${bot.state === "PLAY" ? "current-state" : ""}`}
                              onClick={() => handleBotAction(bot.id, "start")}
                              disabled={bot.state === "PLAY"}
                            >
                              <PlayCircleOutlined />
                            </Button>
                          </Tooltip>
                          <Tooltip
                            title={bot.state === "PAUSE" ? "Paused" : "Pause"}
                          >
                            <Button
                              className={`control-btn pause-btn ${bot.state === "PAUSE" ? "current-state" : ""}`}
                              onClick={() => handleBotAction(bot.id, "pause")}
                              disabled={bot.state !== "PLAY"}
                            >
                              <PauseCircleOutlined />
                            </Button>
                          </Tooltip>
                          <Tooltip
                            title={bot.state === "STOP" ? "Stopped" : "Stop"}
                          >
                            <Button
                              className={`control-btn stop-btn ${bot.state === "STOP" ? "current-state" : ""}`}
                              onClick={() => handleBotAction(bot.id, "stop")}
                              disabled={bot.state === "STOP"}
                            >
                              <StopOutlined />
                            </Button>
                          </Tooltip>
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
