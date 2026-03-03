import { useState, useMemo } from 'react';
import { Typography, Tag, Tooltip, Button, Space, Divider, Progress } from 'antd';
import {
  TrophyOutlined,
  CloseOutlined,
  ShareAltOutlined,
  CopyOutlined,
  DownloadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ClockCircleOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  UserOutlined,
  WalletOutlined,
  BarChartOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { BottomActionSheet } from '../BottomActionSheet';
import './styles.scss';

const { Text, Title } = Typography;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionTrade {
  run: number;
  stake: number;
  profit: number;
}

export interface SessionSummaryData {
  name: string;
  email: string;
  account: string;
  currency: string;
  openBalance: number;
  closeBalance: number;
  wins: number;
  losses: number;
  totalRuns: number;
  totalStake: number;
  totalPayout: number;
  totalProfit: number;
  avgProfitPerRun: number;
  highestStake: number;
  highestProfit: number;
  maxDrawdown: number;
  winRate: number;
  balanceRatio: number;
  profitRatio: string;
  sharpeRatio: number;
  winStreak: number;
  lossStreak: number;
  bestWinStreak: number;
  worstLossStreak: number;
  started: string;
  stopped: string;
  duration: string;
  sessionId: string;
  botName: string;
  trades: SessionTrade[];
}

interface SessionSummaryDrawerProps {
  visible: boolean;
  onClose: () => void;
  data: SessionSummaryData | null;
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

export const DEMO_SESSION_DATA: SessionSummaryData = {
  name: 'Mr Douglas Maposa',
  email: 'dig*************',
  account: 'VRTC1605087',
  currency: 'USD',
  openBalance: 8203.66,
  closeBalance: 8204.19,
  wins: 1,
  losses: 0,
  totalRuns: 1,
  totalStake: 10,
  totalPayout: 10.53,
  totalProfit: 0.53,
  avgProfitPerRun: 0.53,
  highestStake: 10,
  highestProfit: 0.53,
  maxDrawdown: 0,
  winRate: 100,
  balanceRatio: 1.0,
  profitRatio: '∞',
  sharpeRatio: 0,
  winStreak: 1,
  lossStreak: 0,
  bestWinStreak: 1,
  worstLossStreak: 0,
  started: '2026-03-03 14:41',
  stopped: '2026-03-03 14:42',
  duration: '0h 0m 33s',
  sessionId: 'BOT-000004-MMAPUJM3-79AF0582',
  botName: 'Alpha Martingale Bot 2026.1',
  trades: [
    { run: 1, stake: 10.0, profit: 0.53 },
  ],
};

// ─── Component ───────────────────────────────────────────────────────────────

export function SessionSummaryDrawer({ visible, onClose, data }: SessionSummaryDrawerProps) {
  const [copied, setCopied] = useState(false);

  const session = data || DEMO_SESSION_DATA;

  const profitColor = session.totalProfit >= 0 ? '#52c41a' : '#ff4d4f';
  const profitIcon = session.totalProfit >= 0 ? <RiseOutlined /> : <FallOutlined />;
  const totalProfitTrades = useMemo(() =>
    session.trades.reduce((sum, t) => sum + t.profit, 0),
    [session.trades]
  );

  const handleCopyReport = () => {
    const report = generateTextReport(session);
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BottomActionSheet
      isOpen={visible}
      onClose={onClose}
      height="92vh"
      className="session-summary-sheet"
    >
      <div className="session-summary">
        {/* ─── Terminal Header ──────────────────────────────────── */}
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="terminal-title">
            <RobotOutlined />
            <Text strong>KOPPO TRADER — SESSION SUMMARY</Text>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="terminal-close"
          />
        </div>

        {/* ─── Scrollable Content ──────────────────────────────── */}
        <div className="terminal-body">
          {/* Hero Profit Banner */}
          <div className="profit-hero">
            <div className="profit-hero-label">Total Profit</div>
            <div className="profit-hero-value" style={{ color: profitColor }}>
              {profitIcon}
              <span style={{ fontWeight: 800 }}>{session.currency} {session.totalProfit >= 0 ? '+' : ''}{session.totalProfit.toFixed(2)}</span>
            </div>
            <div className="profit-hero-meta">
              <Tag color={session.winRate >= 50 ? 'green' : 'red'}>{session.winRate}% Win Rate</Tag>
              <Tag icon={<ClockCircleOutlined />}>{session.duration}</Tag>
              <Tag icon={<ThunderboltOutlined />}>{session.totalRuns} run{session.totalRuns !== 1 ? 's' : ''}</Tag>
            </div>
          </div>

          {/* ─── Account Info Card ──────────────────────────────── */}
          <div className="info-card">
            <div className="info-card-header">
              <UserOutlined />
              <Text strong>Account</Text>
            </div>
            <div className="info-grid cols-2">
              <div className="info-cell">
                <span className="cell-label">Name</span>
                <span className="cell-value">{session.name}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Email</span>
                <span className="cell-value mono">{session.email}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Account</span>
                <span className="cell-value mono">{session.account}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Currency</span>
                <span className="cell-value">{session.currency}</span>
              </div>
            </div>
          </div>

          {/* ─── Balance Card ───────────────────────────────────── */}
          <div className="info-card">
            <div className="info-card-header">
              <WalletOutlined />
              <Text strong>Balance</Text>
            </div>
            <div className="balance-bar-vertical">
              <div className="balance-endpoint">
                <span className="bal-label">Open</span>
                <span className="bal-value">{session.currency} {session.openBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="balance-endpoint">
                <span className="bal-label">Close</span>
                <span className="bal-value">{session.currency} {session.closeBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="balance-endpoint delta">
                <span className="bal-label">Change</span>
                <span className="bal-value" style={{ color: profitColor, fontWeight: 700 }}>
                  {session.totalProfit >= 0 ? '+' : ''}{session.totalProfit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Performance Card ───────────────────────────────── */}
          <div className="info-card">
            <div className="info-card-header">
              <BarChartOutlined />
              <Text strong>Performance</Text>
            </div>
            <div className="stat-row-group">
              <StatRow label="Total Stake" value={`${session.currency} ${session.totalStake.toFixed(2)}`} />
              <StatRow label="Total Payout" value={`${session.currency} ${session.totalPayout.toFixed(2)}`} />
              <StatRow label="Total Profit" value={`${session.currency} ${session.totalProfit >= 0 ? '+' : ''}${session.totalProfit.toFixed(2)}`} highlight={profitColor} />
              <StatRow label="Avg Profit/Run" value={`${session.currency} ${session.avgProfitPerRun >= 0 ? '+' : ''}${session.avgProfitPerRun.toFixed(2)}`} />
              <StatRow label="Highest Stake" value={`${session.currency} ${session.highestStake.toFixed(2)}`} />
              <StatRow label="Highest Profit" value={`${session.currency} ${session.highestProfit >= 0 ? '+' : ''}${session.highestProfit.toFixed(2)}`} />
              <StatRow label="Max Drawdown" value={`${session.currency} ${session.maxDrawdown.toFixed(2)}`} highlight={session.maxDrawdown > 0 ? '#ff4d4f' : undefined} />
            </div>
          </div>

          {/* ─── Ratios Card ────────────────────────────────────── */}
          <div className="info-card">
            <div className="info-card-header">
              <DashboardOutlined />
              <Text strong>Ratios</Text>
            </div>
            <div className="info-grid cols-4">
              <div className="ratio-chip">
                <span className="ratio-value">{session.winRate}%</span>
                <span className="ratio-label">Win Rate</span>
                <Progress
                  percent={session.winRate}
                  showInfo={false}
                  size="small"
                  strokeColor={session.winRate >= 50 ? '#52c41a' : '#ff4d4f'}
                  trailColor="var(--terminal-bg-alt)"
                />
              </div>
              <div className="ratio-chip">
                <span className="ratio-value">{session.balanceRatio.toFixed(2)}</span>
                <span className="ratio-label">Balance Ratio</span>
              </div>
              <div className="ratio-chip">
                <span className="ratio-value">{session.sharpeRatio}</span>
                <span className="ratio-label">Sharpe Ratio</span>
              </div>
              <div className="ratio-chip">
                <span className="ratio-value">{session.profitRatio}</span>
                <span className="ratio-label">PR</span>
              </div>
            </div>
          </div>

          {/* ─── Win/Loss & Streaks Card ────────────────────────── */}
          <div className="info-card">
            <div className="info-card-header">
              <FireOutlined />
              <Text strong>Win/Loss & Streaks</Text>
            </div>
            <div className="info-grid cols-2">
              <div className="wl-chip win">
                <CheckCircleFilled className="wl-icon" />
                <div className="wl-content">
                  <span className="wl-count">{session.wins}</span>
                  <span className="wl-label">Wins</span>
                </div>
              </div>
              <div className="wl-chip loss">
                <CloseCircleFilled className="wl-icon" />
                <div className="wl-content">
                  <span className="wl-count">{session.losses}</span>
                  <span className="wl-label">Losses</span>
                </div>
              </div>
            </div>
            <Divider className="streak-divider" />
            <div className="info-grid cols-2">
              <StatRow label="Win Streak" value={String(session.winStreak)} icon={<FireOutlined style={{ color: '#52c41a' }} />} />
              <StatRow label="Loss Streak" value={String(session.lossStreak)} icon={<FallOutlined style={{ color: '#ff4d4f' }} />} />
              <StatRow label="Best Win Streak" value={String(session.bestWinStreak)} icon={<TrophyOutlined style={{ color: '#faad14' }} />} />
              <StatRow label="Worst Loss Str" value={String(session.worstLossStreak)} />
            </div>
          </div>

          {/* ─── Session Timing Card ────────────────────────────── */}
          <div className="info-card">
            <div className="info-card-header">
              <FieldTimeOutlined />
              <Text strong>Session Timing</Text>
            </div>
            <div className="timing-stack">
              <StatRow label="Started" value={session.started} mono />
              <StatRow label="Stopped" value={session.stopped} mono />
            </div>
            <div className="timing-meta">
              <Tag icon={<ClockCircleOutlined />} color="blue">{session.duration}</Tag>
              <Text className="session-id-text" copyable={{ text: session.sessionId }}>
                {session.sessionId}
              </Text>
            </div>
            <div className="bot-name-bar">
              <RobotOutlined />
              <Text strong>{session.botName}</Text>
            </div>
          </div>

          {/* ─── Trades Table ───────────────────────────────────── */}
          <div className="info-card trades-card">
            <div className="info-card-header">
              <ThunderboltOutlined />
              <Text strong>Session Trades</Text>
            </div>
            <div className="trades-table">
              <div className="trades-thead">
                <span className="th-run">Run</span>
                <span className="th-stake">Stake</span>
                <span className="th-profit">Profit</span>
              </div>
              {session.trades.map((trade) => (
                <div key={trade.run} className="trades-trow">
                  <span className="td-run">{trade.run}</span>
                  <span className="td-stake">${trade.stake.toFixed(2)}</span>
                  <span className={`td-profit ${trade.profit >= 0 ? 'positive' : 'negative'}`}>
                    {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="trades-tfoot">
                <span className="tf-label">TOTAL PROFIT</span>
                <span className={`tf-value ${totalProfitTrades >= 0 ? 'positive' : 'negative'}`}>
                  {totalProfitTrades >= 0 ? '+' : ''}{totalProfitTrades.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Actions ────────────────────────────────────────── */}
          <div className="session-actions">
            <Space size={12}>
              <Tooltip title={copied ? 'Copied!' : 'Copy report'}>
                <Button
                  icon={copied ? <CheckCircleFilled /> : <CopyOutlined />}
                  onClick={handleCopyReport}
                  className="action-btn"
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </Tooltip>
              <Tooltip title="Share">
                <Button icon={<ShareAltOutlined />} className="action-btn">Share</Button>
              </Tooltip>
              <Tooltip title="Download">
                <Button icon={<DownloadOutlined />} className="action-btn">Export</Button>
              </Tooltip>
            </Space>
          </div>
        </div>
      </div>
    </BottomActionSheet>
  );
}

// ─── Stat Row Sub-Component ──────────────────────────────────────────────────

function StatRow({ label, value, highlight, icon, mono }: {
  label: string;
  value: string;
  highlight?: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="stat-row">
      <span className="stat-row-label">
        {icon && <span className="stat-row-icon">{icon}</span>}
        {label}
      </span>
      <span
        className={`stat-row-value ${mono ? 'mono' : ''}`}
        style={highlight ? { color: highlight, fontWeight: 700 } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Plain Text Report Generator ─────────────────────────────────────────────

function generateTextReport(s: SessionSummaryData): string {
  const lines = [
    '===================================',
    '  KOPPO TRADER - SESSION SUMMARY',
    '===================================',
    `Name:            ${s.name}`,
    `Email:           ${s.email}`,
    `Account:         ${s.account}`,
    `Currency:        ${s.currency}`,
    '',
    `Open Balance:    ${s.currency} ${s.openBalance.toFixed(2)}`,
    `Close Balance:   ${s.currency} ${s.closeBalance.toFixed(2)}`,
    '',
    `Wins:            ${s.wins}`,
    `Losses:          ${s.losses}`,
    `Total Runs:      ${s.totalRuns}`,
    '',
    `Total Stake:     ${s.currency} ${s.totalStake.toFixed(2)}`,
    `Total Payout:    ${s.currency} ${s.totalPayout.toFixed(2)}`,
    `Total Profit:    ${s.currency} ${s.totalProfit.toFixed(2)}`,
    `Avg Profit/Run:  ${s.currency} ${s.avgProfitPerRun.toFixed(2)}`,
    '',
    `Highest Stake:   ${s.currency} ${s.highestStake.toFixed(2)}`,
    `Highest Profit:  ${s.currency} ${s.highestProfit.toFixed(2)}`,
    `Max Drawdown:    ${s.currency} ${s.maxDrawdown.toFixed(2)}`,
    '',
    `Win Rate:        ${s.winRate}%`,
    `Balance Ratio:   ${s.balanceRatio.toFixed(2)} [ PR ${s.profitRatio} ]`,
    `Sharpe Ratio:    ${s.sharpeRatio}`,
    '',
    `Win Streak:      ${s.winStreak}`,
    `Loss Streak:     ${s.lossStreak}`,
    `Best Win Streak: ${s.bestWinStreak}`,
    `Worst Loss Str:  ${s.worstLossStreak}`,
    '',
    `Started:         ${s.started}`,
    `Stopped:         ${s.stopped}`,
    `Duration:        ${s.duration}`,
    '',
    `Session ID:      ${s.sessionId}`,
    `Bot Name:        ${s.botName}`,
    '',
    'Session Trades',
    '+-------+------------+------------+',
    '|  Run  |   Stake    |   Profit   |',
    '+-------+------------+------------+',
    ...s.trades.map(t =>
      `|  ${String(t.run).padStart(3)}  |  ${('$' + t.stake.toFixed(2)).padStart(9)} | ${(t.profit >= 0 ? '+' : '') + t.profit.toFixed(2).padStart(9)} |`
    ),
    '+--------------------+------------+',
    `| TOTAL PROFIT       | ${(s.totalProfit >= 0 ? '+' : '') + s.totalProfit.toFixed(2).padStart(9)} |`,
    '+--------------------+------------+',
    '===================================',
  ];
  return lines.join('\n');
}
