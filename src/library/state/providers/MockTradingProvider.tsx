import MockTradingPairImplementation from "@/library/domain/trading/MockTradingPairImplementation";
import { TradingDirection } from "@/library/domain/trading/types/TradingTransaction";
import { WalletTokensBalanceMap } from "@/library/domain/trading/types/WalletBalances";
import useMockTradingEngine, {
  PriceUpdate,
} from "@/library/hooks/useMockTradingEngine";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface MockTradingEngineContextProps {
  swap: (
    wallet: string,
    amount: number,
    direction: TradingDirection
  ) => Promise<any>;
  engineWalletBalances: WalletTokensBalanceMap;
  getUserTokenBalance: (token: string, wallet: string) => number;
  updateUserTokenBalance: (
    token: string,
    wallet: string,
    newBalance: number
  ) => void;
  tradingPairImplementation: MockTradingPairImplementation | null;
  enginePriceFeed: {
    [timestamp: number]: PriceUpdate;
  };
  lastUpdate: PriceUpdate | null;
}

const MockTradingEngineContext = createContext<
  MockTradingEngineContextProps | undefined
>(undefined);

// Crea el Provider
export const MockTradingEngineProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [lastUpdate, setLastUpdate] = useState<PriceUpdate | null>(null);

  const updateEventHandler = useCallback(
    (update: PriceUpdate) => {
      if (lastUpdate && lastUpdate.time > update.time) {
        return;
      }

      setLastUpdate(update);
    },
    [lastUpdate]
  );

  const tradingEngine = useMockTradingEngine(
    undefined,
    undefined,
    undefined,
    undefined,
    updateEventHandler
  );

  return (
    <MockTradingEngineContext.Provider
      value={{
        ...tradingEngine,
        lastUpdate,
      }}
    >
      {children}
    </MockTradingEngineContext.Provider>
  );
};

// Hook para usar el contexto
export const useCurrentMockTradingEngine = () => {
  const context = useContext(MockTradingEngineContext);
  if (!context) {
    throw new Error(
      "useTradingEngine must be used within a TradingEngineProvider"
    );
  }
  return context;
};
