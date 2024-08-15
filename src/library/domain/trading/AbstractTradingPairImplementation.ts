import Decimal from "decimal.js";
import { TradingPair } from "./types/TradingPair";

export default abstract class AbstractTradingPair {
  constructor(protected pairData: TradingPair) {}

  abstract getReserve0(): Promise<Decimal>;

  abstract getReserve1(): Promise<Decimal>;

  abstract getK(): Promise<Decimal>;

  abstract getSpotPrice(): Promise<number>;
}
