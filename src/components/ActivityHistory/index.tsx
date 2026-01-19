import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SearchOutlined, FilePdfOutlined, TrophyOutlined, RightSquareFilled, LeftSquareFilled } from '@ant-design/icons';
import { Button, Input, Space, Select, Row, Col, Flex, Badge, Spin, Empty } from 'antd';
import { MarketDerivedVolatility100Icon, TradeTypesTurboShortIcon } from '@deriv/quill-icons';
import './styles.scss';

interface TransactionDataType {
  key: string;
  image: string;
  entryPrice: number;
  exitPrice: number;
  buyPrice: number;
  profitLoss: number;
  sessionId: string;
  market: string;
  tradeType: string;
  timestamp: string;
  botName: string;
}

// Mock data for 50 transactions
const mockTransactions: TransactionDataType[] = [
  {
    key: '1',
    image: 'https://picsum.photos/seed/tx1/40/40.jpg',
    entryPrice: 1.2345,
    exitPrice: 1.2378,
    buyPrice: 10.00,
    profitLoss: 3.30,
    sessionId: 'session_1',
    market: 'Volatility 100 (1s) Index',
    tradeType: 'Rise',
    timestamp: '2024-01-10T10:30:15Z',
    botName: 'Alpha Trader'
  },
  {
    key: '2',
    image: 'https://picsum.photos/seed/tx2/40/40.jpg',
    entryPrice: 1.3456,
    exitPrice: 1.3421,
    buyPrice: 15.00,
    profitLoss: -3.50,
    sessionId: 'session_2',
    market: 'Boom 1000 Index',
    tradeType: 'Fall',
    timestamp: '2024-01-10T10:25:30Z',
    botName: 'Beta Scalper'
  },
  {
    key: '3',
    image: 'https://picsum.photos/seed/tx3/40/40.jpg',
    entryPrice: 1.4567,
    exitPrice: 1.4689,
    buyPrice: 12.00,
    profitLoss: 14.64,
    sessionId: 'session_3',
    market: 'Volatility 75 (1s) Index',
    tradeType: 'Rise',
    timestamp: '2024-01-10T10:20:45Z',
    botName: 'Gamma Runner'
  },
  {
    key: '4',
    image: 'https://picsum.photos/seed/tx4/40/40.jpg',
    entryPrice: 1.5678,
    exitPrice: 1.5678,
    buyPrice: 8.00,
    profitLoss: -8.00,
    sessionId: 'session_4',
    market: 'Crash 1000 Index',
    tradeType: 'Fall',
    timestamp: '2024-01-10T10:15:00Z',
    botName: 'Delta Trader'
  },
  {
    key: '5',
    image: 'https://picsum.photos/seed/tx5/40/40.jpg',
    entryPrice: 1.6789,
    exitPrice: 1.6823,
    buyPrice: 20.00,
    profitLoss: 6.80,
    sessionId: 'session_5',
    market: 'Volatility 100 (1s) Index',
    tradeType: 'Rise',
    timestamp: '2024-01-10T10:10:15Z',
    botName: 'Epsilon Bot'
  },
  // Add more mock transactions to reach 50
  ...Array.from({ length: 45 }, (_, i) => ({
    key: `${i + 6}`,
    image: `https://picsum.photos/seed/tx${i + 6}/40/40.jpg`,
    entryPrice: parseFloat((1.1 + Math.random() * 0.5).toFixed(4)),
    exitPrice: parseFloat((1.1 + Math.random() * 0.5).toFixed(4)),
    buyPrice: parseFloat((5 + Math.random() * 25).toFixed(2)),
    profitLoss: parseFloat((Math.random() * 40 - 20).toFixed(2)),
    sessionId: `session_${(i % 5) + 1}`,
    market: ['Volatility 100 (1s) Index', 'Boom 1000 Index', 'Volatility 75 (1s) Index', 'Crash 1000 Index'][i % 4],
    tradeType: Math.random() > 0.5 ? 'Rise' : 'Fall',
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    botName: ['Alpha Trader', 'Beta Scalper', 'Gamma Runner', 'Delta Trader', 'Epsilon Bot'][i % 5]
  }))
];

// Bot sessions for dropdown
const botSessions = [
  { label: 'All Sessions', value: 'all' },
  { label: 'Alpha Trader (session_1)', value: 'session_1' },
  { label: 'Beta Scalper (session_2)', value: 'session_2' },
  { label: 'Gamma Runner (session_3)', value: 'session_3' },
  { label: 'Delta Trader (session_4)', value: 'session_4' },
  { label: 'Epsilon Bot (session_5)', value: 'session_5' }
];

