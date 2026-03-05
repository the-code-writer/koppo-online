import { useState, useMemo, useCallback } from 'react';
import { Typography, Tag, Tooltip, Button, Divider, message } from 'antd';
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
  BarChartOutlined,
  DashboardOutlined,
  FieldTimeOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { BottomActionSheet } from '../BottomActionSheet';
import './styles.scss';
import tradingBotAPIService from '../../services/tradingBotAPIService';

const { Text } = Typography;

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

const rawText:string = `===================================
  KOPPO TRADER - SESSION SUMMARY
===================================

Name:            Mr Douglas Maposa
Email:           dig*************..
Account:         VRTC1605087
Currency:        USD

Open Balance:    USD 8195.31
Close Balance:   USD 8072.3

Wins:            55
Losses:          10
Total Runs:      65

Total Stake:     USD 1460
Total Payout:    USD 1336.99
Total Profit:    USD -123.01
Avg Profit/Run:  USD -1.89

Highest Stake:   USD 100
Highest Profit:  USD 0
Max Drawdown:    USD 123.01

Win Rate:        84.62%
Balance Ratio:   0.98 [ PR 0.35 ]
Sharpe Ratio:    -0.15

Win Streak:      0
Loss Streak:     1
Best Win Streak: 17
Worst Loss Str:  2

Started:         2026-03-04 02:58
Stopped:         2026-03-04 03:06
Duration:        0h 8m 8s

Bot Name:        Alpha Martingale Bot 2026.1
Session ID:      BOT-000004-MMBG5WII-5F7051A9

Session Trades
+-------+------------+------------+
|  Run  |   Stake    |   Profit   |
+-------+------------+------------+
|    1  |     $10.00 |     -10.00 |
|    2  |    $100.00 |      +5.26 |
|    3  |     $10.00 |      +0.53 |
|    4  |     $10.00 |     -10.00 |
|    5  |    $100.00 |      +5.26 |
|    6  |    $100.00 |      +5.26 |
|    7  |     $10.00 |     -10.00 |
|    8  |    $100.00 |      +5.26 |
|    9  |     $10.00 |      +0.53 |
|   10  |     $10.00 |     -10.00 |
|   11  |     $10.00 |      +0.53 |
|   12  |    $100.00 |      +5.26 |
|   13  |     $10.00 |      +0.53 |
|   14  |     $10.00 |      +0.53 |
|   15  |     $10.00 |      +0.53 |
|   16  |     $10.00 |      +0.53 |
|   17  |     $10.00 |      +0.53 |
|   18  |     $10.00 |      +0.53 |
|   19  |     $10.00 |      +0.53 |
|   20  |     $10.00 |     -10.00 |
|   21  |    $100.00 |      +5.26 |
|   22  |     $10.00 |      +0.53 |
|   23  |     $10.00 |      +0.53 |
|   24  |     $10.00 |      +0.53 |
|   25  |     $10.00 |      +0.53 |
|   26  |     $10.00 |      +0.53 |
|   27  |     $10.00 |      +0.53 |
|   28  |     $10.00 |      +0.53 |
|   29  |     $10.00 |      +0.53 |
|   30  |     $10.00 |      +0.53 |
|   31  |     $10.00 |      +0.53 |
|   32  |     $10.00 |      +0.53 |
|   33  |     $10.00 |      +0.53 |
|   34  |     $10.00 |      +0.53 |
|   35  |     $10.00 |      +0.53 |
|   36  |     $10.00 |      +0.53 |
|   37  |     $10.00 |      +0.53 |
|   38  |     $10.00 |     -10.00 |
|   39  |    $100.00 |      +5.26 |
|   40  |     $10.00 |      +0.53 |
|   41  |     $10.00 |      +0.53 |
|   42  |     $10.00 |      +0.53 |
|   43  |     $10.00 |      +0.53 |
|   44  |     $10.00 |      +0.53 |
|   45  |     $10.00 |     -10.00 |
|   46  |     $10.00 |      +0.53 |
|   47  |    $100.00 |    -100.00 |
|   48  |     $10.00 |     -10.00 |
|   49  |    $100.00 |      +5.26 |
|   50  |     $10.00 |      +0.53 |
|   51  |     $10.00 |      +0.53 |
|   52  |     $10.00 |      +0.53 |
|   53  |     $10.00 |      +0.53 |
|   54  |     $10.00 |      +0.53 |
|   55  |     $10.00 |      +0.53 |
|   56  |     $10.00 |      +0.53 |
|   57  |     $10.00 |      +0.53 |
|   58  |     $10.00 |      +0.53 |
|   59  |     $10.00 |      +0.53 |
|   60  |     $10.00 |      +0.53 |
|   61  |     $10.00 |      +0.53 |
|   62  |     $10.00 |      +0.53 |
|   63  |     $10.00 |      +0.53 |
|   64  |     $10.00 |      +0.53 |
|   65  |     $10.00 |     -10.00 |
+--------------------+------------+
| TOTAL PROFIT       |    -123.01 |
+--------------------+------------+`;

