import React from "react";
import { Button, Typography } from "antd";
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import { formatCompact } from "../../utils/snippets";
const { Title } = Typography;

export const LeaderboardTraders: React.FC = () => {
  
  const { leaderboardTopTraders } = useDiscoveryContext();

  return (
    <section className="hs2-performers user">
        <div className="section-header">
          <Title level={4} className="section-title">
            <TrophyOutlined /> Leaderboard
          </Title>
          <Button type="link" className="see-all-btn" size="large">See All</Button>
        </div>
        
        <div className="performers-list">
          {leaderboardTopTraders.map((bot:any, index:number) => (
            <div key={bot.id} className={`performer-card rank-${index + 1}`}>
              <div className="performer-rank sm">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
              <div className="performer-icon sm" style={{backgroundImage: `url(${bot.photo})`, backgroundSize: 'cover', backgroundPosition: 'center'}} ></div>
              <div className="performer-info">
                <span className="performer-name">{bot.name}</span>
                <span className="performer-trades">
                  {bot.trades} Trades &bull; {bot.winRate}%
                </span>
              </div>
              <div className="performer-change">
                <span className={`change-value ${bot.profit >= 0 ? 'positive' : 'negative'}`}>
                  {bot.profit >= 0 ? (<RiseOutlined />):(<FallOutlined />)} {formatCompact(bot.profit)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
  );
};
