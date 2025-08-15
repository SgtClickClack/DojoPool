import { DojoService, DojoCandidate } from '.js';

export interface OnboardingState {
  step: 'location' | 'choose-dojo' | 'complete';
  location?: {
    latitude: number;
    longitude: number;
    city: string;
  };
  selectedDojo?: DojoCandidate;
  isComplete: boolean;
}

export class OnboardingService {
  private static STORAGE_KEY = 'dojopool_onboarding_state';

  /**
   * Get current onboarding state
   */
  static getOnboardingState(): OnboardingState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error reading onboarding state:', error);
    }

    return {
      step: 'location',
      isComplete: false
    };
  }

  /**
   * Save onboarding state
   */
  static saveOnboardingState(state: OnboardingState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving onboarding state:', error);
    }
  }

  /**
   * Get user's current location
   */
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number; city: string }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Get city name from coordinates using reverse geocoding
            const city = await this.getCityFromCoordinates(latitude, longitude);
            resolve({ latitude, longitude, city });
          } catch (error) {
            // If reverse geocoding fails, still return coordinates
            resolve({ latitude, longitude, city: 'Unknown Location' });
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Get city name from coordinates using reverse geocoding
   */
  private static async getCityFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const addressComponents = data.results[0].address_components;
        const cityComponent = addressComponents.find(
          (component: any) => 
            component.types.includes('locality') || 
            component.types.includes('administrative_area_level_1')
        );
        return cityComponent ? cityComponent.long_name : 'Unknown Location';
      }
      
      return 'Unknown Location';
    } catch (error) {
      console.error('Error getting city from coordinates:', error);
      return 'Unknown Location';
    }
  }

  /**
   * Complete onboarding by setting home dojo
   */
  static async completeOnboarding(dojoId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await DojoService.setHomeDojo(dojoId);
      
      if (result.success) {
        // Mark onboarding as complete
        const state = this.getOnboardingState();
        state.isComplete = true;
        state.step = 'complete';
        this.saveOnboardingState(state);
      }
      
      return result;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  /**
   * Check if user has completed onboarding
   */
  static isOnboardingComplete(): boolean {
    const state = this.getOnboardingState();
    return state.isComplete;
  }

  /**
   * Reset onboarding state (for testing or re-onboarding)
   */
  static resetOnboarding(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get onboarding progress percentage
   */
  static getProgressPercentage(): number {
    const state = this.getOnboardingState();
    switch (state.step) {
      case 'location':
        return 33;
      case 'choose-dojo':
        return 66;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  }
} 
