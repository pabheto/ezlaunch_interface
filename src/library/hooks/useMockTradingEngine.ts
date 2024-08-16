import { useCallback, useEffect, useState } from "react";
import MockTradingPairImplementation from "../domain/trading/MockTradingPairImplementation";
import { TradingPair } from "@/library/domain/trading/types/TradingPair";
import { TradingDirection } from "@/library/domain/trading/types/TradingTransaction";

const MOCK_PAIR_DATA: TradingPair = {
  pairAddress: "0xmock",
  baseToken: "0xmocktokenA",
  quoteToken: "0xmocktokenB",
};

export interface PriceUpdate {
  time: string;
  high: number;
  low: number;
  open: number;
  close: number;
}

export default function useMockTradingEngine(
  tradingPairData: TradingPair = MOCK_PAIR_DATA,
  initialAmountA: number = 1000,
  initialAmountB: number = 1000,
  timeframe: number = 60, // Timeframe in seconds
  priceUpdateCallback?: (u: PriceUpdate) => any
) {
  const [lastDate, setLastDate] = useState<Date | null>(null);
  const [aha, setAha] = useState(0);
  const [tradingPairImplementation, setTradingPairImplementation] =
    useState<MockTradingPairImplementation | null>(null);

  const [enginePriceFeed, setEnginePriceFeed] = useState<{
    [timestamp: number]: {
      time: number;
      high: number;
      low: number;
      open: number;
      close: number;
    };
  }>({});

  const [engineWalletBalances, setEngineWalletBalances] = useState<{
    [token: string]: {
      [address: string]: number;
    };
  }>({});

  useEffect(() => {
    const impl = new MockTradingPairImplementation(tradingPairData);
    impl.mockInitialize(initialAmountA, initialAmountB);

    setTradingPairImplementation(impl);
  }, [setTradingPairImplementation]);

  const getUserTokenBalance = useCallback(
    (token: string, wallet: string) => {
      const tokenBalances = engineWalletBalances[token];
      if (tokenBalances) {
        const userBalance = tokenBalances[wallet];
        return userBalance ?? 0;
      }
      return 0;
    },
    [engineWalletBalances]
  );

  const updateUserTokenBalance = useCallback(
    (token: string, wallet: string, newBalance: number) => {
      setEngineWalletBalances((prevBalances) => {
        const tokenBalances = prevBalances[token] ?? {};
        return {
          ...prevBalances,
          [token]: {
            ...tokenBalances,
            [wallet]: newBalance,
          },
        };
      });
    },
    [setEngineWalletBalances, engineWalletBalances]
  );

  const updatePriceFeed = useCallback(async () => {
    if (!tradingPairImplementation) {
      throw new Error("Trading pair implementation not initialized");
    }

    const timestamp = Math.abs(Date.now() / 1000);
    const price = await tradingPairImplementation.getSpotPrice();

    // Rounding to the timeframe
    const roundedTimestamp = Math.floor(timestamp / timeframe) * timeframe;

    // Simulating days after the initial date
    // Mode to set different days
    /* let pd = new Date();
    pd.setUTCHours(0, 0, 0, 0);
    if (lastDate) {
      if (aha % 10 === 0) {
        const d = new Date(lastDate);
        d.setUTCDate(lastDate.getUTCDate() + 1);
        d.setUTCHours(0, 0, 0, 0);
        pd = d;
        setLastDate(d);
      }
      else {
        pd = lastDate;
      }
    } else {
      setLastDate(pd);
    }
    setAha(aha + 1);

    const roundedTimestamp = Math.floor(pd.getTime() / 1000); */
    const currentPriceUpdate = enginePriceFeed[roundedTimestamp];

    let update = null;

    if (currentPriceUpdate) {
      update = {
        ...currentPriceUpdate,
        high: Math.max(currentPriceUpdate.high, price),
        low: Math.min(currentPriceUpdate.low, price),
        close: price,
      };
    } else {
      update = {
        time: roundedTimestamp,
        high: price,
        low: price,
        open: price,
        close: price,
      };
    }
    const newPriceFeed = {
      ...enginePriceFeed,
      [roundedTimestamp]: update,
    };

    priceUpdateCallback && priceUpdateCallback(update);
    setEnginePriceFeed(newPriceFeed);

    return update;
  }, [
    enginePriceFeed,
    setEnginePriceFeed,
    tradingPairImplementation,
    priceUpdateCallback,
  ]);

  // Interaction functions
  const swap = useCallback(
    async (wallet: string, amount: number, direction: TradingDirection) => {
      if (!tradingPairImplementation) {
        throw new Error("Trading pair implementation not initialized");
      }

      const sourceToken =
        direction === TradingDirection.BUY
          ? tradingPairImplementation.getPairData().quoteToken
          : tradingPairImplementation.getPairData().baseToken;

      const targetToken =
        direction === TradingDirection.BUY
          ? tradingPairImplementation.getPairData().baseToken
          : tradingPairImplementation.getPairData().quoteToken;

      const userSourceTokenBalance = getUserTokenBalance(sourceToken, wallet);

      if (userSourceTokenBalance < amount) {
        throw new Error("Insufficient balance");
      }

      const swapTransaction =
        direction === TradingDirection.BUY
          ? tradingPairImplementation.mockSwapBuy(amount)
          : tradingPairImplementation.mockSwapSell(amount);

      // Update balances
      const userTargetTokenBalance = getUserTokenBalance(targetToken, wallet);

      const newSourceTokenBalance =
        direction === TradingDirection.BUY
          ? userSourceTokenBalance - swapTransaction.amountChangeTokenB
          : userSourceTokenBalance + swapTransaction.amountChangeTokenB;

      const newTargetTokenBalance =
        direction === TradingDirection.BUY
          ? userTargetTokenBalance + swapTransaction.amountChangeTokenA
          : userTargetTokenBalance - swapTransaction.amountChangeTokenA;

      updateUserTokenBalance(sourceToken, wallet, newSourceTokenBalance);
      updateUserTokenBalance(targetToken, wallet, newTargetTokenBalance);

      // Updating the price
      await updatePriceFeed();

      return swapTransaction;
    },
    [
      tradingPairImplementation,
      getUserTokenBalance,
      updateUserTokenBalance,
      updatePriceFeed,
    ]
  );

  return {
    swap,
    engineWalletBalances,
    getUserTokenBalance,
    updateUserTokenBalance,
    tradingPairImplementation,
    enginePriceFeed,
  };
}
