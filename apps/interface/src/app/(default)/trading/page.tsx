"use client";

import TradingControls from "@/features/trading/components/TradingControls";
import TradingTerminalChart from "@/features/trading/components/TradingTerminalChart";
import WalletsDisplay from "@/features/trading/components/WalletsDisplay";
import { generateMockScenario } from "@/features/trading/mockEngine/scenario";
import { useCurrentMockTradingEngine } from "@/features/trading/state/providers/MockTradingProvider";
import { useEffect, useRef } from "react";

export default function Trading() {
  const chartRef = useRef<any>(null);

  const {
    swap,
    updateUserTokenBalance,
    engineWalletBalances,
    enginePriceFeed,
    lastUpdate,
    loadAndExecuteScenario,
  } = useCurrentMockTradingEngine();

  useEffect(() => {
    // setting initial wallet balances
    updateUserTokenBalance("MOCKPACO", "0xwalletA", 1000);
  }, [updateUserTokenBalance]);

  useEffect(() => {
    lastUpdate && chartRef?.current?.updatePriceFeed(lastUpdate);
  }, [lastUpdate]);

  /* useEffect(() => {
    const i = setInterval(async () => {
      await swap("0xwalletA", 1, TradingDirection.SELL);
    }, 1000);

    return () => {
      clearInterval(i);
    };
  }, [swap]); */

  return (
    <>
      <div className="trading-header">
        <div className="trading-symbol">Symbol PACO/USDT</div>
      </div>
      <div className="trading-layout grid grid-cols-2 gap-2">
        <div className="trading-chart-container ">
          <TradingTerminalChart ref={chartRef} />
        </div>
        <div className="trading-actions-container">
          <TradingControls />
        </div>
      </div>
      <div className="trading-wallets">
        <div className="trading-wallets-header">Wallet Balances</div>
        <div className="trading-wallets-list">
          <WalletsDisplay walletsTokenMap={engineWalletBalances} />
        </div>
      </div>

      <button
        onClick={async () => {
          const scenario = generateMockScenario({
            initialReserves: { reserve0: 1000, reserve1: 1000 },
            amountBaseTokenInWallets: 0,
            amountQuoteTokenInWallets: 100000,
            nWallets: 100,
            nSteps: 100,
          });

          await loadAndExecuteScenario(scenario);
        }}
      >
        Load Scenario
      </button>
    </>
  );
}
