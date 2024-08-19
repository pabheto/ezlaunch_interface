import { useCallback, useEffect, useRef, useState } from "react";
import MockTradingPairImplementation from "../MockTradingPairImplementation";
import { TradingPair } from "@/features/trading/types/TradingPair";
import { TradingDirection } from "@/features/trading/types/TradingTransaction";
import { WalletTokensBalanceMap } from "@/features/trading/types/WalletBalances";
import { PriceUpdate } from "../types/PriceUpdate";
import { MockScenario, ScenarioExecutionStep } from "../mockEngine/scenario";

const MOCK_PAIR_DATA: TradingPair = {
  pairAddress: "0xmock",
  baseToken: "MOCKPACO",
  quoteToken: "MOCKUSDT",
};

export default function useMockTradingEngine(
  tradingPairData: TradingPair = MOCK_PAIR_DATA,
  initialAmountA: number = 1000,
  initialAmountB: number = 1000,
  timeframe: number = 60, // Timeframe in seconds
  priceUpdateCallback?: (u: PriceUpdate) => any
) {
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

  const [engineWalletBalances, setEngineWalletBalances] =
    useState<WalletTokensBalanceMap>({});

  const engineWalletBalancesRef = useRef(engineWalletBalances);

  useEffect(() => {
    engineWalletBalancesRef.current = engineWalletBalances;
  }, [engineWalletBalances]);

  useEffect(() => {
    const impl = new MockTradingPairImplementation(tradingPairData);
    impl.mockInitialize(initialAmountA, initialAmountB);

    setTradingPairImplementation(impl);
  }, [
    initialAmountA,
    initialAmountB,
    setTradingPairImplementation,
    tradingPairData,
  ]);

  const getUserTokenBalance = useCallback(
    (token: string, wallet: string) => {
      const tokenBalances = engineWalletBalancesRef.current[token];
      if (tokenBalances) {
        const userBalance = tokenBalances[wallet];
        return userBalance ?? 0;
      }
      return 0;
    },
    [engineWalletBalancesRef]
  );

  const [currentSimulation, setCurrentSimulation] =
    useState<MockScenario | null>(null);

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
    [setEngineWalletBalances]
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
    tradingPairImplementation,
    timeframe,
    enginePriceFeed,
    priceUpdateCallback,
  ]);

  // Interaction functions
  const swap = useCallback(
    async (wallet: string, amount: number, direction: TradingDirection) => {
      if (!tradingPairImplementation) {
        throw new Error("Trading pair implementation not initialized");
      }

      const _tradingPairImplementation = tradingPairImplementation.clone();

      const sourceToken = _tradingPairImplementation.getPairData().baseToken;
      const targetToken = _tradingPairImplementation.getPairData().quoteToken;

      const userSourceTokenBalance = getUserTokenBalance(sourceToken, wallet);
      const userTargetTokenBalance = getUserTokenBalance(targetToken, wallet);

      if (direction === TradingDirection.BUY) {
        if (userTargetTokenBalance < amount) {
          throw new Error("Insufficient balance");
        }
      } else {
        if (userSourceTokenBalance < amount) {
          throw new Error("Insufficient balance");
        }
      }

      const swapTransaction =
        direction === TradingDirection.BUY
          ? _tradingPairImplementation.mockSwapBuy(amount)
          : _tradingPairImplementation.mockSwapSell(amount);

      // Update balances

      const newSourceTokenBalance =
        direction === TradingDirection.BUY
          ? userSourceTokenBalance + swapTransaction.amountChangeTokenA
          : userSourceTokenBalance - swapTransaction.amountChangeTokenA;

      const newTargetTokenBalance =
        direction === TradingDirection.BUY
          ? userTargetTokenBalance - swapTransaction.amountChangeTokenB
          : userTargetTokenBalance + swapTransaction.amountChangeTokenB;

      updateUserTokenBalance(sourceToken, wallet, newSourceTokenBalance);
      updateUserTokenBalance(targetToken, wallet, newTargetTokenBalance);

      // Updating the price
      await updatePriceFeed();

      // Triggering update on pair impl
      setTradingPairImplementation(_tradingPairImplementation);

      return swapTransaction;
    },
    [
      getUserTokenBalance,
      updateUserTokenBalance,
      updatePriceFeed,
      tradingPairImplementation,
      setTradingPairImplementation,
    ]
  );

  const executeScenarioStep = useCallback(
    async (step: ScenarioExecutionStep) => {
      if (!tradingPairImplementation) {
        throw new Error("Trading pair implementation not initialized");
      }

      console.log("Engine wallet balances", engineWalletBalancesRef.current);

      const wallet = step.wallet;
      const amountPercentage = step.amountPercentage;
      const direction = step.direction;

      const targetToken =
        direction === TradingDirection.BUY
          ? tradingPairImplementation.getPairData().quoteToken
          : tradingPairImplementation.getPairData().baseToken;
      const currentBalance = getUserTokenBalance(targetToken, wallet);
      const balancePercentaged = currentBalance * amountPercentage;
      console.log(
        "Executing ",
        wallet,
        direction,
        amountPercentage,
        balancePercentaged
      );

      await swap(wallet, balancePercentaged, direction); // Ejecuta la función swap
    },
    [
      getUserTokenBalance,
      swap,
      tradingPairImplementation,
      engineWalletBalancesRef,
    ]
  );

  const loadAndExecuteScenario = useCallback(
    async (scenario: MockScenario) => {
      if (!tradingPairImplementation) {
        throw new Error("Trading pair implementation not initialized");
      }

      const _tradingPairImplementation = tradingPairImplementation.clone();
      _tradingPairImplementation.mockUpdateReserves(
        scenario.initialReserves.reserve0,
        scenario.initialReserves.reserve1
      );
      setEngineWalletBalances(scenario.initialBalances);

      setTradingPairImplementation(_tradingPairImplementation);

      const stepsTs = Object.keys(scenario.steps)
        .map((ts) => parseInt(ts))
        .sort((a, b) => {
          return a - b;
        });

      let previousTime = 0;

      console.log("THe steps ", stepsTs);

      for (let i = 0; i < stepsTs.length; i++) {
        const currentTime = stepsTs[i];
        console.log("New time ", currentTime);
        const delay = currentTime - previousTime; // Calcula la diferencia con el tiempo anterior

        await new Promise((resolve) => setTimeout(resolve, delay)); // Espera la diferencia en segundos

        console.log(`Executing action at ${currentTime} seconds`); // Acción que deseas ejecutar

        const steps = scenario.steps[currentTime];

        for (let j = 0; j < steps.length; j++) {
          const step = steps[j];

          await executeScenarioStep(step); // Ejecuta la función executeScenario
        }

        previousTime = currentTime; // Actualiza el tiempo anterior al tiempo actual
      }
    },
    [executeScenarioStep, tradingPairImplementation]
  );

  return {
    swap,
    engineWalletBalances,
    getUserTokenBalance,
    updateUserTokenBalance,
    tradingPairImplementation,
    enginePriceFeed,
    loadAndExecuteScenario,
  };
}
