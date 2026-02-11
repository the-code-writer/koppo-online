import { apiService } from './api';
import { RawAxiosRequestHeaders } from 'axios';

// ==================== TYPES & INTERFACES ====================

export interface TradeAuditDetail {
  epoch: number;
  tick?: number;
  tick_display_value?: string;
  flag?: string;
  name?: string;
}

export interface BotContractTradeInput {
  botId: string;
  sessionId: string;
  userAccountUUID: string;
  amount: number;
  basis?: string;
  currency: string;
  duration: number;
  duration_unit: string;
  symbol: string;
  contract_type: string;
  symbol_short?: string;
  symbol_full?: string;
  start_time?: number;
  expiry_time?: number;
  purchase_time?: number;
  entry_spot_value?: number;
  entry_spot_time?: number;
  exit_spot_value?: number;
  exit_spot_time?: number;
  ask_price_currency?: string;
  ask_price_value?: number;
  buy_price_currency?: string;
  buy_price_value?: number;
  buy_transaction?: number;
  bid_price_currency?: string;
  bid_price_value?: number;
  sell_price_currency?: string;
  sell_price_value?: number;
  sell_spot?: number;
  sell_spot_time?: number;
  sell_transaction?: number;
  payout?: number;
  payout_currency?: string;
  profit_value?: number;
  profit_currency?: string;
  profit_percentage?: number;
  profit_is_win: boolean;
  profit_sign?: number;
  safeProfit?: number;
  status: 'won' | 'lost';
  longcode?: string;
  proposal_id?: string;
  audit_details?: TradeAuditDetail[];
  ticks?: any;
}

export interface BotContractTradeUpdate {
  amount?: number;
  basis?: string;
  currency?: string;
  duration?: number;
  duration_unit?: string;
  symbol?: string;
  contract_type?: string;
  profit_value?: number;
  profit_is_win?: boolean;
  profit_sign?: number;
  safeProfit?: number;
  payout?: number;
  status?: 'won' | 'lost';
  audit_details?: TradeAuditDetail[];
  ticks?: any;
}

export interface BotContractTrade extends BotContractTradeInput {
  _id: string;
  tradeUUID: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TradeAnalyticsResult {
  success: boolean;
  message: string;
  data: {
    total: number;
    count: number;
    [key: string]: any; // For sessionId, botId, etc.
  };
}

export interface TradeCountResult {
  success: boolean;
  message: string;
  data: {
    count: number;
    [key: string]: any; // For sessionId, botId, etc.
  };
}

export interface TradePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TradesListResponse {
  success: boolean;
  message: string;
  data: {
    trades: BotContractTrade[];
    pagination: TradePagination;
  };
}

export interface TradeResponse {
  success: boolean;
  message: string;
  data: BotContractTrade;
}

export interface BulkTradesResponse {
  success: boolean;
  message: string;
  data: BotContractTrade[];
}

export interface ListTradesParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'purchase_time' | 'sell_spot_time' | 'profit_value' | 'amount' | 'payout' | 'status';
  sortOrder?: 'asc' | 'desc';
  botId?: string;
  sessionId?: string;
  userAccountUUID?: string;
  status?: 'won' | 'lost';
  contract_type?: string;
  symbol?: string;
  startDate?: string | number;
  endDate?: string | number;
}