// ─── Report Parser ───────────────────────────────────────────────────────────

export function parseSessionReport(report: string): SessionSummaryData {
  const lines = report.split('\n').map(l => l.trim()).filter(Boolean);

  const field = (label: string): string => {
    const line = lines.find(l => l.startsWith(label + ':'));
    return line ? line.slice(label.length + 1).trim() : '';
  };

  const num = (label: string): number => {
    const raw = field(label).replace(/[A-Z]{3}\s*/i, '').replace(/[+,%]/g, '').trim();
    return parseFloat(raw) || 0;
  };

  // Parse profit ratio from "1.00 [ PR 1.32 ]" format
  const balanceRatioRaw = field('Balance Ratio');
  let balanceRatio = 0;
  let profitRatio = '0';
  const brMatch = balanceRatioRaw.match(/([\d.]+)\s*\[\s*PR\s+([^\]]+)\]/);
  if (brMatch) {
    balanceRatio = parseFloat(brMatch[1]) || 0;
    profitRatio = brMatch[2].trim();
  }

  // Parse trades from the ASCII table
  const trades: SessionTrade[] = [];
  const tradeLineRegex = /^\|\s*(\d+)\s*\|\s*\$?([\d.]+)\s*\|\s*([+-]?[\d.]+)\s*\|$/;
  for (const line of lines) {
    const m = line.match(tradeLineRegex);
    if (m) {
      trades.push({
        run: parseInt(m[1], 10),
        stake: parseFloat(m[2]),
        profit: parseFloat(m[3]),
      });
    }
  }

  return {
    name: field('Name'),
    email: field('Email'),
    account: field('Account'),
    currency: field('Currency'),
    openBalance: num('Open Balance'),
    closeBalance: num('Close Balance'),
    wins: num('Wins'),
    losses: num('Losses'),
    totalRuns: num('Total Runs'),
    totalStake: num('Total Stake'),
    totalPayout: num('Total Payout'),
    totalProfit: num('Total Profit'),
    avgProfitPerRun: num('Avg Profit/Run'),
    highestStake: num('Highest Stake'),
    highestProfit: num('Highest Profit'),
    maxDrawdown: num('Max Drawdown'),
    winRate: num('Win Rate'),
    balanceRatio,
    profitRatio,
    sharpeRatio: num('Sharpe Ratio'),
    winStreak: num('Win Streak'),
    lossStreak: num('Loss Streak'),
    bestWinStreak: num('Best Win Streak'),
    worstLossStreak: num('Worst Loss Str'),
    started: field('Started'),
    stopped: field('Stopped'),
    duration: field('Duration'),
    sessionId: field('Session ID'),
    botName: field('Bot Name'),
    trades,
  };
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

