import React from "react";
import { Button, Tooltip, Typography } from "antd";
import {
  TrophyOutlined,
  CopyOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import { formatCompact } from "../../utils/snippets";
const { Title } = Typography;

export const LeaderboardTraders: React.FC = () => {
  
  const { leaderboardTopTraders } = useDiscoveryContext();

  return (
    <section className="hs2-performers">
        <div className="section-header">
          <Title level={4} className="section-title">
            <TrophyOutlined /> Leaderboard
          </Title>
          <Button type="link" className="see-all-btn" size="large">See All</Button>
        </div>
        
        <div className="performers-list">
          {leaderboardTopTraders.map((bot:any, index:number) => (
            <div key={bot.id} className={`performer-card rank-${index + 1}`}>
              <div className="performer-rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
              <div className="performer-icon" style={{backgroundImage: `url(${bot.icon})`, backgroundSize: 'cover'}} ></div>
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
                <Tooltip title="Copy Trading">
                    <CopyOutlined className="status-icon paused" />
                  </Tooltip>
              </div>
            </div>
          ))}
        </div>
      </section>
  );
};
