import React from "react";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useDiscoveryContext } from "../../contexts/DiscoveryContext";
import { formatCompact, formatCurrency } from "../../utils/snippets"; 

export const MarketSentiment: React.FC = () => {
  
  const { portfolio } = useDiscoveryContext();

  return (
    <section className="hs2-portfolio-section">
        <div className="portfolio-card">
          <div className="portfolio-glow"></div>
          <div className="portfolio-content">
            <div className="portfolio-label">
              <WalletOutlined /> Total Portfolio Value
            </div>
            <div className="portfolio-value">
              {formatCurrency(portfolio.totalValue)}
            </div>
            <div className="portfolio-changes">
              <div className={`change-badge ${portfolio.dailyChange >= 0 ? 'positive' : 'negative'}`}>
                {portfolio.dailyChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                <span>{formatCompact(Math.abs(portfolio.dailyChange))}</span>
                <span className="change-percent">({portfolio.dailyChangePercent}%)</span>
                <span className="change-label">today</span>
              </div>
            </div>
          </div>
          <div className="portfolio-decoration">
            <div className="deco-circle c1"></div>
            <div className="deco-circle c2"></div>
            <div className="deco-circle c3"></div>
          </div>
        </div>
      </section>
  );
};
