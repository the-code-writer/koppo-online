/**
 * @file TradingBotExecutor.js
 * @description Handles API persistence, CRUD operations, and Deriv contract execution.
 *
 * Responsibilities:
 *   - Create / load / update / delete bot records via the TradingBot API service
 *   - Purchase contracts on the Deriv API with retry logic and timeout protection
 *   - Transform raw Deriv contract responses into normalised TradeResult objects
 *   - Validate contract parameters before submission
 *   - Persist individual trade records via the BotContractTrade API
 *   - Provide an event-driven interface so the TradingBotManager can react to
 *     trade outcomes without coupling to network details
 *
 * @usage
 *   const executor = new TradingBotExecutor({ apiBaseUrl, authToken, derivEndpoint });
 *   await executor.loadBot(botUUID);
 *   const result = await executor.executeTrade(contractParams);
 */

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');

// ─── Constants ───────────────────────────────────────────────────────────────

const BOT_STATUSES = Object.freeze({
  IDLE: 'IDLE',
  START: 'START',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  STOP: 'STOP',
  ERROR: 'ERROR',
});

const DEFAULT_CONNECTION_TIMEOUT = 15000;
const DEFAULT_MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_BASE = 1000;
const DEFAULT_MIN_STAKE = 0.35;
const DEFAULT_MAX_STAKE = 50000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function generateSessionId() {
  return `session_${Date.now()}_${uuidv4().slice(0, 8)}`;
}

// ─── TradingBotExecutor ──────────────────────────────────────────────────────

class TradingBotExecutor extends EventEmitter {
  /**
   * @param {Object} options
   * @param {string} options.apiBaseUrl          - Base URL for the TradingBot REST API
   * @param {string} [options.authToken]         - JWT bearer token
   * @param {string} [options.derivEndpointDomain] - Deriv WebSocket endpoint domain
   * @param {string} [options.derivAppId]        - Deriv app_id
   * @param {string} [options.derivLang]         - Deriv language code
   * @param {number} [options.connectionTimeout] - Timeout for Deriv contract creation (ms)
   * @param {number} [options.maxRetryAttempts]  - Max retry attempts for contract purchase
   * @param {number} [options.retryDelayBase]    - Base delay for exponential backoff (ms)
   * @param {number} [options.minStake]          - Minimum allowed stake
   * @param {number} [options.maxStake]          - Maximum allowed stake
   */
  constructor(options = {}) {
    super();
    this.apiBaseUrl = (options.apiBaseUrl || '').replace(/\/$/, '');
    this.authToken = options.authToken || null;

    // Deriv API settings
    this.derivEndpointDomain = options.derivEndpointDomain || process.env.DERIV_APP_ENDPOINT_DOMAIN || null;
    this.derivAppId = options.derivAppId || process.env.DERIV_APP_ENDPOINT_APP_ID || null;
    this.derivLang = options.derivLang || process.env.DERIV_APP_ENDPOINT_LANG || 'EN';

    // Retry / timeout
    this.connectionTimeout = options.connectionTimeout || DEFAULT_CONNECTION_TIMEOUT;
    this.maxRetryAttempts = options.maxRetryAttempts || DEFAULT_MAX_RETRY_ATTEMPTS;
    this.retryDelayBase = options.retryDelayBase || DEFAULT_RETRY_DELAY_BASE;

    // Stake bounds
    this.minStake = options.minStake ?? DEFAULT_MIN_STAKE;
    this.maxStake = options.maxStake ?? DEFAULT_MAX_STAKE;

    // Internal state
    this._currentBot = null;
    this._sessionId = null;
    this._derivApi = null;
    this._userAccount = null;
    this._tradeHistory = [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════════════════

  setAuthToken(token) {
    this.authToken = token;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HTTP HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generic HTTP request to the TradingBot API.
   * @param {string} endpoint
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async _request(endpoint, options = {}) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        const err = new Error(data.message || data.error || `HTTP ${response.status}`);
        err.statusCode = response.status;
        err.responseData = data;
        throw err;
      }

      return { success: true, data: data.data || data, message: data.message };
    } catch (error) {
      if (error.statusCode) throw error;
      const wrapped = new Error(error.message || 'Network error');
      wrapped.statusCode = 0;
      wrapped.originalError = error;
      throw wrapped;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BOT CRUD — API PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a new bot record on the API from form data.
   * @param {Object} botPayload - The full bot creation payload
   * @returns {Promise<Object>} Created bot record
   */
  async createBot(botPayload) {
    const res = await this._request('/trading-bots', {
      method: 'POST',
      body: JSON.stringify(botPayload),
    });
    this._currentBot = res.data;
    this.emit('bot_created', { botId: res.data.botUUID || res.data.botId, data: res.data });
    return res.data;
  }

  /**
   * Load an existing bot from the API by UUID.
   * @param {string} botUUID
   * @returns {Promise<Object>}
   */
  async loadBot(botUUID) {
    const res = await this._request(`/trading-bots/${botUUID}`);
    this._currentBot = res.data;
    this.emit('bot_loaded', { botId: botUUID, data: res.data });
    return res.data;
  }

  /**
   * Update the current bot record on the API.
   * @param {string} botUUID
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateBot(botUUID, updates) {
    const res = await this._request(`/trading-bots/${botUUID}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (this._currentBot && (this._currentBot.botUUID === botUUID || this._currentBot.botId === botUUID)) {
      Object.assign(this._currentBot, res.data);
    }
    this.emit('bot_updated', { botId: botUUID, data: res.data });
    return res.data;
  }

  /**
   * Soft-delete a bot.
   * @param {string} botUUID
   * @returns {Promise<Object>}
   */
  async deleteBot(botUUID) {
    const res = await this._request(`/trading-bots/${botUUID}`, { method: 'DELETE' });
    if (this._currentBot && (this._currentBot.botUUID === botUUID || this._currentBot.botId === botUUID)) {
      this._currentBot = null;
    }
    this.emit('bot_deleted', { botId: botUUID });
    return res.data;
  }

  /**
   * Clone a bot.
   * @param {string} botUUID
   * @returns {Promise<Object>}
   */
  async cloneBot(botUUID) {
    const res = await this._request(`/trading-bots/${botUUID}/clone`, { method: 'POST' });
    this.emit('bot_cloned', { originalId: botUUID, cloneData: res.data });
    return res.data;
  }

  /**
   * List bots with optional filters.
   * @param {Object} [params]
   * @returns {Promise<Object>}
   */
  async listBots(params = {}) {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) query.set(key, String(val));
    }
    const qs = query.toString();
    return (await this._request(`/trading-bots${qs ? `?${qs}` : ''}`)).data;
  }

