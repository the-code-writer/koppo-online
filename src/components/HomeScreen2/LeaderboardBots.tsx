import React from "react";
import { Button, Typography } from "antd";
import {
  RiseOutlined,
  CrownOutlined,
  FallOutlined
} from "@ant-design/icons";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import { formatCompact } from "../../utils/snippets";
const { Title } = Typography;

export const LeaderboardBots: React.FC = () => {

  const { leaderboardTopBots } = useDiscoveryContext();

  return (
    <section className="hs2-performers">
      <div className="section-header">
        <Title level={4} className="section-title">
          <CrownOutlined /> Top Performers
        </Title>
        <Button type="link" className="see-all-btn" size="large">See All</Button>
      </div>

      <div className="performers-list">
        {leaderboardTopBots.map((bot: any, index: number) => (
          <div key={bot.botId} className={`performer-card rank-${index + 1}`}>
            <div className="performer-rank">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
            </div>
            <div className="performer-icon" style={{backgroundImage: `url(${bot.botIcon}})`, backgroundSize: 'cover'}}></div>
            <div className="performer-info">
              <span className="performer-name">{bot.botName}</span>
              <span className="performer-profitx">
                {String(bot.strategyId).toUpperCase()} &bull; {bot.botId}
              </span>
              <div className="performer-change">
                <span className={`change-value ${bot.profit >= 0 ? 'positive' : 'negative'}`}>
                  {bot.profit >= 0 ? (<RiseOutlined />):(<FallOutlined />)} {formatCompact(bot.profit)} (+{bot.change}%)
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
