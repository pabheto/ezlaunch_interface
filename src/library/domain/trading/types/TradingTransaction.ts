export enum TradingDirection {
  BUY = "BUY",
  SELL = "SELL",
}
export interface TradingTransaction {
  transactionId: string;
  tradingDirection: TradingDirection;

  tokenA: string;
  tokenB: string;
  tradingAmountA?: number;
  tradingAmountB?: number;
}
