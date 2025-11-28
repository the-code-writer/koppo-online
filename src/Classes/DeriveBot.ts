import DerivAPIBasic from "@deriv/deriv-api/dist/DerivAPIBasic.js";

interface TradeContract {
  amount: number;
  basis: string;
  contract_type: string;
  currency: string;
  duration: number;
  duration_unit: string;
  symbol: string;
  barrier: string;
}

interface TickData {
  epoch: number;
  quote: number;
  symbol?: string;
}

export class DerivBot {
  private api: DerivAPIBasic;
  private connection: WebSocket;
  private tickHistory: TickData[] = [];
  private maxTickHistory: number = 100; // Store last 100 ticks for analysis

  constructor(appId: string) {
    this.connection = new WebSocket(
      `wss://ws.derivws.com/websockets/v3?app_id=${appId}`
    );
    this.api = new DerivAPIBasic({ connection: this.connection });
  }

  async initialize(token: string) {
    try {
      // Wait for connection to open
      await this.waitForConnection();
      
      // Authorize
      await this.api.authorize(token);
      console.log("Authorization successful");

      // Get initial balance
      const balance = await this.api.balance();
      console.log("Initial balance:", balance);

      // Subscribe to balance updates
      this.subscribeToBalance();

    } catch (error) {
      console.error("Initialization failed:", error);
    }
  }

  async trade(): Promise<void> {
    try {
      const contract0: TradeContract = {
        amount: 1000,
        basis: "stake",
        contract_type: "DIGITMATCH",
        currency: "USD",
        duration: 1,
        duration_unit: "t",
        symbol: "R_100",
        barrier: "0"
      };

      const contract1: TradeContract = {
        amount: 1000,
        basis: "stake",
        contract_type: "DIGITMATCH",
        currency: "USD",
        duration: 1,
        duration_unit: "t",
        symbol: "R_100",
        barrier: "1"
      };

      const contract2: TradeContract = {
        amount: 1000,
        basis: "stake",
        contract_type: "DIGITMATCH",
        currency: "USD",
        duration: 1,
        duration_unit: "t",
        symbol: "R_100",
        barrier: "2"
      };

      const contract3: TradeContract = {
        amount: 1000,
        basis: "stake",
        contract_type: "DIGITMATCH",
        currency: "USD",
        duration: 1,
        duration_unit: "t",
        symbol: "R_100",
        barrier: "3"
      };

      const contract4: TradeContract = {
        amount: 1000,
        basis: "stake",
        contract_type: "DIGITMATCH",
        currency: "USD",
        duration: 1,
        duration_unit: "t",
        symbol: "R_100",
        barrier: "4"
      };

      const contract5: TradeContract = {
        amount: 1000,
        basis: "stake",
        contract_type: "DIGITMATCH",
        currency: "USD",
        duration: 1,
        duration_unit: "t",
        symbol: "R_100",
        barrier: "5"
      };

      const contract6: TradeContract = {
        amount: 1000,
        basis: "stake",
        contract_type: "DIGITMATCH",
        currency: "USD",
        duration: 1,
        duration_unit: "t",
        symbol: "R_100",
        barrier: "6"
      };

      const contract7: TradeContract = {
        amount: 1000,
        basis: "stake",
        contract_type: "DIGITMATCH",
        currency: "USD",
        duration: 1,
        duration_unit: "t",
        symbol: "R_100",
        barrier: "7"
      };

      // Execute trades in parallel
      await Promise.all([
        this.executeTrade(contract0, "DIGITDIFF-0"),
        this.executeTrade(contract1, "DIGITDIFF-1"),
        this.executeTrade(contract2, "DIGITDIFF-2"),
        this.executeTrade(contract3, "DIGITDIFF-3"),
        this.executeTrade(contract4, "DIGITDIFF-4"),
        this.executeTrade(contract5, "DIGITDIFF-5"),
        this.executeTrade(contract6, "DIGITDIFF-6"),
        this.executeTrade(contract7, "DIGITDIFF-7"),
      ]);

    } catch (error) {
      console.error("Trade execution failed:", error);
    }
  }

