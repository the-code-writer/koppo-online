import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FilePdfOutlined, TrophyOutlined, RightSquareFilled, LeftSquareFilled, SyncOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Input, Row, Col, Flex, Badge, Spin, Empty, Typography, Dropdown } from 'antd';
import { MarketDerivedVolatility100Icon, TradeTypesTurboShortIcon } from '@deriv/quill-icons';
import './styles.scss';
import { useDiscoveryContext } from '../../contexts/DiscoveryContext';

import { BotContractTrade } from '../../services/botContractTradesAPIService';
import { useEventPublisher } from '../../hooks/useEventManager';



export function ActivityHistory() {

  const { activityHistoryItems, refreshActivityHistory, activityHistoryLoading } = useDiscoveryContext();

  const { publish } = useEventPublisher();

  const [selectedSession, setSelectedSession] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(activityHistoryLoading);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [filteredData, setFilteredData] = useState<BotContractTrade[]>([]);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    setLoading(activityHistoryLoading);
  }, [activityHistoryLoading])

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
      let filtered = activityHistoryItems;
      if (selectedSession !== 'all') {
        filtered = activityHistoryItems.filter(tx => tx.sessionId === selectedSession);
      }
      
      // Apply status filter
      if (selectedFilter !== 'all') {
        filtered = filtered.filter(tx => {
          switch (selectedFilter) {
            case 'won':
              return tx.status === 'won';
            case 'lost':
              return tx.status === 'lost';
            case 'profitable':
              return tx.profit_value > 0;
            case 'loss':
              return tx.profit_value < 0;
            default:
              // Handle session-based filtering (keys start with 'session:')
              if (selectedFilter.startsWith('session:')) {
                const sessionId = selectedFilter.replace('session:', '');
                return tx.sessionId === sessionId;
              }
              return true;
          }
        });
      }

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(tx =>
          tx.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.symbol_full?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.contract_type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setFilteredData(filtered.slice(0, displayedCount));
      setLoading(false);
    }, 300);
  }, [selectedSession, selectedFilter, searchQuery, displayedCount, activityHistoryItems]);

  // Apply search filter
  useEffect(() => {
    let filtered = activityHistoryItems;
    if (selectedSession !== 'all') {
      filtered = filtered.filter(tx => tx.sessionId === selectedSession);
    }
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(tx => {
        switch (selectedFilter) {
          case 'won':
            return tx.status === 'won';
          case 'lost':
            return tx.status === 'lost';
          case 'profitable':
            return tx.profit_value > 0;
          case 'loss':
            return tx.profit_value < 0;
          default:
            // Handle session-based filtering (keys start with 'session:')
            if (selectedFilter.startsWith('session:')) {
              const sessionId = selectedFilter.replace('session:', '');
              return tx.sessionId === sessionId;
            }
            return true;
        }
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(tx =>
        tx.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.symbol_full?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.contract_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredData(filtered.slice(0, displayedCount));
  }, [searchQuery, selectedSession, selectedFilter, displayedCount, activityHistoryItems]);

  // Load more function
  const loadMore = useCallback(() => {
    if (loadingMore) return;

    setLoadingMore(true);
    setTimeout(() => {
      let filtered = activityHistoryItems;
      if (selectedSession !== 'all') {
        filtered = filtered.filter(tx => tx.sessionId === selectedSession);
      }
      
      // Apply status filter
      if (selectedFilter !== 'all') {
        filtered = filtered.filter(tx => {
          switch (selectedFilter) {
            case 'won':
              return tx.status === 'won';
            case 'lost':
              return tx.status === 'lost';
            case 'profitable':
              return tx.profit_value > 0;
            case 'loss':
              return tx.profit_value < 0;
            default:
              return true;
          }
        });
      }

      if (searchQuery) {
        filtered = filtered.filter(tx =>
          tx.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.symbol_full?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.contract_type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      const newCount = displayedCount + 10;
      setDisplayedCount(newCount);
      setFilteredData(filtered.slice(0, newCount));
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, displayedCount, selectedSession, selectedFilter, searchQuery, activityHistoryItems]);

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

  // Handle transaction card click
  const handleTransactionClick = (transaction: BotContractTrade) => {
    publish("SHOW_TRADE_CONTRACT_DETAILS", {
      transaction,
    });
  };

  // Handle filter menu click
  const handleFilterMenuClick = ({ key }: { key: string }) => {
    setSelectedFilter(key);
  };
  // Generate filter options with dynamic bot sessions
  const filterOptions = React.useMemo(() => {
    const baseOptions = [
      { label: 'All Trades', key: 'all' },
      { label: 'Won Trades', key: 'won' },
      { label: 'Lost Trades', key: 'lost' },
    ];

    // Get unique session IDs from activity history
    const uniqueSessions = [...new Set(activityHistoryItems.map(item => item.sessionId))];
    
    // Add session options
    const sessionOptions = uniqueSessions.map(sessionId => ({
      label: `Session: ${sessionId.substring(11)}`,
      key: `session:${sessionId}`
    }));

    return [...baseOptions, ...sessionOptions];
  }, [activityHistoryItems]);

  const renderTransactionItem = (transaction: BotContractTrade) => (
    <div
      key={transaction._id}
      className="transaction-item"
      onClick={() => handleTransactionClick(transaction)}
      style={{ cursor: 'pointer' }}
    >
      <Flex align="center" justify="space-between" gap={12}>
        <h3><strong>{transaction.symbol_full || transaction.symbol} &bull; {transaction.contract_type} &bull; {transaction.duration} {transaction.duration_unit} </strong></h3>
        <span>{transaction.createdAt ? new Date(transaction.createdAt).toLocaleTimeString() : '6min'}</span>
      </Flex>
      <p>{transaction.longcode}<br/>&bull; <strong>Session ID:</strong> {transaction.sessionId}<br/>&bull; <strong>Proposal ID:</strong> {transaction.proposal_id}</p>
      <hr />
      <div className="transaction-item-wrapper">
        <div className="transaction-left">
          <Flex align="center" gap={12}>
            <MarketDerivedVolatility100Icon fill='#ffffff' iconSize='md' />
            <TradeTypesTurboShortIcon fill='#ffffff' iconSize='md' />
          </Flex>
        </div>

        <div className="transaction-middle">
          <div className="entry-exit-group">
            <div className="entry-price"><RightSquareFilled /> {transaction.entry_spot_value}</div>
            <div className="exit-price"><LeftSquareFilled /> {transaction.exit_spot_value}</div>
          </div>
        </div>

        <div className="transaction-right">
          <div className="stake-profit-group">
            <div className="stake-amount"><Flex justify="space-between"><span>Stake: </span><span>{transaction.amount.toFixed(2)} {transaction.currency}</span  ></Flex></div>
            <div className="stake-amount"><Flex justify="space-between"><span className={transaction.profit_value && transaction.profit_value >= 0 ? 'profit' : 'loss'}>{transaction.profit_value && transaction.profit_value >= 0 ? 'Profit' : 'Loss'}:</span><span className={transaction.profit_value && transaction.profit_value >= 0 ? 'profit' : 'loss'}> {transaction.profit_value && transaction.profit_value >= 0 ? '+' : ''}{transaction.profit_value?.toFixed(2) || '0.00'} {transaction.currency}</span  ></Flex></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="activity-history-container">
      {/* Fixed Search Header */}

      <div className={`activity-history-search-header  ${isHeaderFixed ? "fixed" : ""}`}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Flex
              align="center"
              justify="space-between"
              style={{ width: "100%" }}
            >
              <h1 className="screen-title">
                {filterOptions.find(option => option.key === selectedFilter)?.label || 'All Trades'} {selectedFilter === "all" && (<Badge count={activityHistoryItems.length} showZero />)}
              </h1>
              <Flex
                align="center"
                justify="flex-end"
                style={{ width: "100%" }}
                gap={16}
              >
                <Button
                  size="large"
                  type="text"
                  icon={<FilePdfOutlined />}
                  className="action-btn"
                  onClick={() => { }}
                />
                <Button
                  size="large"
                  type="text"
                  className="action-btn"
                  icon={<SyncOutlined />}
                  onClick={() => refreshActivityHistory()}
                />
                <Dropdown
                  menu={{
                    items: filterOptions,
                    onClick: handleFilterMenuClick,
                    selectedKeys: [selectedFilter]
                  }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button
                    size="large"
                    type="text"
                    className="action-btn dropdown-button"
                    icon={<FilterOutlined />}
                  />
                </Dropdown>
              </Flex>
            </Flex>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
            <Input
              placeholder={`Search transactions`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<TrophyOutlined />}
              className="text-input"
              allowClear
            />
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div className="activity-history-main-content">
        {loading ? (
          <div className="loading-state">
            <Spin size="large" />
            <div>Loading transactions...</div>
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
