// Type declarations for @rajesh896/broprint.js
// This file resolves TypeScript declaration issues with the package

declare module '@rajesh896/broprint.js' {
  /**
   * This functions working
   * @Param {null}
   * @return {Promise<string>} - resolve(string)
   */
  export const getCurrentBrowserFingerPrint: () => Promise<string>;
  
  declare global {
    interface Navigator {
      brave: {
        isBrave: () => unknown;
      };
    }
  }
}
