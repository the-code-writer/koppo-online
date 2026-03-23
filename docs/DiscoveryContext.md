# DiscoveryContext Documentation

## 📖 Overview

The DiscoveryContext is a comprehensive React context that manages real-time data for trading bots, strategies, and activity history. It integrates with multiple API services and Pusher for real-time updates, providing a centralized state management solution for the discovery features of the Koppo application.

## 🚀 Features

- **Centralized State Management**: Manages bots, strategies, and activity history in one place
- **Real-time Updates**: Integrates with Pusher for live data updates
- **API Integration**: Seamlessly connects to trading bot, strategy, and trade APIs
- **Loading States**: Individual loading states for each data category
- **Error Handling**: Comprehensive error handling and reporting
- **Bot Creation**: Built-in functionality for creating new trading bots
- **Automatic Refreshes**: Smart refresh mechanisms triggered by real-time events

## 🛠️ Installation & Setup

### Provider Setup

The DiscoveryProvider is already configured in `AppProviders.tsx`:

```typescript
// In AppProviders.tsx
<OAuthProvider>
  <DiscoveryProvider>
    <ThemeProvider>
      {/* Other providers */}
    </ThemeProvider>
  </DiscoveryProvider>
</OAuthProvider>
```

### Basic Usage

```typescript
import { useDiscoveryContext } from '@/contexts/DiscoveryContext';

function MyComponent() {
  const {
    myBots,
    freeBots,
    premiumBots,
    strategies,
    activityHistoryItems,
    loading,
    error,
    createBot,
    refreshAll,
    refreshMyBots,
    refreshStrategies,
    refreshActivityHistory
  } = useDiscoveryContext();
  
  // Use the data and functions
}
```

## 📚 API Reference

### State Variables

#### `myBots: ITradingBot[]`
Array of bots owned by the current user.

#### `freeBots: ITradingBot[]`
Array of free (non-premium) public bots available for use.

#### `premiumBots: ITradingBot[]`
Array of premium public bots available for use.

#### `strategies: Strategy[]`
Array of public, active trading strategies.

#### `activityHistoryItems: BotContractTrade[]`
Array of recent trading activities/trades, sorted by newest first.

#### `loading: LoadingStates`
Object with individual loading states:
```typescript
{
  myBots: boolean;
  freeBots: boolean;
  premiumBots: boolean;
  strategies: boolean;
  activityHistory: boolean;
}
```

#### `error: string | null`
Current error message, if any.

#### `lastUpdated: LastUpdated`
Object with timestamps for when each data category was last refreshed.

### Functions

#### `createBot(botData: CreateTradingBotDTO): Promise<ITradingBot>`
Creates a new trading bot and automatically refreshes the myBots list.

#### `refreshAll(): Promise<void>`
Refreshes all data categories simultaneously.

#### `refreshMyBots(): Promise<void>`
Refreshes only the user's bots.

#### `refreshFreeBots(): Promise<void>`
Refreshes only free public bots.

#### `refreshPremiumBots(): Promise<void>`
Refreshes only premium public bots.

#### `refreshStrategies(): Promise<void>`
Refreshes only strategies.

#### `refreshActivityHistory(): Promise<void>`
Refreshes only activity history.

## 🎯 Usage Examples

### Example 1: Basic Bot Display

```typescript
import React from 'react';
import { useDiscoveryContext } from '@/contexts/DiscoveryContext';
import { Card, List, Tag, Spin } from 'antd';

export const MyBotsList: React.FC = () => {
  const { myBots, loading, refreshMyBots } = useDiscoveryContext();

  if (loading.myBots) {
    return <Spin size="large" />;
  }

  return (
    <Card title="My Trading Bots">
      <List
        dataSource={myBots}
        renderItem={(bot) => (
          <List.Item>
            <List.Item.Meta
              title={bot.botName}
              description={bot.botDescription}
            />
            <Tag color={bot.isActive ? 'green' : 'red'}>
              {bot.status}
            </Tag>
          </List.Item>
        )}
        locale={{ emptyText: 'No bots found' }}
      />
    </Card>
  );
};
```

### Example 2: Bot Creation Form

