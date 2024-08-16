"use client";

import TradingControls from "@/components/trading/TradingControls";
import TradingTerminalChart from "@/components/trading/TradingTerminalChart";
import WalletsDisplay from "@/components/trading/WalletsDisplay";
import { TradingDirection } from "@/library/domain/trading/types/TradingTransaction";
import useMockTradingEngine from "@/library/hooks/useMockTradingEngine";
import { useCurrentMockTradingEngine } from "@/library/state/providers/MockTradingProvider";
import { useCallback, useEffect, useMemo, useRef } from "react";

export default function Trading() {
  const chartRef = useRef<any>(null);

  const {
    swap,
    updateUserTokenBalance,
    engineWalletBalances,
    enginePriceFeed,
    lastUpdate,
  } = useCurrentMockTradingEngine();

  useEffect(() => {
    // setting initial wallet balances
    updateUserTokenBalance("MOCKPACO", "0xwalletA", 1000);
  }, [updateUserTokenBalance]);

  useEffect(() => {
    lastUpdate && chartRef?.current?.updatePriceFeed(lastUpdate);
  }, [lastUpdate]);

  useEffect(() => {
    const i = setInterval(async () => {
      await swap("0xwalletA", 1, TradingDirection.SELL);
    }, 1000);

    return () => {
      clearInterval(i);
    };
  }, [swap]);

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
    </>
  );
}
