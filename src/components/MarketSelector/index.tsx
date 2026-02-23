/**
 * @file: MarketSelector/index.tsx
 * @description: Component for selecting trading markets with filtering, search,
 *               favorites management, and categorized display of market options.
 *
 * @components:
 *   - MarketSelector: Main component for market selection
 *   - Market sections: Synthetics, Continuous Indices, Crash/Boom, Forex, 
 *                     Commodities, Cryptocurrency, Indices, Stocks, Energy, 
 *                     Metals, Soft Commodities, Tactical Indices
 * @dependencies:
 *   - React: Core functionality and state management
 *   - antd: Input, Tabs components and icons
 *   - types/market: Market data types and sample data
 *   - MarketIcon: Custom icon component for market symbols
 * @usage:
 *   <MarketSelector
 *     onSelectMarket={(market) => handleMarketSelection(market)}
 *     selectedMarket={currentMarket}
 *   />
 *
 * @architecture: Compound component with filtering and categorization
 * @relationships:
 *   - Used by: Trading forms and market selection interfaces
 *   - Uses: MarketIcon component for visual representation
 * @dataFlow:
 *   - Input: Selected market and selection callback
 *   - State: Search query, active tab, favorite markets
 *   - Output: Market selection events
 *
 * @ai-hints: This component handles multiple filtering methods (tabs, search, favorites)
 *            and organizes markets into categories. It uses conditional rendering
 *            to display different sections based on the active tab and search state.
 *            Supports all major market types including forex, commodities, crypto,
 *            indices, stocks, energy, metals, and tactical indices.
 */
import React, { useState } from "react";
import { Input, Tabs } from "antd";
import { SearchOutlined, StarOutlined, StarFilled } from "@ant-design/icons";
import { marketData, MarketInfo } from "../../types/market";
import "./styles.scss";
import { MarketIcon } from "./MarketIcons/MarketIcon";

interface MarketSelectorProps {
  onSelectMarket: (market: MarketInfo) => void;
  selectedMarket?: MarketInfo;
}

// Define tab types
type TabType = "favorites" | "all" | "derived" | "forex" | "crash_boom" | "commodities" | "cryptocurrency" | "indices" | "stocks" | "energy" | "metals" | "soft_commodities" | "tactical_indices";