  // ─── Field-specific API updates ────────────────────────────────────────────

  async updateBotStatus(botUUID, status) {
    return (await this._request(`/trading-bots/${botUUID}/${status.toLowerCase()}`, { method: 'POST' })).data;
  }

  async updateAmounts(botUUID, amounts) {
    return (await this._request(`/trading-bots/${botUUID}/update-amounts`, {
      method: 'PATCH',
      body: JSON.stringify(amounts),
    })).data;
  }

  async updateRealtimePerformance(botUUID, performance) {
    return (await this._request(`/trading-bots/${botUUID}/update-realtime-performance`, {
      method: 'PATCH',
      body: JSON.stringify({ realtimePerformance: performance }),
    })).data;
  }

  async updateStatistics(botUUID, statistics) {
    return (await this._request(`/trading-bots/${botUUID}/update-statistics`, {
      method: 'PATCH',
      body: JSON.stringify({ statistics }),
    })).data;
  }

  async updateAdvancedSettings(botUUID, advancedSettings) {
    return (await this._request(`/trading-bots/${botUUID}/update-advanced-settings`, {
      method: 'PATCH',
      body: JSON.stringify({ advanced_settings: advancedSettings }),
    })).data;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADE RECORD PERSISTENCE (BotContractTrade)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Persist a completed trade record to the BotContractTrade API.
   * @param {Object} tradeData
   * @returns {Promise<Object>}
   */
  async persistTradeRecord(tradeData) {
    try {
      const res = await this._request('/bot-contract-trades', {
        method: 'POST',
        body: JSON.stringify(tradeData),
      });
      return res.data;
    } catch (err) {
      this.emit('trade_persist_error', { error: err.message, tradeData });
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DERIV CONTRACT EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initialise a new trading session.
   * @returns {string} sessionId
   */
  startSession() {
    this._sessionId = generateSessionId();
    this._tradeHistory = [];
    this.emit('session_started', { sessionId: this._sessionId });
    return this._sessionId;
  }

  /**
   * End the current trading session.
   */
  endSession() {
    const sid = this._sessionId;
    this._sessionId = null;
    this.emit('session_ended', { sessionId: sid, trades: this._tradeHistory.length });
  }

  /**
   * Validate contract parameters before sending to Deriv.
   * @param {Object} params - ContractParams
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validateContractParams(params) {
    const errors = [];
    const required = ['amount', 'contract_type', 'currency', 'symbol'];
    for (const field of required) {
      if (!params[field]) errors.push(`Missing required field: ${field}`);
    }

    const amount = Number(params.amount);
    if (isNaN(amount)) {
      errors.push('Amount must be a number');
    } else {
      if (amount <= 0) errors.push('Amount must be positive');
      if (amount < this.minStake) errors.push(`Amount must be >= ${this.minStake}`);
      if (amount > this.maxStake) errors.push(`Amount must be <= ${this.maxStake}`);
    }

    if (params.barrier !== undefined && params.barrier !== null && isNaN(Number(params.barrier))) {
      errors.push('Barrier must be a number');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Build Deriv-compatible ContractParams from the bot's contract config and a calculated stake.
   *
   * @param {Object} contractConfig - The bot's contract data (from bot.contract)
   * @param {number} stake          - The calculated stake amount
   * @param {string} currency       - Currency code (e.g. 'USD')
   * @param {Object} [overrides]    - Optional overrides for any field
   * @returns {Object} ContractParams ready for Deriv API
   */
  buildContractParams(contractConfig, stake, currency, overrides = {}) {
    const params = {
      amount: roundToTwo(stake),
      basis: 'stake',
      contract_type: contractConfig.contractType || 'CALL',
      currency: currency || 'USD',
      symbol: contractConfig.market?.symbol || contractConfig.symbol || '',
      duration: contractConfig.duration || 1,
      duration_unit: contractConfig.durationUnits || 't',
    };

    // Optional fields
    if (contractConfig.prediction !== undefined && contractConfig.prediction !== null && contractConfig.prediction !== '') {
      params.barrier = String(contractConfig.prediction);
    }
    if (contractConfig.multiplier) {
      params.multiplier = contractConfig.multiplier;
    }

    return { ...params, ...overrides };
  }

  /**
   * Execute a single trade on the Deriv API with retry logic.
   *
   * @param {Object} contractParams - Validated ContractParams
   * @param {string} userAccountToken - Deriv account token
   * @returns {Promise<Object>} Normalised TradeResult
   */
  async executeTrade(contractParams, userAccountToken) {
    const validation = this.validateContractParams(contractParams);
    if (!validation.valid) {
      const err = new Error(`Invalid contract params: ${validation.errors.join('; ')}`);
      err.code = 'VALIDATION_ERROR';
      this.emit('trade_validation_failed', { errors: validation.errors, params: contractParams });
      throw err;
    }

    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt++) {
      try {
        this.emit('trade_attempt', { attempt, maxAttempts: this.maxRetryAttempts, params: contractParams });

        const result = await this._purchaseContract(contractParams, userAccountToken);

        // Normalise the result
        const tradeResult = this._normaliseTradeResult(result.contract, result.user, contractParams);
        tradeResult.sessionId = this._sessionId;
        tradeResult.tradeId = `trade_${Date.now()}_${uuidv4().slice(0, 8)}`;

        this._tradeHistory.push(tradeResult);

        this.emit('trade_executed', { result: tradeResult, attempt });

        // Persist asynchronously (fire-and-forget with error handling)
        this._persistTradeAsync(tradeResult);

        return tradeResult;
      } catch (error) {
        lastError = error;
        this.emit('trade_error', {
          attempt,
          maxAttempts: this.maxRetryAttempts,
          error: error.message || 'Unknown error',
        });

        if (attempt < this.maxRetryAttempts) {
          const delay = this._calculateRetryDelay(attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const finalError = new Error(`All ${this.maxRetryAttempts} trade attempts failed: ${lastError?.message || 'Unknown'}`);
    finalError.code = 'TRADE_EXECUTION_FAILED';
    finalError.lastError = lastError;
    this.emit('trade_all_attempts_failed', { error: finalError.message, params: contractParams });
    throw finalError;
  }

  /**
   * Purchase a contract on the Deriv API.
   * @private
   */
  async _purchaseContract(params, userAccountToken) {
    if (!this.derivEndpointDomain) throw new Error('DERIV_APP_ENDPOINT_DOMAIN not configured');
    if (!this.derivAppId) throw new Error('DERIV_APP_ENDPOINT_APP_ID not configured');
    if (!userAccountToken) throw new Error('User account token is required');

    let DerivAPI;
    try {
      DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');
    } catch (e) {
      throw new Error('Deriv API package not available. Install @deriv/deriv-api');
    }

    const api = new DerivAPI({
      endpoint: this.derivEndpointDomain,
      app_id: this.derivAppId,
      lang: this.derivLang,
    });

    // Authenticate
    const account = await api.account(userAccountToken);
    const user = {
      token: userAccountToken,
      account: account?.loginid || '',
      currency: account?.currency || params.currency,
      balance: account?.balance || 0,
    };

    // Create contract with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Contract creation timed out')), this.connectionTimeout)
    );

    const contract = await Promise.race([api.contract(params), timeoutPromise]);

    // Subscribe to updates
    const subscription = contract.onUpdate(({ status, payout, bid_price }) => {
      this.emit('contract_update', { status, payout, bid_price });
    });

    // Buy
    await contract.buy();

    // Wait for settlement
    const { find } = require('rxjs/operators');
    await contract
      .onUpdate()
      .pipe(find(({ is_sold }) => is_sold))
      .toPromise();

    subscription.unsubscribe();

    return { contract, user };
  }

  /**
   * Normalise a Deriv contract response into a standard TradeResult.
   * @private
   */
  _normaliseTradeResult(contract, user, originalParams) {
    try {
      const profit = contract.profit?._data?.value ?? 0;
      const isWin = contract.profit?._data?.is_win ?? profit > 0;
      const buyPrice = contract.buy_price?._data?.value ?? originalParams.amount;
      const sellPrice = contract.sell_price?._data?.value ?? 0;
      const payout = contract.payout?.value ?? 0;

      // Safe profit calculation (triple-check)
      let safeProfit;
      const profitFromPrices = sellPrice === 0 && buyPrice > 0
        ? roundToTwo(-buyPrice)
        : roundToTwo(sellPrice - buyPrice);
      const profitFromPercentage = roundToTwo(buyPrice * (contract.profit?._data?.percentage || 0) / 100);
      const profitFromSign = roundToTwo((contract.profit?._data?.value || 0) * (contract.profit?._data?.sign || 1));

      if (profitFromPrices === profitFromPercentage && profitFromPercentage === profitFromSign) {
        safeProfit = profitFromPrices;
      } else {
        safeProfit = profitFromPrices; // fallback to price-based
      }

      return {
        tradeId: null, // set by caller
        sessionId: null, // set by caller
        contractId: contract.proposal_id || '',
        botId: this._currentBot?.botId || this._currentBot?.botUUID || '',
        botUUID: this._currentBot?.botUUID || '',
        strategyId: this._currentBot?.strategyId || '',
        userAccountUUID: user.account || '',

        // Timing
        entryTime: this._extractTime(contract.start_time),
        exitTime: this._extractTime(contract.expiry_time),
        purchaseTime: this._extractTime(contract.purchase_time),

        // Spots
        entrySpotValue: contract.entry_spot?._data?.value ?? null,
        entrySpotTime: this._extractTime(contract.entry_spot?._data?.time),
        exitSpotValue: contract.exit_spot?._data?.value ?? contract.sell_spot?._data?.value ?? null,
        exitSpotTime: this._extractTime(contract.exit_spot?._data?.time),

        // Prices
        askPrice: contract.ask_price?._data?.value ?? 0,
        askPriceCurrency: contract.ask_price?._data?.currency ?? originalParams.currency,
        buyPrice,
        buyPriceCurrency: contract.buy_price?._data?.currency ?? originalParams.currency,
        buyTransaction: contract.buy_transaction ?? null,
        bidPrice: contract.bid_price?._data?.value ?? 0,
        bidPriceCurrency: contract.bid_price?._data?.currency ?? originalParams.currency,
        sellPrice,
        sellPriceCurrency: contract.sell_price?._data?.currency ?? originalParams.currency,
        sellSpot: contract.sell_spot?._data?.value ?? null,
        sellSpotTime: this._extractTime(contract.sell_spot?._data?.time),
        sellTransaction: contract.sell_transaction ?? null,

        // Result
        stake: buyPrice,
        payout,
        profit: safeProfit,
        profitPercentage: contract.profit?._data?.percentage ?? 0,
        isWin: !!isWin,
        status: contract.status || 'unknown',

        // Contract info
        symbol: contract.symbol?.short || originalParams.symbol,
        symbolFull: contract.symbol?.full || '',
        contractType: originalParams.contract_type,
        duration: originalParams.duration,
        durationUnits: originalParams.duration_unit,
        currency: originalParams.currency,
        longcode: contract.longcode || '',

        // Audit
        auditDetails: contract.audit_details?.all_ticks || [],
        ticks: contract.ticks?.[0] || null,

        // User
        userAccount: user,

        // Timestamp
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      // Fallback minimal result on parse error
      return {
        tradeId: null,
        sessionId: null,
        contractId: '',
        botId: this._currentBot?.botId || '',
        stake: originalParams.amount,
        payout: 0,
        profit: 0,
        isWin: false,
        status: 'parse_error',
        error: err.message,
        contractType: originalParams.contract_type,
        symbol: originalParams.symbol,
        currency: originalParams.currency,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Extract a timestamp from a Deriv time object.
   * @private
   */
  _extractTime(timeObj) {
    if (!timeObj) return null;
    try {
      if (timeObj._data?.internal?.$d) {
        return Math.floor(timeObj._data.internal.$d.getTime() / 1000);
      }
      if (typeof timeObj === 'number') return timeObj;
      if (typeof timeObj === 'string') return new Date(timeObj).getTime() / 1000;
    } catch (e) {
      return null;
    }
    return null;
  }

  /**
   * Persist a trade record asynchronously.
   * @private
   */
  async _persistTradeAsync(tradeResult) {
    try {
      await this.persistTradeRecord({
        sessionId: tradeResult.sessionId,
        botId: tradeResult.botId,
        botUUID: tradeResult.botUUID,
        strategyId: tradeResult.strategyId,
        userAccountUUID: tradeResult.userAccountUUID,
        symbol: tradeResult.symbol,
        symbolFull: tradeResult.symbolFull,
        contractType: tradeResult.contractType,
        currency: tradeResult.currency,
        stake: tradeResult.stake,
        payout: tradeResult.payout,
        profit: tradeResult.profit,
        profitPercentage: tradeResult.profitPercentage,
        isWin: tradeResult.isWin,
        status: tradeResult.status,
        entryTime: tradeResult.entryTime,
        exitTime: tradeResult.exitTime,
        purchaseTime: tradeResult.purchaseTime,
        entrySpotValue: tradeResult.entrySpotValue,
        exitSpotValue: tradeResult.exitSpotValue,
        buyPrice: tradeResult.buyPrice,
        sellPrice: tradeResult.sellPrice,
        longcode: tradeResult.longcode,
        auditDetails: tradeResult.auditDetails,
      });
    } catch (err) {
      this.emit('trade_persist_error', { error: err.message, tradeId: tradeResult.tradeId });
    }
  }

  /**
   * Calculate retry delay with exponential backoff + jitter.
   * @private
   */
  _calculateRetryDelay(attempt) {
    const jitter = Math.random() * 500;
    return Math.min(this.retryDelayBase * Math.pow(2, attempt - 1) + jitter, 10000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSORS
  // ═══════════════════════════════════════════════════════════════════════════

  get currentBot() {
    return this._currentBot ? { ...this._currentBot } : null;
  }

  get sessionId() {
    return this._sessionId;
  }

  get tradeHistory() {
    return [...this._tradeHistory];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  destroy() {
    this._currentBot = null;
    this._sessionId = null;
    this._tradeHistory = [];
    this._derivApi = null;
    this._userAccount = null;
    this.removeAllListeners();
  }
}

export { TradingBotExecutor, BOT_STATUSES };
