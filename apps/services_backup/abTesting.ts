// Temporarily disabled - stub service for A/B testing
export const abTestingService = {
  getVariantForUser: (testId: string, userId: string) => {
    console.log('A/B testing temporarily disabled', { testId, userId });
    return null;
  },
  trackMetric: (testId: string, userId: string, metricName: string, value: number) => {
    console.log('A/B testing metric tracking temporarily disabled', { testId, userId, metricName, value });
  }
};
