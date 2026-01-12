import { useState, useEffect } from 'react';
import { Button, Empty, Spin, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { BotInstance } from '../../../../types/bot';
import { botAPI } from '../../../../services/api';
import { EnhancedBotCard } from '../EnhancedBotCard';
import './styles.scss';

interface BotListProps {
  onCreateBot: () => void;
  onEditBot: (bot: BotInstance) => void;
}

/**
 * BotList: Displays a list of bots with loading, empty states, and actions
 */
export function BotList({ onCreateBot, onEditBot }: BotListProps) {
  const [bots, setBots] = useState<BotInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch bots on mount
  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const response = await botAPI.getBots();
      if (response.success && response.bots) {
        setBots(response.bots);
      } else {
        message.error(response.error || 'Failed to fetch bots');
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
      message.error('Failed to fetch bots');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBots();
  };

  const handleStartBot = async (botId: string) => {
    try {
      const response = await botAPI.startBot(botId);
      if (response.success) {
        message.success('Bot started successfully');
        // Update local state
        setBots(prev => prev.map(bot => 
          bot._id === botId ? { ...bot, status: 'running' as const } : bot
        ));
      } else {
        message.error(response.error || 'Failed to start bot');
      }
    } catch (error) {
      console.error('Error starting bot:', error);
      message.error('Failed to start bot');
    }
  };

  const handleStopBot = async (botId: string) => {
    try {
      const response = await botAPI.stopBot(botId);
      if (response.success) {
        message.success('Bot stopped successfully');
        setBots(prev => prev.map(bot => 
          bot._id === botId ? { ...bot, status: 'stopped' as const } : bot
        ));
      } else {
        message.error(response.error || 'Failed to stop bot');
      }
    } catch (error) {
      console.error('Error stopping bot:', error);
      message.error('Failed to stop bot');
    }
  };

  const handlePauseBot = async (botId: string) => {
    try {
      const response = await botAPI.pauseBot(botId);
      if (response.success) {
        message.success('Bot paused successfully');
        setBots(prev => prev.map(bot => 
          bot._id === botId ? { ...bot, status: 'paused' as const } : bot
        ));
      } else {
        message.error(response.error || 'Failed to pause bot');
      }
    } catch (error) {
      console.error('Error pausing bot:', error);
      message.error('Failed to pause bot');
    }
  };

  const handleDeleteBot = async (botId: string) => {
    try {
      const response = await botAPI.deleteBot(botId);
      if (response.success) {
        message.success('Bot deleted successfully');
        setBots(prev => prev.filter(bot => bot._id !== botId));
      } else {
        message.error(response.error || 'Failed to delete bot');
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
      message.error('Failed to delete bot');
    }
  };

  if (loading) {
    return (
      <div className="bot-list-loading">
        <Spin size="large" />
        <p>Loading your bots...</p>
      </div>
    );
  }

  return (
    <div className="bot-list">
      {/* Header */}
      <div className="bot-list-header">
        <div className="header-info">
          <h2 className="header-title">My Bots</h2>
          <span className="bot-count">{bots.length} bot{bots.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="header-actions">
          <Button 
            type="text" 
            icon={<ReloadOutlined spin={refreshing} />} 
            onClick={handleRefresh}
            className="refresh-btn"
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onCreateBot}
            className="create-btn"
          >
            Create Bot
          </Button>
        </div>
      </div>

      {/* Bot Cards */}
      {bots.length === 0 ? (
        <div className="bot-list-empty">
          <Empty 
            description={
              <span className="empty-text">
                No bots yet. Create your first trading bot!
              </span>
            }
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onCreateBot}
            size="large"
            className="create-first-btn"
          >
            Create Your First Bot
          </Button>
        </div>
      ) : (
        <div className="bot-cards">
          {bots.map(bot => (
            <EnhancedBotCard
              key={bot._id}
              bot={bot}
              onStart={handleStartBot}
              onStop={handleStopBot}
              onPause={handlePauseBot}
              onEdit={onEditBot}
              onDelete={handleDeleteBot}
            />
          ))}
        </div>
      )}
    </div>
  );
}