export const DEMO_SESSION_DATA: SessionSummaryData = parseSessionReport(rawText);

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
    const report = '```\n' + generateTextReport(session) + '\n```';
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = useCallback(async () => {
    const report = '```\n' + generateTextReport(session) + '\n```';
    const shareData = {
      title: 'Koppo Session Summary',
      text: report,
    };

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          message.error('Failed to share');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(report);
        message.success('Report copied to clipboard');
      } catch {
        message.error('Sharing is not supported on this browser');
      }
    }
  }, [session]);

  const handleExport = useCallback(() => {
    const report = '```\n' + generateTextReport(session) + '\n```';
    const reportHtml = generateHtmlReport(session);
    const payload:any = { messengerText: report, emailText: reportHtml, sessionId: session.sessionId, fullName: session.name || '', botName: session.botName || '', account: session.account || '', currency: session.currency || '' };
    tradingBotAPIService.sendSessionSummary(payload)
    console.log("SEND SESSION SUMMARY", payload);
  }, [session]);

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
            <Text>KOPPO SESSION SUMMARY</Text>
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
              <Text>Account</Text>
            </div>
            <div className="info-grid cols-2">
              <div className="info-cell">
                <span className="cell-label">Name</span>
                <span className="cell-value mono single-line-ellipsis">{session.name}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Email</span>
                <span className="cell-value mono single-line-ellipsis">{session.email}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Account</span>
                <span className="cell-value mono">{session.account}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Currency</span>
                <span className="cell-value mono">{session.currency}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Open Balance</span>
                <span className="cell-value mono">{session.currency} {session.openBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="info-cell">
                <span className="cell-label">Close Balance</span>
                <span className="cell-value mono">{session.currency} {session.closeBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* ─── Performance Card ───────────────────────────────── */}
          <div className="info-card">
            <div className="info-card-header">
              <BarChartOutlined />
              <Text>Performance</Text>
            </div>
            <div className="stat-row-group">
              <StatRow label="Max Drawdown" value={`${session.currency} ${session.maxDrawdown.toFixed(2)}`} highlight={session.maxDrawdown > 0 ? '#ff4d4f' : undefined} />
              <StatRow label="Avg Profit/Run" value={`${session.currency} ${session.avgProfitPerRun >= 0 ? '+' : ''}${session.avgProfitPerRun.toFixed(2)}`} />
              <StatRow label="Highest Stake" value={`${session.currency} ${session.highestStake.toFixed(2)}`} />
              <StatRow label="Highest Profit" value={`${session.currency} ${session.highestProfit >= 0 ? '+' : ''}${session.highestProfit.toFixed(2)}`} />
              <StatRow label="Total Stake" value={`${session.currency} ${session.totalStake.toFixed(2)}`} />
              <StatRow label="Total Payout" value={`${session.currency} ${session.totalPayout.toFixed(2)}`} />
              <StatRow label="Total Profit" value={`${session.currency} ${session.totalProfit >= 0 ? '+' : ''}${session.totalProfit.toFixed(2)}`} highlight={profitColor} />
            </div>
          </div>

          {/* ─── Ratios Card ────────────────────────────────────── */}
          <div className="info-card">
            <div className="info-card-header">
              <DashboardOutlined />
              <Text>Ratios</Text>
            </div>
            <div className="info-grid cols-4">
              <div className="ratio-chip">
                <span className="ratio-value">{session.winRate}%</span>
                <span className="ratio-label">Sesion Win Rate</span>
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
                <span className="ratio-label">Profit Ratio</span>
              </div>
            </div>
          </div>

          {/* ─── Win/Loss & Streaks Card ────────────────────────── */}
          <div className="info-card">
            <div className="info-card-header">
              <FireOutlined />
              <Text>Win/Loss & Streaks</Text>
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
            <div className="info-grid cols-1">
              <StatRow label="Win Streak" value={String(session.winStreak)} icon={<FireOutlined style={{ color: '#52c41a' }} />} />
              <StatRow label="Loss Streak" value={String(session.lossStreak)} icon={<FallOutlined style={{ color: '#ff4d4f' }} />} />
              <StatRow label="Best Win Streak" value={String(session.bestWinStreak)} icon={<TrophyOutlined style={{ color: '#faad14' }} />} />
              <StatRow label="Worst Loss Str" value={String(session.worstLossStreak)} icon={<FallOutlined style={{ color: '#ff4d4f' }} />} />
            </div>
          </div>

          {/* ─── Session Timing Card ────────────────────────────── */}
          <div className="info-card">
            <div className="info-card-header">
              <FieldTimeOutlined />
              <Text>Session Timing</Text>
            </div>
            <div className="timing-stack">
              <StatRow label="Started" value={session.started} mono />
              <StatRow label="Stopped" value={session.stopped} mono />
              <StatRow label="Running Time" value={<Tag icon={<ClockCircleOutlined />} color="blue">{session.duration}</Tag>} mono />
            </div>
            <div className="timing-meta">
              <Text className="session-id-text" copyable={{ text: session.sessionId }}>
                {session.sessionId}
              </Text>
            </div>
            <div className="bot-name-bar">
              <RobotOutlined />
              <Text>{session.botName}</Text>
            </div>
          </div>

          {/* ─── Trades Table ───────────────────────────────────── */}
          <div className="info-card trades-card">
            <div className="info-card-header">
              <ThunderboltOutlined />
              <Text>Session Trades</Text>
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
              <Tooltip title={copied ? 'Copied!' : 'Copy report'}>
                <Button
                  icon={copied ? <CheckCircleFilled /> : <CopyOutlined />}
                  onClick={handleCopyReport}
                  className="action-btn" size="large" block
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </Tooltip>
              <Tooltip title="Share">
                <Button icon={<ShareAltOutlined />} className="action-btn" size="large" block onClick={handleShare}>Share</Button>
              </Tooltip>
              <Tooltip title="Download">
                <Button icon={<DownloadOutlined />} className="action-btn" size="large" block onClick={handleExport}>Export</Button>
              </Tooltip>
          </div>
        </div>
      </div>
    </BottomActionSheet>
  );
}

