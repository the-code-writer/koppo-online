import React from "react";
import { Typography, Progress, Flex } from "antd";
import {
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { formatCompact, getProfitColor } from "../../utils/snippets";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
const { Title } = Typography;

export const WeeklyPerformance: React.FC = () => {

  const { weeklyPerformance } = useDiscoveryContext();

  // Calculate cumulative profit from weekly performance data
  const cumulativeProfit = weeklyPerformance.reduce((total: number, day: any) => total + day.profit, 0);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpOutlined className="trend-up" style={{color: "#52c41a"}} />;
    if (change < 0) return <ArrowDownOutlined className="trend-down" style={{color: "#ff4d4f"}} />;
    return <div className="trend-neutral" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return '#52c41a';
    if (change < 0) return '#ff4d4f';
    return '#8c8c8c';
  };

  return (
    <section className="hs2-weekly-performance hs2-activity">
            <div className="section-header">
              <Title level={4} className="section-title">
                <TrophyOutlined /> Last 7 Days Performance
              </Title>
              <div className={`live-indicator ${cumulativeProfit > 0 ? 'profit' : 'loss'} `} >
                <span className="pulse"></span>
                <span>{cumulativeProfit > 0 ? '+' : ''}{formatCompact(cumulativeProfit)}</span>
              </div>
            </div>
            
            <div className="weekly-performance-grid">
              {weeklyPerformance.map((day: any) => (
                <div key={day.day} className="day-performance-card">
                  <div className="day-header">
                    <span className="day-name">{day.day}</span>
                    <div className="day-indicator" />
                  </div>
                  
                  <div className="day-metrics">
                    {/* Main profit display */}
                    <div className="profit-section" style={{width: "100%"}}>
                      <div className="profit-amount" style={{ color: getProfitColor(day.profit) }}>
                        {day.profit > 0 ? '+' : ''}{formatCompact(day.profit)}
                      </div>
                      {day.trades > 0 && (
                        <div className="profit-change">
                          {getChangeIcon(day.monetaryChange)}
                          <span style={{ color: getChangeColor(day.monetaryChange) }}>
                            {day.monetaryChange > 0 ? '+' : ''}{formatCompact(day.monetaryChange)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Performance metrics */}
                    <div className="performance-stats">
                      <div className="stat-item">
                        <span className="stat-label">Trades</span>: <span className="stat-value">{day.trades}</span>
                        
                      </div>
                      
                      <div className="stat-item">
                        <div className="win-rate-container">
                          <Progress 
                            percent={day.winRate} 
                            size="small" 
                            showInfo={false}
                            strokeColor={day.winRate >= 70 ? '#52c41a' : day.winRate >= 50 ? '#faad14' : '#ff4d4f'}
                          />
                         <span className="stat-label">Win Rate</span>: <span className="win-rate-text">{day.winRate.toFixed(1)}%</span>
                        </div>
                        
                      </div>
                    </div>

                    {/* Percentage change indicator */}
                    {day.trades > 0 && day.percentageChange !== 0 && (
                      <div className="percentage-change">
                        <span style={{ color: getChangeColor(day.percentageChange) }}>
                          {day.percentageChange > 0 ? '+' : ''}{day.percentageChange.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
  );
};
