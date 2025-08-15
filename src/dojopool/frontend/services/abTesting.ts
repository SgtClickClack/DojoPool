// Minimal abTestingService for ABTestResults compatibility

export const abTestingService = {
  getTestResults(testId: string) {
    // TODO: Replace with real data fetching logic (API call, localStorage, etc.)
    // This is a stub to allow the build to pass
    return {
      testName: `Test ${testId}`,
      variants: {
        A: { users: 50, conversions: 10 },
        B: { users: 45, conversions: 12 },
      },
    };
  },
  // Add more methods as needed for your app
};