export interface DateRangeParams {
  startDate?: string | number;
  endDate?: string | number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================== API SERVICE CLASS ====================

export class BotContractTradesAPIService {
  private readonly basePath = '/api/v1/bot-contract-trades';

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create a new trade
   */
  async createTrade(
    tradeData: BotContractTradeInput,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeResponse> {
    return apiService.post<TradeResponse>(`${this.basePath}`, tradeData, headers);
  }

  /**
   * Create multiple trades in bulk (up to 100)
   */
  async createBulkTrades(
    trades: BotContractTradeInput[],
    headers?: RawAxiosRequestHeaders
  ): Promise<BulkTradesResponse> {
    return apiService.post<BulkTradesResponse>(
      `${this.basePath}/bulk`,
      { trades },
      headers
    );
  }

  /**
   * List trades with optional filters and pagination
   */
  async listTrades(
    params?: ListTradesParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradesListResponse> {
    return apiService.get<TradesListResponse>(`${this.basePath}`, params, headers);
  }

  /**
   * Get a single trade by UUID
   */
  async getTrade(
    tradeUUID: string,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeResponse> {
    return apiService.get<TradeResponse>(`${this.basePath}/${tradeUUID}`, undefined, headers);
  }

  /**
   * Update a trade by UUID
   */
  async updateTrade(
    tradeUUID: string,
    updateData: BotContractTradeUpdate,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeResponse> {
    return apiService.patch<TradeResponse>(
      `${this.basePath}/${tradeUUID}`,
      updateData,
      headers
    );
  }

  /**
   * Delete a trade by UUID (soft delete)
   */
  async deleteTrade(
    tradeUUID: string,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeResponse> {
    return apiService.delete<TradeResponse>(`${this.basePath}/${tradeUUID}`, headers);
  }

  // ==================== ANALYTICS - TOTAL PROFIT ====================

  async getTotalProfitBySession(
    sessionId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-profit/session/${sessionId}`,
      params,
      headers
    );
  }

  async getTotalProfitByBot(
    botId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-profit/bot/${botId}`,
      params,
      headers
    );
  }

  async getTotalProfitByStrategy(
    strategyId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-profit/strategy/${strategyId}`,
      params,
      headers
    );
  }

  async getTotalProfitByUser(
    userAccountUUID: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-profit/user/${userAccountUUID}`,
      params,
      headers
    );
  }

  async getTotalProfitByContractType(
    contractType: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-profit/contract-type/${contractType}`,
      params,
      headers
    );
  }

  async getTotalProfitBySymbol(
    symbol: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-profit/symbol/${symbol}`,
      params,
      headers
    );
  }

  // ==================== ANALYTICS - TOTAL WINS ====================

  async getTotalWinsBySession(
    sessionId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-wins/session/${sessionId}`,
      params,
      headers
    );
  }

  async getTotalWinsByBot(
    botId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-wins/bot/${botId}`,
      params,
      headers
    );
  }

  async getTotalWinsByUser(
    userAccountUUID: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-wins/user/${userAccountUUID}`,
      params,
      headers
    );
  }

  async getTotalWinsByContractType(
    contractType: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-wins/contract-type/${contractType}`,
      params,
      headers
    );
  }

  async getTotalWinsBySymbol(
    symbol: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-wins/symbol/${symbol}`,
      params,
      headers
    );
  }

  // ==================== ANALYTICS - TOTAL LOSSES ====================

  async getTotalLossesBySession(
    sessionId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-losses/session/${sessionId}`,
      params,
      headers
    );
  }

