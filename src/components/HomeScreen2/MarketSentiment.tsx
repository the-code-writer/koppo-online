import React from "react";
import { SafetyCertificateOutlined } from "@ant-design/icons";

const marketSentiment: string = "bullish";

export const MarketSentiment: React.FC = () => {
  return (
    <section className="hs2-sentiment">
      <div className={`sentiment-card ${marketSentiment}`}>
        <div className="sentiment-icon">
          {marketSentiment === "bullish"
            ? "📈"
            : marketSentiment === "bearish"
              ? "📉"
              : "➡️"}
        </div>
        <div className="sentiment-info">
          <span className="sentiment-label">Market Sentiment</span>
          <span className="sentiment-value">
            {marketSentiment.charAt(0).toUpperCase() + marketSentiment.slice(1)}
          </span>
        </div>
        <SafetyCertificateOutlined className="sentiment-badge" />
      </div>
    </section>
  );
};
