import React, { useState, useEffect, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Input,
  message,
  Avatar,
  Segmented,
  Dropdown,
  Tag,
  Row,
  Col,
  Typography,
  Space,
  Flex,
  Spin,
  Tooltip,
  Modal,
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
  SearchOutlined,
  EllipsisOutlined,
  UserOutlined,
  StarOutlined,
  StarFilled,
  EditOutlined,
  CopyOutlined,
  UnlockOutlined,
  LockOutlined,
  DeleteOutlined,
  DotChartOutlined,
  FileTextOutlined,
  HistoryOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import "./styles.scss";
import botIcon from "../../assets/bot.png";
import { BottomActionSheet } from "../BottomActionSheet/index";
import { useLocalStorage } from "../../utils/use-local-storage";
import { useEventPublisher } from "../../hooks/useEventManager";
import { Strategy, TradingBotConfig } from "../../types/strategy";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import tradingBotAPIService from "../../services/tradingBotAPIService";
import { MarketIcon } from "../MarketSelector/MarketIcons/MarketIcon";
import useSounds from "../../hooks/useSounds";
import { StandaloneEllipsisBoldIcon } from "@deriv/quill-icons";
import {
  formatCurrency,
  formatDecimal,
  currencyShorten,
} from "../../utils/stringUtils";

const { Title, Text } = Typography;

// Helper function to format currency with shortening for large values
const formatCurrencyWithShortening = (
  value: number,
  currency: string = 'GBP',
  locale: string = 'en-GB'
): string => {
  if (Math.abs(value) >= 999) {
    const shortened = currencyShorten(value, '', 2); // Get shortened value with 2 decimal places
    return `${shortened} <sup><small>${currency}</small></sup>`;
  } else {
    const formatted = formatCurrency(value, {
      locale,
      currency: '', // Don't include currency symbol in formatCurrency
      showSymbol: false,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} <sup><small>${currency}</small></sup>`;
  }
};

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

// Countdown Timer Component
const CountDownTimer = ({
  run,
  timeStarted,
  timeStopped,
}: {
  run: boolean;
  timeStarted: string;
  timeStopped: string;
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!run || !timeStarted) {
      // If not running or no start time, don't calculate elapsed time
      return;
    }

    const startTime = new Date(timeStarted).getTime();

    const calculateElapsed = () => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed > 0 ? elapsed : 0);
    };

    // Calculate initial elapsed time
    calculateElapsed();

    // Update every second only when running
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [run, timeStarted]);

  // Handle paused state - show time elapsed until stopped
  useEffect(() => {
    if (!run && timeStarted && timeStopped) {
      const startTime = new Date(timeStarted).getTime();
      const stoppedTime = new Date(timeStopped).getTime();
      const elapsed = Math.floor((stoppedTime - startTime) / 1000);
      setElapsedSeconds(elapsed > 0 ? elapsed : 0);
    }
  }, [run, timeStarted, timeStopped]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return formatTime(elapsedSeconds);
};

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
        <h3 style={{ marginBottom: 0 }}>🎯 Trading Strategies</h3>
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

export function Bots2() {
  const { publish } = useEventPublisher();
  const {
    playBotStart,
    playBotPause,
    playBotResume,
    playBotStop,
    playSuccess,
    playWarn,
    playError,
  } = useSounds({
    volume: 0.7,
    interrupt: true,
  });

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

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<TradingBotConfig | null>(null);
  const [isBotDetailsLoading, setIsBotDetailsLoading] = useState(false);

  const [currentState, setCurrentState] = useState("BOT_DETAILS");

  // Memoized bot drawer title
  const botDrawerTitle = useMemo(() => {
    switch (currentState) {
      case "BOT_DETAILS": {
        return "Bot Details";
      }
      case "BOT_TRANSACTIONS": {
        return "Bot Transactions";
      }
      case "BOT_AUDIT_TRAIL": {
        return "Bot Audit Trail";
      }
      default: {
        return "Bot Details";
      }
    }
  }, [currentState]);

  const [bots, setBots] = useLocalStorage<TradingBotConfig[]>("my_bots", {
    defaultValue: myBots,
  });

  useEffect(() => {
    setBots(myBots);
    console.warn({ myBots });
  }, [myBots]);

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
    if (typeof seconds === "string") {
      seconds = new Date(seconds).getSeconds();
    }
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate net profit
  const getNetProfit = (bot: TradingBotConfig): number => {
    const totalStake = parseFloat(String(bot?.realtimePerformance?.totalStake || bot?.totalStake || 0));
    const totalPayout = parseFloat(String(bot?.realtimePerformance?.totalPayout || bot?.totalPayout || 0));
    return totalPayout - totalStake;
  };

  // Calculate win rate
  const getWinRate = (bot: TradingBotConfig): number => {
    const wins = parseInt(String(bot?.realtimePerformance?.numberOfWins || bot?.numberOfWins || 0));
    const totalRuns = parseInt(String(bot?.realtimePerformance?.numberOfLosses || bot?.numberOfLosses || 0)) + wins;
    
    if (totalRuns === 0) return 0;
    return Math.round((wins / totalRuns) * 100);
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

  // Helper function to determine if an action should be enabled based on bot status
  const isActionEnabled = (action: string, botStatus: string) => {
    switch (action) {
      case "START":
        return botStatus === "STOP";
      case "PAUSE":
        return botStatus === "START" || botStatus === "RESUME";
      case "RESUME":
        return botStatus === "PAUSE";
      case "STOP":
        return (
          botStatus === "START" ||
          botStatus === "PAUSE" ||
          botStatus === "RESUME"
        );
      default:
        return true; // Non-control actions are always enabled
    }
  };

  // Handle bot audit action
  const handleAuditBot = (botUUID: string) => {
    const bot = (bots || []).find((b) => b.botUUID === botUUID);
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

      // Play sound for the action being initiated
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
        switch (action) {
          case "START":
            playBotStart();
            break;
          case "PAUSE":
            playBotPause();
            break;
          case "RESUME":
            playBotResume();
            break;
          case "STOP":
            playBotStop();
            break;
        }
      } else {
        message.error(response.message || `Failed to ${action} bot`);
        playError(); // Play error sound for failed action
      }

      // Refresh the general bots list
      refreshMyBots();
      stateEditBotShow(true);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      message.error(errorMessage);
      playError(); // Play error sound for exception
    }
  };

  // Handle bot cloning action
  const handleCloneBot = async (botUUID: string) => {
    try {
      // Play a sound to initiate cloning
      playSuccess(); // Use success sound for cloning initiation

      const response = await tradingBotAPIService.cloneBot(botUUID);

      if (response.success) {
        message.success(`Bot "${response.data.botName}" cloned successfully!`);
        playSuccess(); // Play success sound for successful cloning

        // Refresh the bots list to show the new cloned bot
        refreshMyBots();
      } else {
        message.error(response.message || "Failed to clone bot");
        playError(); // Play error sound for failed cloning
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      message.error(`Failed to clone bot: ${errorMessage}`);
      playError(); // Play error sound for exception
    }
  };

  // Handle bot editing action
  const handleEditBot = (bot: TradingBotConfig) => {
    if (isBotRunning(bot)) {
      showRunningBotWarning("edit the bot", () => {
        executeEditBot(bot);
      });
      return;
    }
    
    executeEditBot(bot);
  };

  // Execute bot editing action
  const executeEditBot = (bot: TradingBotConfig) => {
    // Find the strategy for this bot
    const strategy = { strategyId: bot.strategyId };

    // Publish EDIT_BOT event with strategy and bot data
    publish("EDIT_BOT", {
      strategy,
      bot,
    });
  };

  // Helper function to check if bot is in running state
  const isBotRunning = (bot: TradingBotConfig | null) => {
    return bot?.status === "START" || bot?.status === "PAUSE" || bot?.status === "RESUME";
  };

  // Show warning modal for running bot
  const showRunningBotWarning = (action: string, onConfirm: () => void) => {
    playWarn();
    
    Modal.confirm({
      title: "Bot is Running",
      content: `The bot is currently running (${selectedBot?.status}). Please stop the bot first before attempting to ${action}.`,
      okText: "Stop Bot & Proceed",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          // Stop the bot first
          await tradingBotAPIService.stopBot(selectedBot?.botUUID || "");
          message.success("Bot stopped successfully");
          
          // Refresh bot data
          const updatedBotData = await tradingBotAPIService.getBot(selectedBot?.botUUID || "");
          if (updatedBotData.success) {
            setSelectedBot(updatedBotData?.data as unknown as TradingBotConfig);
          }
          
          // Refresh bots list
          await refreshMyBots();
          
          // Execute the original action
          onConfirm();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          message.error(`Failed to stop bot: ${errorMessage}`);
          playError();
        }
      },
    });
  };

  // Handle premium status toggle
  const handleTogglePremium = async (botUUID: string, isPremium: boolean) => {
    if (isBotRunning(selectedBot)) {
      showRunningBotWarning("change premium status", () => {
        executeTogglePremium(botUUID, isPremium);
      });
      return;
    }
    
    await executeTogglePremium(botUUID, isPremium);
  };

  // Execute premium status toggle
  const executeTogglePremium = async (botUUID: string, isPremium: boolean) => {
    try {
      if (isPremium) {
        await tradingBotAPIService.markBotAsPremium(botUUID);
        message.success("Bot marked as Premium");
      } else {
        await tradingBotAPIService.markBotAsFree(botUUID);
        message.success("Bot marked as Free");
      }
      
      // Refresh bot data
      if (selectedBot?.botUUID === botUUID) {
        const updatedBotData = await tradingBotAPIService.getBot(botUUID);
        if (updatedBotData.success) {
          setSelectedBot(updatedBotData?.data as unknown as TradingBotConfig);
        }
      }
      
      // Refresh bots list
      await refreshMyBots();
      playSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      message.error(`Failed to update premium status: ${errorMessage}`);
      playError();
    }
  };

  // Handle activation status toggle
  const handleToggleActivation = async (botUUID: string, isActive: boolean) => {
    if (isBotRunning(selectedBot)) {
      showRunningBotWarning("change activation status", () => {
        executeToggleActivation(botUUID, isActive);
      });
      return;
    }
    
    await executeToggleActivation(botUUID, isActive);
  };

  // Execute activation status toggle
  const executeToggleActivation = async (botUUID: string, isActive: boolean) => {
    try {
      if (isActive) {
        await tradingBotAPIService.markBotAsActive(botUUID);
        message.success("Bot activated");
      } else {
        await tradingBotAPIService.markBotAsInactive(botUUID);
        message.success("Bot deactivated");
      }
      
      // Refresh bot data
      if (selectedBot?.botUUID === botUUID) {
        const updatedBotData = await tradingBotAPIService.getBot(botUUID);
        if (updatedBotData.success) {
          setSelectedBot(updatedBotData?.data as unknown as TradingBotConfig);
        }
      }
      
      // Refresh bots list
      await refreshMyBots();
      playSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      message.error(`Failed to update activation status: ${errorMessage}`);
      playError();
    }
  };

  // Handle visibility toggle
  const handleToggleVisibility = async (botUUID: string, isPublic: boolean) => {
    if (isBotRunning(selectedBot)) {
      showRunningBotWarning("change visibility", () => {
        executeToggleVisibility(botUUID, isPublic);
      });
      return;
    }
    
    await executeToggleVisibility(botUUID, isPublic);
  };

  // Execute visibility toggle
  const executeToggleVisibility = async (botUUID: string, isPublic: boolean) => {
    try {
      if (isPublic) {
        await tradingBotAPIService.setAsPublic(botUUID);
        message.success("Bot made public");
      } else {
        await tradingBotAPIService.setAsPrivate(botUUID);
        message.success("Bot made private");
      }
      
      // Refresh bot data
      if (selectedBot?.botUUID === botUUID) {
        const updatedBotData = await tradingBotAPIService.getBot(botUUID);
        if (updatedBotData.success) {
          setSelectedBot(updatedBotData?.data as unknown as TradingBotConfig);
        }
      }
      
      // Refresh bots list
      await refreshMyBots();
      playSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      message.error(`Failed to update visibility: ${errorMessage}`);
      playError();
    }
  };

  // Handle bot deletion with confirmation
  const handleDeleteBot = (botUUID: string, botName: string) => {
    if (isBotRunning(selectedBot)) {
      showRunningBotWarning("delete the bot", () => {
        executeDeleteBot(botUUID, botName);
      });
      return;
    }
    
    executeDeleteBot(botUUID, botName);
  };

  // Execute bot deletion
  const executeDeleteBot = (botUUID: string, botName: string) => {
    // Play warning sound when showing delete confirmation
    playWarn();
    
    Modal.confirm({
      title: "Delete Bot",
      content: `Are you sure you want to delete the bot "${botName}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await tradingBotAPIService.deleteBot(botUUID);
          message.success("Bot deleted successfully");
          
          // Close drawer if deleted bot is selected
          if (selectedBot?.botUUID === botUUID) {
            setAuditDrawerOpen(false);
            setSelectedBot(null);
          }
          
          // Refresh bots list
          await refreshMyBots();
          playSuccess();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          message.error(`Failed to delete bot: ${errorMessage}`);
          playError();
        }
      },
    });
  };

  const stateEditBotShow = async (silence: boolean = false) => {
    if (!silence) {
      setIsBotDetailsLoading(true);
    }

    // Fetch the specific bot's latest data from API
    try {
      const updatedBotData = await tradingBotAPIService.getBot(
        selectedBot?.botUUID || "",
      );
      if (updatedBotData.success) {
        setSelectedBot(updatedBotData?.data as unknown as TradingBotConfig);
      }
    } catch (error) {
      console.error("Failed to fetch updated bot details:", error);
    } finally {
      setIsBotDetailsLoading(false);
    }
  };

  useEffect(() => {
    switch (currentState) {
      case "BOT_DETAILS":
        stateEditBotShow();
        break;
      case "BOT_TRANSACTIONS":
        console.log("Showing bot transactions");
        break;
      case "BOT_AUDIT_TRAIL":
        console.log("Showing bot audit trail");
        break;
      default:
        console.log("Default case");
        break;
    }
  }, [currentState]);

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
              {filteredBots.map((bot: TradingBotConfig) => {
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
                          {String(bot?.strategyId).toUpperCase()} •{" "}
                          {bot?.contract?.market?.displayName} •{" "}
                          {bot?.contract?.contractType}
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
                              {formatTime(
                                bot.realtimePerformance?.startedAt || 0,
                              )}
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
                              className={`stat-value ${isProfit ? "profit" : "loss"}`}
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
                              <small>
                                {bot?.realtimePerformance?.numberOfWins}/
                                {bot?.realtimePerformance?.totalRuns}
                              </small>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="bot-controls">
                        <div className="control-buttons">
                          <Tooltip
                            title={
                              bot?.status === "START" ? "Running" : "Start"
                            }
                          >
                            <Button
                              className={`control-btn start-btn ${bot?.status === "START" ? "current-state" : ""}`}
                              onClick={() =>
                                handleBotAction(bot?.botUUID, "START")
                              }
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
                              onClick={() =>
                                handleBotAction(bot?.botUUID, "PAUSE")
                              }
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
                              onClick={() =>
                                handleBotAction(bot?.botUUID, "STOP")
                              }
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
        title={botDrawerTitle}
        open={auditDrawerOpen}
        onClose={() => setAuditDrawerOpen(false)}
        size="100%"
        placement="right"
        className="bot-details-drawer"
        extra={
          <>
            {selectedBot && (
              <Dropdown
                key="more"
                menu={{
                  items: [
                    {
                      key: "View Bot Details",
                      icon:
                        currentState === "BOT_DETAILS" ? (
                          <CheckOutlined />
                        ) : (
                          <FileTextOutlined />
                        ),
                      label: "View Bot Details",
                      disabled: currentState === "BOT_DETAILS",
                      onClick: () => setCurrentState("BOT_DETAILS"),
                    },
                    {
                      key: "View Bot Transactions",
                      icon:
                        currentState === "BOT_TRANSACTIONS" ? (
                          <CheckOutlined />
                        ) : (
                          <HistoryOutlined />
                        ),
                      label: "View Bot Transactions",
                      disabled: currentState === "BOT_TRANSACTIONS",
                      onClick: () => setCurrentState("BOT_TRANSACTIONS"),
                    },
                    {
                      key: "View Bot Audit Trail",
                      icon:
                        currentState === "BOT_AUDIT_TRAIL" ? (
                          <CheckOutlined />
                        ) : (
                          <FileSearchOutlined />
                        ),
                      label: "View Bot Audit Trail",
                      disabled: currentState === "BOT_AUDIT_TRAIL",
                      onClick: () => setCurrentState("BOT_AUDIT_TRAIL"),
                    },
                    { type: "divider" },
                    {
                      key: "edit",
                      icon: <EditOutlined />,
                      label: "Edit Bot",
                      onClick: () => handleEditBot(selectedBot),
                    },
                    {
                      key: "clone",
                      icon: <CopyOutlined />,
                      label: "Clone Bot",
                      onClick: () => handleCloneBot(selectedBot?.botUUID),
                    },
                    { type: "divider" },
                    {
                      key: "startBot",
                      icon: <PlayCircleOutlined />,
                      label: "Start Bot",
                      disabled: !isActionEnabled("START", selectedBot?.status),
                      onClick: () =>
                        handleBotAction(selectedBot?.botUUID, "START"),
                    },
                    {
                      key: "pauseResumeBot",
                      icon:
                        selectedBot?.status === "START" ||
                        selectedBot?.status === "RESUME" ? (
                          <PauseCircleOutlined />
                        ) : (
                          <PlayCircleOutlined />
                        ),
                      label:
                        selectedBot?.status === "START" ||
                        selectedBot?.status === "RESUME"
                          ? "Pause Bot"
                          : "Resume Bot",
                      disabled: !isActionEnabled(
                        selectedBot?.status === "START" ||
                          selectedBot?.status === "RESUME"
                          ? "PAUSE"
                          : "RESUME",
                        selectedBot?.status,
                      ),
                      onClick: () =>
                        handleBotAction(
                          selectedBot?.botUUID,
                          selectedBot?.status === "START" ||
                            selectedBot?.status === "RESUME"
                            ? "PAUSE"
                            : "RESUME",
                        ),
                    },
                    {
                      key: "stopBot",
                      icon: <StopOutlined />,
                      label: "Stop Bot",
                      disabled: !isActionEnabled("STOP", selectedBot?.status),
                      onClick: () =>
                        handleBotAction(selectedBot?.botUUID, "STOP"),
                    },
                    { type: "divider" },
                    ...(selectedBot?.isPremium !== false ? [{
                      key: "makeFree",
                      icon: <UnlockOutlined />,
                      label: "Mark Bot as Free",
                      onClick: () => handleTogglePremium(selectedBot?.botUUID, false),
                    }] : []),
                    ...(selectedBot?.isPremium !== true ? [{
                      key: "makePremium",
                      icon: <LockOutlined />,
                      label: "Mark Bot as Premium",
                      onClick: () => handleTogglePremium(selectedBot?.botUUID, true),
                    }] : []),
                    ...(selectedBot?.isActive !== true ? [{
                      key: "activate",
                      icon: <PlayCircleOutlined />,
                      label: "Activate Bot",
                      onClick: () => handleToggleActivation(selectedBot?.botUUID, true),
                    }] : []),
                    ...(selectedBot?.isActive !== false ? [{
                      key: "deactivate",
                      icon: <StopOutlined />,
                      label: "Deactivate Bot",
                      onClick: () => handleToggleActivation(selectedBot?.botUUID, false),
                    }] : []),
                    ...(selectedBot?.isPublic !== true ? [{
                      key: "makePublic",
                      icon: <UnlockOutlined />,
                      label: "Mark Bot as Public",
                      onClick: () => handleToggleVisibility(selectedBot?.botUUID, true),
                    }] : []),
                    ...(selectedBot?.isPublic !== false ? [{
                      key: "makePrivate",
                      icon: <LockOutlined />,
                      label: "Mark Bot as Private",
                      onClick: () => handleToggleVisibility(selectedBot?.botUUID, false),
                    }] : []),
                    {
                      key: "delete",
                      icon: <DeleteOutlined />,
                      label: "Delete Bot",
                      danger: true,
                      onClick: () => handleDeleteBot(selectedBot?.botUUID, selectedBot?.botName),
                    },
                  ].filter(Boolean),
                }}
                trigger={["click"]}
              >
                <Button
                  style={{ border: "none" }}
                  type="text"
                  icon={<StandaloneEllipsisBoldIcon />}
                />
              </Dropdown>
            )}
          </>
        }
      >
        {selectedBot && (
          <>
            {currentState === "BOT_DETAILS" &&
              (isBotDetailsLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "200px",
                  }}
                >
                  <Spin size="large" />
                </div>
              ) : (
                <div className="strategy-card">
                  {/* Content */}
                  <div className="strategy-card-content">
                    <Card
                      className="bot-info-card"
                      style={{ width: "100%" }}
                      cover={
                        <>
                          <img
                            draggable={false}
                            alt={selectedBot?.botName}
                            src={selectedBot?.botBanner || "/no-image.svg"}
                            style={{
                              mixBlendMode: selectedBot?.botBanner
                                ? "normal"
                                : "multiply",
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/no-image.svg";
                            }}
                          />
                          <Flex
                            align="center"
                            justify="space-between"
                            className={`bot-running-time ${selectedBot?.status?.toLowerCase()}`}
                          >
                            {selectedBot?.status === "START" ||
                            selectedBot?.status === "PAUSE" ||
                            selectedBot?.status === "RESUME" ? (
                              <div className="contract-strategy-id">
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color:
                                      selectedBot?.status === "START" ||
                                      selectedBot?.status === "RESUME"
                                        ? "#36a100ff"
                                        : selectedBot?.status === "PAUSE"
                                          ? "#ff9800"
                                          : "#666",
                                  }}
                                >
                                  {selectedBot?.status === "START"
                                    ? "🟢 RUNNING"
                                    : selectedBot?.status === "PAUSE"
                                      ? "🟠 PAUSED"
                                      : "🟢 RESUMED"}
                                </span>
                              </div>
                            ) : (
                              <div className="contract-strategy-id">
                                <span
                                  style={{ fontWeight: 700, color: "#f44336" }}
                                >
                                  🔴 STOPPED
                                </span>
                              </div>
                            )}
                            <code>
                              <strong>
                                <CountDownTimer
                                  run={
                                    selectedBot?.status === "START" ||
                                    selectedBot?.status === "RESUME"
                                  }
                                  timeStarted={
                                    selectedBot?.realtimePerformance?.startedAt || ""
                                  }
                                  timeStopped={
                                    selectedBot?.realtimePerformance?.stoppedAt || ""
                                  }
                                />
                              </strong>
                            </code>
                          </Flex>
                        </>
                      }
                      actions={[
                        // When STARTED / RESUMED: Show PAUSE & STOP
                        selectedBot?.status === "START" ||
                        selectedBot?.status === "RESUME"
                          ? [
                              <Button
                                type="text"
                                key="pause"
                                size="large"
                                onClick={() =>
                                  handleBotAction(selectedBot?.botUUID, "PAUSE")
                                }
                              >
                                ⏸️ Pause
                              </Button>,
                              <Button
                                type="text"
                                key="stop"
                                size="large"
                                onClick={() =>
                                  handleBotAction(selectedBot?.botUUID, "STOP")
                                }
                              >
                                ⏹️ Stop
                              </Button>,
                            ]
                          : // When PAUSED: Show RESUME & STOP
                            selectedBot?.status === "PAUSE"
                            ? [
                                <Button
                                  key="resume"
                                  type="text"
                                  size="large"
                                  onClick={() =>
                                    handleBotAction(
                                      selectedBot?.botUUID,
                                      "RESUME",
                                    )
                                  }
                                >
                                  ▶️ Resume
                                </Button>,
                                <Button
                                  key="stop"
                                  type="text"
                                  size="large"
                                  onClick={() =>
                                    handleBotAction(
                                      selectedBot?.botUUID,
                                      "STOP",
                                    )
                                  }
                                >
                                  ⏹️ Stop
                                </Button>,
                              ]
                            : // When STOPPED or other states: Show START
                              [
                                <Button
                                  key="start"
                                  type="text"
                                  size="large"
                                  onClick={() =>
                                    handleBotAction(
                                      selectedBot?.botUUID,
                                      "START",
                                    )
                                  }
                                >
                                  ▶️ Start
                                </Button>,
                              ],
                      ].flat()}
                    >
                      <div style={{ padding: 32, paddingBottom: 0 }}>
                        <h2 style={{ marginBottom: "12px" }}>
                          {selectedBot?.botName || "No title available"}
                        </h2>
                        <p style={{ marginBottom: "12px" }}>
                          {selectedBot?.botDescription ||
                            "No description available"}
                        </p>
                        {selectedBot?.botTags &&
                          selectedBot?.botTags.length > 0 && (
                            <div className="strategy-tags">
                              {selectedBot?.botTags.map(
                                (tag: string, index: number) => (
                                  <Badge
                                    key={index}
                                    status="processing"
                                    text={tag}
                                  />
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </Card>

                    <Divider />
                    <h3 style={{ marginBottom: 0 }}>Contract Details</h3>
                    <div className="strategy-metrics">
                      <div
                        className="metric-item contract-details"
                        style={{ textAlign: "left" }}
                      >
                        <div className="contract-info">
                          <div className="contract-icon">
                            <MarketIcon
                              symbol={
                                selectedBot?.contract?.market?.symbol || ""
                              }
                              size="large"
                            />
                          </div>
                          <div className="contract-details-content">
                            <div className="contract-name">
                              {String(
                                selectedBot?.contract?.market?.displayName ||
                                  "Unknown Market",
                              )}
                            </div>
                            <div className="contract-type">
                              {String(selectedBot?.strategyId || "N/A")}
                              &nbsp;&bull;&nbsp;
                              {String(
                                selectedBot?.contract?.market?.shortName ||
                                  "Unknown Market",
                              )}
                              &nbsp;&bull;&nbsp;
                              {String(
                                selectedBot?.contract?.market?.symbol || "",
                              )}
                            </div>
                            <div className="contract-predictions">
                              {String(
                                selectedBot?.contract?.contractType || "N/A",
                              )}
                              &nbsp;&bull;&nbsp;
                              {String(selectedBot?.contract?.tradeType || "N/A")}
                              &nbsp;&bull;&nbsp;
                              {String(
                                selectedBot?.contract?.prediction || "N/A",
                              )}
                              &nbsp;&bull;&nbsp;
                              <br />
                              <strong># {selectedBot?.botId}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="strategy-metrics">
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            selectedBot?.contract?.duration || 0,
                            1
                          )}{" "}
                          <sup><small>{selectedBot?.contract?.durationUnits}</small></sup>
                        </span>
                        <span className="metric-label">Duration</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            selectedBot?.contract?.delay || 0,
                            1
                          )} <sup><small>sec</small></sup>
                        </span>
                        <span className="metric-label">Delay</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            selectedBot?.contract?.multiplier || 1,
                            2
                          )}x
                        </span>
                        <span className="metric-label">Multiplier</span>
                      </div>
                    </div>

                    <Divider />

                    {/* Amounts Section */}
                    <h3 style={{ marginBottom: 0 }}>
                      Stake, Take Profit, Stop Loss
                    </h3>
                    <div className="strategy-metrics">
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              (selectedBot?.amounts?.base_stake as any)?.value || 0,
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        {(selectedBot?.amounts?.base_stake as any)?.type !== "fixed" && "%"}
                        <span className="metric-label">Stake</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              (selectedBot?.amounts?.take_profit as any)?.value || 0,
                              (selectedBot?.amounts?.take_profit as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        {(selectedBot?.amounts?.take_profit as any)?.type !== "fixed" && "%"}
                        <span className="metric-label">Take Profit</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              (selectedBot?.amounts?.stop_loss as any)?.value || 0,
                              (selectedBot?.amounts?.stop_loss as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        {(selectedBot?.amounts?.stop_loss as any)?.type !== "fixed" && "%"}
                        <span className="metric-label">Stop Loss</span>
                      </div>
                    </div>

                    <Divider />

                    {/* Realtime Performance */}
                    <h3 style={{ marginBottom: 0 }}>Realtime Performance</h3>
                    <div className="strategy-metrics">
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            parseInt(
                              String(
                                selectedBot?.realtimePerformance?.numberOfWins ||
                                  selectedBot?.numberOfWins ||
                                  0
                              )
                            ),
                            0
                          )}
                        </span>
                        <span className="metric-label">No. of Wins</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            parseInt(
                              String(
                                selectedBot?.realtimePerformance?.numberOfLosses ||
                                  selectedBot?.numberOfLosses ||
                                  0
                              )
                            ),
                            0
                          )}
                        </span>
                        <span className="metric-label">No. of Losses</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            parseInt(
                              String(
                                selectedBot?.realtimePerformance?.numberOfWins ||
                                  selectedBot?.numberOfWins ||
                                  0
                              )
                            ) + parseInt(
                              String(
                                selectedBot?.realtimePerformance?.numberOfLosses ||
                                  selectedBot?.numberOfLosses ||
                                  0
                              )
                            ),
                            0
                          )}
                        </span>
                        <span className="metric-label">Total Runs</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              parseFloat(
                                String(
                                  (selectedBot?.amounts?.base_stake as any)?.value ||
                                    selectedBot?.amounts?.base_stake ||
                                    selectedBot?.baseStake ||
                                    0
                                )
                              ),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        <span className="metric-label">Base Stake</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              parseFloat(
                                String(
                                  selectedBot?.realtimePerformance?.currentStake ||
                                    selectedBot?.currentStake ||
                                    0
                                )
                              ),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        <span className="metric-label">Current Stake</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              parseFloat(
                                String(
                                  selectedBot?.realtimePerformance?.highestStake ||
                                    selectedBot?.highestStake ||
                                    0
                                )
                              ),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        <span className="metric-label">Highest Stake</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              parseFloat(
                                String(
                                  selectedBot?.realtimePerformance?.totalStake ||
                                    selectedBot?.totalStake ||
                                    0
                                )
                              ),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        {(selectedBot?.amounts?.base_stake as any)?.type !== "fixed" && "%"}
                        <span className="metric-label">Total Stake</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              parseFloat(
                                String(
                                  selectedBot?.realtimePerformance?.totalPayout ||
                                    selectedBot?.totalPayout ||
                                    0
                                )
                              ),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        <span className="metric-label">Total Payout</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              (() => {
                                const totalStake = parseFloat(String(
                                  selectedBot?.realtimePerformance?.totalStake ||
                                    selectedBot?.totalStake ||
                                    0
                                ));
                                const totalPayout = parseFloat(String(
                                  selectedBot?.realtimePerformance?.totalPayout ||
                                    selectedBot?.totalPayout ||
                                    0
                                ));
                                return totalPayout - totalStake;
                              })(),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        <span className="metric-label">Total Profit</span>
                      </div>
                    </div>

                    <Divider />

                    {/* Statistics */}
                    <h3 style={{ marginBottom: 0 }}>Lifetime Stastistics</h3>
                    <div className="strategy-metrics">
                      <div className="metric-item">
                        <span className="metric-value">
                          {String(
                            selectedBot?.statistics?.lifetimeWins ||
                              selectedBot?.numberOfWins ||
                              0,
                          )}
                        </span>
                        <span className="metric-label">No. of Wins</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {String(
                            selectedBot?.statistics?.lifetimeLosses ||
                              selectedBot?.numberOfLosses ||
                              0,
                          )}
                        </span>
                        <span className="metric-label">No. of Losses</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            (() => {
                              const wins = parseInt(String(selectedBot?.realtimePerformance?.numberOfWins || selectedBot?.numberOfWins || 0));
                              const losses = parseInt(String(selectedBot?.realtimePerformance?.numberOfLosses || selectedBot?.numberOfLosses || 0));
                              const totalRuns = wins + losses;
                              if (totalRuns === 0) return 0;
                              return Math.round((wins / totalRuns) * 100);
                            })(),
                            0
                          )}%
                        </span>
                        <span className="metric-label">Win Rate</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {String(
                            selectedBot?.statistics?.longestWinStreak || 0,
                          )}
                        </span>
                        <span className="metric-label">Win Streak</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {String(
                            selectedBot?.statistics?.longestLossStreak || 0,
                          )}
                        </span>
                        <span className="metric-label">Loss Streak</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {String(selectedBot?.statistics?.profitFactor || 0)}
                        </span>
                        <span className="metric-label">Profit Factor</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              parseFloat(String(
                                selectedBot?.statistics?.totalStake ||
                                  selectedBot?.totalStake ||
                                  0
                              )),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        <span className="metric-label">Total Stake</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              parseFloat(String(
                                selectedBot?.statistics?.totalPayout ||
                                  selectedBot?.totalPayout ||
                                  0
                              )),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        <span className="metric-label">Total Payout</span>
                      </div>
                      <div className="metric-item">
                        <span 
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              (() => {
                                const totalStake = parseFloat(String(
                                  selectedBot?.statistics?.totalStake ||
                                    selectedBot?.realtimePerformance?.totalStake ||
                                    selectedBot?.totalStake ||
                                    0
                                ));
                                const totalPayout = parseFloat(String(
                                  selectedBot?.statistics?.totalPayout ||
                                    selectedBot?.realtimePerformance?.totalPayout ||
                                    selectedBot?.totalPayout ||
                                    0
                                ));
                                return totalPayout - totalStake;
                              })(),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        <span className="metric-label">Total Profit</span>
                      </div>
                    </div>

                    <Divider />

                    {/* Advanced Settings Section */}
                    <h3 className="advanced-settings-header">
                      Advanced Settings
                    </h3>

                    {/* General Settings */}
                    <div style={{ marginTop: "16px", marginBottom: "24px" }}>
                      <h4 className="metric-section-header">
                        ⚙️ General Settings
                      </h4>
                      <Descriptions
                        bordered
                        column={1}
                        size="small"
                        style={{ borderRadius: "8px" }}
                      >
                        <Descriptions.Item label="Max Trades">
                          {selectedBot?.advanced_settings
                            ?.general_settings_section
                            ?.maximum_number_of_trades || "Unlimited"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Runtime">
                          {selectedBot?.advanced_settings
                            ?.general_settings_section?.maximum_running_time ||
                            "Unlimited"}{" "}
                          min
                        </Descriptions.Item>
                        <Descriptions.Item label="Cooldown">
                          {selectedBot?.advanced_settings
                            ?.general_settings_section?.cooldown_period
                            ? `${selectedBot?.advanced_settings.general_settings_section.cooldown_period.duration} ${selectedBot?.advanced_settings.general_settings_section.cooldown_period.unit}`
                            : "None"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Recovery Type">
                          {selectedBot?.advanced_settings
                            ?.general_settings_section?.recovery_type || "None"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Compound Stake">
                          {selectedBot?.advanced_settings
                            ?.general_settings_section?.compound_stake
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Auto Restart">
                          {selectedBot?.advanced_settings
                            ?.general_settings_section?.auto_restart
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {/* Risk Management */}
                    <div style={{ marginBottom: "24px" }}>
                      <h4 className="metric-section-header">
                        🛡️ Risk Management
                      </h4>
                      <Descriptions
                        bordered
                        column={1}
                        size="small"
                        style={{ borderRadius: "8px" }}
                      >
                        <Descriptions.Item label="Max Daily Loss">
                          {String(
                            selectedBot?.advanced_settings
                              ?.risk_management_section?.max_daily_loss ||
                              "Not set",
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Daily Profit">
                          {String(
                            selectedBot?.advanced_settings
                              ?.risk_management_section?.max_daily_profit ||
                              "Not set",
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Consecutive Losses">
                          {String(
                            selectedBot?.advanced_settings
                              ?.risk_management_section
                              ?.max_consecutive_losses || "Not set",
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Drawdown">
                          {selectedBot?.advanced_settings
                            ?.risk_management_section?.max_drawdown_percentage
                            ? `${selectedBot?.advanced_settings.risk_management_section.max_drawdown_percentage}%`
                            : "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Risk Per Trade">
                          {selectedBot?.advanced_settings
                            ?.risk_management_section?.risk_per_trade
                            ? `${selectedBot?.advanced_settings.risk_management_section.risk_per_trade}%`
                            : "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Position Sizing">
                          {selectedBot?.advanced_settings
                            ?.risk_management_section?.position_sizing
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Emergency Stop">
                          {selectedBot?.advanced_settings
                            ?.risk_management_section?.emergency_stop
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {/* Volatility Controls */}
                    <div style={{ marginBottom: "24px" }}>
                      <h4 className="metric-section-header">
                        📊 Volatility Controls
                      </h4>
                      <Descriptions
                        bordered
                        column={1}
                        size="small"
                        style={{ borderRadius: "8px" }}
                      >
                        <Descriptions.Item label="Volatility Filter">
                          {selectedBot?.advanced_settings
                            ?.volatility_controls_section?.volatility_filter
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Min Volatility">
                          {selectedBot?.advanced_settings
                            ?.volatility_controls_section?.min_volatility ||
                            "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Volatility">
                          {selectedBot?.advanced_settings
                            ?.volatility_controls_section?.max_volatility ||
                            "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Volatility Adjustment">
                          {selectedBot?.advanced_settings
                            ?.volatility_controls_section?.volatility_adjustment
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Pause on High Volatility">
                          {selectedBot?.advanced_settings
                            ?.volatility_controls_section
                            ?.pause_on_high_volatility
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Lookback Period">
                          {selectedBot?.advanced_settings
                            ?.volatility_controls_section
                            ?.volatility_lookback_period || "Not set"}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {/* Market Conditions */}
                    <div style={{ marginBottom: "24px" }}>
                      <h4 className="metric-section-header">
                        🌍 Market Conditions
                      </h4>
                      <Descriptions
                        bordered
                        column={1}
                        size="small"
                        style={{ borderRadius: "8px" }}
                      >
                        <Descriptions.Item label="Trend Detection">
                          {selectedBot?.advanced_settings
                            ?.market_conditions_section?.trend_detection
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trend Strength Threshold">
                          {selectedBot?.advanced_settings
                            ?.market_conditions_section
                            ?.trend_strength_threshold || "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Avoid Ranging Market">
                          {selectedBot?.advanced_settings
                            ?.market_conditions_section?.avoid_ranging_market
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Market Correlation Check">
                          {selectedBot?.advanced_settings
                            ?.market_conditions_section
                            ?.market_correlation_check
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Time of Day Filter">
                          {selectedBot?.advanced_settings
                            ?.market_conditions_section?.time_of_day_filter
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Preferred Trading Hours">
                          {selectedBot?.advanced_settings
                            ?.market_conditions_section
                            ?.preferred_trading_hours || "Not set"}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {/* Recovery Settings */}
                    <div style={{ marginBottom: "24px" }}>
                      <h4 className="metric-section-header">
                        🔄 Recovery Settings
                      </h4>
                      <Descriptions
                        bordered
                        column={1}
                        size="small"
                        style={{ borderRadius: "8px" }}
                      >
                        <Descriptions.Item label="Progressive Recovery">
                          {selectedBot?.advanced_settings
                            ?.recovery_settings_section?.progressive_recovery
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Recovery Multiplier">
                          {selectedBot?.advanced_settings
                            ?.recovery_settings_section?.recovery_multiplier ||
                            "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Recovery Attempts">
                          {selectedBot?.advanced_settings
                            ?.recovery_settings_section
                            ?.max_recovery_attempts || "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Recovery Cooldown">
                          {selectedBot?.advanced_settings
                            ?.recovery_settings_section?.recovery_cooldown
                            ? `${selectedBot?.advanced_settings.recovery_settings_section.recovery_cooldown.duration} ${selectedBot?.advanced_settings.recovery_settings_section.recovery_cooldown.unit}`
                            : "None"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Partial Recovery">
                          {selectedBot?.advanced_settings
                            ?.recovery_settings_section?.partial_recovery
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {/* Strategy-Specific Settings */}
                    {selectedBot?.advanced_settings?.[
                      `${selectedBot?.strategyId}_strategy_section` as keyof TradingBotConfig["advanced_settings"]
                    ] && (
                      <div style={{ marginBottom: "24px" }}>
                        <h4 className="metric-section-header">
                          ⚙️{" "}
                          {selectedBot?.strategyId.charAt(0).toUpperCase() +
                            selectedBot?.strategyId.slice(1)}{" "}
                          Settings
                        </h4>
                        <Descriptions
                          bordered
                          column={1}
                          size="small"
                          style={{ borderRadius: "8px" }}
                        >
                          {Object.entries(
                            selectedBot?.advanced_settings[
                              `${selectedBot?.strategyId}_strategy_section` as keyof TradingBotConfig["advanced_settings"]
                            ],
                          ).map(([key, value]) => (
                            <Descriptions.Item
                              key={key}
                              label={key
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            >
                              {typeof value === "boolean"
                                ? value
                                  ? "✅ Enabled"
                                  : "❌ Disabled"
                                : typeof value === "object" && value !== null
                                  ? JSON.stringify(value)
                                  : String(value || "Not set")}
                            </Descriptions.Item>
                          ))}
                        </Descriptions>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div style={{ marginBottom: "24px" }}>
                      <Descriptions
                        bordered
                        column={1}
                        size="small"
                        style={{ borderRadius: "8px" }}
                      >
                        <Descriptions.Item label="Created At">
                          {selectedBot?.createdAt
                            ? new Date(selectedBot?.createdAt).toLocaleString(
                                "en-CA",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                },
                              )
                            : "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Updated At">
                          {selectedBot?.updatedAt
                            ? new Date(selectedBot?.updatedAt).toLocaleString(
                                "en-CA",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                },
                              )
                            : "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Version Date">
                          {selectedBot?.version?.date
                            ? new Date(
                                selectedBot?.version.date,
                              ).toLocaleString("en-CA", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })
                            : "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Version Current">
                          {selectedBot?.version?.current || "Not set"}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {/* Version Notes */}
                    <Card
                      className="bot-version-notes"
                      style={
                        {
                          //padding: "8px 12px",
                          //borderRadius: "8px",
                          //fontFamily: "monospace",
                          //fontSize: "12px",
                          //marginBottom: "24px",
                        }
                      }
                    >
                      <strong>Version Notes:</strong>
                      <br />
                      {selectedBot?.version?.notes || "Not set"}
                    </Card>

                    {/* Bot Status */}
                    <div style={{ marginBottom: "24px" }}>
                      <Descriptions
                        bordered
                        column={1}
                        size="small"
                        style={{ borderRadius: "8px" }}
                      >
                        <Descriptions.Item label="Is Public">
                          {selectedBot?.isPublic ? "🌍 Public" : "🔒 Private"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Is Active">
                          {selectedBot?.isActive ? "✅ Active" : "❌ Inactive"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Is Premium">
                          {selectedBot?.isPremium ? "⭐ Premium" : "🆓 Free"}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {/* Footer with Creator and Control Button */}
                    <div className="strategy-footer">
                      <div className="author-info">
                        <Avatar
                          size={48}
                          shape="square"
                          src={selectedBot?.createdBy?.photoURL || undefined}
                          icon={<UserOutlined />}
                        />
                        <div className="author-details">
                          <strong>{selectedBot?.createdBy?.displayName || "Unknown Creator"}</strong>
                          <span>Bot Creator</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {currentState === "BOT_TRANSACTIONS" && (
              <div style={{ padding: "32px" }}>
                <h2>Bot Transactions</h2>
                <p>Transaction history for {selectedBot?.botName}</p>
                {/* Add transaction content here */}
              </div>
            )}

            {currentState === "BOT_AUDIT_TRAIL" && (
              <div style={{ padding: "32px" }}>
                <h2>Bot Audit Trail</h2>
                <p>Audit trail for {selectedBot?.botName}</p>
                {/* Add audit trail content here */}
              </div>
            )}
          </>
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