```typescript
import React, { useState } from 'react';
import { useDiscoveryContext } from '@/contexts/DiscoveryContext';
import { Form, Input, Select, Button, message } from 'antd';

export const CreateBotForm: React.FC = () => {
  const { createBot, strategies } = useDiscoveryContext();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const newBot = await createBot({
        botName: values.name,
        botDescription: values.description,
        strategyId: values.strategyId,
        isPremium: false,
        isPublic: false,
      });
      
      message.success(`Bot "${newBot.botName}" created successfully!`);
    } catch (error) {
      message.error('Failed to create bot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onFinish={handleSubmit} layout="vertical">
      <Form.Item name="name" label="Bot Name" rules={[{ required: true }]}>
        <Input placeholder="Enter bot name" />
      </Form.Item>
      
      <Form.Item name="description" label="Description">
        <Input.TextArea placeholder="Describe your bot" />
      </Form.Item>
      
      <Form.Item name="strategyId" label="Strategy" rules={[{ required: true }]}>
        <Select placeholder="Select a strategy">
          {strategies.map(strategy => (
            <Select.Option key={strategy.strategyUUID} value={strategy.strategyUUID}>
              {strategy.title}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Create Bot
        </Button>
      </Form.Item>
    </Form>
  );
};
```

### Example 3: Real-time Activity Monitor

```typescript
import React, { useEffect } from 'react';
import { useDiscoveryContext } from '@/contexts/DiscoveryContext';
import { Card, List, Tag, Badge, Statistic } from 'antd';

export const ActivityMonitor: React.FC = () => {
  const { activityHistoryItems, loading, refreshActivityHistory } = useDiscoveryContext();

  // Calculate statistics from activity history
  const stats = React.useMemo(() => {
    const total = activityHistoryItems.length;
    const wins = activityHistoryItems.filter(trade => trade.profit_is_win).length;
    const losses = total - wins;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    
    return { total, wins, losses, winRate };
  }, [activityHistoryItems]);

  return (
    <div>
      {/* Statistics */}
      <Card title="Trading Statistics" style={{ marginBottom: 16 }}>
        <Statistic title="Total Trades" value={stats.total} />
        <Statistic title="Wins" value={stats.wins} valueStyle={{ color: '#3f8600' }} />
        <Statistic title="Losses" value={stats.losses} valueStyle={{ color: '#cf1322' }} />
        <Statistic title="Win Rate" value={stats.winRate} precision={1} suffix="%" />
      </Card>

      {/* Recent Activity */}
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Recent Activity</span>
            <Badge count={activityHistoryItems.length} />
          </div>
        }
        extra={
          <Button onClick={refreshActivityHistory} loading={loading.activityHistory}>
            Refresh
          </Button>
        }
      >
        <List
          dataSource={activityHistoryItems.slice(0, 10)}
          renderItem={(trade) => (
            <List.Item>
              <List.Item.Meta
                title={`Trade on ${trade.symbol}`}
                description={`${trade.amount} ${trade.currency} - ${new Date(trade.createdAt).toLocaleString()}`}
              />
              <Tag color={trade.profit_is_win ? 'green' : 'red'}>
                {trade.profit_is_win ? 'Won' : 'Lost'}
              </Tag>
            </List.Item>
          )}
          locale={{ emptyText: 'No recent activity' }}
        />
      </Card>
    </div>
  );
};
```

### Example 4: Bot Marketplace

```typescript
import React, { useState } from 'react';
import { useDiscoveryContext } from '@/contexts/DiscoveryContext';
import { Card, Tabs, Button, Tag, Row, Col, Statistic } from 'antd';

const { TabPane } = Tabs;

export const BotMarketplace: React.FC = () => {
  const { freeBots, premiumBots, loading, refreshFreeBots, refreshPremiumBots } = useDiscoveryContext();
  const [activeTab, setActiveTab] = useState('free');

  const renderBotCard = (bot: ITradingBot) => (
    <Col xs={24} sm={12} md={8} lg={6} key={bot.botUUID}>
      <Card
        hoverable
        cover={<img src={bot.botThumbnail} alt={bot.botName} />}
        actions={[
          <Button key="view" type="primary">View Details</Button>,
          <Button key="use">Use Bot</Button>,
        ]}
      >
        <Card.Meta
          title={bot.botName}
          description={
            <div>
              <p>{bot.botDescription}</p>
              <div>
                <Tag color="blue">{bot.contract.tradeType}</Tag>
                <Tag color="purple">{bot.contract.market?.symbol}</Tag>
                {bot.isPremium && <Tag color="gold">Premium</Tag>}
              </div>
              <div style={{ marginTop: 8 }}>
                <Statistic
                  title="Win Rate"
                  value={bot.statistics.winRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{ fontSize: '14px' }}
                />
              </div>
            </div>
          }
        />
      </Card>
    </Col>
  );

  return (
    <Card title="Bot Marketplace">
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={`Free Bots (${freeBots.length})`} 
          key="free"
        >
          <Button 
            onClick={refreshFreeBots} 
            loading={loading.freeBots}
            style={{ marginBottom: 16 }}
          >
            Refresh Free Bots
          </Button>
          <Row gutter={[16, 16]}>
            {freeBots.map(renderBotCard)}
          </Row>
        </TabPane>
        
        <TabPane 
          tab={`Premium Bots (${premiumBots.length})`} 
          key="premium"
        >
          <Button 
            onClick={refreshPremiumBots} 
            loading={loading.premiumBots}
            style={{ marginBottom: 16 }}
          >
            Refresh Premium Bots
          </Button>
          <Row gutter={[16, 16]}>
            {premiumBots.map(renderBotCard)}
          </Row>
        </TabPane>
      </Tabs>
    </Card>
  );
};
```

