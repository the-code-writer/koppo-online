import React, { useState, useEffect, useMemo } from "react";
import { ClockCircleOutlined, DollarOutlined, ThunderboltOutlined, TrophyOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, FileSearchOutlined, CheckOutlined, CopyOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, HistoryOutlined, LockOutlined, SyncOutlined, UnlockOutlined, UserOutlined } from "@ant-design/icons";
import { Col, Card, Space, Flex, Tag, Tooltip, Button, Typography, Drawer, Avatar, Badge, Descriptions, Divider, Dropdown, Row, Spin, Table, Modal, message } from "antd";
import { CountDownTimer } from "../Composite/CountDownTimer";
import { StandaloneEllipsisBoldIcon } from "@deriv/quill-icons";
import { formatDecimal, formatCurrency, currencyShorten } from "../../utils/stringUtils";
import { MarketIcon } from "../MarketSelector/MarketIcons/MarketIcon";
import { BotRealtimePerformanceData, tradingBotAPIService, TradingBotConfig } from "../../services/tradingBotAPIService";
import { useEventPublisher, useEventSubscription } from "../../hooks/useEventManager";
import { useSounds } from "../../hooks/useSounds";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import { BotContractTrade } from "../../services/botContractTradesAPIService";

const { Title, Text } = Typography;

interface BotItemProps {
  bot: TradingBotConfig;
}