export function ActivityHistory() {
  const [selectedSession, setSelectedSession] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [filteredData, setFilteredData] = useState(mockTransactions.slice(0, 10));
  const [displayedCount, setDisplayedCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Handle scroll events for header positioning
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 57) {
        setIsHeaderFixed(true);
      } else {
        setIsHeaderFixed(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter data based on session selection
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      let filtered = mockTransactions;
      if (selectedSession !== 'all') {
        filtered = mockTransactions.filter(tx => tx.sessionId === selectedSession);
      }
      
      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(tx => 
          tx.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.sessionId.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setFilteredData(filtered.slice(0, displayedCount));
      setLoading(false);
    }, 300);
  }, [selectedSession, searchQuery, displayedCount]);

  // Apply search filter
  useEffect(() => {
    let filtered = mockTransactions;
    if (selectedSession !== 'all') {
      filtered = filtered.filter(tx => tx.sessionId === selectedSession);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.sessionId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredData(filtered.slice(0, displayedCount));
  }, [searchQuery, selectedSession, displayedCount]);

  // Load more function
  const loadMore = useCallback(() => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    setTimeout(() => {
      let filtered = mockTransactions;
      if (selectedSession !== 'all') {
        filtered = filtered.filter(tx => tx.sessionId === selectedSession);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(tx => 
          tx.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.sessionId.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      const newCount = displayedCount + 10;
      setDisplayedCount(newCount);
      setFilteredData(filtered.slice(0, newCount));
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, displayedCount, selectedSession, searchQuery]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0,
    };

    observer.current = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        loadMore();
      }
    }, options);

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loadMore]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(10);
  }, [selectedSession, searchQuery]);

  const renderTransactionItem = (transaction: TransactionDataType) => (
    <div key={transaction.key} className="transaction-item">
      <Flex align="center" justify="space-between" gap={12}>
          <h3><strong>The Bot Name</strong></h3>
          <span>6min</span>
        </Flex>
      <p>Win payout if the last digit of Volatility 90 (1s) Index is strictly higher than 1 after 1 ticks. (ID: 604709034788)</p>
      <hr/>
      <div class="transaction-item-wrapper">
      <div className="transaction-left">
        <Flex align="center" gap={12}>
          <MarketDerivedVolatility100Icon fill='#ffffff' iconSize='md'/>
          <TradeTypesTurboShortIcon fill='#ffffff' iconSize='md'/>
        </Flex>
      </div>
      
      <div className="transaction-middle">
        <div className="entry-exit-group">
          <div className="entry-price"><RightSquareFilled /> {transaction.entryPrice.toFixed(4)}</div>
          <div className="exit-price"><LeftSquareFilled /> {transaction.exitPrice.toFixed(4)}</div>
        </div>
      </div>
      
      <div className="transaction-right">
        <div className="stake-profit-group">
          <div className="stake-amount"><Flex justify="space-between"><span>Stake: </span  ><span>{transaction.buyPrice.toFixed(2)} USD</span  ></Flex></div>
          <div className={`profit-loss ${transaction.profitLoss >= 0 ? 'profit' : 'loss'}`}>
            <Flex justify="space-between"><span>{transaction.profitLoss >= 0 ? 'Profit' : 'Loss'}: </span  ><span>{transaction.profitLoss >= 0 ? '+' : ''}{transaction.profitLoss.toFixed(2)} USD</span  ></Flex>
            
          </div>
        </div>
      </div>
      </div>
    </div>
  );

  return (
    <div className="activity-history-container">
      {/* Fixed Search Header */}
      <div className={`activity-history-search-header ${isHeaderFixed ? 'fixed' : ''}`}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Flex align="center" justify="space-between">
              <h1 style={{ fontSize: 32 }}>History</h1>
              <Space>
                <Button 
                  type="primary" 
                  icon={<FilePdfOutlined />} 
                  className="create-btn"
                >
                  Generate Report
                </Button>
              </Space>
            </Flex>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Flex align="center" gap={16}>
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<TrophyOutlined />}
                className="search-input"
                allowClear
              />
              <Select
                value={selectedSession}
                onChange={setSelectedSession}
                className="session-dropdown"
                style={{ minWidth: 200 }}
                options={botSessions}
              />
            </Flex>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div className="activity-history-main-content">
        {loading ? (
          <div className="loading-state">
            <Spin size="large" />
            <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading transactions...</div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state">
            <Empty
              description={
                <span className="empty-text">
                  {selectedSession === 'all' ? 'No transactions found.' : 'No transactions found for this session.'}
                </span>
              }
            />
          </div>
        ) : (
          <div className="transaction-list">
            {filteredData.map(renderTransactionItem)}
            {loadingMore && (
              <div className="loading-more">
                <Spin size="small" />
                <span>Loading more...</span>
              </div>
            )}
            <div ref={loadMoreRef} style={{ height: 20 }} />
          </div>
        )}
      </div>
    </div>
  );
}
