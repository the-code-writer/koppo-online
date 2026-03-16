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
import { formatCurrency } from "../../utils/snippets";
const { Title } = Typography;

export const LiveActivityFeed: React.FC = () => {
  
  const { botHeartbeat } = useDiscoveryContext();

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
        {botHeartbeat.length > 0 ? (
          botHeartbeat.map((activity) => (
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
              🤖 Waiting for bot activities...
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