  private async executeTrade(contract: TradeContract, tradeName: string): Promise<void> {
    try {
      // Step 1: Get proposal
      const proposalResponse = await this.api.proposal({
        proposal: 1,
        amount: contract.amount,
        basis: contract.basis,
        contract_type: contract.contract_type,
        currency: contract.currency,
        duration: contract.duration,
        duration_unit: contract.duration_unit,
        symbol: contract.symbol,
        barrier: contract.barrier
      });

      console.log(`${tradeName} Proposal:`, proposalResponse);

      // Step 2: Buy contract using proposal ID
      if (proposalResponse && proposalResponse.proposal.id) {
        const buyResponse = this.api.buy({
          buy: proposalResponse.proposal.id,
          price: contract.amount
        });

        console.log(`${tradeName} Buy Result:`, buyResponse);

        // Step 3: Subscribe to contract updates
        if (buyResponse && buyResponse.contract_id) {
          this.api.subscribe({
            contract: buyResponse.contract_id
          }, (update: any) => {
            console.log(`${tradeName} Update:`, update);
          });
        }
      }

    } catch (error) {
      console.error(`Error executing ${tradeName}:`, error);
    }
  }

  private waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (this.connection.readyState === WebSocket.OPEN) {
        resolve();
      } else {
        this.connection.addEventListener('open', () => resolve());
      }
    });
  }

    private subscribeToBalance() {
        try {
            // Method 1: Using subscribe with callback (most reliable)
            this.api.subscribe({ balance: 1 }, (response: any) => {
                console.log("Balance update:", response);
            });

            // Method 2: Alternative approach using the response object directly
            const subscription = this.api.subscribe({ balance: 1 });

            // Check if onUpdate exists before calling it
            if (subscription && typeof subscription.subscribe === 'function') {
                subscription.subscribe({
                    next: (data: any) => console.log("Balance update (rxjs):", data),
                    error: (err: any) => console.error("Subscription error:", err),
                    complete: () => console.log("Subscription completed")
                });
            } else {
                // Fallback: Listen for messages directly
                this.connection.addEventListener('message', (event) => {
                    const data = JSON.parse(event.data);
                    if (data.msg_type === 'balance') {
                        console.log("Balance update (direct):", data);
                    }
                });
            }

        } catch (error) {
            console.error("Balance subscription failed:", error);
        }
    }

    // Get current balance
    async getBalance(): Promise<any> {
        try {
            return await this.api.balance();
        } catch (error) {
            console.error("Failed to get balance:", error);
            throw error;
        }
    }

    // Cleanup method
    disconnect() {
        if (this.api && typeof this.api.disconnect === 'function') {
            this.api.disconnect();
        }
        if (this.connection) {
            this.connection.close();
        }
    }

  // Add tick analysis methods
  async startTickAnalysis(symbol: string = 'R_100'): Promise<void> {
    try {
      console.log(`Starting tick analysis for ${symbol}...`);

      // Subscribe to ticks
      this.api.subscribe({ ticks: symbol }, (response: any) => {
        if (response.tick) {
          this.handleTickUpdate(response.tick, symbol);
        }
      });

      // Get initial tick history
      await this.getTickHistory(symbol);

    } catch (error) {
      console.error("Tick analysis failed to start:", error);
    }
  }

  private handleTickUpdate(tick: TickData, symbol: string): void {
    // Add new tick to history
    this.tickHistory.unshift(tick);

    // Keep only the last maxTickHistory ticks
    if (this.tickHistory.length > this.maxTickHistory) {
      this.tickHistory = this.tickHistory.slice(0, this.maxTickHistory);
    }

    // Analyze the last 3 ticks
    if (this.tickHistory.length >= 3) {
      this.analyzeLastDigits();
    }

    console.log(`New tick: ${tick.quote}, Time: ${new Date(tick.epoch * 1000).toLocaleTimeString()}`);
  }

  private async getTickHistory(symbol: string): Promise<void> {
    try {
      // Get tick history (adjust count as needed)
      const historyResponse = await this.api.ticksHistory({
        ticks_history: symbol,
        count: 100,
        end: "latest"
      });

      if (historyResponse.history && historyResponse.history.prices) {
        this.tickHistory = historyResponse.history.prices.map((price: number, index: number) => ({
          epoch: historyResponse.history.times[index],
          quote: price
        })).reverse(); // Reverse to have latest first

        console.log(`Loaded ${this.tickHistory.length} historical ticks`);

        // Analyze if we have enough data
        if (this.tickHistory.length >= 3) {
          this.analyzeLastDigits();
        }
      }
    } catch (error) {
      console.error("Failed to get tick history:", error);
    }
  }

  private analyzeLastDigits(): void {
    if (this.tickHistory.length < 3) return;

    // Get last 3 ticks
    const lastThreeTicks = this.tickHistory.slice(0, 3);

    // Extract last digits
    const lastDigits = lastThreeTicks.map(tick => {
      const quoteStr = tick.quote.toString();
      return parseInt(quoteStr[quoteStr.length - 1]); // Get last digit
    });

    console.log('=== TICK ANALYSIS ===');
    console.log('Last 3 ticks:', lastThreeTicks.map(t => t.quote));
    console.log('Last digits sequence:', lastDigits);

    // Analyze patterns
    this.analyzePatterns(lastDigits, lastThreeTicks);
    console.log('=====================');
  }

  private analyzePatterns(lastDigits: number[], ticks: TickData[]): void {
    // Pattern 1: Check for same digits
    const allSame = lastDigits.every(digit => digit === lastDigits[0]);
    if (allSame) {
      console.log('🚨 PATTERN: All last digits are the same!');
    }

    // Pattern 2: Check for sequence (ascending/descending)
    const isAscending = lastDigits[0] > lastDigits[1] && lastDigits[1] > lastDigits[2];
    const isDescending = lastDigits[0] < lastDigits[1] && lastDigits[1] < lastDigits[2];

    if (isAscending) {
      console.log('📈 PATTERN: Digits in descending sequence');
    } else if (isDescending) {
      console.log('📉 PATTERN: Digits in ascending sequence');
    }

    // Pattern 3: Check for high-low patterns
    const isHighLowHigh = lastDigits[0] > 5 && lastDigits[1] < 5 && lastDigits[2] > 5;
    const isLowHighLow = lastDigits[0] < 5 && lastDigits[1] > 5 && lastDigits[2] < 5;

    if (isHighLowHigh) {
      console.log('🔄 PATTERN: High-Low-High pattern detected');
    } else if (isLowHighLow) {
      console.log('🔄 PATTERN: Low-High-Low pattern detected');
    }

    // Pattern 4: Even/Odd patterns
    const evenCount = lastDigits.filter(digit => digit % 2 === 0).length;
    const oddCount = lastDigits.filter(digit => digit % 2 === 1).length;

    if (evenCount === 3) {
      console.log('🔵 PATTERN: All digits are even');
    } else if (oddCount === 3) {
      console.log('🟠 PATTERN: All digits are odd');
    }

    // Pattern 5: Check for specific digit ranges
    const highDigits = lastDigits.filter(digit => digit >= 7).length;
    const lowDigits = lastDigits.filter(digit => digit <= 2).length;

    if (highDigits >= 2) {
      console.log('🎯 PATTERN: Multiple high digits (7-9)');
    } else if (lowDigits >= 2) {
      console.log('🎯 PATTERN: Multiple low digits (0-2)');
    }
  }

  // Method to get current analysis summary
  getTickAnalysisSummary(): any {
    if (this.tickHistory.length < 3) {
      return { message: "Not enough data for analysis" };
    }

    const lastThree = this.tickHistory.slice(0, 3);
    const lastDigits = lastThree.map(tick => {
      const quoteStr = tick.quote.toString();
      return parseInt(quoteStr[quoteStr.length - 1]);
    });

    return {
      lastThreeTicks: lastThree.map(t => t.quote),
      lastDigits: lastDigits,
      timestamp: new Date().toISOString(),
      totalTicksStored: this.tickHistory.length
    };
  }

  // Method to manually trigger analysis
  triggerAnalysis(): void {
    console.log('=== MANUAL ANALYSIS TRIGGERED ===');
    this.analyzeLastDigits();
  }
}