import chalk from 'chalk';

interface ConsoleMethod {
  (...args: any[]): void;
}

class DevConsole {
  private colors = {
    log: chalk.white,
    debug: chalk.cyan,
    info: chalk.blue,
    warn: chalk.yellow,
    error: chalk.red,
    timestamp: chalk.gray,
    type: chalk.magenta
  };

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  private formatMessage(type: string, args: any[]): string[] {
    const timestamp = this.formatTimestamp();
    const coloredTimestamp = this.colors.timestamp(`[${timestamp}]`);
    const coloredType = this.colors.type(`[${type}]`);
    
    // Format arguments like native console
    const formattedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return arg;
      } else if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    });

    return [`${coloredTimestamp} ${coloredType}`, ...formattedArgs];
  }

  private createConsoleMethod(type: keyof typeof this.colors): ConsoleMethod {
    return (...args: any[]) => {
      const colorFn = this.colors[type];
      const formattedArgs = this.formatMessage(type.toUpperCase(), args);
      
      // Apply color to the message content (excluding timestamp and type)
      if (formattedArgs.length > 1) {
        const [prefix, ...messages] = formattedArgs;
        const coloredMessages = messages.map(msg => colorFn(msg));
        console.log(prefix, ...coloredMessages);
      } else {
        console.log(formattedArgs[0]);
      }
    };
  }

  // Console methods
  readonly log = this.createConsoleMethod('log');
  readonly debug = this.createConsoleMethod('debug');
  readonly info = this.createConsoleMethod('info');
  readonly warn = this.createConsoleMethod('warn');
  readonly error = this.createConsoleMethod('error');

  // Additional utility methods
  readonly clear = () => console.clear();
  readonly trace = (...args: any[]) => console.trace(...args);
  readonly table = (...args: any[]) => console.table(...args);
  readonly group = (label?: string) => console.group(label);
  readonly groupCollapsed = (label?: string) => console.groupCollapsed(label);
  readonly groupEnd = () => console.groupEnd();

  // Method to assert with colored output
  assert(condition: any, ...args: any[]): void {
    if (!condition) {
      this.error('Assertion failed:', ...args);
      throw new Error('Assertion failed');
    }
  }

  // Method to count with colored output
  count(label: string = 'default'): void {
    const coloredLabel = this.colors.type(label);
    console.log(`${this.formatTimestamp()} [COUNT]`, coloredLabel);
  }

  // Method to time with colored output
  time(label: string = 'default'): void {
    const coloredLabel = this.colors.type(label);
    console.log(`${this.formatTimestamp()} [TIMER]`, coloredLabel, '- started');
    console.time(label);
  }

  // Method to timeEnd with colored output
  timeEnd(label: string = 'default'): void {
    const coloredLabel = this.colors.type(label);
    console.timeEnd(label);
    console.log(`${this.formatTimestamp()} [TIMER]`, coloredLabel, '- ended');
  }
}

// Create singleton instance
const devConsole = new DevConsole();

// Make it globally available
declare global {
  var devConsole: DevConsole;
}

// Assign to global object
if (typeof globalThis !== 'undefined') {
  (globalThis as any).devConsole = devConsole;
} else if (typeof global !== 'undefined') {
  (global as any).devConsole = devConsole;
} else if (typeof window !== 'undefined') {
  (window as any).devConsole = devConsole;
} else if (typeof self !== 'undefined') {
  (self as any).devConsole = devConsole;
}

// Export for TypeScript support
export { devConsole };
export default devConsole;