export const BotItem: React.FC<BotItemProps> = ({ bot }) => {

  // Hooks
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
  
    const { refreshMyBots, activityHistoryItems } = useDiscoveryContext();

    const { publish } = useEventPublisher();
  
  // State variables
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<TradingBotConfig | null>(bot);
  const [isBotDetailsLoading, setIsBotDetailsLoading] = useState(false);

  // Audit trail state
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPagination, setAuditPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [currentState, setCurrentState] = useState("BOT_DETAILS");

  // Memoized bot drawer title
  const botDrawerTitle = useMemo(() => {

    console.log("ACTIVITY_HISTORY_ITEMS", activityHistoryItems);

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

  useEffect(()=>{

  }, [activityHistoryItems])

  const handleTransactionClick = (transaction: BotContractTrade) => {
      publish("SHOW_TRADE_CONTRACT_DETAILS", {
        transaction,
      });
    };

  // Format changes for display
  const formatMetadata = (meta: any[] | null) => {
    
    if (!meta) return null;
    return meta.map((item:any, itemIndex:number) => (
      <div className="metadata-wrapper" key={itemIndex}>
        <span className="meta-key">{item.key}:</span> <span className="meta-value">{item.value}</span>
      </div>
    ));
  };

  // Calculate net profit
  const getNetProfit = (bot: TradingBotConfig | null): number => {
    if (!bot) return 0;
    const totalStake = parseFloat(String(bot?.realtimePerformance?.totalStake || bot?.statistics?.totalStake || 0));
    const totalPayout = parseFloat(String(bot?.realtimePerformance?.totalPayout || bot?.statistics?.totalPayout || 0));
    return totalPayout - totalStake;
  };

  // Calculate win rate
  const getWinRate = (bot: TradingBotConfig | null): number => {
    if (!bot) return 0;
    const wins = parseInt(String(bot?.realtimePerformance?.numberOfWins || bot?.statistics?.lifetimeWins || 0));
    const totalRuns = parseInt(String(bot?.realtimePerformance?.numberOfLosses || bot?.statistics?.lifetimeLosses || 0)) + wins;

    if (totalRuns === 0) return 0;
    return Math.round((wins / totalRuns) * 100);
  };

  // Get status configuration
  const getStatusConfig = (state: string) => {
    switch (state) {
      case "START":
        return { color: "#36a100ff", label: "Running", icon: "🟢" };
      case "RESUME":
        return { color: "#36a100ff", label: "Resumed", icon: "🟢" };
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

  // Check if bot is running
  const isBotRunning = (bot: TradingBotConfig | null): boolean => {
    return bot?.status === "START" || selectedBot?.status === "RESUME";
  };

  // Show running bot warning
  const showRunningBotWarning = (action: string, onConfirm: () => void) => {
    Modal.confirm({
      title: "Bot Running",
      content: `The bot is currently running. You need to stop it before you can ${action}.`,
      okText: "Stop Bot & Continue",
      cancelText: "Cancel",
      onOk: async () => {
        if (selectedBot?.botUUID) {
          await handleBotAction(selectedBot.botUUID, "STOP");
          onConfirm();
        }
      },
    });
  };

  // Format date for display
  const formatDate = (dateInput: string | number) => {
    // Convert Unix timestamp to milliseconds if it's a number
    const date = typeof dateInput === 'number' ? new Date(dateInput * 1000) : new Date(dateInput);
    return date.toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(',', '');
  };

  // Check if action is enabled based on bot status
  const isActionEnabled = (action: string, status: string): boolean => {
    switch (action) {
      case "START":
        return status !== "START" && status !== "RESUME";
      case "PAUSE":
        return status === "START" || status === "RESUME";
      case "RESUME":
        return status === "PAUSE";
      case "STOP":
        return status === "START" || status === "RESUME" || status === "PAUSE";
      default:
        return false;
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
        // Refresh the general bots list
        await refreshMyBots();
      } else {
        message.error(response.message || `Failed to ${action} bot`);
        playError(); // Play error sound for failed action
      }

      stateEditBotShow(true);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      message.error(errorMessage);
      playError(); // Play error sound for exception
    }
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

          // Refresh bots list
          await refreshMyBots();
          playSuccess();
          // Close drawer if deleted bot is selected
          if (selectedBot?.botUUID === botUUID) {
            setAuditDrawerOpen(false);
            setSelectedBot(null);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          message.error(`Failed to delete bot: ${errorMessage}`);
          playError();
        }
      },
    });
  };

  // Handle bot audit action
  const handleAuditBot = () => {
    setAuditDrawerOpen(true);
    setCurrentState("BOT_DETAILS");
    fetchAuditTrail();
  };

  // Handle audit trail fetch
  const fetchAuditTrail = async (page: number = 1) => {
    if (!selectedBot?.botUUID) return;

    setAuditLoading(true);
    try {
      const response = await tradingBotAPIService.getBotAuditTrail(selectedBot.botUUID, {
        page,
        limit: 10
      });
      if (response.success) {
        setAuditTrail(response.data.auditTrail || []);
        setAuditPagination(prev => ({
          ...prev,
          current: page,
          total: response.data.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch audit trail:", error);
      message.error("Failed to fetch audit trail");
      playError();
    } finally {
      setAuditLoading(false);
    }
  };

  // Handle audit trail pagination change
  const handleAuditPaginationChange = (page: number) => {
    fetchAuditTrail(page);
  };

  // Handle row expansion
  const handleRowExpand = (expanded: boolean, record: any) => {
    const newExpandedRows = new Set(expandedRows);
    if (expanded) {
      newExpandedRows.add(record._id);
    } else {
      newExpandedRows.delete(record._id);
    }
    setExpandedRows(newExpandedRows);
  };

  // Handle bot cloning action
  const handleCloneBot = async (botUUID: string) => {
    try {
      // Play a sound to initiate cloning
      const response = await tradingBotAPIService.cloneBot(botUUID);
      if (response.success) {
        message.success("Bot cloned successfully");
        // Refresh bots list
        await refreshMyBots();
        setAuditDrawerOpen(false);
        playSuccess();
      }else{
        message.error("Failed to clone bot");
        playError();
      }
    } catch (error) {
      console.error("Error cloning bot:", error);
      message.error("Failed to clone bot");
      playError();
    }
  };

  // Handle bot editing action
  const handleEditBot = (botData: TradingBotConfig) => {
    if (isBotRunning(botData)) {
      showRunningBotWarning("edit the bot", () => {
        executeEditBot(botData);
      });
      return;
    }
    executeEditBot(botData);
  };

  // Execute bot editing
  const executeEditBot = (botData: TradingBotConfig) => {
    publish("EDIT_BOT", {
      bot: botData,
    });
  };

  // State edit bot show
  const stateEditBotShow = async (silence: boolean = false) => {
    if (!silence) {
      setIsBotDetailsLoading(true);
    }
    try {
      if (selectedBot?.botUUID) {
        const botData = await tradingBotAPIService.getBot(selectedBot.botUUID);
        if (botData.success) {
          setSelectedBot(botData?.data as unknown as TradingBotConfig);
        }
      }
    } catch (error) {
      console.error("Error fetching bot details:", error);
      message.error("Failed to fetch bot details");
    } finally {
      setIsBotDetailsLoading(false);
    }
  };

  // Helper function to format currency with shortening for large values
  const formatCurrencyWithShortening = (
    value: number,
    currency: string = '',
    locale: string = 'en-GB'
  ): string => {
    if (Math.abs(value) >= 999) {
      const shortened = currencyShorten(value, '', 2); // Get shortened value with 2 decimal places
      return `${shortened} <br/><span className="superscript"><small>${currency}</small></span>`;
    } else {
      const formatted = formatCurrency(value, {
        locale,
        currency: '', // Don't include currency symbol in formatCurrency
        showSymbol: false,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${formatted} <br/><span className="superscript"><small>${currency}</small></span>`;
    }
  };

  const statusConfig = getStatusConfig(selectedBot?.status || "IDLE");
  const netProfit = getNetProfit(selectedBot);
  const winRate = getWinRate(selectedBot);
  const isProfit = netProfit >= 0;

  useEventSubscription("UPDATE_BOT_REALTIME_STATS", (data: BotRealtimePerformanceData) => {
  if(data.botUUID === selectedBot?.botUUID) {
    console.log("::: UPDATE_BOT_REALTIME_STATS", data);
    setSelectedBot(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        realtimePerformance: data.realtimePerformance,
        statistics: data.statistics
      };
    });
  }
});

  return (
    <>
      <Col
        xs={24}
        sm={24}
        md={12}
        lg={12}
        xl={8}
        key={selectedBot?.botUUID}
        className="bot-card-wrapper"
      >
        <Card
          className={`bot-card ${selectedBot?.status === "START" ? "running" : ""}`}
          hoverable
          size="small"
        >
          {/* Card Header */}
          <Space className="bot-card-header" vertical>
            <Flex className="bot-info" align="center" justify="space-between">
              <Title level={5} className="bot-name">
                {selectedBot?.botName}
              </Title>
              <Tag color={statusConfig.color} className="status-tag">
                {statusConfig.icon} <span>{statusConfig.label}</span>
              </Tag>
            </Flex>
            <Text type="secondary" className="bot-market">
              {String(selectedBot?.strategyId).toUpperCase()} •{" "}
              {selectedBot?.contract?.market?.displayName} • {selectedBot?.contract?.contractType}
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
                <span className="stat-value">
                  <CountDownTimer
                    run={selectedBot?.status === "START" || selectedBot?.status === "RESUME"}
                    timeStarted={selectedBot?.realtimePerformance?.startedAt || ""}
                    timeStopped={selectedBot?.realtimePerformance?.stoppedAt || ""}
                  />
                </span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <DollarOutlined />
                <span className="stat-label">
                  Profit{" "}
                  {selectedBot?.status === "START" && <span className="live-indicator" />}
                </span>
              </div>
              <div className="stat-content">
                <span className={`stat-value ${isProfit ? "profit" : "loss"}`}>
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
                  {String(selectedBot?.realtimePerformance?.currentStake || 0)} <br />
                  <small>
                    {selectedBot?.amounts?.base_stake?.value}{" "}
                    {(selectedBot?.botAccount as any)?.currency}
                  </small>
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
                    {selectedBot?.realtimePerformance?.numberOfWins}/
                    {selectedBot?.realtimePerformance?.totalRuns}
                  </small>
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bot-controls">
            <div className="control-buttons">
              <Tooltip title={selectedBot?.status === "START" ? "Running" : "Start"}>
                <Button
                  className={`control-btn start-btn ${selectedBot?.status === "START" ? "current-state" : ""}`}
                  onClick={() =>
                    selectedBot?.botUUID && handleBotAction(selectedBot.botUUID, "START")
                  }
                  disabled={selectedBot?.status === "START"}
                >
                  <PlayCircleOutlined />
                </Button>
              </Tooltip>
              <Tooltip title={selectedBot?.status === "PAUSE" ? "Paused" : "Pause"}>
                <Button
                  className={`control-btn pause-btn ${selectedBot?.status === "PAUSE" ? "current-state" : ""}`}
                  onClick={() =>
                    selectedBot?.botUUID && handleBotAction(selectedBot.botUUID, "PAUSE")
                  }
                  disabled={selectedBot?.status !== "START"}
                >
                  <PauseCircleOutlined />
                </Button>
              </Tooltip>
              <Tooltip title={selectedBot?.status === "STOP" ? "Stopped" : "Stop"}>
                <Button
                  className={`control-btn stop-btn ${selectedBot?.status === "STOP" ? "current-state" : ""}`}
                  onClick={() =>
                    selectedBot?.botUUID && handleBotAction(selectedBot.botUUID, "STOP")
                  }
                  disabled={selectedBot?.status === "STOP"}
                >
                  <StopOutlined />
                </Button>
              </Tooltip>
              <Tooltip title="View Audit Trail">
                <Button
                  className="control-btn audit-btn"
                  onClick={() =>  handleAuditBot()}
                >
                  <FileSearchOutlined /> Details
                </Button>
              </Tooltip>
            </div>
          </div>
        </Card>
      </Col>

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
            {bot && (
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <Button
                  type="text"
                  icon={<SyncOutlined spin={isBotDetailsLoading || auditLoading} />}
                  style={{ border: "none", boxShadow: "none" }}
                  onClick={() => {
                    switch (currentState) {
                      case "BOT_DETAILS":
                        stateEditBotShow();
                        break;
                      case "BOT_AUDIT_TRAIL":
                        fetchAuditTrail(auditPagination.current);
                        break;
                      case "BOT_TRANSACTIONS":
                        // Handle transactions refresh if needed
                        break;
                      default:
                        break;
                    }
                  }}
                  title="Refresh"
                />
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
                      { type: "divider" as const },
                      {
                        key: "edit",
                        icon: <EditOutlined />,
                        label: "Edit Bot",
                        onClick: () => handleEditBot(bot),
                      },
                      {
                        key: "clone",
                        icon: <CopyOutlined />,
                        label: "Clone Bot",
                        onClick: () => selectedBot?.botUUID && handleCloneBot(selectedBot.botUUID),
                      },
                      { type: "divider" as const },
                      {
                        key: "startBot",
                        icon: <PlayCircleOutlined />,
                        label: "Start Bot",
                        disabled: !selectedBot?.status || !isActionEnabled("START", selectedBot.status),
                        onClick: () =>
                          selectedBot?.botUUID && handleBotAction(selectedBot.botUUID, "START"),
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
                        disabled: !selectedBot?.status || !isActionEnabled(
                          selectedBot.status === "START" ||
                            selectedBot.status === "RESUME"
                            ? "PAUSE"
                            : "RESUME",
                          selectedBot.status,
                        ),
                        onClick: () =>
                          selectedBot?.botUUID &&
                          handleBotAction(
                            selectedBot.botUUID,
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
                        disabled: !selectedBot?.status || !isActionEnabled("STOP", selectedBot.status),
                        onClick: () =>
                          selectedBot?.botUUID && handleBotAction(selectedBot.botUUID, "STOP"),
                      },
                      { type: "divider" as const },
                      ...(selectedBot?.isPremium !== false ? [{
                        key: "makeFree",
                        icon: <UnlockOutlined />,
                        label: "Mark Bot as Free",
                        onClick: () => selectedBot?.botUUID && handleTogglePremium(selectedBot.botUUID, false),
                      }] : []),
                      ...(selectedBot?.isPremium !== true ? [{
                        key: "makePremium",
                        icon: <LockOutlined />,
                        label: "Mark Bot as Premium",
                        onClick: () => selectedBot?.botUUID && handleTogglePremium(selectedBot.botUUID, true),
                      }] : []),
                      ...(selectedBot?.isActive !== true ? [{
                        key: "activate",
                        icon: <PlayCircleOutlined />,
                        label: "Activate Bot",
                        onClick: () => selectedBot?.botUUID && handleToggleActivation(selectedBot.botUUID, true),
                      }] : []),
                      ...(selectedBot?.isActive !== false ? [{
                        key: "deactivate",
                        icon: <StopOutlined />,
                        label: "Deactivate Bot",
                        onClick: () => selectedBot?.botUUID && handleToggleActivation(selectedBot.botUUID, false),
                      }] : []),
                      ...(selectedBot?.isPublic !== true ? [{
                        key: "makePublic",
                        icon: <UnlockOutlined />,
                        label: "Mark Bot as Public",
                        onClick: () => selectedBot?.botUUID && handleToggleVisibility(selectedBot.botUUID, true),
                      }] : []),
                      ...(selectedBot?.isPublic !== false ? [{
                        key: "makePrivate",
                        icon: <LockOutlined />,
                        label: "Mark Bot as Private",
                        onClick: () => selectedBot?.botUUID && handleToggleVisibility(selectedBot.botUUID, false),
                      }] : []),
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        label: "Delete Bot",
                        danger: true,
                        onClick: () => selectedBot?.botUUID && handleDeleteBot(selectedBot.botUUID, selectedBot.botName),
                      },
                    ].filter(Boolean),
                  }}
                  trigger={["click"]}
                >
                  <Button
                    style={{ border: "none", boxShadow: "none" }}
                    type="text"
                    icon={<StandaloneEllipsisBoldIcon />}
                  />
                </Dropdown>
              </div>
            )}
          </>
        }
      >
        {bot && (
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
                                selectedBot?.botUUID && handleBotAction(selectedBot.botUUID, "PAUSE")
                              }
                            >
                              ⏸️ Pause
                            </Button>,
                            <Button
                              type="text"
                              key="stop"
                              size="large"
                              onClick={() =>
                                selectedBot?.botUUID && handleBotAction(selectedBot.botUUID, "STOP")
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
                                  selectedBot?.botUUID && handleBotAction(
                                    selectedBot.botUUID,
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
                                  selectedBot?.botUUID && handleBotAction(
                                    selectedBot.botUUID,
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
                                  selectedBot?.botUUID && handleBotAction(
                                    selectedBot.botUUID,
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
                          <br/><span className="superscript"><small>{selectedBot?.contract?.durationUnits}</small></span>
                        </span>
                        <span className="metric-label">Duration</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            selectedBot?.contract?.delay || 0,
                            1
                          )} <br/><span className="superscript"><small>sec</small></span>
                        </span>
                        <span className="metric-label">Delay</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            selectedBot?.contract?.multiplier || 1,
                            2
                          )} <br/><span className="superscript"><small>x</small></span>
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
                                ? (selectedBot?.botAccount as any)?.currency
                                : undefined
                            )
                          }}
                        />
                        {(selectedBot?.amounts?.base_stake as any)?.type === "percentage" && "%"}
                        <span className="metric-label">Stake</span>
                      </div>
                      <div className="metric-item">
                        <span
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              (selectedBot?.amounts?.take_profit as any)?.value || 0,
                              (selectedBot?.amounts?.take_profit as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
                                : undefined
                            )
                          }}
                        />
                        {(selectedBot?.amounts?.take_profit as any)?.type === "percentage" && "%"}
                        <span className="metric-label">Take Profit</span>
                      </div>
                      <div className="metric-item">
                        <span
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              (selectedBot?.amounts?.stop_loss as any)?.value || 0,
                              (selectedBot?.amounts?.stop_loss as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
                                : undefined
                            )
                          }}
                        />
                        {(selectedBot?.amounts?.stop_loss as any)?.type === "percentage" && "%"}
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
                                0
                              )
                            ) + parseInt(
                              String(
                                selectedBot?.realtimePerformance?.numberOfLosses ||
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
                                  0
                                )
                              ),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
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
                                  0
                                )
                              ),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
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
                                  0
                                )
                              ),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
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
                                  selectedBot?.statistics?.totalStake ||
                                  0
                                )
                              ),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
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
                                  selectedBot?.statistics?.totalPayout ||
                                  0
                                )
                              ),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
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
                                  selectedBot?.statistics?.totalStake ||
                                  0
                                ));
                                const totalPayout = parseFloat(String(
                                  selectedBot?.realtimePerformance?.totalPayout ||
                                  selectedBot?.statistics?.totalPayout ||
                                  0
                                ));
                                return totalPayout - totalStake;
                              })(),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
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
                            selectedBot?.realtimePerformance?.numberOfWins ||
                            0,
                          )}
                        </span>
                        <span className="metric-label">No. of Wins</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {String(
                            selectedBot?.statistics?.lifetimeLosses ||
                            selectedBot?.realtimePerformance?.numberOfLosses ||
                            0,
                          )}
                        </span>
                        <span className="metric-label">No. of Losses</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            (() => {
                              const wins = parseInt(String(selectedBot?.realtimePerformance?.numberOfWins || 0));
                              const losses = parseInt(String(selectedBot?.realtimePerformance?.numberOfLosses || 0));
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
                          {(selectedBot?.statistics?.profitFactor || 0).toFixed(2)}
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
                                selectedBot?.realtimePerformance?.totalStake ||
                                0
                              )),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
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
                                selectedBot?.realtimePerformance?.totalPayout ||
                                0
                              )),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
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
                                  0
                                ));
                                const totalPayout = parseFloat(String(
                                  selectedBot?.statistics?.totalPayout ||
                                  selectedBot?.realtimePerformance?.totalPayout ||
                                  0
                                ));
                                return totalPayout - totalStake;
                              })(),
                              (selectedBot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (selectedBot?.botAccount as any)?.currency
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
                          {(() => {
                            const cooldown = selectedBot?.advanced_settings?.general_settings_section?.cooldown_period;
                            if (!cooldown) return "None";
                            if (typeof cooldown === 'string') return `${cooldown} seconds`;
                            if (typeof cooldown === 'object' && cooldown.duration) {
                              return `${cooldown.duration} ${cooldown.unit || 'seconds'}`;
                            }
                            return "None";
                          })()}
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
                          {(() => {
                            const value = selectedBot?.advanced_settings?.risk_management_section?.max_daily_loss;
                            if (!value) return "Not set";
                            if (typeof value === 'object' && value.type === 'percentage') {
                              return `${value.value}%`;
                            }
                            if (typeof value === 'object' && value.type === 'fixed') {
                              return `$${value.value}`;
                            }
                            return String(value);
                          })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Daily Profit">
                          {(() => {
                            const value = selectedBot?.advanced_settings?.risk_management_section?.max_daily_profit;
                            if (!value) return "Not set";
                            if (typeof value === 'object' && value.type === 'percentage') {
                              return `${value.value}%`;
                            }
                            if (typeof value === 'object' && value.type === 'fixed') {
                              return `$${value.value}`;
                            }
                            return String(value);
                          })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Hourly Loss">
                          {(() => {
                            const value = selectedBot?.advanced_settings?.risk_management_section?.max_hourly_loss;
                            if (!value) return "Not set";
                            if (typeof value === 'object' && value.type === 'percentage') {
                              return `${value.value}%`;
                            }
                            if (typeof value === 'object' && value.type === 'fixed') {
                              return `$${value.value}`;
                            }
                            return String(value);
                          })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Hourly Profit">
                          {(() => {
                            const value = selectedBot?.advanced_settings?.risk_management_section?.max_hourly_profit;
                            if (!value) return "Not set";
                            if (typeof value === 'object' && value.type === 'percentage') {
                              return `${value.value}%`;
                            }
                            if (typeof value === 'object' && value.type === 'fixed') {
                              return `$${value.value}`;
                            }
                            return String(value);
                          })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Weekly Loss">
                          {(() => {
                            const value = selectedBot?.advanced_settings?.risk_management_section?.max_weekly_loss;
                            if (!value) return "Not set";
                            if (typeof value === 'object' && value.type === 'percentage') {
                              return `${value.value}%`;
                            }
                            if (typeof value === 'object' && value.type === 'fixed') {
                              return `$${value.value}`;
                            }
                            return String(value);
                          })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Weekly Profit">
                          {(() => {
                            const value = selectedBot?.advanced_settings?.risk_management_section?.max_weekly_profit;
                            if (!value) return "Not set";
                            if (typeof value === 'object' && value.type === 'percentage') {
                              return `${value.value}%`;
                            }
                            if (typeof value === 'object' && value.type === 'fixed') {
                              return `$${value.value}`;
                            }
                            return String(value);
                          })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trailing Stop Loss">
                          {(() => {
                            const value = selectedBot?.advanced_settings?.risk_management_section?.trailing_stop_loss;
                            if (!value) return "Not set";
                            if (typeof value === 'object' && value.type === 'percentage') {
                              return `${value.value}%`;
                            }
                            if (typeof value === 'object' && value.type === 'fixed') {
                              return `$${value.value}`;
                            }
                            return String(value);
                          })()}
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
                        <Descriptions.Item label="Loss Protection Mode">
                          {selectedBot?.advanced_settings
                            ?.risk_management_section?.loss_protection_mode
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Auto Reduce Stake on Loss">
                          {selectedBot?.advanced_settings
                            ?.risk_management_section?.auto_reduce_stake_on_loss
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Minimum Profit Ratio">
                          {selectedBot?.advanced_settings
                            ?.risk_management_section?.minimum_profit_ratio
                            ? `${selectedBot?.advanced_settings.risk_management_section.minimum_profit_ratio}x`
                            : "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Account Risk">
                          {selectedBot?.advanced_settings
                            ?.risk_management_section?.max_account_risk_percentage
                            ? `${selectedBot?.advanced_settings.risk_management_section.max_account_risk_percentage}%`
                            : "Not set"}
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
                            ?.volatility_lookback_period+" Ticks" || "Not set"}
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
                            ?.preferred_trading_hours || "24 Hours"}
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
                          {(() => {
                            const cooldown = selectedBot?.advanced_settings?.recovery_settings_section?.recovery_cooldown;
                            if (!cooldown) return "None";
                            if (typeof cooldown === 'string') return `${cooldown} seconds`;
                            if (typeof cooldown === 'object' && cooldown.duration) {
                              return `${cooldown.duration} ${cooldown.unit || 'seconds'}`;
                            }
                            return "None";
                          })()}
                        </Descriptions.Item>
                        <Descriptions.Item label="Partial Recovery">
                          {selectedBot?.advanced_settings
                            ?.recovery_settings_section?.partial_recovery
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Recovery Threshold">
                          {(() => {
                            const threshold = selectedBot?.advanced_settings?.recovery_settings_section?.recovery_threshold;
                            if (!threshold) return "Not set";
                            if (typeof threshold === 'object' && threshold.type === 'percentage') {
                              return `${threshold.value}%`;
                            }
                            if (typeof threshold === 'object' && threshold.type === 'fixed') {
                              return `$${threshold.value}`;
                            }
                            return String(threshold);
                          })()}
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
                            {selectedBot?.strategyId
                              ? selectedBot.strategyId.charAt(0).toUpperCase() +
                                selectedBot.strategyId.slice(1)
                              : "Unknown"}{" "}
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
                              ] || {}
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
                                    ? formatMetadata(value)
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
                          src={typeof selectedBot?.createdBy === 'object' && selectedBot?.createdBy?.photoURL || undefined}
                          icon={<UserOutlined />}
                        />
                        <div className="author-details">
                          <strong>{typeof selectedBot?.createdBy === 'object' ? selectedBot?.createdBy?.displayName : selectedBot?.createdBy || "Unknown Creator"}</strong>
                          <span>Bot Creator</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {currentState === "BOT_TRANSACTIONS" && (
              <div style={{ padding: "12px" }}>
                <h2>{selectedBot?.botName}</h2>
                <br/>
                {/* Add transaction content here */}
                <Table
                      columns={[
                        {
                          title: "Date",
                          dataIndex: "purchase_time",
                          key: "purchase_time",
                          render: (purchase_time: string | number) => formatDate(purchase_time),
                          width: 290,
                        },
                        {
                          title: "Buy",
                          dataIndex: "buy_price_value",
                          key: "buy_price_value",
                          render: (buy_price_value: number) => (
                            <span style={{display: 'block', width: '100%', textAlign: 'right', fontFamily: 'monospace'}}>{formatCurrency(buy_price_value)}</span>
                          ),
                          width: 150,
                        },
                        {
                          title: "Sell",
                          dataIndex: "sell_price_value",
                          key: "sell_price_value",
                          render: (sell_price_value: number) => (
                            <span style={{display: 'block', width: '100%', textAlign: 'right', fontFamily: 'monospace'}}>{formatCurrency(sell_price_value)}</span>
                          ),
                          width: 150,
                        },
                        {
                          title: "Profit",
                          dataIndex: "safeProfit",
                          key: "safeProfit",
                          render: (safeProfit: number) => (
                            <span style={{display: 'block', width: '100%', color: `${safeProfit<0?"red":"inherit"}`, textAlign: 'right', fontFamily: 'monospace'}}>{formatCurrency(safeProfit)}</span>
                          ),
                          width: 150,
                        },
                      ]}
                      dataSource={activityHistoryItems}
                      rowKey="proposal_id"
                      size="large"
                      onRow={(record: BotContractTrade) => ({
                        onClick: () => handleTransactionClick(record),
                        style: { cursor: 'pointer' }
                      })}
                    />
              </div>
            )}

            {currentState === "BOT_AUDIT_TRAIL" && (
              <div style={{ padding: "12px" }}>
                <h2 style={{ marginBottom: 12 }}>{selectedBot?.botName}</h2>

                {auditLoading ? (
                  <div style={{ textAlign: "center", padding: "50px" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <>
                    <Table
                      columns={[
                        {
                          title: "Date",
                          dataIndex: "datetime",
                          key: "datetime",
                          render: (datetime: string) => formatDate(datetime),
                          width: 210,
                        },
                        {
                          title: "Action",
                          dataIndex: "action",
                          key: "action",
                          render: (action: string) => (
                            <Tag color="blue">{action.replace(/_/g, " ")}</Tag>
                          ),
                          width: 150,
                        },
                        {
                          title: "Version",
                          dataIndex: "version",
                          key: "version",
                          width: 100,
                        },
                      ]}
                      dataSource={auditTrail}
                      rowKey="_id"
                      expandable={{
                        expandedRowRender: (record: any, index: number) => {
                          // Compare with next record (bottom to top logic)
                          const nextRecord = auditTrail[index + 1];
                          const isVersionIntact = nextRecord && nextRecord.version === record.version;

                          return (
                            <Row gutter={16}>
                              <Col span={24}>
                                <div>
                                  {isVersionIntact
                                    ? "No changes"
                                    : (record.currentVersionNotes || "No description")
                                  }
                                </div>
                              </Col>
                            </Row>
                          );
                        },
                        onExpand: handleRowExpand,
                        expandedRowKeys: Array.from(expandedRows),
                      }}
                      pagination={{
                        current: auditPagination.current,
                        pageSize: auditPagination.pageSize,
                        total: auditPagination.total,
                        onChange: handleAuditPaginationChange,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total: number, range: [number, number]) =>
                          `${range[0]}-${range[1]} of ${total} items`,
                      }}
                      size="small"
                    />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </Drawer>
    </>
  );
};