  async getTotalLossesByBot(
    botId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-losses/bot/${botId}`,
      params,
      headers
    );
  }

  async getTotalLossesByUser(
    userAccountUUID: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-losses/user/${userAccountUUID}`,
      params,
      headers
    );
  }

  async getTotalLossesByContractType(
    contractType: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-losses/contract-type/${contractType}`,
      params,
      headers
    );
  }

  async getTotalLossesBySymbol(
    symbol: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-losses/symbol/${symbol}`,
      params,
      headers
    );
  }

  // ==================== ANALYTICS - TOTAL STAKE ====================

  async getTotalStakeBySession(
    sessionId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-stake/session/${sessionId}`,
      params,
      headers
    );
  }

  async getTotalStakeByBot(
    botId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-stake/bot/${botId}`,
      params,
      headers
    );
  }

  async getTotalStakeByUser(
    userAccountUUID: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-stake/user/${userAccountUUID}`,
      params,
      headers
    );
  }

  async getTotalStakeByContractType(
    contractType: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-stake/contract-type/${contractType}`,
      params,
      headers
    );
  }

  async getTotalStakeBySymbol(
    symbol: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-stake/symbol/${symbol}`,
      params,
      headers
    );
  }

  // ==================== ANALYTICS - TOTAL PAYOUT ====================

  async getTotalPayoutBySession(
    sessionId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-payout/session/${sessionId}`,
      params,
      headers
    );
  }

  async getTotalPayoutByBot(
    botId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-payout/bot/${botId}`,
      params,
      headers
    );
  }

  async getTotalPayoutByUser(
    userAccountUUID: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-payout/user/${userAccountUUID}`,
      params,
      headers
    );
  }

  async getTotalPayoutByContractType(
    contractType: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-payout/contract-type/${contractType}`,
      params,
      headers
    );
  }

  async getTotalPayoutBySymbol(
    symbol: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeAnalyticsResult> {
    return apiService.get<TradeAnalyticsResult>(
      `${this.basePath}/analytics/total-payout/symbol/${symbol}`,
      params,
      headers
    );
  }

  // ==================== ANALYTICS - TOTAL RUNS ====================

  async getTotalRunsBySession(
    sessionId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-runs/session/${sessionId}`,
      params,
      headers
    );
  }

  async getTotalRunsByBot(
    botId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-runs/bot/${botId}`,
      params,
      headers
    );
  }

  async getTotalRunsByUser(
    userAccountUUID: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-runs/user/${userAccountUUID}`,
      params,
      headers
    );
  }

  async getTotalRunsByContractType(
    contractType: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-runs/contract-type/${contractType}`,
      params,
      headers
    );
  }

  async getTotalRunsBySymbol(
    symbol: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradeCountResult> {
    return apiService.get<TradeCountResult>(
      `${this.basePath}/analytics/total-runs/symbol/${symbol}`,
      params,
      headers
    );
  }

  // ==================== FILTER QUERIES ====================

  /**
   * Get trades by buying date range (purchase_time)
   */
  async getTradesByBuyingDate(
    startDate: string | number,
    endDate: string | number,
    params?: Omit<DateRangeParams, 'startDate' | 'endDate'>,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradesListResponse> {
    return apiService.get<TradesListResponse>(
      `${this.basePath}/filter/by-buying-date`,
      { startDate, endDate, ...params },
      headers
    );
  }

  /**
   * Get trades by selling date range (sell_spot_time)
   */
  async getTradesBySellingDate(
    startDate: string | number,
    endDate: string | number,
    params?: Omit<DateRangeParams, 'startDate' | 'endDate'>,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradesListResponse> {
    return apiService.get<TradesListResponse>(
      `${this.basePath}/filter/by-selling-date`,
      { startDate, endDate, ...params },
      headers
    );
  }

  /**
   * Get trades by symbol
   */
  async getTradesBySymbol(
    symbol: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradesListResponse> {
    return apiService.get<TradesListResponse>(
      `${this.basePath}/filter/by-symbol/${symbol}`,
      params,
      headers
    );
  }

  /**
   * Get trades by contract type
   */
  async getTradesByContractType(
    contractType: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradesListResponse> {
    return apiService.get<TradesListResponse>(
      `${this.basePath}/filter/by-contract-type/${contractType}`,
      params,
      headers
    );
  }

  /**
   * Get trades by user account UUID
   */
  async getTradesByUser(
    userAccountUUID: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradesListResponse> {
    return apiService.get<TradesListResponse>(
      `${this.basePath}/filter/by-user/${userAccountUUID}`,
      params,
      headers
    );
  }

  /**
   * Get trades by bot ID
   */
  async getTradesByBot(
    botId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradesListResponse> {
    return apiService.get<TradesListResponse>(
      `${this.basePath}/filter/by-bot/${botId}`,
      params,
      headers
    );
  }

  /**
   * Get trades by session ID
   */
  async getTradesBySession(
    sessionId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<TradesListResponse> {
    return apiService.get<TradesListResponse>(
      `${this.basePath}/filter/by-session/${sessionId}`,
      params,
      headers
    );
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Get complete session analytics dashboard
   */
  async getSessionDashboard(
    sessionId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<{
    totalProfit: TradeAnalyticsResult;
    totalWins: TradeCountResult;
    totalLosses: TradeCountResult;
    totalStake: TradeAnalyticsResult;
    totalPayout: TradeAnalyticsResult;
    totalRuns: TradeCountResult;
  }> {
    const [
      totalProfit,
      totalWins,
      totalLosses,
      totalStake,
      totalPayout,
      totalRuns
    ] = await Promise.all([
      this.getTotalProfitBySession(sessionId, params, headers),
      this.getTotalWinsBySession(sessionId, params, headers),
      this.getTotalLossesBySession(sessionId, params, headers),
      this.getTotalStakeBySession(sessionId, params, headers),
      this.getTotalPayoutBySession(sessionId, params, headers),
      this.getTotalRunsBySession(sessionId, params, headers)
    ]);

    return {
      totalProfit,
      totalWins,
      totalLosses,
      totalStake,
      totalPayout,
      totalRuns
    };
  }

  /**
   * Get complete bot lifetime analytics
   */
  async getBotLifetimeAnalytics(
    botId: string,
    params?: DateRangeParams,
    headers?: RawAxiosRequestHeaders
  ): Promise<{
    totalProfit: TradeAnalyticsResult;
    totalWins: TradeCountResult;
    totalLosses: TradeCountResult;
    totalStake: TradeAnalyticsResult;
    totalPayout: TradeAnalyticsResult;
    totalRuns: TradeCountResult;
  }> {
    const [
      totalProfit,
      totalWins,
      totalLosses,
      totalStake,
      totalPayout,
      totalRuns
    ] = await Promise.all([
      this.getTotalProfitByBot(botId, params, headers),
      this.getTotalWinsByBot(botId, params, headers),
      this.getTotalLossesByBot(botId, params, headers),
      this.getTotalStakeByBot(botId, params, headers),
      this.getTotalPayoutByBot(botId, params, headers),
      this.getTotalRunsByBot(botId, params, headers)
    ]);

    return {
      totalProfit,
      totalWins,
      totalLosses,
      totalStake,
      totalPayout,
      totalRuns
    };
  }
}

// ==================== EXPORTS ====================

export const botContractTradesAPI = new BotContractTradesAPIService();
export default botContractTradesAPI;
