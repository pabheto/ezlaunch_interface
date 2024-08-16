import { WalletTokensBalanceMap } from "@/library/domain/trading/types/WalletBalances";
import { useMemo } from "react";

export default function WalletsDisplay({
  walletsTokenMap,
}: {
  walletsTokenMap: WalletTokensBalanceMap;
}) {
  const walletBalancesArray = useMemo<
    {
      token: string;
      balanceMap: { address: string; balance: number }[];
    }[]
  >(() => {
    return Object.keys(walletsTokenMap).reduce<
      {
        token: string;
        balanceMap: { address: string; balance: number }[];
      }[]
    >((acc, token) => {
      const balanceMap = Object.keys(walletsTokenMap[token]).map((address) => {
        return {
          address,
          balance: walletsTokenMap[token][address],
        };
      });
      acc.push({
        token,
        balanceMap,
      });
      return acc;
    }, []);
  }, [walletsTokenMap]);

  return (
    <>
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
    </>
  );
}
