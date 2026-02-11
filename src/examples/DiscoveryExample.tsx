import React from 'react';
import { useDiscoveryContext } from '../contexts/DiscoveryContext';
import { Card, Button, Spin, Alert, List, Tag, Typography, Space } from 'antd';
import { RobotOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * Example component demonstrating how to use the DiscoveryContext
 * This component shows how to access and use all the exposed variables and functions
 */
export const DiscoveryExample: React.FC = () => {
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
    refreshPremiumBots,
    refreshFreeBots,
    refreshMyBots,
    refreshStrategies,
    refreshActivityHistory,
  } = useDiscoveryContext();

  // Example create bot function
  const handleCreateBot = async () => {
    try {
      const newBot = await createBot({
        botName: 'Example Bot',
        botDescription: 'Created from DiscoveryContext example',
        strategyId: strategies[0]?.strategyUUID || '',
        isPremium: false,
        isPublic: false,
      });
      console.log('Bot created successfully:', newBot);
    } catch (error) {
      console.error('Failed to create bot:', error);
    }
  };

  // Loading state
  const isLoading = Object.values(loading).some(Boolean);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Discovery Context Example</Title>
      
      {/* Error Display */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Spin size="large" />
        </div>
      )}

      {/* Action Buttons */}
      <Space style={{ marginBottom: '24px' }}>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={refreshAll}
          loading={isLoading}
        >
          Refresh All
        </Button>
        <Button 
          icon={<PlusOutlined />} 
          onClick={handleCreateBot}
          disabled={strategies.length === 0}
        >
          Create Bot
        </Button>
      </Space>

      {/* My Bots Section */}
      <Card 
        title={
          <Space>
            <RobotOutlined />
            <span>My Bots ({myBots.length})</span>
            <Button size="small" onClick={refreshMyBots} loading={loading.myBots}>
              Refresh
            </Button>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <List
          dataSource={myBots.slice(0, 3)}
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

      {/* Free Bots Section */}
      <Card 
        title={
          <Space>
            <span>Free Bots ({freeBots.length})</span>
            <Button size="small" onClick={refreshFreeBots} loading={loading.freeBots}>
              Refresh
            </Button>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <List
          dataSource={freeBots.slice(0, 3)}
          renderItem={(bot) => (
            <List.Item>
              <List.Item.Meta
                title={bot.botName}
                description={bot.botDescription}
              />
              <Tag color="blue">Free</Tag>
            </List.Item>
          )}
          locale={{ emptyText: 'No free bots available' }}
        />
      </Card>

      {/* Premium Bots Section */}
      <Card 
        title={
          <Space>
            <span>Premium Bots ({premiumBots.length})</span>
            <Button size="small" onClick={refreshPremiumBots} loading={loading.premiumBots}>
              Refresh
            </Button>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <List
          dataSource={premiumBots.slice(0, 3)}
          renderItem={(bot) => (
            <List.Item>
              <List.Item.Meta
                title={bot.botName}
                description={bot.botDescription}
              />
              <Tag color="gold">Premium</Tag>
            </List.Item>
          )}
          locale={{ emptyText: 'No premium bots available' }}
        />
      </Card>

      {/* Strategies Section */}
      <Card 
        title={
          <Space>
            <span>Strategies ({strategies.length})</span>
            <Button size="small" onClick={refreshStrategies} loading={loading.strategies}>
              Refresh
            </Button>
          </Space>
        }
        style={{ marginBottom: '16px' }}
      >
        <List
          dataSource={strategies.slice(0, 3)}
          renderItem={(strategy) => (
            <List.Item>
              <List.Item.Meta
                title={strategy.title}
                description={strategy.description}
              />
              <Tag color="purple">{strategy.market}</Tag>
            </List.Item>
          )}
          locale={{ emptyText: 'No strategies available' }}
        />
      </Card>

      {/* Activity History Section */}
      <Card 
        title={
          <Space>
            <span>Activity History ({activityHistoryItems.length})</span>
            <Button size="small" onClick={refreshActivityHistory} loading={loading.activityHistory}>
              Refresh
            </Button>
          </Space>
        }
      >
        <List
          dataSource={activityHistoryItems.slice(0, 5)}
          renderItem={(trade) => (
            <List.Item>
              <List.Item.Meta
                title={`Trade on ${trade.symbol}`}
                description={`${trade.amount} ${trade.currency} - ${trade.status}`}
              />
              <Tag color={trade.profit_is_win ? 'green' : 'red'}>
                {trade.profit_is_win ? 'Won' : 'Lost'}
              </Tag>
            </List.Item>
          )}
          locale={{ emptyText: 'No activity history available' }}
        />
      </Card>
    </div>
  );
};

export default DiscoveryExample;
