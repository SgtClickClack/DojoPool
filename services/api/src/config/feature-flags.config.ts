import { Injectable } from '@nestjs/common';
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

  constructor(private configService: ConfigService) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    this.flags = {
      // Simulation and background tasks - disabled by default in production
      ENABLE_SIMULATION:
        this.configService.get<string>('ENABLE_SIMULATION') === 'true',
      SIMULATION_FEATURE_FLAG:
        this.configService.get<string>('SIMULATION_FEATURE_FLAG') === 'true',
      BACKGROUND_BROADCASTING:
        this.configService.get<string>('BACKGROUND_BROADCASTING') === 'true',

      // AI and game features
      AI_COMMENTARY:
        this.configService.get<string>('AI_COMMENTARY_ENABLED') === 'true',
      AI_REFEREE:
        this.configService.get<string>('AI_REFEREE_ENABLED') === 'true',
      REAL_TIME_TRACKING:
        this.configService.get<string>('REAL_TIME_TRACKING_ENABLED') === 'true',
      TERRITORY_CONTROL:
        this.configService.get<string>('TERRITORY_CONTROL_ENABLED') === 'true',
      CHALLENGE_SYSTEM:
        this.configService.get<string>('CHALLENGE_SYSTEM_ENABLED') === 'true',
      MATCH_REPLAY:
        this.configService.get<string>('MATCH_REPLAY_ENABLED') === 'true',
      ANALYTICS: this.configService.get<string>('ANALYTICS_ENABLED') === 'true',
    };

    // Override flags for production safety
    if (isProduction) {
      this.flags.ENABLE_SIMULATION =
        this.flags.ENABLE_SIMULATION &&
        this.configService.get<string>('ENABLE_SIMULATION') === 'true';
      this.flags.SIMULATION_FEATURE_FLAG =
        this.flags.SIMULATION_FEATURE_FLAG &&
        this.configService.get<string>('SIMULATION_FEATURE_FLAG') === 'true';
      this.flags.BACKGROUND_BROADCASTING =
        this.flags.BACKGROUND_BROADCASTING &&
        this.configService.get<string>('BACKGROUND_BROADCASTING') === 'true';
    }
  }

  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  isSimulationEnabled(): boolean {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (isProduction) {
      // In production, require explicit enablement
      return this.flags.ENABLE_SIMULATION && this.flags.SIMULATION_FEATURE_FLAG;
    }

    // In development, allow simulation by default
    return this.flags.ENABLE_SIMULATION || this.flags.SIMULATION_FEATURE_FLAG;
  }

  isBackgroundBroadcastingEnabled(): boolean {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (isProduction) {
      // In production, require explicit enablement
      return (
        this.flags.BACKGROUND_BROADCASTING &&
        this.configService.get<string>('BACKGROUND_BROADCASTING') === 'true'
      );
    }

    // In development, allow background broadcasting by default
    return this.flags.BACKGROUND_BROADCASTING;
  }

  validateProductionSettings(): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

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
