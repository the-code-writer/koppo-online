/**
 * @file: Positions/index.tsx
 * @description: Component for displaying trading positions with filtering and management
 *
 * @components:
 *   - Positions: Main component for positions display
 * @dependencies:
 *   - React: Core functionality and hooks
 *   - antd: UI components (Alert, Spin, Typography)
 * @usage:
 *   <Positions />
 *
 * @architecture: Functional component with filtering and state management
 * @relationships:
 *   - Parent: PositionsPage
 *   - Children: TradeFilters, TradeGrid
 * @dataFlow:
 *   - Input: Trading positions from API or props
 *   - Processing: Filtering and sorting based on user selections
 *   - Output: Filtered positions display and position management actions
 *
 * @ai-hints: This component handles the display logic for trading positions,
 *            including filtering, sorting, and empty state handling.
 */
import React, { useState, useEffect, useRef } from 'react';
import { Alert, Spin, Typography, Tabs } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import TradeGrid from './components/TradeGrid';
import './styles.scss';

const { Title } = Typography;
const { TabPane } = Tabs;

// Mock data for demonstration
const mockTrades = {
  'session_1': {
    session_id: 'session_1',
    strategy: 'repeat',
    status: 'running',
    start_time: '2024-01-10T10:30:00Z',
    total_profit: 125.50,
    contracts: [
      {
        contract_id: 'contract_abc123',
        profit: 25.50,
        stake: 10.00,
        result: 'win'
      },
      {
        contract_id: 'contract_def456',
        profit: 15.25,
        stake: 10.00,
        result: 'win'
      }
    ],
    market: 'Volatility 100 (1s) Index',
    trade_type: 'rise',
    base_stake: 10.00,
    max_trades: 50,
    current_trade: 3
  },
  'session_2': {
    session_id: 'session_2',
    strategy: 'martingale',
    status: 'stopped',
    start_time: '2024-01-10T09:15:00Z',
    total_profit: -45.75,
    contracts: [
      {
        contract_id: 'contract_ghi789',
        profit: -20.00,
        stake: 15.00,
        result: 'loss'
      },
      {
        contract_id: 'contract_jkl012',
        profit: -25.75,
        stake: 20.00,
        result: 'loss'
      }
    ],
    market: 'Boom 1000 Index',
    trade_type: 'fall',
    base_stake: 15.00,
    max_trades: 30,
    current_trade: 2
  },
  'session_3': {
    session_id: 'session_3',
    strategy: 'dalembert',
    status: 'running',
    start_time: '2024-01-10T11:45:00Z',
    total_profit: 89.25,
    contracts: [
      {
        contract_id: 'contract_mno345',
        profit: 35.00,
        stake: 12.00,
        result: 'win'
      },
      {
        contract_id: 'contract_pqr678',
        profit: 54.25,
        stake: 18.00,
        result: 'win'
      }
    ],
    market: 'Volatility 75 (1s) Index',
    trade_type: 'rise',
    base_stake: 12.00,
    max_trades: 40,
    current_trade: 2
  },
  'session_4': {
    session_id: 'session_4',
    strategy: 'repeat',
    status: 'error',
    start_time: '2024-01-10T08:30:00Z',
    total_profit: -15.00,
    contracts: [
      {
        contract_id: 'contract_stu901',
        profit: -15.00,
        stake: 8.00,
        result: 'loss'
      }
    ],
    market: 'Crash 1000 Index',
    trade_type: 'fall',
    base_stake: 8.00,
    max_trades: 25,
    current_trade: 1
  },
  'session_5': {
    session_id: 'session_5',
    strategy: 'martingale',
    status: 'completed',
    start_time: '2024-01-10T07:00:00Z',
    total_profit: 200.00,
    contracts: [
      {
        contract_id: 'contract_vwx234',
        profit: 50.00,
        stake: 20.00,
        result: 'win'
      },
      {
        contract_id: 'contract_yza567',
        profit: 75.00,
        stake: 25.00,
        result: 'win'
      },
      {
        contract_id: 'contract_bcd890',
        profit: 75.00,
        stake: 30.00,
        result: 'win'
      }
    ],
    market: 'Volatility 100 (1s) Index',
    trade_type: 'rise',
    base_stake: 20.00,
    max_trades: 35,
    current_trade: 3
  }
};

const Positions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('open');
  const [trades, setTrades] = useState(mockTrades);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate initial loading
  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const getOpenAndClosedTrades = () => {
    // Convert trades object to array
    const allTrades = Object.values(trades);
    
    // Separate open and closed trades
    const openTrades = allTrades.filter(trade =>
      trade.status !== 'stopped' && trade.status !== 'error' && trade.status !== 'completed'
    );
    
    const closedTrades = allTrades.filter(trade =>
      trade.status === 'stopped' || trade.status === 'error' || trade.status === 'completed'
    );
    
    // Sort by start time (newest first)
    const sortTrades = (trades: any[]) => {
      return [...trades].sort((a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
      );
    };
    
    return {
      openTrades: sortTrades(openTrades),
      closedTrades: sortTrades(closedTrades)
    };
  };

  const { openTrades, closedTrades } = getOpenAndClosedTrades();

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // Handle position closing and switch to Closed tab
  const handleClosePosition = async (sessionId: string) => {
    // Simulate closing position
    setTrades(prevTrades => ({
      ...prevTrades,
      [sessionId]: {
        ...prevTrades[sessionId],
        status: 'stopped'
      }
    }));
    
    // Switch to the Closed Positions tab
    setActiveTab('closed');
  };

  const renderTabContent = (trades: any[], tabType: string) => {
    if (loading) {
      return (
        <div className="positions__loading">
          <Spin size="large" />
        </div>
      );
    }
    
    if (trades.length === 0) {
      return (
        <div className="positions__empty">
          <SwapOutlined />
          <Title level={3}>
            {tabType === 'open' ? 'No Active Positions' : 'No Closed Positions'}
          </Title>
          <p>
            {tabType === 'open'
              ? 'There are currently no active trading positions to display.'
              : 'There are currently no closed trading positions to display.'}
          </p>
        </div>
      );
    }
    
    return (
      <TradeGrid
        trades={trades}
        loading={false}
        onClose={handleClosePosition}
        lastUpdated={new Date().toISOString()}
      />
    );
  };

  return (
    <div className="positions">
      <div className="positions__header">
        <div className="positions__title">
          <Title level={1}>Trading Positions</Title>
        </div>
      </div>

      <div className="positions__content">
        {error ? (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            className="positions__error"
          />
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            className="positions__tabs"
          >
            <TabPane tab="Open Positions" key="open">
              {renderTabContent(openTrades, 'open')}
            </TabPane>
            <TabPane tab="Closed Positions" key="closed">
              {renderTabContent(closedTrades, 'closed')}
            </TabPane>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Positions;