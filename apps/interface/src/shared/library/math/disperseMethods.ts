export function generateGaussianRandom(
  mean: number,
  standardDeviation: number
): number {
  const u = Math.random();
  const v = Math.random();
  return (
    mean +
    standardDeviation *
      Math.sqrt(-2.0 * Math.log(u)) *
      Math.cos(2.0 * Math.PI * v)
  );
}

export function uniformDisperseWithStandardDeviation(
  amount: number,
  targetIds: string[],
  standardDeviation: number
): { [key: string]: number } {
  const n = targetIds.length;
  const mean = amount / n;
  const distributions: { [key: string]: number } = {};

  let total = 0;

  for (let i = 0; i < n; i++) {
    const randomGaussian = Math.abs(
      generateGaussianRandom(mean, standardDeviation)
    );
    distributions[targetIds[i]] = randomGaussian;
    total += randomGaussian;
  }

  // Adjust the distributions to ensure the total equals the amount
  const adjustmentFactor = amount / total;
  Object.keys(distributions).forEach((key) => {
    distributions[key] *= adjustmentFactor;
  });

  console.log(
    "Total amount:",
    Object.values(distributions).reduce((acc, val) => acc + val, 0)
  );

  return distributions;
}
