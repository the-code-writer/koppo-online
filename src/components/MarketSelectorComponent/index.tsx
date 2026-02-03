import React, { useState, useEffect } from 'react';
import { InputField } from '../InputField';
import { BottomActionSheet } from '../BottomActionSheet';
import { MarketSelector } from '../MarketSelector';
import { MarketDerivedVolatility1001sIcon } from '@deriv/quill-icons';
import { DownOutlined } from '@ant-design/icons';
import { MarketInfo } from '../../types/market';
import './styles.scss';
import { MarketIcon } from '../MarketSelector/MarketIcons/MarketIcon';

export interface MarketSelectorComponentProps {
  value?: MarketInfo | null;
  onChange?: (market: MarketInfo | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MarketSelectorComponent({
  value = null,
  onChange,
  placeholder = 'Select market',
  disabled = false,
  className = '',
}: MarketSelectorComponentProps) {
  const [currentMarket, setCurrentMarket] = useState<MarketInfo | null>(value);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  // Sync with external value changes
  useEffect(() => {
    setCurrentMarket(value);
  }, [value]);

  const handleMarketSelection = (market: MarketInfo) => {
    console.log(market)
    setCurrentMarket(market);
    onChange?.(market);
    setIsActionSheetOpen(false);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsActionSheetOpen(true);
    }
  };

  const getDisplayValue = () => {
    if (!currentMarket) return placeholder;
    return currentMarket.displayName || currentMarket.shortName || currentMarket.symbol;
  };

  const getMarketIcon = () => {
    // Return default icon if no market is selected
    if (!currentMarket) {
      return <MarketDerivedVolatility1001sIcon fill='#000000' iconSize='sm' />;
    }
    // Return market-specific icon
    return <MarketIcon symbol={currentMarket.symbol} />;
  };

  return (
    <div className={`market-selector-component ${className}`}>
      <InputField
        type="selectable"
        value={getDisplayValue()}
        prefix={getMarketIcon()}
        suffix={<DownOutlined />}
        disabled={disabled}
        onClick={handleInputClick}
        readOnly
        className="market-input-field"
        placeholder="Click here to select market"
      />
      
      <BottomActionSheet  onClose={() => setIsActionSheetOpen(false)} isOpen={isActionSheetOpen} >
        <MarketSelector
          onSelectMarket={handleMarketSelection}
          selectedMarket={currentMarket}
        />
      </BottomActionSheet>
    </div>
  );
}

export default MarketSelectorComponent;
