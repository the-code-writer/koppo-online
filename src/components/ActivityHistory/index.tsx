import React, { useRef, useState, useEffect, useCallback } from 'react';
import { SearchOutlined, FilePdfOutlined, TrophyOutlined, RightSquareFilled, LeftSquareFilled, ArrowRightOutlined, ClockCircleOutlined, DollarOutlined, RiseOutlined, FallOutlined, InfoCircleOutlined, TagOutlined, CalendarOutlined, CloseCircleOutlined, ShareAltOutlined, CopyOutlined, SyncOutlined, PlusOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Input, Space, Select, Row, Col, Flex, Badge, Spin, Empty, Drawer, Typography, Divider, Tag, Dropdown, Menu } from 'antd';
import { MarketDerivedVolatility100Icon, TradeTypesTurboShortIcon } from '@deriv/quill-icons';
import './styles.scss';
import { useDiscoveryContext } from '../../contexts/DiscoveryContext';

const { Title, Text } = Typography;

import { BotContractTrade } from '../../services/botContractTradesAPIService';



export function ActivityHistory() {

  const { activityHistoryItems, refreshActivityHistory, activityHistoryLoading } = useDiscoveryContext();

  const [selectedSession, setSelectedSession] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [filteredData, setFilteredData] = useState<BotContractTrade[]>([]);
  const [displayedCount, setDisplayedCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BotContractTrade | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
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

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(10);
  }, [selectedSession, searchQuery]);

  // Handle transaction card click
  const handleTransactionClick = (transaction: BotContractTrade) => {
    setSelectedTransaction(transaction);
    setDrawerVisible(true);
  };

  // Handle export transaction
  const handleExportTransaction = () => {
    if (!selectedTransaction) return;

    const exportText = `
=== TRANSACTION DETAILS ===

Session ID: ${selectedTransaction.sessionId}
Bot ID: ${selectedTransaction.botId}
Status: ${selectedTransaction.status === 'won' ? 'WON' : 'LOST'}

=== TRADE INFORMATION ===
Description: ${selectedTransaction.longcode}
Market: ${selectedTransaction.symbol_full || selectedTransaction.symbol}
Contract Type: ${selectedTransaction.contract_type}

=== TIMING ===
Purchase Time: ${selectedTransaction.purchase_time ? new Date(selectedTransaction.purchase_time * 1000).toLocaleString() : new Date(selectedTransaction.createdAt).toLocaleString()}
Exit Time: ${selectedTransaction.sell_spot_time ? new Date(selectedTransaction.sell_spot_time * 1000).toLocaleString() : 'N/A'}

=== PRICING ===
Entry Spot: ${selectedTransaction.entry_spot_value?.toFixed(4) || '0.0000'}
Exit Spot: ${selectedTransaction.exit_spot_value?.toFixed(4) || '0.0000'}
Stake Amount: ${selectedTransaction.amount.toFixed(2)} ${selectedTransaction.currency}
Payout: ${selectedTransaction.payout?.toFixed(2) || '0.00'} ${selectedTransaction.payout_currency || selectedTransaction.currency}
Profit/Loss: ${selectedTransaction.profit_value >= 0 ? '+' : ''}${selectedTransaction.profit_value?.toFixed(2) || '0.00'} ${selectedTransaction.currency}

=== SUMMARY ===
${selectedTransaction.status === 'won' ? '✅ PROFITABLE TRADE' : '❌ LOSING TRADE'}
${Math.abs(selectedTransaction.profit_percentage || 0).toFixed(2)}% ${selectedTransaction.profit_value >= 0 ? 'gain' : 'loss'}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    // Check if Web Share API is supported (mobile devices)
    if (navigator.share && /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
      navigator.share({
        title: `Transaction ${selectedTransaction.sessionId}`,
        text: exportText,
      }).catch((error) => {
        console.log('Share failed or was cancelled:', error);
        // Fallback to clipboard if share fails
        fallbackToClipboard(exportText);
      });
    } else {
      // Fallback for desktop or unsupported browsers
      fallbackToClipboard(exportText);
    }
  };

  // Fallback function to copy to clipboard
  const fallbackToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        // Show success message
        alert('Transaction details copied to clipboard!');
      }).catch((err) => {
        console.error('Failed to copy text: ', err);
        // Final fallback - create textarea and select
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Transaction details copied to clipboard!');
      });
    } else {
      // Legacy fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Transaction details copied to clipboard!');
    }
  };

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    if (!selectedTransaction) return;

    const copyText = `
=== TRANSACTION DETAILS ===

Session ID: ${selectedTransaction.sessionId}
Bot ID: ${selectedTransaction.botId}
Status: ${selectedTransaction.status === 'won' ? 'WON' : 'LOST'}

=== TRADE INFORMATION ===
Description: ${selectedTransaction.longcode}
Market: ${selectedTransaction.symbol_full || selectedTransaction.symbol}
Contract Type: ${selectedTransaction.contract_type}

=== TIMING ===
Purchase Time: ${selectedTransaction.purchase_time ? new Date(selectedTransaction.purchase_time * 1000).toLocaleString() : new Date(selectedTransaction.createdAt).toLocaleString()}
Exit Time: ${selectedTransaction.sell_spot_time ? new Date(selectedTransaction.sell_spot_time * 1000).toLocaleString() : 'N/A'}

=== PRICING ===
Entry Spot: ${selectedTransaction.entry_spot_value}
Exit Spot: ${selectedTransaction.exit_spot_value}
Stake Amount: ${selectedTransaction.amount.toFixed(2)} ${selectedTransaction.currency}
Payout: ${selectedTransaction.payout?.toFixed(2) || '0.00'} ${selectedTransaction.payout_currency || selectedTransaction.currency}
Profit/Loss: ${selectedTransaction.profit_value >= 0 ? '+' : ''}${selectedTransaction.profit_value?.toFixed(2) || '0.00'} ${selectedTransaction.currency}

=== SUMMARY ===
${selectedTransaction.status === 'won' ? '✅ PROFITABLE TRADE' : '❌ LOSING TRADE'}
${Math.abs(selectedTransaction.profit_percentage || 0).toFixed(2)}% ${selectedTransaction.profit_value >= 0 ? 'gain' : 'loss'}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    fallbackToClipboard(copyText);
  };
  // Close drawer
  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedTransaction(null);
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

      {/* Transaction Details Drawer */}
      <Drawer
        title={null}
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        size={600}
        className="transaction-details-drawer"
        closeIcon={null}
      >
        <div className="drawer-header">
          <Button
            type="text"
            icon={<ArrowRightOutlined rotate={180} />}
            onClick={closeDrawer}
            className="back-button"
          />
          <Title level={4} className="drawer-title">Transaction Details</Title>
        </div>

        <div className="drawer-content">
          {selectedTransaction && (
            <div className="transaction-details">
              {/* Header Section */}
              <div className="detail-section">
                <div className="detail-header">
                  <div className="detail-icon">
                    <MarketDerivedVolatility100Icon fill='#ffffff' iconSize='lg' />
                  </div>
                  <div className="detail-info">
                    <Title level={5}>{selectedTransaction.symbol_full || selectedTransaction.symbol}</Title>
                    <Text type="secondary">{selectedTransaction.symbol_short} &bull; {selectedTransaction.contract_type}</Text>
                  </div>
                </div>
              </div>

              {/* Trade Information */}
              <div className="detail-section">
                <Title level={5} className="section-title">Trade Information</Title>
                <Title level={5} className="section-title">{selectedTransaction.sessionId}</Title>
                <div className="trade-info-list">
                  <div className="trade-info-row">
                    <Text className="detail-label"><strong>Proposal: <br />{selectedTransaction.proposal_id}</strong></Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><strong>{selectedTransaction.longcode}</strong></Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><CloseCircleOutlined className="detail-label-icon" /> Duration</Text>
                    <Text strong className="detail-value">{selectedTransaction.duration} {selectedTransaction.duration_unit}</Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><DollarOutlined className="detail-label-icon" /> Stake Amount</Text>
                    <Text strong className="detail-value">{selectedTransaction.amount.toFixed(2)} {selectedTransaction.currency}</Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><DollarOutlined className="detail-label-icon" /> Potential Payout</Text>
                    <Text strong className="detail-value">{selectedTransaction.payout?.toFixed(2) || '0.00'} {selectedTransaction.payout_currency || selectedTransaction.currency}</Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label">{selectedTransaction.profit_value && selectedTransaction.profit_value >= 0 ? <RiseOutlined className="detail-label-icon" /> : <FallOutlined className="detail-label-icon" />} Total Profit/Loss</Text>
                    <Tag color={selectedTransaction.status === 'won' ? 'green' : 'red'} className={selectedTransaction.status === 'won' ? 'profit-loss-green' : 'profit-loss-red'}>{(selectedTransaction.profit_value ?? 0) >= 0 ? '+' : ''}{(selectedTransaction.profit_value ?? 0).toFixed(2)} {selectedTransaction.currency}</Tag>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><TagOutlined className="detail-label-icon" /> Status</Text>
                    <Tag color={selectedTransaction.status === 'won' ? 'green' : 'red'} className="trade-type-tag">
                      {selectedTransaction.status === 'won' ? 'Won' : 'Lost'}
                    </Tag>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><RightSquareFilled className="detail-label-icon" /> Entry Spot</Text>
                    <Text strong className="detail-value">{selectedTransaction.entry_spot_value}</Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><LeftSquareFilled className="detail-label-icon" /> Exit Spot</Text>
                    <Text strong className="detail-value">{selectedTransaction.exit_spot_value}</Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><LeftSquareFilled className="detail-label-icon" /> Sell Spot</Text>
                    <Text strong className="detail-value">{selectedTransaction.sell_spot}</Text>
                  </div>
                  <div className="trade-divider" />
                  <Title level={5} className="section-title">Timestamps</Title>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Purchase Time</Text>
                    <Text strong className="detail-value">{selectedTransaction.purchase_time ? new Date(selectedTransaction.purchase_time * 1000).toLocaleString() : new Date(selectedTransaction.createdAt).toLocaleString()}</Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Start Time</Text>
                    <Text strong className="detail-value">{selectedTransaction.start_time ? new Date(selectedTransaction.start_time * 1000).toLocaleString() : 'N/A'}</Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Expiry Time</Text>
                    <Text strong className="detail-value">{selectedTransaction.expiry_time ? new Date(selectedTransaction.expiry_time * 1000).toLocaleString() : 'N/A'}</Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Entry Time</Text>
                    <Text strong className="detail-value">{selectedTransaction.entry_spot_time ? new Date(selectedTransaction.entry_spot_time * 1000).toLocaleString() : 'N/A'}</Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Exit Time</Text>
                    <Text strong className="detail-value">{selectedTransaction.exit_spot_time ? new Date(selectedTransaction.exit_spot_time * 1000).toLocaleString() : 'N/A'}</Text>
                  </div>
                  <div className="trade-divider" />
                  <div className="trade-info-row">
                    <Text className="detail-label"><ClockCircleOutlined className="detail-label-icon" /> Sell Time</Text>
                    <Text strong className="detail-value">{selectedTransaction.sell_spot_time ? new Date(selectedTransaction.sell_spot_time * 1000).toLocaleString() : new Date(selectedTransaction.createdAt).toLocaleString()}</Text>
                  </div>
                  <div className="trade-divider" />
                </div>
              </div>

              <Divider />

              {/* Action Buttons */}
              <Space className="action-buttons" vertical size={18} style={{ marginTop: 0, width: '100%', padding: 0 }}>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<ShareAltOutlined />}
                  onClick={handleExportTransaction}
                  className="submit-button"
                >
                  Export Transaction
                </Button>
                <Button
                  type="default"
                  size="large"
                  block
                  icon={<CopyOutlined />}
                  onClick={handleCopyToClipboard}
                >
                  Copy to Clipboard
                </Button>
                <Button
                  type="default"
                  size="large"
                  block
                  onClick={closeDrawer}
                >
                  Close
                </Button>
              </Space>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}
