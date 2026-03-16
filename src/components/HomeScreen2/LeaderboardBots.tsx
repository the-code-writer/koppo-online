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
          {data.topPerformers.map((bot, index) => (
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
