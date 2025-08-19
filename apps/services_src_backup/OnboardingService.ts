interface OnboardingState {
  completed: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  dojoChoice?: string;
}

class OnboardingService {
  private static readonly STORAGE_KEY = 'dojopool_onboarding';

  static isOnboardingComplete(): boolean {
    try {
      const state = this.getOnboardingState();
      return state.completed;
    } catch {
      return false;
    }
  }

  static getOnboardingState(): OnboardingState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading onboarding state:', error);
    }

    // Default state for development
    return {
      completed: true,
      location: {
        latitude: -27.4568,
        longitude: 153.0364,
        address: 'Fortitude Valley, Brisbane',
      },
      dojoChoice: 'jade-tiger',
    };
  }

  static setOnboardingState(state: OnboardingState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  }

  static completeOnboarding(
    location: OnboardingState['location'],
    dojoChoice?: string
  ): void {
    this.setOnboardingState({
      completed: true,
      location,
      dojoChoice,
    });
  }
}

export { OnboardingService };
export type { OnboardingState };