export const MarketSelector: React.FC<MarketSelectorProps> = ({
  onSelectMarket,
  selectedMarket,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [favoriteMarkets, setFavoriteMarkets] = useState<string[]>([]);

  // Group markets by type for display
  const syntheticMarkets = marketData.filter(
    (market) =>
      market.market_name === "synthetic_index" && !market.symbol.includes("1HZ")
  );

  const continuousIndicesMarkets = marketData.filter(
    (market) =>
      market.market_name === "synthetic_index" && market.symbol.includes("1HZ")
  );

  const crashBoomMarkets = marketData.filter(
    (market) => market.market_name === "crash_boom"
  );

  const forexMarkets = marketData.filter(
    (market) => market.market_name === "forex"
  );

  // New market categories
  const commoditiesMarkets = marketData.filter(
    (market) => market.market_name === "commodities"
  );

  const cryptocurrencyMarkets = marketData.filter(
    (market) => market.market_name === "cryptocurrency"
  );

  const indicesMarkets = marketData.filter(
    (market) => market.market_name === "indices"
  );

  const stocksMarkets = marketData.filter(
    (market) => market.market_name === "stocks"
  );

  const energyMarkets = marketData.filter(
    (market) => market.market_name === "energy"
  );

  const metalsMarkets = marketData.filter(
    (market) => market.market_name === "metals"
  );

  const softCommoditiesMarkets = marketData.filter(
    (market) => market.market_name === "soft_commodities"
  );

  const tacticalIndicesMarkets = marketData.filter(
    (market) => market.market_name === "tactical_indices"
  );

  // We don't filter the markets by tab anymore, we just use the tab to determine which sections to show
  const filteredMarkets = searchQuery
    ? marketData.filter(
        (market) =>
          market.displayName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          market.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : marketData;

  const favoriteFilteredMarkets = filteredMarkets.filter((market) =>
    favoriteMarkets.includes(market.symbol)
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
    setSearchQuery("");
  };

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the market selection
    setFavoriteMarkets((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleSelectMarket = (market: MarketInfo) => {
    onSelectMarket(market);
  };

  // Render market sections based on active tab and search query
  const renderMarketSections = () => {
    if (searchQuery) {
      // When searching, show all matching markets without sections
      return (
        <div className="market-section">
          {filteredMarkets.length > 0 ? (
            filteredMarkets.map((market) => renderMarketItem(market))
          ) : (
            <div className="no-markets">No markets match your search</div>
          )}
        </div>
      );
    }

    if (activeTab === "favorites") {
      return (
        <div className="market-section">
          {favoriteFilteredMarkets.length > 0 ? (
            favoriteFilteredMarkets.map((market) => renderMarketItem(market))
          ) : (
            <div className="no-markets">No favorite markets found</div>
          )}
        </div>
      );
    }

    // For other tabs, show relevant sections
    const showSynthetics = activeTab === "all" || activeTab === "derived";
    const showContinuous = activeTab === "all" || activeTab === "derived";
    const showCrashBoom = activeTab === "all" || activeTab === "crash_boom";
    const showForex = activeTab === "all" || activeTab === "forex";
    const showCommodities = activeTab === "all" || activeTab === "commodities";
    const showCryptocurrency = activeTab === "all" || activeTab === "cryptocurrency";
    const showIndices = activeTab === "all" || activeTab === "indices";
    const showStocks = activeTab === "all" || activeTab === "stocks";
    const showEnergy = activeTab === "all" || activeTab === "energy";
    const showMetals = activeTab === "all" || activeTab === "metals";
    const showSoftCommodities = activeTab === "all" || activeTab === "soft_commodities";
    const showTacticalIndices = activeTab === "all" || activeTab === "tactical_indices";

    return (
      <>
        {showSynthetics && syntheticMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Synthetics</h3>
            {syntheticMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showContinuous && continuousIndicesMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Continuous Indices</h3>
            {continuousIndicesMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showCrashBoom && crashBoomMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Crash/Boom</h3>
            {crashBoomMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showForex && forexMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Forex</h3>
            {forexMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showCommodities && commoditiesMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Commodities</h3>
            {commoditiesMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showCryptocurrency && cryptocurrencyMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Cryptocurrency</h3>
            {cryptocurrencyMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showIndices && indicesMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Indices</h3>
            {indicesMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showStocks && stocksMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Stocks</h3>
            {stocksMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showEnergy && energyMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Energy</h3>
            {energyMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showMetals && metalsMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Metals</h3>
            {metalsMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showSoftCommodities && softCommoditiesMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Soft Commodities</h3>
            {softCommoditiesMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}

        {showTacticalIndices && tacticalIndicesMarkets.length > 0 && (
          <div className="market-section">
            <h3 className="section-title">Tactical Indices</h3>
            {tacticalIndicesMarkets.map((market) => renderMarketItem(market))}
          </div>
        )}
      </>
    );
  };

  // Render individual market item
  const renderMarketItem = (market: MarketInfo) => {
    const isSelected = selectedMarket?.symbol === market.symbol;
    const isFavorite = favoriteMarkets.includes(market.symbol);

    return (
      <div
        key={market.symbol}
        className={`market-item ${isSelected ? "selected" : ""} ${
          market.isClosed ? "closed" : ""
        }`}
        onClick={() => !market.isClosed && handleSelectMarket(market)}
      >
        <div className="market-item-left">
          <MarketIcon symbol={market.symbol} />
          <span className="market-name">{market.displayName}</span>
          {market.isClosed && <span className="market-closed-tag">Closed</span>}
        </div>
        <div
          className="market-favorite"
          onClick={(e) => toggleFavorite(market.symbol, e)}
        >
          {isFavorite ? (
            <StarFilled className="star-filled" />
          ) : (
            <StarOutlined className="star-outline" />
          )}
        </div>
      </div>
    );
  };

  // Define tab items for Ant Design Tabs
  const tabItems = [
    {
      key: "favorites",
      label: "Favourites",
    },
    {
      key: "all",
      label: "All",
    },
    {
      key: "derived",
      label: "Derived",
    },
    {
      key: "forex",
      label: "Forex",
    },
    {
      key: "crash_boom",
      label: "Crash",
    },
    {
      key: "commodities",
      label: "Commodities",
    },
    {
      key: "cryptocurrency",
      label: "Crypto",
    },
    {
      key: "indices",
      label: "Indices",
    },
    {
      key: "stocks",
      label: "Stocks",
    },
    {
      key: "energy",
      label: "Energy",
    },
    {
      key: "metals",
      label: "Metals",
    },
    {
      key: "soft_commodities",
      label: "Soft",
    },
    {
      key: "tactical_indices",
      label: "Tactical",
    },
  ];

  return (
    <div className="market-selector">
      <div className="market-selector-search">
        <Input
          placeholder="Search markets on Rise/Fall"
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={handleSearch}
          className="market-search-input"
        />
      </div>

      <div className="market-selector-tabs-container">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          className="market-selector-tabs"
        />
      </div>

      <div className="market-content">{renderMarketSections()}</div>
    </div>
  );
};

export default MarketSelector;
