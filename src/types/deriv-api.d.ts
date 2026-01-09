declare module "@deriv/deriv-api/dist/DerivAPIBasic.js" {
  class DerivAPIBasic {
    constructor(connection: any);
    subscribe(params: any): any;
    authorize(tokens: any): Promise<any>;
  }
  
  export default DerivAPIBasic;
}
