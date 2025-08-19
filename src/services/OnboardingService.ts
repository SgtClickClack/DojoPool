const OnboardingService = {
  chooseDojo: async (dojoId: string) => {
    return { status: 'ok', dojoId } as const;
  },
  getCurrentLocation: async () => {
    return { latitude: -27.4568, longitude: 153.0364, city: 'Brisbane' };
  },
  getOnboardingState: () => {
    return { step: 'choose-dojo', location: null };
  },
  saveOnboardingState: (state: any) => {
    console.log('Saving onboarding state:', state);
  },
};

export default OnboardingService;
export { OnboardingService };
