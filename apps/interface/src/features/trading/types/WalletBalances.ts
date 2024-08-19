export type WalletTokensBalanceMap = {
  [token: string]: {
    [address: string]: number;
  };
};
