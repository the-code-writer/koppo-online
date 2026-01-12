import { useState, useEffect } from 'react';
import { Button, Dropdown, Tag, Tooltip, Progress } from 'antd';
import {
  MoreOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  EditOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { BotInstance } from '../../../../types/bot';
import './styles.scss';

interface EnhancedBotCardProps {
  bot: BotInstance;
  onStart: (botId: string) => void;
  onStop: (botId: string) => void;
  onPause: (botId: string) => void;
  onEdit: (bot: BotInstance) => void;
  onDelete: (botId: string) => void;
}

/**
 * EnhancedBotCard: Elegant bot card component with running time, control buttons, and profit display
 */
export function EnhancedBotCard({ 
  bot, 
  onStart, 
  onStop, 
  onPause, 
  onEdit, 
  onDelete 
}: EnhancedBotCardProps) {
  const [runningTime, setRunningTime] = useState(bot.runningTime || 0);
  
  // Update running time every second when bot is running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (bot.status === 'running') {
      interval = setInterval(() => {
        setRunningTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bot.status]);

  // Format running time to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate net profit
  const netProfit = bot.totalProfit - bot.totalLoss;
  const isProfit = netProfit >= 0;

  // Get status color and label
  const getStatusConfig = () => {
    switch (bot.status) {
      case 'running':
        return { color: '#52c41a', label: 'Running', glow: true };
      case 'paused':
        return { color: '#faad14', label: 'Paused', glow: false };
      case 'stopped':
        return { color: '#ff4d4f', label: 'Stopped', glow: false };
      case 'error':
        return { color: '#ff4d4f', label: 'Error', glow: false };
      default:
        return { color: '#8c8c8c', label: 'Idle', glow: false };
    }
  };

  const statusConfig = getStatusConfig();

  // Calculate win rate
  const winRate = bot.totalTrades > 0 
    ? Math.round((bot.totalProfit / (bot.totalProfit + bot.totalLoss || 1)) * 100) 
    : 0;

  const menuItems = [
    {
      key: 'edit',
      label: 'Edit Bot',
      icon: <EditOutlined />,
      onClick: () => onEdit(bot),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      label: 'Delete Bot',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(bot._id),
    },
  ];

  return (
    <div className={`enhanced-bot-card ${bot.status === 'running' ? 'running' : ''}`}>
      {/* Gradient Background Glow */}
      {statusConfig.glow && <div className="card-glow" />}
      
      {/* Header */}
      <div className="bot-header">
        <div className="bot-info">
          <div className="bot-name-row">
            <h3 className="bot-name">{bot.configuration.general.botName}</h3>
            <Tag 
              className="status-tag"
              style={{ 
                backgroundColor: `${statusConfig.color}20`,
                color: statusConfig.color,
                borderColor: statusConfig.color
              }}
            >
              <span className={`status-dot ${statusConfig.glow ? 'pulse' : ''}`} 
                style={{ backgroundColor: statusConfig.color }} 
              />
              {statusConfig.label}
            </Tag>
          </div>
          <div className="bot-market">
            <ThunderboltOutlined /> {bot.configuration.general.market}
          </div>
          <div className="bot-trade-type">
            {bot.configuration.general.tradeType}
          </div>
        </div>
        
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<MoreOutlined />} className="more-btn" />
        </Dropdown>
      </div>

      {/* Stats Section */}
      <div className="bot-stats">
        {/* Running Time */}
        <div className="stat-item">
          <div className="stat-icon">
            <ClockCircleOutlined />
          </div>
          <div className="stat-content">
            <span className="stat-label">Running Time</span>
            <span className="stat-value time">{formatTime(runningTime)}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="stat-item">
          <div className="stat-icon">
            <DollarOutlined />
          </div>
          <div className="stat-content">
            <span className="stat-label">Net Profit</span>
            <span className={`stat-value ${isProfit ? 'profit' : 'loss'}`}>
              {isProfit ? '+' : ''}{netProfit.toFixed(2)} USD
            </span>
          </div>
        </div>

        {/* Total Trades */}
        <div className="stat-item">
          <div className="stat-icon">
            <ThunderboltOutlined />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Trades</span>
            <span className="stat-value">{bot.totalTrades}</span>
          </div>
        </div>
      </div>

      {/* Win Rate Progress */}
      <div className="win-rate-section">
        <div className="win-rate-header">
          <span className="win-rate-label">Win Rate</span>
          <span className="win-rate-value">{winRate}%</span>
        </div>
        <Progress 
          percent={winRate} 
          showInfo={false}
          strokeColor={{
            '0%': '#667eea',
            '100%': '#764ba2',
          }}
          trailColor="rgba(255, 255, 255, 0.1)"
          size="small"
        />
      </div>

      {/* Control Buttons */}
      <div className="bot-controls">
        {bot.status === 'running' ? (
          <>
            <Tooltip title="Pause Bot">
              <Button 
                type="default" 
                icon={<PauseCircleOutlined />} 
                onClick={() => onPause(bot._id)}
                className="control-btn pause"
              >
                Pause
              </Button>
            </Tooltip>
            <Tooltip title="Stop Bot">
              <Button 
                type="primary" 
                danger
                icon={<StopOutlined />} 
                onClick={() => onStop(bot._id)}
                className="control-btn stop"
              >
                Stop
              </Button>
            </Tooltip>
          </>
        ) : bot.status === 'paused' ? (
          <>
            <Tooltip title="Resume Bot">
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                onClick={() => onStart(bot._id)}
                className="control-btn start"
              >
                Resume
              </Button>
            </Tooltip>
            <Tooltip title="Stop Bot">
              <Button 
                type="default" 
                danger
                icon={<StopOutlined />} 
                onClick={() => onStop(bot._id)}
                className="control-btn stop"
              >
                Stop
              </Button>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Start Bot">
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />} 
              onClick={() => onStart(bot._id)}
              className="control-btn start"
              block
            >
              Start Bot
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
