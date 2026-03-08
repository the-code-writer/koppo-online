import React, { useState, useMemo } from "react";
import { ClockCircleOutlined, DollarOutlined, ThunderboltOutlined, TrophyOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, FileSearchOutlined, CheckOutlined, CopyOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, HistoryOutlined, LockOutlined, SyncOutlined, UnlockOutlined, UserOutlined } from "@ant-design/icons";
import { Col, Card, Space, Flex, Tag, Tooltip, Button, Typography, Drawer, Avatar, Badge, Descriptions, Divider, Dropdown, Row, Spin, Table, Modal, message } from "antd";
import { CountDownTimer } from "../Composite/CountDownTimer";
import { StandaloneEllipsisBoldIcon } from "@deriv/quill-icons";
import { formatDecimal, formatCurrency, currencyShorten } from "../../utils/stringUtils";
import { MarketIcon } from "../MarketSelector/MarketIcons/MarketIcon";
import { tradingBotAPIService, TradingBotConfig } from "../../services/tradingBotAPIService";
import { useEventPublisher } from "../../hooks/useEventManager";
import { useSounds } from "../../hooks/useSounds";

const { Title, Text } = Typography;

interface BotItemProps {
  bot: TradingBotConfig;
  handleBotAction: (botUUID: string, action: "START" | "PAUSE" | "RESUME" | "STOP" | "IDLE" | "ERROR") => Promise<void>;
  refreshMyBots: () => Promise<void>;
}

