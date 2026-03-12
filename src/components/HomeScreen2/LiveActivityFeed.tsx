import React, { useState, useEffect } from "react";
import { Typography } from "antd";
import {
  ThunderboltOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FieldTimeOutlined,
  BarChartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useEventSubscription } from "../../hooks/useEventManager";
import { CountDownTimer } from "../Composite/CountDownTimer";

const { Title } = Typography;

// Types for activity feed items
interface ActivityItem {
  id: string;
  type: "win" | "loss";
  bot: string;
  amount: number;
  time: string;
  botUUID: string;
  heartbeat: {
    status: string;
    uptime: number;
    lastTradeAt: string;
    currentStake: number;
    botStatus: string;
    tradeCount: number;
    profit: number;
    memoryUsage: number;
    balance: number;
    winRate: number;
    consecutiveLosses: number;
    consecutiveWins: number;
  };
  timestamp: string;
}

// Types for event data
interface BotHeartbeatEvent {
  botUUID: string;
  heartbeat: {
    botName: string;
    status: string;
    uptime: number;
    lastTradeAt: string;
    currentStake: number;
    botStatus: string;
    tradeCount: number;
    profit: number;
    memoryUsage: number;
    balance: number;
    winRate: number;
    consecutiveLosses: number;
    consecutiveWins: number;
  };
  timestamp: string;
}

export const LiveActivityFeed: React.FC = ({onSummary}) => {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(value));
  };

  // Format time relative to now
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  // Subscribe to BOT_HEARTBEAT events
  useEventSubscription("BOT_HEARTBEAT", (data: BotHeartbeatEvent) => {
    console.log("BOT_HEARTBEAT", [data]);

    if (!data.botUUID || !data.heartbeat) return;

    const botName = data.heartbeat.botName || `Bot ${data.botUUID.slice(0, 8)}`;
    const timestamp = new Date(data.timestamp).getTime();

    // Create activity entry if there's profit/loss data
    if (data.heartbeat.profit !== undefined && data.heartbeat.profit !== 0) {
      const activity: ActivityItem = {
        id: `${data.botUUID}-${timestamp}`,
        type: data.heartbeat.profit > 0 ? "win" : "loss",
        bot: botName,
        amount: Math.abs(data.heartbeat.profit),
        time: formatTime(timestamp),
        botUUID: data.botUUID,
        heartbeat: data.heartbeat,
        timestamp: data.timestamp,
      };

      setRecentActivity((prev) => {
        // Check if this botUUID already exists in the list
        const existingIndex = prev.findIndex(
          (item) => item.botUUID === data.botUUID,
        );

        if (existingIndex !== -1) {
          // Update existing bot entry
          const updated = [...prev];
          updated[existingIndex] = activity;
          // Move the updated item to the top
          return [
            activity,
            ...updated.filter((_, index) => index !== existingIndex),
          ].slice(0, 10);
        } else {
          // Add new bot entry
          return [activity, ...prev].slice(0, 10);
        }
      });
    }
  });

  // Clean up old activities periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentActivity((prev) => {
        const now = Date.now();
        // Remove activities that haven't been updated in 60 seconds
        const filtered = prev.filter((activity) => {
          const lastUpdate = new Date(activity.timestamp).getTime();
          const timeSinceUpdate = now - lastUpdate;
          return timeSinceUpdate < 60000; // Keep only items updated within last 60 seconds
        });

        // Update time displays for remaining activities
        return filtered.map((activity) => ({
          ...activity,
          time: formatTime(
            Date.now() - (parseInt(activity.id.split("-")[1]) || 0),
          ),
        }));
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const [runningBots, setRunningBots] = useState(0);
  const [sessionProfits, setSessionProfits] = useState(0);
  const [winRate, setWinRate] = useState(0);

  useEffect(() => {

    setRunningBots(recentActivity.length);
    setSessionProfits(recentActivity.reduce((sum: number, bot: ActivityItem) => sum + Math.abs(bot.amount), 0));
    setWinRate(recentActivity.reduce((sum: number, bot: ActivityItem) => sum + Math.abs(bot.heartbeat.winRate), 0)/recentActivity.length);

  }, [recentActivity]);

  useEffect(() => {

    onSummary({runningBots, sessionProfits, winRate});

  }, [runningBots, sessionProfits, winRate]);

  return (
    <section className="hs2-activity">
      <div className="section-header">
        <Title level={4} className="section-title">
          <ThunderboltOutlined /> Live Activity
        </Title>
        <div className="live-indicator">
          <span className="pulse"></span>
          <span>Live</span>
        </div>
      </div>

      <div className="activity-feed">
        {recentActivity.length > 0 ? (
          recentActivity.map((activity) => (
            <div key={activity.id} className={`activity-item ${activity.type}`}>
              <div className="activity-icon">
                {activity.type === "win" ? (
                  <ArrowUpOutlined className="win-icon" />
                ) : (
                  <ArrowDownOutlined className="loss-icon" />
                )}
              </div>
              <div className="activity-details">
                <span className="activity-bot">{activity.bot}</span>
                <div className="activity-stats dflex">
                  <span className="activity-uptime">
                    <code>
                      <FieldTimeOutlined />{" "}
                      <CountDownTimer
                        run={activity.heartbeat.status === "RUNNING"}
                        timeStarted={new Date(
                          Date.now() - activity.heartbeat.uptime,
                        ).toISOString()}
                        timeStopped=""
                      />
                    </code>
                  </span>
                  <span className="activity-runs">
                    <BarChartOutlined />{" "}
                    <code>{activity.heartbeat.tradeCount}</code>
                  </span>
                  <span className="activity-winrate">
                    <TrophyOutlined />{" "}
                    <code>
                      {(activity.heartbeat.winRate * 100).toFixed(1)}%
                    </code>
                  </span>
                </div>
              </div>
              <div className={`activity-amount ${activity.type}`}>
                {activity.type === "win" ? "+" : "-"}
                {formatCurrency(activity.amount)}
              </div>
            </div>
          ))
        ) : (
          <div className="no-activity" style={{ padding: 24 }}>
            <span className="no-activity-text">
              🟨 Waiting for bot activity...
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
