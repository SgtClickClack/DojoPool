import { BaseManager } from "./base-manager";

export interface DeviceCapabilities {
  readonly webglVersion: 1 | 2;
  readonly maxTextureSize: number;
  readonly maxViewportDims: number[];
  readonly floatTextureSupport: boolean;
  readonly extensionSupport: Set<string>;
  readonly deviceMemory?: number;
  readonly hardwareConcurrency?: number;
  readonly devicePixelRatio: number;
  readonly isMobile: boolean;
  readonly isLowEndDevice: boolean;
  readonly batteryLevel?: number;
  readonly isLowPowerMode?: boolean;
}

export interface PerformanceProfile {
  readonly qualityLevel: number;
  readonly textureQuality: number;
  readonly maxDrawCalls: number;
  readonly targetFPS: number;
  readonly useFloatTextures: boolean;
  readonly useWebGL2: boolean;
  readonly useMipmaps: boolean;
  readonly useCompressedTextures: boolean;
  readonly useHDR: boolean;
  readonly useAntialiasing: boolean;
}

export class DeviceProfileManager extends BaseManager<DeviceProfileManager> {
  private static readonly DEFAULT_PROFILE: Readonly<PerformanceProfile> = {
    qualityLevel: 0.5,
    textureQuality: 0.75,
    maxDrawCalls: 1000,
    targetFPS: 30,
    useFloatTextures: false,
    useWebGL2: false,
    useMipmaps: true,
    useCompressedTextures: true,
    useHDR: false,
    useAntialiasing: true,
  } as const;

  private static readonly MOBILE_PROFILE: Readonly<PerformanceProfile> = {
    qualityLevel: 0.3,
    textureQuality: 0.5,
    maxDrawCalls: 500,
    targetFPS: 30,
    useFloatTextures: false,
    useWebGL2: true,
    useMipmaps: false,
    useCompressedTextures: true,
    useHDR: false,
    useAntialiasing: false,
  } as const;

  private static readonly HIGH_END_PROFILE: Readonly<PerformanceProfile> = {
    qualityLevel: 0.8,
    textureQuality: 1.0,
    maxDrawCalls: 2000,
    targetFPS: 60,
    useFloatTextures: true,
    useWebGL2: true,
    useMipmaps: true,
    useCompressedTextures: true,
    useHDR: true,
    useAntialiasing: true,
  } as const;

  private readonly capabilities: DeviceCapabilities;
  private currentProfile: PerformanceProfile;
  private batteryManager: any | null = null;

  protected constructor() {
    super();
    this.capabilities = this.detectCapabilities();
    this.currentProfile = this.generateProfile();
    this.setupBatteryMonitoring();
    this.setupDeviceMonitoring();
  }

  private async setupBatteryMonitoring(): Promise<void> {
    try {
      if ("getBattery" in navigator) {
        this.batteryManager = await (navigator as any).getBattery();
        this.batteryManager.addEventListener(
          "levelchange",
          this.handleBatteryChange,
        );
        this.batteryManager.addEventListener(
          "chargingchange",
          this.handleBatteryChange,
        );
      }
    } catch (error) {
      console.warn(
        "Battery monitoring not available:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private setupDeviceMonitoring(): void {
    // Monitor device pixel ratio changes
    window.matchMedia("(resolution: 1dppx)").addListener(() => {
      this.capabilities.devicePixelRatio = window.devicePixelRatio;
      this.updateProfile();
    });

    // Monitor device memory changes if available
    if ("memory" in navigator) {
      const memoryInfo = (navigator as any).deviceMemory;
      Object.defineProperty(navigator, "deviceMemory", {
        get: () => {
          this.updateProfile();
          return memoryInfo;
        },
      });
    }
  }

  private handleBatteryChange = (): void => {
    if (this.batteryManager) {
      const isLowPower =
        this.batteryManager.level <= 0.2 && !this.batteryManager.charging;
      if (isLowPower !== this.capabilities.isLowPowerMode) {
        this.capabilities.isLowPowerMode = isLowPower;
        this.updateProfile();
      }
    }
  };

  private detectCapabilities(): DeviceCapabilities {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

    if (!gl) {
      throw new Error("WebGL not supported");
    }

    const extensions = new Set(gl.getSupportedExtensions() || []);
    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      ("maxTouchPoints" in navigator && navigator.maxTouchPoints > 0);

    const deviceMemory = (navigator as any).deviceMemory;
    const hardwareConcurrency = navigator.hardwareConcurrency;

    const isLowEndDevice =
      (deviceMemory && deviceMemory <= 4) ||
      (hardwareConcurrency && hardwareConcurrency <= 4) ||
      gl.getParameter(gl.MAX_TEXTURE_SIZE) <= 4096;

    return {
      webglVersion: gl instanceof WebGL2RenderingContext ? 2 : 1,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      floatTextureSupport: extensions.has("OES_texture_float"),
      extensionSupport: extensions,
      deviceMemory,
      hardwareConcurrency,
      devicePixelRatio: window.devicePixelRatio,
      isMobile,
      isLowEndDevice,
      batteryLevel: undefined,
      isLowPowerMode: false,
    };
  }

  private generateProfile(): PerformanceProfile {
    const { capabilities } = this;

    // Start with appropriate base profile
    let profile: PerformanceProfile;
    if (capabilities.isMobile || capabilities.isLowEndDevice) {
      profile = { ...DeviceProfileManager.MOBILE_PROFILE };
    } else if (this.isHighEndDevice()) {
      profile = { ...DeviceProfileManager.HIGH_END_PROFILE };
    } else {
      profile = { ...DeviceProfileManager.DEFAULT_PROFILE };
    }

    // Adjust based on device capabilities
    return {
      ...profile,
      useWebGL2: capabilities.webglVersion === 2,
      useFloatTextures:
        capabilities.floatTextureSupport && !capabilities.isLowEndDevice,
      useHDR: capabilities.floatTextureSupport && this.isHighEndDevice(),
      useAntialiasing: !capabilities.isMobile && !capabilities.isLowEndDevice,
      targetFPS: this.getTargetFPS(),
    };
  }

  private isHighEndDevice(): boolean {
    const { capabilities } = this;
    return (
      !capabilities.isMobile &&
      !capabilities.isLowEndDevice &&
      capabilities.deviceMemory >= 8 &&
      capabilities.hardwareConcurrency >= 8 &&
      capabilities.maxTextureSize >= 8192
    );
  }

  private getTargetFPS(): number {
    const { capabilities } = this;
    if (capabilities.isLowPowerMode) {
      return 30;
    }
    if (this.isHighEndDevice()) {
      return 60;
    }
    return capabilities.isMobile ? 30 : 45;
  }

  private updateProfile(): void {
    this.currentProfile = this.generateProfile();
  }

  public getProfile(): Readonly<PerformanceProfile> {
    return this.currentProfile;
  }

  public getCapabilities(): Readonly<DeviceCapabilities> {
    return this.capabilities;
  }

  public isMobileDevice(): boolean {
    return this.capabilities.isMobile;
  }

  public isLowEndDevice(): boolean {
    return this.capabilities.isLowEndDevice;
  }

  public override cleanup(): void {
    if (this.batteryManager) {
      this.batteryManager.removeEventListener(
        "levelchange",
        this.handleBatteryChange,
      );
      this.batteryManager.removeEventListener(
        "chargingchange",
        this.handleBatteryChange,
      );
    }
    this.onCleanup();
  }
}
