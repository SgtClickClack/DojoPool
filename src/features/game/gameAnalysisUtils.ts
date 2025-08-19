export function prepareBallDistributionData(
  ballDistribution: Record<number, number>
) {
  return Object.entries(ballDistribution).map(([ball, count]) => ({
    name: `Ball ${ball}`,
    value: count,
  }));
}
