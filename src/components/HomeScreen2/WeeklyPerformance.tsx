import React from "react";
import { Typography } from "antd";
import {
  TrophyOutlined,
} from "@ant-design/icons";
import { formatCompact, getProfitColor } from "../../utils/snippets";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
const { Title } = Typography;

export const WeeklyPerformance: React.FC = () => {

  const { weeklyPerformance } = useDiscoveryContext();

  return (
    <section className="hs2-weekly-performance hs2-activity">
            <div className="section-header">
              <Title level={4} className="section-title">
                <TrophyOutlined /> Weekly Performance
              </Title>
              <div className="live-indicator">
                <span className="pulse"></span>
                <span>+{formatCompact(2748)}</span>
              </div>
            </div>
            
            <div className="weekly-performance-grid">
              {weeklyPerformance.map((day: any) => (
                <div key={day.day} className="day-performance-card">
                  <div className="day-header">
                    <span className="day-name">{day.day}</span>
                    <div className="day-indicator" />
                  </div>
                  <div className="day-profit">
                    <span className="profit-amount" style={{ color: getProfitColor(day.profit) }}>
                      {day.profit > 0 ? '+' : ''}{formatCompact(day.profit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
  );
};
