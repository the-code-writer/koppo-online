export interface MarketInfo {
    symbol: string
    displayName: string
    shortName: string
    market_name: string
    type: "volatility" | "boom" | "crash" | "forex" | "commodities" | "cryptocurrency" | "indices" | "stocks" | "energy" | "metals" | "soft_commodities" | "derived" | "tactical_indices"
    isClosed?: boolean
  }
  
  // Market display titles
  export const marketTitles: Record<string, string> = {
    synthetic_index: "Synthetics",
    crash_boom: "Crash/Boom",
    forex: "Forex",
    commodities: "Commodities",
    //
    cryptocurrency: "Cryptocurrency",
    indices: "Indices",
    stocks: "Stocks",
    energy: "Energy",
    metals: "Metals",
    soft_commodities: "Soft Commodities",
    derived: "Derived",
    tactical_indices: "Tactical Indices",
  }
  
  // Market type mapping for tabs
  export const marketTypeMap: Record<string, string> = {
    derived: "synthetic_index",
    forex: "forex",
    crash_boom: "crash_boom",
    commodities: "commodities",
    //
    cryptocurrency: "cryptocurrency",
    indices: "indices",
    stocks: "stocks",
    energy: "energy",
    metals: "metals",
    soft_commodities: "soft_commodities",
    tactical_indices: "tactical_indices",
  }
  
  export const marketData: MarketInfo[] = [
    // Synthetic Indices
    {
      symbol: "R_100",
      displayName: "Volatility 100 Index",
      shortName: "100",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "R_90",
      displayName: "Volatility 90 Index",
      shortName: "90",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "R_75",
      displayName: "Volatility 75 Index",
      shortName: "75",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "R_50",
      displayName: "Volatility 50 Index",
      shortName: "50",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "R_35",
      displayName: "Volatility 35 Index",
      shortName: "35",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "R_25",
      displayName: "Volatility 25 Index",
      shortName: "25",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "R_10",
      displayName: "Volatility 10 Index",
      shortName: "10",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "1HZ100V",
      displayName: "Volatility 100 (1s) Index",
      shortName: "100",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "1HZ75V",
      displayName: "Volatility 75 (1s) Index",
      shortName: "75",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "1HZ50V",
      displayName: "Volatility 50 (1s) Index",
      shortName: "50",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "1HZ25V",
      displayName: "Volatility 25 (1s) Index",
      shortName: "25",
      market_name: "synthetic_index",
      type: "volatility"
    },
    {
      symbol: "1HZ10V",
      displayName: "Volatility 10 (1s) Index",
      shortName: "10",
      market_name: "synthetic_index",
      type: "volatility"
    },
    
    // Crash/Boom
    {
      symbol: "BOOM1000",
      displayName: "Boom 1000 Index",
      shortName: "1000",
      market_name: "crash_boom",
      type: "boom"
    },
    {
      symbol: "BOOM500",
      displayName: "Boom 500 Index",
      shortName: "500",
      market_name: "crash_boom",
      type: "boom"
    },
    {
      symbol: "CRASH1000",
      displayName: "Crash 1000 Index",
      shortName: "1000",
      market_name: "crash_boom",
      type: "crash"
    },
    {
      symbol: "CRASH500",
      displayName: "Crash 500 Index",
      shortName: "500",
      market_name: "crash_boom",
      type: "crash"
    },
    
    // Forex
    {
      symbol: "frxEURUSD",
      displayName: "EUR/USD",
      shortName: "EUR",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxGBPUSD",
      displayName: "GBP/USD",
      shortName: "GBP",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxUSDJPY",
      displayName: "USD/JPY",
      shortName: "USD",
      market_name: "forex",
      type: "volatility",
      isClosed: true
    },
    {
      symbol: "frxAUDUSD",
      displayName: "AUD/USD",
      shortName: "AUD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxUSDCAD",
      displayName: "USD/CAD",
      shortName: "USD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxUSDCHF",
      displayName: "USD/CHF",
      shortName: "USD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxEURGBP",
      displayName: "EUR/GBP",
      shortName: "EUR",
      market_name: "forex",
      type: "volatility"
    },

    //
    
    // Additional Synthetic Indices
    {
      symbol: "1HZ901V",
      displayName: "Volatility 90 (1s) Index",
      shortName: "90",
      market_name: "synthetic_index",
      type: "volatility"
    },
    
    // Additional Crash/Boom
    {
      symbol: "BOOM300",
      displayName: "Boom 300 Index",
      shortName: "300",
      market_name: "crash_boom",
      type: "boom"
    },
    {
      symbol: "BOOM600",
      displayName: "Boom 600 Index",
      shortName: "600",
      market_name: "crash_boom",
      type: "boom"
    },
    {
      symbol: "BOOM900",
      displayName: "Boom 900 Index",
      shortName: "900",
      market_name: "crash_boom",
      type: "boom"
    },
    {
      symbol: "CRASH300",
      displayName: "Crash 300 Index",
      shortName: "300",
      market_name: "crash_boom",
      type: "crash"
    },
    {
      symbol: "CRASH600",
      displayName: "Crash 600 Index",
      shortName: "600",
      market_name: "crash_boom",
      type: "crash"
    },
    {
      symbol: "CRASH900",
      displayName: "Crash 900 Index",
      shortName: "900",
      market_name: "crash_boom",
      type: "crash"
    },
    
    // Additional Forex Pairs
    {
      symbol: "frxAUDSGD",
      displayName: "AUD/SGD",
      shortName: "AUD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxCADCHF",
      displayName: "CAD/CHF",
      shortName: "CAD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxCADJPY",
      displayName: "CAD/JPY",
      shortName: "CAD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxCHFJPY",
      displayName: "CHF/JPY",
      shortName: "CHF",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxEURHKD",
      displayName: "EUR/HKD",
      shortName: "EUR",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxEURILS",
      displayName: "EUR/ILS",
      shortName: "EUR",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxEURMXN",
      displayName: "EUR/MXN",
      shortName: "EUR",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxEURNOK",
      displayName: "EUR/NOK",
      shortName: "EUR",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxEURPLN",
      displayName: "EUR/PLN",
      shortName: "EUR",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxEURSEK",
      displayName: "EUR/SEK",
      shortName: "EUR",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxEURSGD",
      displayName: "EUR/SGD",
      shortName: "EUR",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxEURZAR",
      displayName: "EUR/ZAR",
      shortName: "EUR",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxGBPSEK",
      displayName: "GBP/SEK",
      shortName: "GBP",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxGBPSGD",
      displayName: "GBP/SGD",
      shortName: "GBP",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxHKDJPY",
      displayName: "HKD/JPY",
      shortName: "HKD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxNZDCAD",
      displayName: "NZD/CAD",
      shortName: "NZD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxNZDCHF",
      displayName: "NZD/CHF",
      shortName: "NZD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxNZDSGD",
      displayName: "NZD/SGD",
      shortName: "NZD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxSGDJPY",
      displayName: "SGD/JPY",
      shortName: "SGD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxUSDCNH",
      displayName: "USD/CNH",
      shortName: "USD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxUSDHKD",
      displayName: "USD/HKD",
      shortName: "USD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxUSDILS",
      displayName: "USD/ILS",
      shortName: "USD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxUSDRUB",
      displayName: "USD/RUB",
      shortName: "USD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxUSDSGD",
      displayName: "USD/SGD",
      shortName: "USD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxUSDTHB",
      displayName: "USD/THB",
      shortName: "USD",
      market_name: "forex",
      type: "volatility"
    },
    {
      symbol: "frxUSDZAR",
      displayName: "USD/ZAR",
      shortName: "USD",
      market_name: "forex",
      type: "volatility"
    },
    
    // Commodities
    {
      symbol: "frxXAGUSD",
      displayName: "Silver/USD",
      shortName: "Silver",
      market_name: "commodities",
      type: "commodities"
    },
    {
      symbol: "frxXAUUSD",
      displayName: "Gold/USD",
      shortName: "Gold",
      market_name: "commodities",
      type: "commodities"
    },
    {
      symbol: "frxXPDUSD",
      displayName: "Palladium/USD",
      shortName: "Palladium",
      market_name: "commodities",
      type: "commodities"
    },
    {
      symbol: "frxXPTUSD",
      displayName: "Platinum/USD",
      shortName: "Platinum",
      market_name: "commodities",
      type: "commodities"
    },
    {
      symbol: "frxALUMUSD",
      displayName: "Aluminium/USD",
      shortName: "Aluminium",
      market_name: "commodities",
      type: "commodities"
    },
    {
      symbol: "frxCOPUSD",
      displayName: "Copper/USD",
      shortName: "Copper",
      market_name: "commodities",
      type: "commodities"
    },
    {
      symbol: "frxAUDEUR",
      displayName: "Gold/EUR",
      shortName: "Gold",
      market_name: "commodities",
      type: "commodities"
    },
    {
      symbol: "frxLEADUSD",
      displayName: "Lead/USD",
      shortName: "Lead",
      market_name: "commodities",
      type: "commodities"
    },
    {
      symbol: "frxNICKUSD",
      displayName: "Nickel/USD",
      shortName: "Nickel",
      market_name: "commodities",
      type: "commodities"
    },
    {
      symbol: "frxXAGEUR",
      displayName: "Silver/EUR",
      shortName: "Silver",
      market_name: "commodities",
      type: "commodities"
    },
    {
      symbol: "frxZINCUSD",
      displayName: "Zinc/USD",
      shortName: "Zinc",
      market_name: "commodities",
      type: "commodities"
    },
    
    // Energy
    {
      symbol: "OTC_BRENT",
      displayName: "Brent Crude Oil",
      shortName: "Brent",
      market_name: "energy",
      type: "energy"
    },
    {
      symbol: "OTC_NGAS",
      displayName: "Natural Gas",
      shortName: "Gas",
      market_name: "energy",
      type: "energy"
    },
    {
      symbol: "OTC_WTI",
      displayName: "WTI Oil",
      shortName: "WTI",
      market_name: "energy",
      type: "energy"
    },
    
    // Indices
    {
      symbol: "OTC_AS51",
      displayName: "Australia 200",
      shortName: "AUS200",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_SX5E",
      displayName: "Euro 50",
      shortName: "EU50",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_FCHI",
      displayName: "France 40",
      shortName: "FRA40",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_GDAXI",
      displayName: "German 40",
      shortName: "GER40",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_HSI",
      displayName: "Hong Kong 50",
      shortName: "HK50",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_N225",
      displayName: "Japan 225",
      shortName: "JPN225",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_AEX",
      displayName: "Netherlands 25",
      shortName: "NETH25",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_SSMI",
      displayName: "Swiss 20",
      shortName: "SWI20",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_FTSE",
      displayName: "UK 100",
      shortName: "UK100",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_SPC",
      displayName: "US 500",
      shortName: "US500",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_NDX",
      displayName: "US Tech 100",
      shortName: "USTECH",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_DJI",
      displayName: "Wall Street 30",
      shortName: "WS30",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_CHN50",
      displayName: "China 50",
      shortName: "CHN50",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_CHNHS",
      displayName: "China H Shares",
      shortName: "CHNHS",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_SIN20",
      displayName: "Singapore 20",
      shortName: "SIN20",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_ES35",
      displayName: "Spain 35",
      shortName: "ESP35",
      market_name: "indices",
      type: "indices"
    },
    {
      symbol: "OTC_TWII",
      displayName: "Taiwan Index",
      shortName: "TAIWAN",
      market_name: "indices",
      type: "indices"
    },
    
    // Cryptocurrencies
    {
      symbol: "cryBTCUSD",
      displayName: "BTC/USD",
      shortName: "BTC",
      market_name: "cryptocurrency",
      type: "cryptocurrency"
    },
    {
      symbol: "cryETHUSD",
      displayName: "ETH/USD",
      shortName: "ETH",
      market_name: "cryptocurrency",
      type: "cryptocurrency"
    },
    {
      symbol: "cryLTCUSD",
      displayName: "LTC/USD",
      shortName: "LTC",
      market_name: "cryptocurrency",
      type: "cryptocurrency"
    },
    {
      symbol: "cryBCHUSD",
      displayName: "BCH/USD",
      shortName: "BCH",
      market_name: "cryptocurrency",
      type: "cryptocurrency"
    },
    {
      symbol: "cryXRPUSD",
      displayName: "XRP/USD",
      shortName: "XRP",
      market_name: "cryptocurrency",
      type: "cryptocurrency"
    },
    {
      symbol: "cryADAUSD",
      displayName: "ADA/USD",
      shortName: "ADA",
      market_name: "cryptocurrency",
      type: "cryptocurrency"
    },
    {
      symbol: "cryDOTUSD",
      displayName: "DOT/USD",
      shortName: "DOT",
      market_name: "cryptocurrency",
      type: "cryptocurrency"
    },
    {
      symbol: "cryEOSUSD",
      displayName: "EOS/USD",
      shortName: "EOS",
      market_name: "cryptocurrency",
      type: "cryptocurrency"
    },
    {
      symbol: "cryETCUSD",
      displayName: "ETC/USD",
      shortName: "ETC",
      market_name: "cryptocurrency",
      type: "cryptocurrency"
    },
    {
      symbol: "cryTRXUSD",
      displayName: "TRX/USD",
      shortName: "TRX",
      market_name: "cryptocurrency",
      type: "cryptocurrency"
    }
  ]
  