import { TradingDirection } from "@/features/trading/types/TradingTransaction";
import { useCurrentMockTradingEngine } from "@/features/trading/state/providers/MockTradingProvider";
import { useCallback, useEffect, useState } from "react";

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

  const [reserves, setReserves] = useState<{
    reserve0: number;
    reserve1: number;
  }>({ reserve0: 0, reserve1: 0 });

  useEffect(() => {
    if (!tradingPairImplementation) return;
    tradingPairImplementation.getReserve0().then((r0) => {
      tradingPairImplementation.getReserve1().then((r1) => {
        setReserves({ reserve0: r0.toNumber(), reserve1: r1.toNumber() });
      });
    });
  }, [tradingPairImplementation]);

  return (
    <>
      <div>
        <div>Asset Price</div>
        <input
          readOnly
          type="text"
          className="form-input"
          value={lastUpdate?.close}
        />
      </div>

      <div>
        <div>Reserves</div>
        <div className="flex">
          <input
            readOnly
            type="text"
            className="form-input"
            value={reserves.reserve0}
          />
          <input
            readOnly
            type="text"
            className="form-input"
            value={reserves.reserve1}
          />
        </div>
      </div>

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
