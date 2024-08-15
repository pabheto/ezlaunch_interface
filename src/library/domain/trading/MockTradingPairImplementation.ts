import Decimal from "decimal.js";
import AbstractTradingPairImplementation from "./AbstractTradingPairImplementation";
import {
  TradingDirection,
  TradingTransaction,
} from "./types/TradingTransaction";

export default class MockTradingPairImplementation extends AbstractTradingPairImplementation {
  private reserve0: number;
  private reserve1: number;
  private k: number;

  constructor(pairData: any) {
    super(pairData);
    this.reserve0 = 0;
    this.reserve1 = 0;
    this.k = 0;
  }

  mockInitialize(reserve0: number, reserve1: number) {
    this.reserve0 = reserve0;
    this.reserve1 = reserve1;
    this.k = reserve0 * reserve1;
  }

  mockUpdateReserves(reserve0: number, reserve1: number) {
    this.reserve0 = reserve0;
    this.reserve1 = reserve1;
    this.k = reserve0 * reserve1;
  }

  async getReserve0() {
    return new Decimal(this.reserve0);
  }

  async getReserve1() {
    return new Decimal(this.reserve1);
  }

  async getK() {
    return new Decimal(this.k);
  }

  async getSpotPrice() {
    return this.reserve1 / this.reserve0;
  }

  getLiquidity() {
    return Math.sqrt(this.k);
  }

  mockMint(amount0: number, amount1: number) {
    this.reserve0 += amount0;
    this.reserve1 += amount1;
    this.k = this.reserve0 * this.reserve1;
  }

  mockBurn(amount0: number, amount1: number) {
    this.reserve0 -= amount0;
    this.reserve1 -= amount1;
    this.k = this.reserve0 * this.reserve1;
  }

  // Trading ops
  async mockSwapAmount0In(amount0In: number) {
    this.reserve0 += amount0In;
    const amount1Out = (amount0In * this.reserve1) / this.reserve0;
    this.reserve1 -= amount1Out;
    this.k = this.reserve0 * this.reserve1;

    const tradingTransaction: TradingTransaction = {
      transactionId: "mock",
      tradingDirection: TradingDirection.BUY,
      tokenA: this.pairData.baseToken,
      tokenB: this.pairData.quoteToken,
      tradingAmountA: amount0In,
      tradingAmountB: amount1Out,
    };

    return tradingTransaction;
  }

  async mockSwapAmount1In(amount1In: number) {
    this.reserve1 += amount1In;
    const amount0Out = (amount1In * this.reserve0) / this.reserve1;
    this.reserve0 -= amount0Out;
    this.k = this.reserve0 * this.reserve1;

    const tradingTransaction: TradingTransaction = {
      transactionId: "mock",
      tradingDirection: TradingDirection.SELL,
      tokenA: this.pairData.baseToken,
      tokenB: this.pairData.quoteToken,
      tradingAmountA: amount0Out,
      tradingAmountB: amount1In,
    };

    return tradingTransaction;
  }
}
