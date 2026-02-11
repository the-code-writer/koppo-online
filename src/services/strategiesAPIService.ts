import { apiService } from './api';

// Types based on the Strategy module
export interface StrategyAuthor {
  photoURL: string;
  displayName: string;
  date: string;
}

export interface StrategyStatistics {
  totalRuns: number;
  totalWins: number;
  totalLosses: number;
  totalPayout: number;
  totalStake: number;
  totalTrades: number;
  rank?: number;
}

export interface Strategy {
  _id: string;
  strategyId: string;
  strategyUUID: string;
  title: string;
  tradeType: 'SPOT' | 'FUTURES' | 'OPTIONS' | 'SWAP' | 'MARGIN';
  market: 'STOCKS' | 'CRYPTO' | 'FOREX' | 'COMMODITIES' | 'INDICES' | 'BONDS';
  metadata: Record<string, any>;
  tags: string[];
  description: string;
  author: StrategyAuthor;
  coverPhoto: string;
  thumbnail: string;
  icon: string;
  isActive: boolean;
  isPublic: boolean;
  statistics?: StrategyStatistics;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateStrategyRequest {
  strategyId: string;
  title: string;
  tradeType: 'SPOT' | 'FUTURES' | 'OPTIONS' | 'SWAP' | 'MARGIN';
  market: 'STOCKS' | 'CRYPTO' | 'FOREX' | 'COMMODITIES' | 'INDICES' | 'BONDS';
  metadata?: Record<string, any>;
  tags?: string[];
  description: string;
  author: StrategyAuthor;
  coverPhoto: string;
  thumbnail: string;
  icon: string;
  isActive?: boolean;
  isPublic?: boolean;
  statistics?: StrategyStatistics;
}

export interface UpdateStrategyRequest {
  title?: string;
  tradeType?: 'SPOT' | 'FUTURES' | 'OPTIONS' | 'SWAP' | 'MARGIN';
  market?: 'STOCKS' | 'CRYPTO' | 'FOREX' | 'COMMODITIES' | 'INDICES' | 'BONDS';
  metadata?: Record<string, any>;
  tags?: string[];
  description?: string;
  author?: StrategyAuthor;
  coverPhoto?: string;
  thumbnail?: string;
  icon?: string;
  isActive?: boolean;
  isPublic?: boolean;
  statistics?: StrategyStatistics;
}

export interface StrategyFilters {
  tradeType?: 'SPOT' | 'FUTURES' | 'OPTIONS' | 'SWAP' | 'MARGIN';
  market?: 'STOCKS' | 'CRYPTO' | 'FOREX' | 'COMMODITIES' | 'INDICES' | 'BONDS';
  isPublic?: boolean;
  isActive?: boolean;
  tags?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StrategyListResponse {
  strategies: Strategy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface StrategyApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// Strategy API Utility
export const strategyApi = {
  /**
   * Get all strategies with filters and pagination
   */
  async getStrategies(
    filters?: StrategyFilters,
    options?: Partial<PaginationOptions>
  ): Promise<StrategyApiResponse<StrategyListResponse>> {
    const params = {
      ...filters,
      page: options?.page || 1,
      limit: options?.limit || 20,
      sortBy: options?.sortBy || 'createdAt',
      sortOrder: options?.sortOrder || 'desc',
      ...(filters?.tags && { tags: filters.tags.join(',') }),
    };

    return apiService.get<StrategyApiResponse<StrategyListResponse>>('/strategies', params);
  },

  /**
   * Get a single strategy by UUID
   */
  async getStrategy(uuid: string): Promise<StrategyApiResponse<Strategy>> {
    return apiService.get<StrategyApiResponse<Strategy>>(`/strategies/${uuid}`);
  },

  /**
   * Create a new strategy
   */
  async createStrategy(strategyData: CreateStrategyRequest): Promise<StrategyApiResponse<Strategy>> {
    return apiService.post<StrategyApiResponse<Strategy>>('/strategies', strategyData);
  },

  /**
   * Update a strategy by UUID
   */
  async updateStrategy(
    uuid: string,
    updateData: UpdateStrategyRequest
  ): Promise<StrategyApiResponse<Strategy>> {
    return apiService.put<StrategyApiResponse<Strategy>>(`/strategies/${uuid}`, updateData);
  },

  /**
   * Delete a strategy by UUID
   */
  async deleteStrategy(uuid: string): Promise<StrategyApiResponse<void>> {
    return apiService.delete<StrategyApiResponse<void>>(`/strategies/${uuid}`);
  },

  /**
   * Update strategy description
   */
  async updateStrategyDescription(
    uuid: string,
    description: string
  ): Promise<StrategyApiResponse<Strategy>> {
    return apiService.patch<StrategyApiResponse<Strategy>>(
      `/strategies/${uuid}/description`,
      { description }
    );
  },

  /**
   * Update strategy photos
   */
  async updateStrategyPhotos(
    uuid: string,
    photos: {
      coverPhoto?: string;
      thumbnail?: string;
      icon?: string;
    }
  ): Promise<StrategyApiResponse<Strategy>> {
    return apiService.patch<StrategyApiResponse<Strategy>>(
      `/strategies/${uuid}/photos`,
      photos
    );
  },

  /**
   * Get strategy fields (metadata structure)
   */
  async getStrategyFields(): Promise<StrategyApiResponse<any>> {
    return apiService.get<StrategyApiResponse<any>>('/strategies/fields');
  },

  /**
   * Get strategies by market type
   */
  async getStrategiesByMarket(
    market: 'STOCKS' | 'CRYPTO' | 'FOREX' | 'COMMODITIES' | 'INDICES' | 'BONDS',
    options?: Partial<PaginationOptions>
  ): Promise<StrategyApiResponse<StrategyListResponse>> {
    return this.getStrategies({ market }, options);
  },

  /**
   * Get strategies by trade type
   */
  async getStrategiesByTradeType(
    tradeType: 'SPOT' | 'FUTURES' | 'OPTIONS' | 'SWAP' | 'MARGIN',
    options?: Partial<PaginationOptions>
  ): Promise<StrategyApiResponse<StrategyListResponse>> {
    return this.getStrategies({ tradeType }, options);
  },

  /**
   * Get public strategies only
   */
  async getPublicStrategies(
    options?: Partial<PaginationOptions>
  ): Promise<StrategyApiResponse<StrategyListResponse>> {
    return this.getStrategies({ isPublic: true }, options);
  },

  /**
   * Get active strategies only
   */
  async getActiveStrategies(
    options?: Partial<PaginationOptions>
  ): Promise<StrategyApiResponse<StrategyListResponse>> {
    return this.getStrategies({ isActive: true }, options);
  },

  /**
   * Search strategies by tags
   */
  async searchStrategiesByTags(
    tags: string[],
    options?: Partial<PaginationOptions>
  ): Promise<StrategyApiResponse<StrategyListResponse>> {
    return this.getStrategies({ tags }, options);
  },

  /**
   * Get strategies with multiple filters
   */
  async getFilteredStrategies(
    filters: StrategyFilters,
    options?: Partial<PaginationOptions>
  ): Promise<StrategyApiResponse<StrategyListResponse>> {
    return this.getStrategies(filters, options);
  },

  /**
   * Get strategy statistics
   */
  async getStrategyStatistics(uuid: string): Promise<StrategyApiResponse<StrategyStatistics>> {
    const strategy = await this.getStrategy(uuid);
    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: strategy.data.statistics || {
        totalRuns: 0,
        totalWins: 0,
        totalLosses: 0,
        totalPayout: 0,
        totalStake: 0,
        totalTrades: 0,
      },
    };
  },

  /**
   * Clone a strategy (create a new one based on existing)
   */
  async cloneStrategy(
    uuid: string,
    newStrategyData: Partial<CreateStrategyRequest>
  ): Promise<StrategyApiResponse<Strategy>> {
    const originalStrategy = await this.getStrategy(uuid);
    
    const clonedStrategy: CreateStrategyRequest = {
      ...originalStrategy.data,
      ...newStrategyData,
      strategyId: newStrategyData.strategyId || `${originalStrategy.data.strategyId}-clone`,
      title: newStrategyData.title || `${originalStrategy.data.title} (Clone)`,
    };

    return this.createStrategy(clonedStrategy);
  },

  /**
   * Batch operations - Create multiple strategies
   */
  async createMultipleStrategies(
    strategies: CreateStrategyRequest[]
  ): Promise<StrategyApiResponse<Strategy[]>> {
    const promises = strategies.map(strategy => this.createStrategy(strategy));
    const results = await Promise.all(promises);
    
    return {
      success: true,
      message: `${strategies.length} strategies created successfully`,
      data: results.map(result => result.data),
    };
  },

  /**
   * Get strategies by author
   */
  async getStrategiesByAuthor(
    authorDisplayName: string,
    options?: Partial<PaginationOptions>
  ): Promise<StrategyApiResponse<StrategyListResponse>> {
    // This would need to be implemented on the backend
    // For now, we'll fetch all and filter client-side
    const allStrategies = await this.getStrategies(undefined, options);
    const authorStrategies = allStrategies.data.strategies.filter(
      strategy => strategy.author.displayName === authorDisplayName
    );

    return {
      success: true,
      message: 'Strategies by author retrieved successfully',
      data: {
        strategies: authorStrategies,
        pagination: allStrategies.data.pagination,
      },
    };
  },
};

// Default export
export default strategyApi;
