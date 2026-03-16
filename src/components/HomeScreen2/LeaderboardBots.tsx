import React from "react";
import { Button, Tooltip, Typography } from "antd";
import {
  RiseOutlined,
  CrownOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import { formatCompact } from "../../utils/snippets";
const { Title } = Typography;

const topPerformers = [
    { id: 1, name: 'Alpha Momentum', profit: 12450.20, change: 8.5, status: 'running', icon: '🚀' },
    { id: 2, name: 'Beta Scalper', profit: 8920.15, change: 5.2, status: 'running', icon: '⚡' },
    { id: 3, name: 'Gamma Swing', profit: 6540.80, change: 3.8, status: 'paused', icon: '🎯' }
  ];

export const LeaderboardBots: React.FC = () => {
  
  const { botHeartbeat } = useDiscoveryContext();

  return (
    <section className="hs2-performers">
        <div className="section-header">
          <Title level={4} className="section-title">
            <CrownOutlined /> Top Performers
          </Title>
          <Button type="link" className="see-all-btn" size="large">See All</Button>
        </div>
        
        <div className="performers-list">
          {topPerformers.map((bot: any, index:number) => (
            <div key={bot.id} className={`performer-card rank-${index + 1}`}>
              <div className="performer-rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
              <div className="performer-icon">{bot.icon}</div>
              <div className="performer-info">
                <span className="performer-name">{bot.name}</span>
                <span className="performer-profit">
                  <RiseOutlined /> {formatCompact(bot.profit)}
                </span>
              </div>
              <div className="performer-change">
                <span className={`change-value ${bot.change >= 0 ? 'positive' : 'negative'}`}>
                  +{bot.change}%
                </span>
              </div>
              <div className="performer-status">
                {bot.status === 'running' ? (
                  <Tooltip title="Running">
                    <PlayCircleOutlined className="status-icon running" />
                  </Tooltip>
                ) : (
                  <Tooltip title="Paused">
                    <PauseCircleOutlined className="status-icon paused" />
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
  );
};
