import { TradingDirection } from "@/library/domain/trading/types/TradingTransaction";
import { useCurrentMockTradingEngine } from "@/library/state/providers/MockTradingProvider";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function TradingControls() {
  const { tradingPairImplementation, swap, lastUpdate } =
    useCurrentMockTradingEngine();

  const [tradingDirection, setTradingDirection] = useState<TradingDirection>(
    TradingDirection.BUY
  );

  // Buy control
  const [assetAmount, setAssetAmount] = useState<number>(0);

  const handleOperate = useCallback(async () => {
    console.log("Swapping...", assetAmount, tradingDirection);
    await swap("0xwalletA", assetAmount, tradingDirection);
  }, [assetAmount, tradingDirection, swap]);

  useEffect(() => {
    console.log("Trading Pair Implementation", tradingPairImplementation);
  }, [tradingPairImplementation]);

  return (
    <>
      <div>Asset Price</div>
      <input
        readOnly
        type="text"
        className="form-input"
        value={lastUpdate?.close}
      />

      <div className="direction-control">
        <button
          className="btn"
          onClick={() => {
            tradingDirection === TradingDirection.BUY
              ? setTradingDirection(TradingDirection.SELL)
              : setTradingDirection(TradingDirection.BUY);
          }}
        >
          {tradingDirection === TradingDirection.BUY ? "Buy" : "Sell"}
        </button>
      </div>

      <div className="amounts-panel flex gap-4 items-center mt-4">
        <label htmlFor="assetAmount">Asset Amount</label>
        <input
          onChange={(e) => {
            setAssetAmount(parseFloat(e.target.value));
          }}
          id="assetAmount"
          type="number"
          className="form-input"
        />
      </div>

      <button onClick={handleOperate} className="btn">
        Operate ({tradingDirection === TradingDirection.BUY ? "Buy" : "Sell"})
      </button>
    </>
  );
}