// ─── Stat Row Sub-Component ──────────────────────────────────────────────────

function StatRow({ label, value, highlight, icon, mono }: {
  label: string;
  value: string | any;
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

// ─── HTML Report Generator (Email-compatible) ───────────────────────────────

function generateHtmlReport(s: SessionSummaryData): string {
  const mono = "'SF Mono', 'Fira Code', 'Consolas', 'Courier New', monospace";
  const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const green = '#52c41a';
  const red = '#ff4d4f';
  const accent = '#3b82f6';
  const profitColor = s.totalProfit >= 0 ? green : red;
  const profitSign = s.totalProfit >= 0 ? '+' : '';
  const totalTradeProfit = s.trades.reduce((sum, t) => sum + t.profit, 0);

  const cardStyle = `background:#ffffff; border:1px solid #e6e6e6; border-radius:12px; padding:18px; margin-bottom:16px;`;
  const cardHeaderStyle = `font-family:${sans}; font-size:16px; font-weight:700; text-transform:uppercase; color:#000000; border-bottom:1px solid #e6e6e6; padding-bottom:12px; margin-bottom:16px;`;
  const cellLabelStyle = `font-family:${sans}; font-size:14px; font-weight:600; color:rgba(0,0,0,0.45); margin:0; line-height:1.4;`;
  const cellValueStyle = `font-family:${mono}; font-size:14px; font-weight:600; color:rgba(0,0,0,0.85); margin:0; line-height:1.4;`;
  const statRowLabelStyle = `font-family:${sans}; font-size:14px; font-weight:600; color:rgba(0,0,0,0.45);`;
  const statRowValueStyle = `font-family:${mono}; font-size:14px; font-weight:600; color:rgba(0,0,0,0.85); text-align:right;`;

  const infoCell = (label: string, value: string) =>
    `<td style="padding:10px 12px; background:#f8f9fa; border-radius:8px; vertical-align:top; width:50%;">
      <p style="${cellLabelStyle}">${label}</p>
      <p style="${cellValueStyle}">${value}</p>
    </td>`;

  const statRow = (label: string, value: string, color?: string) =>
    `<tr>
      <td style="${statRowLabelStyle} padding:8px 12px; border-bottom:1px solid #f0f0f0;">${label}</td>
      <td style="${statRowValueStyle} padding:8px 12px; border-bottom:1px solid #f0f0f0;${color ? ` color:${color}; font-weight:700;` : ''}">${value}</td>
    </tr>`;

  const ratioCell = (value: string, label: string) =>
    `<td style="text-align:center; padding:14px 8px; background:#f8f9fa; border:1px solid #e6e6e6; border-radius:10px; width:25%;">
      <div style="font-family:${mono}; font-size:20px; font-weight:800; color:rgba(0,0,0,0.85); line-height:1;">${value}</div>
      <div style="font-family:${sans}; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.8px; color:rgba(0,0,0,0.45); margin-top:6px;">${label}</div>
    </td>`;

  const tradeRows = s.trades.map(t => {
    const pColor = t.profit >= 0 ? green : red;
    const pSign = t.profit >= 0 ? '+' : '';
    return `<tr>
      <td style="padding:10px 14px; text-align:center; color:rgba(0,0,0,0.45); border-bottom:1px solid #f0f0f0; font-family:${mono}; font-size:14px;">${t.run}</td>
      <td style="padding:10px 14px; text-align:right; font-family:${mono}; font-size:14px; border-bottom:1px solid #f0f0f0;">$${t.stake.toFixed(2)}</td>
      <td style="padding:10px 14px; text-align:right; font-family:${mono}; font-size:14px; font-weight:700; color:${pColor}; border-bottom:1px solid #f0f0f0;">${pSign}${t.profit.toFixed(2)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f0f2f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;">
<tr><td align="center" style="padding:20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden;">

  <!-- Header -->
  <tr>
    <td style="background:#f8f9fa; padding:14px 20px; border-bottom:1px solid #e6e6e6;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td>
          <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#ff5f57; margin-right:6px;"></span>
          <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#febc2e; margin-right:6px;"></span>
          <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#28c840;"></span>
        </td>
        <td style="text-align:right; font-family:${sans}; font-size:16px; font-weight:800; color:rgba(0,0,0,0.45); text-transform:uppercase;">
          &#129302; KOPPO SESSION SUMMARY
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- Body -->
  <tr><td style="padding:20px;">

    <!-- Profit Hero -->
    <div style="text-align:center; padding:28px 0; background:linear-gradient(135deg, #f8f9fa 0%, rgba(59,130,246,0.06) 100%); border:1px solid #e6e6e6; border-radius:12px; margin-bottom:16px;">
      <p style="font-family:${sans}; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:2px; color:rgba(0,0,0,0.45); margin:0 0 8px;">Total Profit</p>
      <p style="font-family:${mono}; font-size:36px; font-weight:800; color:${profitColor}; margin:0 0 16px; letter-spacing:-1px;">${profitSign}${s.currency} ${s.totalProfit.toFixed(2)}</p>
      <span style="display:inline-block; font-family:${mono}; font-size:12px; font-weight:600; padding:2px 10px; border-radius:6px; background:${s.winRate >= 50 ? 'rgba(82,196,26,0.1)' : 'rgba(255,77,79,0.1)'}; color:${s.winRate >= 50 ? green : red}; margin:0 4px;">${s.winRate}% Win Rate</span>
      <span style="display:inline-block; font-family:${mono}; font-size:12px; font-weight:600; padding:2px 10px; border-radius:6px; background:rgba(0,0,0,0.04); color:rgba(0,0,0,0.65); margin:0 4px;">&#128339; ${s.duration}</span>
      <span style="display:inline-block; font-family:${mono}; font-size:12px; font-weight:600; padding:2px 10px; border-radius:6px; background:rgba(0,0,0,0.04); color:rgba(0,0,0,0.65); margin:0 4px;">&#9889; ${s.totalRuns} run${s.totalRuns !== 1 ? 's' : ''}</span>
    </div>

    <!-- Account Card -->
    <div style="${cardStyle}">
      <div style="${cardHeaderStyle}">&#128100; Account</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="6">
        <tr>${infoCell('Name', s.name)}${infoCell('Email', s.email)}</tr>
        <tr>${infoCell('Account', s.account)}${infoCell('Currency', s.currency)}</tr>
        <tr>${infoCell('Open Balance', `${s.currency} ${s.openBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)}${infoCell('Close Balance', `${s.currency} ${s.closeBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)}</tr>
      </table>
    </div>

    <!-- Performance Card -->
    <div style="${cardStyle}">
      <div style="${cardHeaderStyle}">&#128202; Performance</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${statRow('Max Drawdown', `${s.currency} ${s.maxDrawdown.toFixed(2)}`, s.maxDrawdown > 0 ? red : undefined)}
        ${statRow('Avg Profit/Run', `${s.currency} ${s.avgProfitPerRun >= 0 ? '+' : ''}${s.avgProfitPerRun.toFixed(2)}`)}
        ${statRow('Highest Stake', `${s.currency} ${s.highestStake.toFixed(2)}`)}
        ${statRow('Highest Profit', `${s.currency} ${s.highestProfit >= 0 ? '+' : ''}${s.highestProfit.toFixed(2)}`)}
        ${statRow('Total Stake', `${s.currency} ${s.totalStake.toFixed(2)}`)}
        ${statRow('Total Payout', `${s.currency} ${s.totalPayout.toFixed(2)}`)}
        ${statRow('Total Profit', `${s.currency} ${profitSign}${s.totalProfit.toFixed(2)}`, profitColor)}
      </table>
    </div>

    <!-- Ratios Card -->
    <div style="${cardStyle}">
      <div style="${cardHeaderStyle}">&#128200; Ratios</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="6">
        <tr>
          ${ratioCell(`${s.winRate}%`, 'Session Win Rate')}
          ${ratioCell(s.balanceRatio.toFixed(2), 'Balance Ratio')}
          ${ratioCell(String(s.sharpeRatio), 'Sharpe Ratio')}
          ${ratioCell(s.profitRatio, 'Profit Ratio')}
        </tr>
      </table>
    </div>

    <!-- Win/Loss & Streaks Card -->
    <div style="${cardStyle}">
      <div style="${cardHeaderStyle}">&#128293; Win/Loss &amp; Streaks</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="8">
        <tr>
          <td style="text-align:center; padding:16px; background:rgba(63,185,80,0.08); border:1px solid rgba(63,185,80,0.25); border-radius:10px; width:50%;">
            <div style="font-family:${mono}; font-size:22px; font-weight:800; color:${green};">${s.wins}</div>
            <div style="font-family:${sans}; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:rgba(63,185,80,0.7);">Wins</div>
          </td>
          <td style="text-align:center; padding:16px; background:rgba(248,81,73,0.08); border:1px solid rgba(248,81,73,0.25); border-radius:10px; width:50%;">
            <div style="font-family:${mono}; font-size:22px; font-weight:800; color:${red};">${s.losses}</div>
            <div style="font-family:${sans}; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:rgba(248,81,73,0.7);">Losses</div>
          </td>
        </tr>
      </table>
      <hr style="border:none; border-top:1px solid #e6e6e6; margin:12px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${statRow('Win Streak', String(s.winStreak))}
        ${statRow('Loss Streak', String(s.lossStreak))}
        ${statRow('Best Win Streak', String(s.bestWinStreak))}
        ${statRow('Worst Loss Str', String(s.worstLossStreak))}
      </table>
    </div>

    <!-- Session Timing Card -->
    <div style="${cardStyle}">
      <div style="${cardHeaderStyle}">&#128336; Session Timing</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${statRow('Started', s.started)}
        ${statRow('Stopped', s.stopped)}
        ${statRow('Running Time', s.duration)}
      </table>
      <p style="font-family:${mono}; font-size:14px; color:rgba(0,0,0,0.45); margin:14px 0 0; word-break:break-all;">${s.sessionId}</p>
      <div style="margin-top:14px; padding:12px 14px; background:linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(147,51,234,0.06) 100%); border:1px solid rgba(59,130,246,0.15); border-radius:8px;">
        <span style="font-family:${mono}; font-size:14px; color:rgba(0,0,0,0.85);">&#129302; ${s.botName}</span>
      </div>
    </div>

    <!-- Trades Table Card -->
    <div style="${cardStyle}">
      <div style="${cardHeaderStyle}">&#9889; Session Trades</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6e6e6; border-radius:8px; overflow:hidden;">
        <thead>
          <tr style="background:#f8f9fa;">
            <th style="padding:10px 14px; font-family:${sans}; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:rgba(0,0,0,0.45); text-align:center; border-bottom:1px solid #e6e6e6;">Run</th>
            <th style="padding:10px 14px; font-family:${sans}; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:rgba(0,0,0,0.45); text-align:right; border-bottom:1px solid #e6e6e6;">Stake</th>
            <th style="padding:10px 14px; font-family:${sans}; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:rgba(0,0,0,0.45); text-align:right; border-bottom:1px solid #e6e6e6;">Profit</th>
          </tr>
        </thead>
        <tbody>${tradeRows}</tbody>
        <tfoot>
          <tr style="background:#f8f9fa; border-top:2px solid #e6e6e6;">
            <td colspan="2" style="padding:12px 14px; font-family:${sans}; font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:rgba(0,0,0,0.45);">TOTAL PROFIT</td>
            <td style="padding:12px 14px; text-align:right; font-family:${mono}; font-size:16px; font-weight:800; color:${totalTradeProfit >= 0 ? green : red};">${totalTradeProfit >= 0 ? '+' : ''}${totalTradeProfit.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

  </td></tr>

  <!-- Footer -->
  <tr>
    <td style="text-align:center; padding:16px 20px; background:#f8f9fa; border-top:1px solid #e6e6e6;">
      <p style="font-family:${sans}; font-size:12px; color:rgba(0,0,0,0.35); margin:0;">Generated by <strong style="color:${accent};">Koppo Trader</strong></p>
    </td>
  </tr>

</table>
</td></tr></table>
</body>
</html>`;
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