### Example 5: Strategy Explorer

```typescript
import React, { useState } from 'react';
import { useDiscoveryContext } from '@/contexts/DiscoveryContext';
import { Card, Input, Select, Row, Col, Tag, Button, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export const StrategyExplorer: React.FC = () => {
  const { strategies, loading, refreshStrategies } = useDiscoveryContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [selectedTradeType, setSelectedTradeType] = useState<string>('');

  // Filter strategies based on search and filters
  const filteredStrategies = React.useMemo(() => {
    return strategies.filter(strategy => {
      const matchesSearch = strategy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          strategy.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMarket = !selectedMarket || strategy.market === selectedMarket;
      const matchesTradeType = !selectedTradeType || strategy.tradeType === selectedTradeType;
      
      return matchesSearch && matchesMarket && matchesTradeType;
    });
  }, [strategies, searchTerm, selectedMarket, selectedTradeType]);

  const markets = React.useMemo(() => {
    return [...new Set(strategies.map(s => s.market))];
  }, [strategies]);

  const tradeTypes = React.useMemo(() => {
    return [...new Set(strategies.map(s => s.tradeType))];
  }, [strategies]);

  return (
    <Card title="Strategy Explorer">
      {/* Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Search strategies..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="Select Market"
            value={selectedMarket}
            onChange={setSelectedMarket}
            allowClear
            style={{ width: '100%' }}
          >
            {markets.map(market => (
              <Select.Option key={market} value={market}>{market}</Select.Option>
            ))}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="Select Trade Type"
            value={selectedTradeType}
            onChange={setSelectedTradeType}
            allowClear
            style={{ width: '100%' }}
          >
            {tradeTypes.map(type => (
              <Select.Option key={type} value={type}>{type}</Select.Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* Refresh Button */}
      <Button 
        onClick={refreshStrategies} 
        loading={loading.strategies}
        style={{ marginBottom: 16 }}
      >
        Refresh Strategies
      </Button>

      {/* Strategy Grid */}
      {filteredStrategies.length === 0 ? (
        <Empty description="No strategies found matching your criteria" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredStrategies.map(strategy => (
            <Col xs={24} sm={12} md={8} lg={6} key={strategy.strategyUUID}>
              <Card
                hoverable
                cover={<img src={strategy.coverPhoto} alt={strategy.title} />}
                actions={[
                  <Button key="view" type="primary">View Strategy</Button>,
                  <Button key="use">Use Strategy</Button>,
                ]}
              >
                <Card.Meta
                  title={strategy.title}
                  description={
                    <div>
                      <p>{strategy.description}</p>
                      <div>
                        <Tag color="blue">{strategy.market}</Tag>
                        <Tag color="purple">{strategy.tradeType}</Tag>
                        {strategy.statistics && (
                          <Tag color="green">
                            {strategy.statistics.totalRuns} runs
                          </Tag>
                        )}
                      </div>
                      {strategy.statistics && (
                        <div style={{ marginTop: 8 }}>
                          <small>
                            Win Rate: {strategy.statistics.winRate?.toFixed(1)}% | 
                            Total Payout: ${strategy.statistics.totalPayout}
                          </small>
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
};
```

## 🔄 Real-time Integration

The DiscoveryContext automatically handles real-time updates through Pusher:

### Automatic Updates

- **New Trades**: Automatically added to the top of `activityHistoryItems`
- **Bot Updates**: Bot information updated across all relevant lists
- **Bot Creation**: `myBots` list automatically refreshed
- **Strategy Updates**: `strategies` list automatically refreshed

### Pusher Events Handled

```typescript
// Events automatically handled:
'bot-updates:trade-executed'    // New trade
'bot-updates:bot-updated'       // Bot status change
'bot-updates:bot-created'        // New bot created
'bot-updates:bot-deleted'        // Bot deleted
'bot-updates:strategy-updated'    // Strategy updated
'user-updates-{userId}:*'         // User-specific events
```

## 🚨 Error Handling

