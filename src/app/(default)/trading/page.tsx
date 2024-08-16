"use client";

import TradingTerminalChart from "@/components/trading/TradingTerminalChart";
import { TradingDirection } from "@/library/domain/trading/types/TradingTransaction";
import useMockTradingEngine from "@/library/hooks/useMockTradingEngine";
import { useEffect, useMemo, useRef } from "react";

export default function Trading() {
  const chartRef = useRef<any>(null);

  const {
    swap,
    updateUserTokenBalance,
    engineWalletBalances,
    enginePriceFeed,
  } = useMockTradingEngine(
    undefined,
    undefined,
    undefined,
    undefined,
    chartRef?.current?.updatePriceFeed
  );

  const walletBalancesArray = useMemo<
    {
      token: string;
      balanceMap: { address: string; balance: number }[];
    }[]
  >(() => {
    return Object.keys(engineWalletBalances).reduce<
      {
        token: string;
        balanceMap: { address: string; balance: number }[];
      }[]
    >((acc, token) => {
      const balanceMap = Object.keys(engineWalletBalances[token]).map(
        (address) => {
          return {
            address,
            balance: engineWalletBalances[token][address],
          };
        }
      );
      acc.push({
        token,
        balanceMap,
      });
      return acc;
    }, []);
  }, [engineWalletBalances]);

  useEffect(() => {
    // setting initial wallet balances
    updateUserTokenBalance("0xmocktokenA", "0xwalletA", 1000);
  }, []);

  // Swaps every 1 seconds
  useEffect(() => {
    const i = setInterval(() => {
      swap("0xwalletA", 1, TradingDirection.SELL);
    }, 1000);

    return () => {
      clearInterval(i);
    };
  }, [swap]);

  useEffect(() => {
    const i = setInterval(() => {
      swap("0xwalletA", 3, TradingDirection.BUY);
    }, 3000);

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
        <div className="trading-actions-container">Trading controls</div>
      </div>
      <div className="trading-wallets">
        <div className="trading-wallets-header">Wallet Balances</div>
        <div className="trading-wallets-list">
          {walletBalancesArray.map((m) => {
            return (
              <>
                <div key={m.token}>Token {m.token}</div>
                {m.balanceMap.map((e) => (
                  <div key={e.address} className="trading-wallet-item">
                    <div className="trading-wallet-item-address">
                      {e.address}: {e.balance}
                    </div>
                  </div>
                ))}
              </>
            );
          })}
        </div>
      </div>
    </>
  );
}
