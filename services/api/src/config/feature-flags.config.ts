import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface FeatureFlags {
  // Simulation and background tasks
  ENABLE_SIMULATION: boolean;
  SIMULATION_FEATURE_FLAG: boolean;
  BACKGROUND_BROADCASTING: boolean;
  AI_COMMENTARY: boolean;
  AI_REFEREE: boolean;
  REAL_TIME_TRACKING: boolean;
  TERRITORY_CONTROL: boolean;
  CHALLENGE_SYSTEM: boolean;
  MATCH_REPLAY: boolean;
  ANALYTICS: boolean;
}

@Injectable()
export class FeatureFlagsConfig {
  private readonly flags: FeatureFlags;

  constructor(@Optional() private configService?: ConfigService) {
    const get = this.configService?.get.bind(this.configService) as
      | (<T = any>(key: string) => T | undefined)
      | undefined;
    const isProduction = (get?.<string>('NODE_ENV') as string) === 'production';

    this.flags = {
      // Simulation and background tasks - disabled by default in production
      ENABLE_SIMULATION:
        (get?.<string>('ENABLE_SIMULATION') as string) === 'true',
      SIMULATION_FEATURE_FLAG:
        (get?.<string>('SIMULATION_FEATURE_FLAG') as string) === 'true',
      BACKGROUND_BROADCASTING:
        (get?.<string>('BACKGROUND_BROADCASTING') as string) === 'true',

      // AI and game features
      AI_COMMENTARY:
        (get?.<string>('AI_COMMENTARY_ENABLED') as string) === 'true',
      AI_REFEREE: (get?.<string>('AI_REFEREE_ENABLED') as string) === 'true',
      REAL_TIME_TRACKING:
        (get?.<string>('REAL_TIME_TRACKING_ENABLED') as string) === 'true',
      TERRITORY_CONTROL:
        (get?.<string>('TERRITORY_CONTROL_ENABLED') as string) === 'true',
      CHALLENGE_SYSTEM:
        (get?.<string>('CHALLENGE_SYSTEM_ENABLED') as string) === 'true',
      MATCH_REPLAY:
        (get?.<string>('MATCH_REPLAY_ENABLED') as string) === 'true',
      ANALYTICS: (get?.<string>('ANALYTICS_ENABLED') as string) === 'true',
    };

    // Override flags for production safety
    if (isProduction) {
      this.flags.ENABLE_SIMULATION =
        this.flags.ENABLE_SIMULATION &&
        (get?.<string>('ENABLE_SIMULATION') as string) === 'true';
      this.flags.SIMULATION_FEATURE_FLAG =
        this.flags.SIMULATION_FEATURE_FLAG &&
        (get?.<string>('SIMULATION_FEATURE_FLAG') as string) === 'true';
      this.flags.BACKGROUND_BROADCASTING =
        this.flags.BACKGROUND_BROADCASTING &&
        (get?.<string>('BACKGROUND_BROADCASTING') as string) === 'true';
    }
  }

  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  isSimulationEnabled(): boolean {
    const get = this.configService?.get.bind(this.configService) as
      | (<T = any>(key: string) => T | undefined)
      | undefined;
    const isProduction = (get?.<string>('NODE_ENV') as string) === 'production';

    if (isProduction) {
      // In production, require explicit enablement
      return this.flags.ENABLE_SIMULATION && this.flags.SIMULATION_FEATURE_FLAG;
    }

    // In development, allow simulation by default
    return this.flags.ENABLE_SIMULATION || this.flags.SIMULATION_FEATURE_FLAG;
  }

  isBackgroundBroadcastingEnabled(): boolean {
    const get = this.configService?.get.bind(this.configService) as
      | (<T = any>(key: string) => T | undefined)
      | undefined;
    const isProduction = (get?.<string>('NODE_ENV') as string) === 'production';

    if (isProduction) {
      // In production, require explicit enablement
      return (
        this.flags.BACKGROUND_BROADCASTING &&
        (get?.<string>('BACKGROUND_BROADCASTING') as string) === 'true'
      );
    }

    // In development, allow background broadcasting by default
    return this.flags.BACKGROUND_BROADCASTING;
  }

  validateProductionSettings(): void {
    const get = this.configService?.get.bind(this.configService) as
      | (<T = any>(key: string) => T | undefined)
      | undefined;
    const isProduction = (get?.<string>('NODE_ENV') as string) === 'production';

    if (isProduction) {
      const warnings: string[] = [];

      if (this.flags.ENABLE_SIMULATION) {
        warnings.push('ENABLE_SIMULATION is enabled in production');
      }

      if (this.flags.SIMULATION_FEATURE_FLAG) {
        warnings.push('SIMULATION_FEATURE_FLAG is enabled in production');
      }

      if (this.flags.BACKGROUND_BROADCASTING) {
        warnings.push('BACKGROUND_BROADCASTING is enabled in production');
      }

      if (warnings.length > 0) {
        console.warn('⚠️ Production warnings:', warnings.join(', '));
      }
    }
  }
}