The context provides comprehensive error handling:

```typescript
const { error } = useDiscoveryContext();

if (error) {
  message.error(error);
  // Handle error appropriately
}
```

## 📊 Performance Considerations

### Best Practices

1. **Use Loading States**: Always check individual loading states before rendering data
2. **Memoize Calculations**: Use `useMemo` for expensive calculations based on context data
3. **Selective Refreshes**: Use specific refresh functions instead of `refreshAll()` when possible
4. **Error Boundaries**: Wrap components in error boundaries to handle context errors gracefully

### Example of Optimized Component

```typescript
import React, { useMemo } from 'react';
import { useDiscoveryContext } from '@/contexts/DiscoveryContext';

const OptimizedComponent: React.FC = () => {
  const { myBots, loading } = useDiscoveryContext();

  // Memoize expensive calculations
  const activeBots = useMemo(() => {
    return myBots.filter(bot => bot.isActive);
  }, [myBots]);

  const profitableBots = useMemo(() => {
    return myBots.filter(bot => bot.statistics.totalProfit > 0);
  }, [myBots]);

  if (loading.myBots) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>Active Bots: {activeBots.length}</div>
      <div>Profitable Bots: {profitableBots.length}</div>
    </div>
  );
};
```

## 🔧 Advanced Usage

### Custom Hooks

Create custom hooks for specific use cases:

```typescript
import { useCallback } from 'react';
import { useDiscoveryContext } from '@/contexts/DiscoveryContext';

export const useBotActions = () => {
  const { createBot, refreshMyBots } = useDiscoveryContext();

  const createAndConfigureBot = useCallback(async (baseConfig: any) => {
    const bot = await createBot(baseConfig);
    await refreshMyBots();
    return bot;
  }, [createBot, refreshMyBots]);

  return { createAndConfigureBot };
};
```

### Context Selectors

Use context selectors to avoid unnecessary re-renders:

```typescript
import { useContext, createContext } from 'react';
import { DiscoveryContextType } from '@/contexts/DiscoveryContext';

const BotsContext = createContext<Pick<DiscoveryContextType, 'myBots' | 'loading' | 'refreshMyBots'> | null>(null);

export const BotsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const discoveryContext = useDiscoveryContext();
  
  const botsContext = {
    myBots: discoveryContext.myBots,
    loading: discoveryContext.loading,
    refreshMyBots: discoveryContext.refreshMyBots,
  };

  return (
    <BotsContext.Provider value={botsContext}>
      {children}
    </BotsContext.Provider>
  );
};

export const useBots = () => {
  const context = useContext(BotsContext);
  if (!context) {
    throw new Error('useBots must be used within BotsProvider');
  }
  return context;
};
```

## 📱 Testing

### Mock Context for Testing

```typescript
import { ReactNode } from 'react';
import { DiscoveryContextType, initialState } from '@/contexts/DiscoveryContext';

export const mockDiscoveryContext: DiscoveryContextType = {
  ...initialState,
  createBot: jest.fn(),
  refreshAll: jest.fn(),
  refreshMyBots: jest.fn(),
  refreshFreeBots: jest.fn(),
  refreshPremiumBots: jest.fn(),
  refreshStrategies: jest.fn(),
  refreshActivityHistory: jest.fn(),
};

export const MockDiscoveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <DiscoveryContext.Provider value={mockDiscoveryContext}>
    {children}
  </DiscoveryContext.Provider>
);
```

## 🔍 Debugging

### Development Tools

```typescript
import { useDiscoveryContext } from '@/contexts/DiscoveryContext';

const DebugPanel: React.FC = () => {
  const context = useDiscoveryContext();

  if (import.meta.env.DEV) {
    return (
      <div style={{ position: 'fixed', top: 10, right: 10, background: 'white', padding: 10, border: '1px solid #ccc' }}>
        <h4>DiscoveryContext Debug</h4>
        <div>My Bots: {context.myBots.length}</div>
        <div>Free Bots: {context.freeBots.length}</div>
        <div>Premium Bots: {context.premiumBots.length}</div>
        <div>Strategies: {context.strategies.length}</div>
        <div>Activity: {context.activityHistoryItems.length}</div>
        {context.error && <div>Error: {context.error}</div>}
      </div>
    );
  }

  return null;
};
```

## 📄 Related Documentation

- [Pusher Service Documentation](../services/PUSHER.md)
- [Trading Bot API Documentation](../services/tradingBotAPIService.ts)
- [Strategy API Documentation](../services/strategiesAPIService.ts)
- [Environment Configuration](../config/env.config.ts)

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Maintainer**: Koppo Development Team