export const BotItem: React.FC<BotItemProps> = ({ bot, refreshMyBots }) => {

  // Hooks
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
  

  // State variables
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<TradingBotConfig | null>(null);
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
  const getNetProfit = (bot: TradingBotConfig): number => {
    const totalStake = parseFloat(String(bot?.realtimePerformance?.totalStake || bot?.statistics?.totalStake || 0));
    const totalPayout = parseFloat(String(bot?.realtimePerformance?.totalPayout || bot?.statistics?.totalPayout || 0));
    return totalPayout - totalStake;
  };

  // Calculate win rate
  const getWinRate = (bot: TradingBotConfig): number => {
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
    return bot?.status === "START" || bot?.status === "RESUME";
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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
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
      playSuccess(); // Use success sound for cloning initiation
      publish("CLONE_BOT", {
        botUUID,
      });
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

  const statusConfig = getStatusConfig(bot?.status);
  const netProfit = getNetProfit(bot);
  const winRate = getWinRate(bot);
  const isProfit = netProfit >= 0;

  return (
    <>
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
            <Flex className="bot-info" align="center" justify="space-between">
              <Title level={5} className="bot-name">
                {bot?.botName}
              </Title>
              <Tag color={statusConfig.color} className="status-tag">
                {statusConfig.icon} <span>{statusConfig.label}</span>
              </Tag>
            </Flex>
            <Text type="secondary" className="bot-market">
              {String(bot?.strategyId).toUpperCase()} •{" "}
              {bot?.contract?.market?.displayName} • {bot?.contract?.contractType}
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
                    run={bot?.status === "START" || bot?.status === "RESUME"}
                    timeStarted={bot?.realtimePerformance?.startedAt || ""}
                    timeStopped={bot?.realtimePerformance?.stoppedAt || ""}
                  />
                </span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <DollarOutlined />
                <span className="stat-label">
                  Profit{" "}
                  {bot?.status === "START" && <span className="live-indicator" />}
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
                  {String(bot?.realtimePerformance?.currentStake || 0)} <br />
                  <small>
                    {bot?.amounts?.base_stake?.value}{" "}
                    {(bot?.botAccount as any)?.currency}
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
              <Tooltip title={bot?.status === "START" ? "Running" : "Start"}>
                <Button
                  className={`control-btn start-btn ${bot?.status === "START" ? "current-state" : ""}`}
                  onClick={() =>
                    bot?.botUUID && handleBotAction(bot.botUUID, "START")
                  }
                  disabled={bot?.status === "START"}
                >
                  <PlayCircleOutlined />
                </Button>
              </Tooltip>
              <Tooltip title={bot?.status === "PAUSE" ? "Paused" : "Pause"}>
                <Button
                  className={`control-btn pause-btn ${bot?.status === "PAUSE" ? "current-state" : ""}`}
                  onClick={() =>
                    bot?.botUUID && handleBotAction(bot.botUUID, "PAUSE")
                  }
                  disabled={bot?.status !== "START"}
                >
                  <PauseCircleOutlined />
                </Button>
              </Tooltip>
              <Tooltip title={bot?.status === "STOP" ? "Stopped" : "Stop"}>
                <Button
                  className={`control-btn stop-btn ${bot?.status === "STOP" ? "current-state" : ""}`}
                  onClick={() =>
                    bot?.botUUID && handleBotAction(bot.botUUID, "STOP")
                  }
                  disabled={bot?.status === "STOP"}
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
                        onClick: () => bot?.botUUID && handleCloneBot(bot.botUUID),
                      },
                      { type: "divider" as const },
                      {
                        key: "startBot",
                        icon: <PlayCircleOutlined />,
                        label: "Start Bot",
                        disabled: !isActionEnabled("START", bot?.status),
                        onClick: () =>
                          bot?.botUUID && handleBotAction(bot.botUUID, "START"),
                      },
                      {
                        key: "pauseResumeBot",
                        icon:
                          bot?.status === "START" ||
                            bot?.status === "RESUME" ? (
                            <PauseCircleOutlined />
                          ) : (
                            <PlayCircleOutlined />
                          ),
                        label:
                          bot?.status === "START" ||
                            bot?.status === "RESUME"
                            ? "Pause Bot"
                            : "Resume Bot",
                        disabled: !isActionEnabled(
                          bot?.status === "START" ||
                            bot?.status === "RESUME"
                            ? "PAUSE"
                            : "RESUME",
                          bot?.status,
                        ),
                        onClick: () =>
                          handleBotAction(
                            bot?.botUUID!,
                            bot?.status === "START" ||
                              bot?.status === "RESUME"
                              ? "PAUSE"
                              : "RESUME",
                          ),
                      },
                      {
                        key: "stopBot",
                        icon: <StopOutlined />,
                        label: "Stop Bot",
                        disabled: !isActionEnabled("STOP", bot?.status),
                        onClick: () =>
                          bot?.botUUID && handleBotAction(bot.botUUID, "STOP"),
                      },
                      { type: "divider" as const },
                      ...(bot?.isPremium !== false ? [{
                        key: "makeFree",
                        icon: <UnlockOutlined />,
                        label: "Mark Bot as Free",
                        onClick: () => bot?.botUUID && handleTogglePremium(bot.botUUID, false),
                      }] : []),
                      ...(bot?.isPremium !== true ? [{
                        key: "makePremium",
                        icon: <LockOutlined />,
                        label: "Mark Bot as Premium",
                        onClick: () => bot?.botUUID && handleTogglePremium(bot.botUUID, true),
                      }] : []),
                      ...(bot?.isActive !== true ? [{
                        key: "activate",
                        icon: <PlayCircleOutlined />,
                        label: "Activate Bot",
                        onClick: () => bot?.botUUID && handleToggleActivation(bot.botUUID, true),
                      }] : []),
                      ...(bot?.isActive !== false ? [{
                        key: "deactivate",
                        icon: <StopOutlined />,
                        label: "Deactivate Bot",
                        onClick: () => bot?.botUUID && handleToggleActivation(bot.botUUID, false),
                      }] : []),
                      ...(bot?.isPublic !== true ? [{
                        key: "makePublic",
                        icon: <UnlockOutlined />,
                        label: "Mark Bot as Public",
                        onClick: () => bot?.botUUID && handleToggleVisibility(bot.botUUID, true),
                      }] : []),
                      ...(bot?.isPublic !== false ? [{
                        key: "makePrivate",
                        icon: <LockOutlined />,
                        label: "Mark Bot as Private",
                        onClick: () => bot?.botUUID && handleToggleVisibility(bot.botUUID, false),
                      }] : []),
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        label: "Delete Bot",
                        danger: true,
                        onClick: () => bot?.botUUID && handleDeleteBot(bot.botUUID, bot.botName),
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
                            alt={bot?.botName}
                            src={bot?.botBanner || "/no-image.svg"}
                            style={{
                              mixBlendMode: bot?.botBanner
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
                            className={`bot-running-time ${bot?.status?.toLowerCase()}`}
                          >
                            {bot?.status === "START" ||
                              bot?.status === "PAUSE" ||
                              bot?.status === "RESUME" ? (
                              <div className="contract-strategy-id">
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color:
                                      bot?.status === "START" ||
                                        bot?.status === "RESUME"
                                        ? "#36a100ff"
                                        : bot?.status === "PAUSE"
                                          ? "#ff9800"
                                          : "#666",
                                  }}
                                >
                                  {bot?.status === "START"
                                    ? "🟢 RUNNING"
                                    : bot?.status === "PAUSE"
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
                                    bot?.status === "START" ||
                                    bot?.status === "RESUME"
                                  }
                                  timeStarted={
                                    bot?.realtimePerformance?.startedAt || ""
                                  }
                                  timeStopped={
                                    bot?.realtimePerformance?.stoppedAt || ""
                                  }
                                />
                              </strong>
                            </code>
                          </Flex>
                        </>
                      }
                      actions={[
                        // When STARTED / RESUMED: Show PAUSE & STOP
                        bot?.status === "START" ||
                          bot?.status === "RESUME"
                          ? [
                            <Button
                              type="text"
                              key="pause"
                              size="large"
                              onClick={() =>
                                bot?.botUUID && handleBotAction(bot.botUUID, "PAUSE")
                              }
                            >
                              ⏸️ Pause
                            </Button>,
                            <Button
                              type="text"
                              key="stop"
                              size="large"
                              onClick={() =>
                                bot?.botUUID && handleBotAction(bot.botUUID, "STOP")
                              }
                            >
                              ⏹️ Stop
                            </Button>,
                          ]
                          : // When PAUSED: Show RESUME & STOP
                          bot?.status === "PAUSE"
                            ? [
                              <Button
                                key="resume"
                                type="text"
                                size="large"
                                onClick={() =>
                                  bot?.botUUID && handleBotAction(
                                    bot.botUUID,
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
                                  bot?.botUUID && handleBotAction(
                                    bot.botUUID,
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
                                  bot?.botUUID && handleBotAction(
                                    bot.botUUID,
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
                          {bot?.botName || "No title available"}
                        </h2>
                        <p style={{ marginBottom: "12px" }}>
                          {bot?.botDescription ||
                            "No description available"}
                        </p>
                        {bot?.botTags &&
                          bot?.botTags.length > 0 && (
                            <div className="strategy-tags">
                              {bot?.botTags.map(
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
                                bot?.contract?.market?.symbol || ""
                              }
                              size="large"
                            />
                          </div>
                          <div className="contract-details-content">
                            <div className="contract-name">
                              {String(
                                bot?.contract?.market?.displayName ||
                                "Unknown Market",
                              )}
                            </div>
                            <div className="contract-type">
                              {String(bot?.strategyId || "N/A")}
                              &nbsp;&bull;&nbsp;
                              {String(
                                bot?.contract?.market?.shortName ||
                                "Unknown Market",
                              )}
                              &nbsp;&bull;&nbsp;
                              {String(
                                bot?.contract?.market?.symbol || "",
                              )}
                            </div>
                            <div className="contract-predictions">
                              {String(
                                bot?.contract?.contractType || "N/A",
                              )}
                              &nbsp;&bull;&nbsp;
                              {String(bot?.contract?.tradeType || "N/A")}
                              &nbsp;&bull;&nbsp;
                              {String(
                                bot?.contract?.prediction || "N/A",
                              )}
                              &nbsp;&bull;&nbsp;
                              <br />
                              <strong># {bot?.botId}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="strategy-metrics">
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            bot?.contract?.duration || 0,
                            1
                          )}{" "}
                          <sup><small>{bot?.contract?.durationUnits}</small></sup>
                        </span>
                        <span className="metric-label">Duration</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            bot?.contract?.delay || 0,
                            1
                          )} <sup><small>sec</small></sup>
                        </span>
                        <span className="metric-label">Delay</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            bot?.contract?.multiplier || 1,
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
                              (bot?.amounts?.base_stake as any)?.value || 0,
                              (bot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        {(bot?.amounts?.base_stake as any)?.type !== "fixed" && "%"}
                        <span className="metric-label">Stake</span>
                      </div>
                      <div className="metric-item">
                        <span
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              (bot?.amounts?.take_profit as any)?.value || 0,
                              (bot?.amounts?.take_profit as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        {(bot?.amounts?.take_profit as any)?.type !== "fixed" && "%"}
                        <span className="metric-label">Take Profit</span>
                      </div>
                      <div className="metric-item">
                        <span
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              (bot?.amounts?.stop_loss as any)?.value || 0,
                              (bot?.amounts?.stop_loss as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        {(bot?.amounts?.stop_loss as any)?.type !== "fixed" && "%"}
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
                                bot?.realtimePerformance?.numberOfWins ||
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
                                bot?.realtimePerformance?.numberOfLosses ||
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
                                bot?.realtimePerformance?.numberOfWins ||
                                0
                              )
                            ) + parseInt(
                              String(
                                bot?.realtimePerformance?.numberOfLosses ||
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
                                  (bot?.amounts?.base_stake as any)?.value ||
                                  bot?.amounts?.base_stake ||
                                  0
                                )
                              ),
                              (bot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
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
                                  bot?.realtimePerformance?.currentStake ||
                                  0
                                )
                              ),
                              (bot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
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
                                  bot?.realtimePerformance?.highestStake ||
                                  0
                                )
                              ),
                              (bot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
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
                                  bot?.realtimePerformance?.totalStake ||
                                  bot?.statistics?.totalStake ||
                                  0
                                )
                              ),
                              (bot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
                                : undefined
                            )
                          }}
                        />
                        {(bot?.amounts?.base_stake as any)?.type !== "fixed" && "%"}
                        <span className="metric-label">Total Stake</span>
                      </div>
                      <div className="metric-item">
                        <span
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              parseFloat(
                                String(
                                  bot?.realtimePerformance?.totalPayout ||
                                  bot?.statistics?.totalPayout ||
                                  0
                                )
                              ),
                              (bot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
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
                                  bot?.realtimePerformance?.totalStake ||
                                  bot?.statistics?.totalStake ||
                                  0
                                ));
                                const totalPayout = parseFloat(String(
                                  bot?.realtimePerformance?.totalPayout ||
                                  bot?.statistics?.totalPayout ||
                                  0
                                ));
                                return totalPayout - totalStake;
                              })(),
                              (bot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
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
                            bot?.statistics?.lifetimeWins ||
                            bot?.realtimePerformance?.numberOfWins ||
                            0,
                          )}
                        </span>
                        <span className="metric-label">No. of Wins</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {String(
                            bot?.statistics?.lifetimeLosses ||
                            bot?.realtimePerformance?.numberOfLosses ||
                            0,
                          )}
                        </span>
                        <span className="metric-label">No. of Losses</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {formatDecimal(
                            (() => {
                              const wins = parseInt(String(bot?.realtimePerformance?.numberOfWins || 0));
                              const losses = parseInt(String(bot?.realtimePerformance?.numberOfLosses || 0));
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
                            bot?.statistics?.longestWinStreak || 0,
                          )}
                        </span>
                        <span className="metric-label">Win Streak</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {String(
                            bot?.statistics?.longestLossStreak || 0,
                          )}
                        </span>
                        <span className="metric-label">Loss Streak</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-value">
                          {String(bot?.statistics?.profitFactor || 0)}
                        </span>
                        <span className="metric-label">Profit Factor</span>
                      </div>
                      <div className="metric-item">
                        <span
                          className="metric-value"
                          dangerouslySetInnerHTML={{
                            __html: formatCurrencyWithShortening(
                              parseFloat(String(
                                bot?.statistics?.totalStake ||
                                bot?.realtimePerformance?.totalStake ||
                                0
                              )),
                              (bot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
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
                                bot?.statistics?.totalPayout ||
                                bot?.realtimePerformance?.totalPayout ||
                                0
                              )),
                              (bot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
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
                                  bot?.statistics?.totalStake ||
                                  bot?.realtimePerformance?.totalStake ||
                                  0
                                ));
                                const totalPayout = parseFloat(String(
                                  bot?.statistics?.totalPayout ||
                                  bot?.realtimePerformance?.totalPayout ||
                                  0
                                ));
                                return totalPayout - totalStake;
                              })(),
                              (bot?.amounts?.base_stake as any)?.type === "fixed"
                                ? (bot?.botAccount as any)?.currency || "GBP"
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
                          {bot?.advanced_settings
                            ?.general_settings_section
                            ?.maximum_number_of_trades || "Unlimited"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Runtime">
                          {bot?.advanced_settings
                            ?.general_settings_section?.maximum_running_time ||
                            "Unlimited"}{" "}
                          min
                        </Descriptions.Item>
                        <Descriptions.Item label="Cooldown">
                          {bot?.advanced_settings
                            ?.general_settings_section?.cooldown_period
                            ? `${bot?.advanced_settings.general_settings_section.cooldown_period.duration} ${bot?.advanced_settings.general_settings_section.cooldown_period.unit}`
                            : "None"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Recovery Type">
                          {bot?.advanced_settings
                            ?.general_settings_section?.recovery_type || "None"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Compound Stake">
                          {bot?.advanced_settings
                            ?.general_settings_section?.compound_stake
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Auto Restart">
                          {bot?.advanced_settings
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
                            bot?.advanced_settings
                              ?.risk_management_section?.max_daily_loss ||
                            "Not set",
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Daily Profit">
                          {String(
                            bot?.advanced_settings
                              ?.risk_management_section?.max_daily_profit ||
                            "Not set",
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Consecutive Losses">
                          {String(
                            bot?.advanced_settings
                              ?.risk_management_section
                              ?.max_consecutive_losses || "Not set",
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Drawdown">
                          {bot?.advanced_settings
                            ?.risk_management_section?.max_drawdown_percentage
                            ? `${bot?.advanced_settings.risk_management_section.max_drawdown_percentage}%`
                            : "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Risk Per Trade">
                          {bot?.advanced_settings
                            ?.risk_management_section?.risk_per_trade
                            ? `${bot?.advanced_settings.risk_management_section.risk_per_trade}%`
                            : "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Position Sizing">
                          {bot?.advanced_settings
                            ?.risk_management_section?.position_sizing
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Emergency Stop">
                          {bot?.advanced_settings
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
                          {bot?.advanced_settings
                            ?.volatility_controls_section?.volatility_filter
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Min Volatility">
                          {bot?.advanced_settings
                            ?.volatility_controls_section?.min_volatility ||
                            "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Volatility">
                          {bot?.advanced_settings
                            ?.volatility_controls_section?.max_volatility ||
                            "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Volatility Adjustment">
                          {bot?.advanced_settings
                            ?.volatility_controls_section?.volatility_adjustment
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Pause on High Volatility">
                          {bot?.advanced_settings
                            ?.volatility_controls_section
                            ?.pause_on_high_volatility
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Lookback Period">
                          {bot?.advanced_settings
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
                          {bot?.advanced_settings
                            ?.market_conditions_section?.trend_detection
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trend Strength Threshold">
                          {bot?.advanced_settings
                            ?.market_conditions_section
                            ?.trend_strength_threshold || "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Avoid Ranging Market">
                          {bot?.advanced_settings
                            ?.market_conditions_section?.avoid_ranging_market
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Market Correlation Check">
                          {bot?.advanced_settings
                            ?.market_conditions_section
                            ?.market_correlation_check
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Time of Day Filter">
                          {bot?.advanced_settings
                            ?.market_conditions_section?.time_of_day_filter
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Preferred Trading Hours">
                          {bot?.advanced_settings
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
                          {bot?.advanced_settings
                            ?.recovery_settings_section?.progressive_recovery
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Recovery Multiplier">
                          {bot?.advanced_settings
                            ?.recovery_settings_section?.recovery_multiplier ||
                            "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Max Recovery Attempts">
                          {bot?.advanced_settings
                            ?.recovery_settings_section
                            ?.max_recovery_attempts || "Not set"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Recovery Cooldown">
                          {bot?.advanced_settings
                            ?.recovery_settings_section?.recovery_cooldown
                            ? `${bot?.advanced_settings.recovery_settings_section.recovery_cooldown.duration} ${bot?.advanced_settings.recovery_settings_section.recovery_cooldown.unit}`
                            : "None"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Partial Recovery">
                          {bot?.advanced_settings
                            ?.recovery_settings_section?.partial_recovery
                            ? "✅ Enabled"
                            : "❌ Disabled"}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {/* Strategy-Specific Settings */}
                    {bot?.advanced_settings?.[
                      `${bot?.strategyId}_strategy_section` as keyof TradingBotConfig["advanced_settings"]
                    ] && (
                        <div style={{ marginBottom: "24px" }}>
                          <h4 className="metric-section-header">
                            ⚙️{" "}
                            {bot?.strategyId
                              ? bot.strategyId.charAt(0).toUpperCase() +
                                bot.strategyId.slice(1)
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
                              bot?.advanced_settings[
                              `${bot?.strategyId}_strategy_section` as keyof TradingBotConfig["advanced_settings"]
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
                          {bot?.createdAt
                            ? new Date(bot?.createdAt).toLocaleString(
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
                          {bot?.updatedAt
                            ? new Date(bot?.updatedAt).toLocaleString(
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
                          {bot?.version?.date
                            ? new Date(
                              bot?.version.date,
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
                          {bot?.version?.current || "Not set"}
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
                      {bot?.version?.notes || "Not set"}
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
                          {bot?.isPublic ? "🌍 Public" : "🔒 Private"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Is Active">
                          {bot?.isActive ? "✅ Active" : "❌ Inactive"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Is Premium">
                          {bot?.isPremium ? "⭐ Premium" : "🆓 Free"}
                        </Descriptions.Item>
                      </Descriptions>
                    </div>

                    {/* Footer with Creator and Control Button */}
                    <div className="strategy-footer">
                      <div className="author-info">
                        <Avatar
                          size={48}
                          shape="square"
                          src={typeof bot?.createdBy === 'object' && bot?.createdBy?.photoURL || undefined}
                          icon={<UserOutlined />}
                        />
                        <div className="author-details">
                          <strong>{typeof bot?.createdBy === 'object' ? bot?.createdBy?.displayName : bot?.createdBy || "Unknown Creator"}</strong>
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
                <p>Transaction history for {bot?.botName}</p>
                {/* Add transaction content here */}
              </div>
            )}

            {currentState === "BOT_AUDIT_TRAIL" && (
              <div style={{ padding: "12px 24px" }}>
                <h2 style={{ marginBottom: 12 }}>{bot?.botName}</h2>

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
