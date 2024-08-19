import { uniformDisperseWithStandardDeviation } from "@/shared/library/math/disperseMethods";
import { TradingDirection } from "../types/TradingTransaction";
import { WalletTokensBalanceMap } from "../types/WalletBalances";

export interface ScenarioExecutionStep {
  t: number;
  direction: TradingDirection;
  amountPercentage: number;
  wallet: string;
}

export interface MockScenario {
  initialBalances: WalletTokensBalanceMap;
  initialReserves: {
    reserve0: number;
    reserve1: number;
  };
  steps: Record<number, ScenarioExecutionStep[]>; // The number is the t of the simulation, using redundancy
}

const ROUND_TO = 1000;

export function generateMockScenario({
  initialReserves,
  amountBaseTokenInWallets,
  amountQuoteTokenInWallets,
  nWallets = 100,
  nSteps = 100,
  tDuration = 100000, // 100 seconds

  tokenA = "MOCKPACO",
  tokenB = "MOCKUSDT",
}: {
  initialReserves: {
    reserve0: number;
    reserve1: number;
  };
  amountBaseTokenInWallets: number;
  amountQuoteTokenInWallets: number;
  nWallets?: number;
  nSteps?: number;
  tDuration?: number;
  tokenA?: string;
  tokenB?: string;
}) {
  const mockWallets = Array.from(
    { length: nWallets },
    (_, i) => `0xscenariowallet${i}`
  );

  const initialBalances: WalletTokensBalanceMap = {};

  const tokenABalances = uniformDisperseWithStandardDeviation(
    amountBaseTokenInWallets,
    mockWallets,
    10
  );

  const tokenBBalances = uniformDisperseWithStandardDeviation(
    amountQuoteTokenInWallets,
    mockWallets,
    10
  );

  if (!initialBalances[tokenA]) {
    initialBalances[tokenA] = {};
  }
  Object.keys(tokenABalances).forEach((wallet) => {
    initialBalances[tokenA][wallet] = tokenABalances[wallet];
  });

  if (!initialBalances[tokenB]) {
    initialBalances[tokenB] = {};
  }
  Object.keys(tokenBBalances).forEach((wallet) => {
    initialBalances[tokenB][wallet] = tokenBBalances[wallet];
  });

  const steps: Record<number, ScenarioExecutionStep[]> = {};

  // Generate random steps
  for (let i = 0; i < nSteps; i++) {
    // Generate a number between 0 and tDuration and round to ROUND_TO
    const t = Math.floor(Math.random() * tDuration);
    const roundedT = Math.floor(t / ROUND_TO) * ROUND_TO;
    const direction =
      Math.random() > 0.5 ? TradingDirection.BUY : TradingDirection.SELL;
    const amountPercentage = Math.floor(Math.random() * 100) / 100;
    const wallet = mockWallets[Math.floor(Math.random() * mockWallets.length)];

    if (!steps[roundedT]) {
      steps[roundedT] = [] as ScenarioExecutionStep[];
    }

    steps[roundedT] = [
      ...steps[roundedT],
      {
        t,
        direction,
        amountPercentage,
        wallet,
      },
    ];
  }

  return {
    initialBalances,
    initialReserves,
    steps,
  } as MockScenario;
}
