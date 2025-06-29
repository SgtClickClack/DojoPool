export interface HardwareDevice {
  id: string;
  venueId: string;
  tableId?: string;
  type: HardwareDeviceType;
  model: string;
  status: DeviceStatus;
  ipAddress?: string;
  macAddress?: string;
  firmwareVersion: string;
  lastSeen: Date;
  location: DeviceLocation;
  capabilities: DeviceCapability[];
  configuration: DeviceConfiguration;
  health: DeviceHealth;
}

export enum HardwareDeviceType {
  CAMERA = 'camera',
  SENSOR = 'sensor',
  PROCESSOR = 'processor',
  DISPLAY = 'display',
  NETWORK = 'network',
  AUDIO = 'audio',
  LIGHTING = 'lighting'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error',
  CALIBRATING = 'calibrating'
}

export interface DeviceLocation {
  x: number;
  y: number;
  z: number;
  orientation: number;
  room: string;
  table?: string;
}

export interface DeviceCapability {
  name: string;
  version: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface DeviceConfiguration {
  resolution?: string;
  frameRate?: number;
  sensitivity?: number;
  threshold?: number;
  calibration?: CalibrationData;
  network?: NetworkConfig;
  storage?: StorageConfig;
}

export interface CalibrationData {
  lastCalibrated: Date;
  accuracy: number;
  parameters: Record<string, number>;
  referencePoints: CalibrationPoint[];
}

export interface CalibrationPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  expected: number;
  actual: number;
  deviation: number;
}

export interface NetworkConfig {
  ipAddress: string;
  subnet: string;
  gateway: string;
  dns: string[];
  bandwidth: number;
  latency: number;
}

export interface StorageConfig {
  totalSpace: number;
  usedSpace: number;
  retentionDays: number;
  compression: boolean;
  encryption: boolean;
}

export interface DeviceHealth {
  temperature: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  uptime: number;
  lastMaintenance: Date;
  alerts: DeviceAlert[];
}

export interface DeviceAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolutionTime?: Date;
}

export enum AlertType {
  TEMPERATURE_HIGH = 'temperature_high',
  DISK_FULL = 'disk_full',
  NETWORK_DOWN = 'network_down',
  CALIBRATION_NEEDED = 'calibration_needed',
  FIRMWARE_UPDATE = 'firmware_update',
  HARDWARE_FAILURE = 'hardware_failure'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface SensorData {
  deviceId: string;
  timestamp: Date;
  type: SensorType;
  values: Record<string, number>;
  quality: number;
  location: DeviceLocation;
}

export enum SensorType {
  MOTION = 'motion',
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  LIGHT = 'light',
  SOUND = 'sound',
  PRESSURE = 'pressure',
  ACCELEROMETER = 'accelerometer',
  GYROSCOPE = 'gyroscope'
}

export interface CameraData {
  deviceId: string;
  timestamp: Date;
  frame: string; // Base64 encoded image
  metadata: CameraMetadata;
  analysis: CameraAnalysis;
}

export interface CameraMetadata {
  resolution: string;
  frameRate: number;
  exposure: number;
  gain: number;
  focus: number;
  whiteBalance: number;
  timestamp: Date;
}

export interface CameraAnalysis {
  objects: DetectedObject[];
  motion: MotionData;
  quality: ImageQuality;
  processing: ProcessingMetrics;
}

export interface DetectedObject {
  id: string;
  type: ObjectType;
  confidence: number;
  boundingBox: BoundingBox;
  properties: Record<string, any>;
}

export enum ObjectType {
  BALL = 'ball',
  CUE = 'cue',
  PLAYER = 'player',
  TABLE = 'table',
  POCKET = 'pocket',
  OBSTACLE = 'obstacle'
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MotionData {
  detected: boolean;
  intensity: number;
  direction: MotionDirection;
  velocity: number;
  regions: MotionRegion[];
}

export enum MotionDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  FORWARD = 'forward',
  BACKWARD = 'backward'
}

export interface MotionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

export interface ImageQuality {
  sharpness: number;
  contrast: number;
  brightness: number;
  noise: number;
  overall: number;
}

export interface ProcessingMetrics {
  processingTime: number;
  fps: number;
  latency: number;
  throughput: number;
}

export interface HardwareEvent {
  id: string;
  deviceId: string;
  type: HardwareEventType;
  timestamp: Date;
  data: any;
  severity: AlertSeverity;
}

export enum HardwareEventType {
  DEVICE_ONLINE = 'device_online',
  DEVICE_OFFLINE = 'device_offline',
  SENSOR_READING = 'sensor_reading',
  CAMERA_FRAME = 'camera_frame',
  ALERT_TRIGGERED = 'alert_triggered',
  ALERT_RESOLVED = 'alert_resolved',
  CALIBRATION_STARTED = 'calibration_started',
  CALIBRATION_COMPLETED = 'calibration_completed',
  MAINTENANCE_SCHEDULED = 'maintenance_scheduled',
  MAINTENANCE_COMPLETED = 'maintenance_completed'
}

export interface VenueHardwareStatus {
  venueId: string;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  maintenanceDevices: number;
  errorDevices: number;
  lastUpdate: Date;
  alerts: DeviceAlert[];
  performance: HardwarePerformance;
}

export interface HardwarePerformance {
  averageLatency: number;
  averageThroughput: number;
  uptime: number;
  errorRate: number;
  calibrationAccuracy: number;
}

class VenueHardwareService {
  private devices: Map<string, HardwareDevice> = new Map();
  private sensorData: Map<string, SensorData[]> = new Map();
  private cameraData: Map<string, CameraData[]> = new Map();
  private events: HardwareEvent[] = [];
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initializeMockDevices();
    this.startDataCollection();
  }

  private initializeMockDevices(): void {
    // Mock camera devices
    const cameraDevice: HardwareDevice = {
      id: 'camera_001',
      venueId: 'venue_001',
      tableId: 'table_001',
      type: HardwareDeviceType.CAMERA,
      model: 'DojoVision Pro 4K',
      status: DeviceStatus.ONLINE,
      ipAddress: '192.168.1.100',
      macAddress: '00:11:22:33:44:55',
      firmwareVersion: '2.1.0',
      lastSeen: new Date(),
      location: {
        x: 0,
        y: 0,
        z: 3.5,
        orientation: 0,
        room: 'Main Hall',
        table: 'table_001'
      },
      capabilities: [
        {
          name: 'motion_detection',
          version: '1.0',
          enabled: true,
          parameters: { sensitivity: 0.8, threshold: 0.1 }
        },
        {
          name: 'object_tracking',
          version: '2.0',
          enabled: true,
          parameters: { max_objects: 10, confidence_threshold: 0.7 }
        },
        {
          name: 'ball_tracking',
          version: '1.5',
          enabled: true,
          parameters: { ball_size_range: [0.05, 0.15], tracking_speed: 'fast' }
        }
      ],
      configuration: {
        resolution: '4K',
        frameRate: 60,
        sensitivity: 0.8,
        threshold: 0.1,
        calibration: {
          lastCalibrated: new Date(),
          accuracy: 0.95,
          parameters: { focal_length: 35, distortion: 0.001 },
          referencePoints: []
        },
        network: {
          ipAddress: '192.168.1.100',
          subnet: '255.255.255.0',
          gateway: '192.168.1.1',
          dns: ['8.8.8.8', '8.8.4.4'],
          bandwidth: 1000,
          latency: 5
        },
        storage: {
          totalSpace: 1000000000000, // 1TB
          usedSpace: 250000000000, // 250GB
          retentionDays: 30,
          compression: true,
          encryption: true
        }
      },
      health: {
        temperature: 45,
        cpuUsage: 25,
        memoryUsage: 40,
        diskUsage: 25,
        networkLatency: 5,
        uptime: 86400, // 24 hours
        lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        alerts: []
      }
    };

    // Mock sensor devices
    const sensorDevice: HardwareDevice = {
      id: 'sensor_001',
      venueId: 'venue_001',
      tableId: 'table_001',
      type: HardwareDeviceType.SENSOR,
      model: 'DojoSense Ultra',
      status: DeviceStatus.ONLINE,
      ipAddress: '192.168.1.101',
      macAddress: '00:11:22:33:44:56',
      firmwareVersion: '1.8.2',
      lastSeen: new Date(),
      location: {
        x: 1.5,
        y: 0.8,
        z: 2.0,
        orientation: 90,
        room: 'Main Hall',
        table: 'table_001'
      },
      capabilities: [
        {
          name: 'motion_detection',
          version: '1.0',
          enabled: true,
          parameters: { range: 5, sensitivity: 0.9 }
        },
        {
          name: 'environmental_monitoring',
          version: '1.2',
          enabled: true,
          parameters: { temperature_range: [-10, 50], humidity_range: [0, 100] }
        }
      ],
      configuration: {
        sensitivity: 0.9,
        threshold: 0.05,
        calibration: {
          lastCalibrated: new Date(),
          accuracy: 0.98,
          parameters: { offset: 0.1, scale: 1.0 },
          referencePoints: []
        },
        network: {
          ipAddress: '192.168.1.101',
          subnet: '255.255.255.0',
          gateway: '192.168.1.1',
          dns: ['8.8.8.8', '8.8.4.4'],
          bandwidth: 100,
          latency: 2
        },
        storage: {
          totalSpace: 10000000000, // 10GB
          usedSpace: 2000000000, // 2GB
          retentionDays: 7,
          compression: false,
          encryption: false
        }
      },
      health: {
        temperature: 35,
        cpuUsage: 10,
        memoryUsage: 20,
        diskUsage: 20,
        networkLatency: 2,
        uptime: 172800, // 48 hours
        lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        alerts: []
      }
    };

    this.devices.set(cameraDevice.id, cameraDevice);
    this.devices.set(sensorDevice.id, sensorDevice);
  }

  private startDataCollection(): void {
    // Simulate real-time data collection
    setInterval(() => {
      this.collectSensorData();
      this.collectCameraData();
      this.updateDeviceHealth();
    }, 1000); // Collect data every second
  }

  private collectSensorData(): void {
    for (const device of this.devices.values()) {
      if (device.type === HardwareDeviceType.SENSOR && device.status === DeviceStatus.ONLINE) {
        const sensorData: SensorData = {
          deviceId: device.id,
          timestamp: new Date(),
          type: SensorType.MOTION,
          values: {
            motion: Math.random() > 0.7 ? 1 : 0,
            temperature: 22 + Math.random() * 5,
            humidity: 45 + Math.random() * 10,
            light: 500 + Math.random() * 200,
            sound: 30 + Math.random() * 20
          },
          quality: 0.95 + Math.random() * 0.05,
          location: device.location
        };

        if (!this.sensorData.has(device.id)) {
          this.sensorData.set(device.id, []);
        }
        this.sensorData.get(device.id)!.push(sensorData);

        // Keep only last 1000 readings
        if (this.sensorData.get(device.id)!.length > 1000) {
          this.sensorData.get(device.id)!.shift();
        }

        this.publish('sensor_data', sensorData);
      }
    }
  }

  private collectCameraData(): void {
    for (const device of this.devices.values()) {
      if (device.type === HardwareDeviceType.CAMERA && device.status === DeviceStatus.ONLINE) {
        // Simulate camera frame analysis
        const cameraData: CameraData = {
          deviceId: device.id,
          timestamp: new Date(),
          frame: 'mock_frame_data', // In real implementation, this would be base64 image
          metadata: {
            resolution: device.configuration.resolution || '4K',
            frameRate: device.configuration.frameRate || 60,
            exposure: 1/60,
            gain: 1.0,
            focus: 0.5,
            whiteBalance: 5500,
            timestamp: new Date()
          },
          analysis: {
            objects: this.generateMockObjects(),
            motion: this.generateMockMotion(),
            quality: {
              sharpness: 0.9 + Math.random() * 0.1,
              contrast: 0.8 + Math.random() * 0.2,
              brightness: 0.7 + Math.random() * 0.3,
              noise: Math.random() * 0.1,
              overall: 0.85 + Math.random() * 0.15
            },
            processing: {
              processingTime: 16 + Math.random() * 8, // 16-24ms
              fps: 55 + Math.random() * 10, // 55-65 FPS
              latency: 5 + Math.random() * 5, // 5-10ms
              throughput: 100 + Math.random() * 50 // 100-150 MB/s
            }
          }
        };

        if (!this.cameraData.has(device.id)) {
          this.cameraData.set(device.id, []);
        }
        this.cameraData.get(device.id)!.push(cameraData);

        // Keep only last 100 frames
        if (this.cameraData.get(device.id)!.length > 100) {
          this.cameraData.get(device.id)!.shift();
        }

        this.publish('camera_data', cameraData);
      }
    }
  }

  private generateMockObjects(): DetectedObject[] {
    const objects: DetectedObject[] = [];
    
    // Simulate ball detection
    if (Math.random() > 0.3) {
      objects.push({
        id: 'ball_001',
        type: ObjectType.BALL,
        confidence: 0.85 + Math.random() * 0.15,
        boundingBox: {
          x: 0.3 + Math.random() * 0.4,
          y: 0.2 + Math.random() * 0.6,
          width: 0.02 + Math.random() * 0.01,
          height: 0.02 + Math.random() * 0.01
        },
        properties: {
          color: ['white', 'red', 'yellow', 'green', 'brown', 'blue', 'pink', 'black'][Math.floor(Math.random() * 8)],
          velocity: Math.random() * 5,
          direction: Math.random() * 360
        }
      });
    }

    // Simulate cue detection
    if (Math.random() > 0.5) {
      objects.push({
        id: 'cue_001',
        type: ObjectType.CUE,
        confidence: 0.9 + Math.random() * 0.1,
        boundingBox: {
          x: 0.1 + Math.random() * 0.8,
          y: 0.1 + Math.random() * 0.8,
          width: 0.01 + Math.random() * 0.005,
          height: 0.3 + Math.random() * 0.2
        },
        properties: {
          angle: Math.random() * 360,
          length: 1.4 + Math.random() * 0.2
        }
      });
    }

    return objects;
  }

  private generateMockMotion(): MotionData {
    const motionDetected = Math.random() > 0.6;
    return {
      detected: motionDetected,
      intensity: motionDetected ? Math.random() * 0.8 + 0.2 : 0,
      direction: motionDetected ? Object.values(MotionDirection)[Math.floor(Math.random() * 6)] : MotionDirection.UP,
      velocity: motionDetected ? Math.random() * 10 : 0,
      regions: motionDetected ? [{
        x: Math.random() * 0.8,
        y: Math.random() * 0.8,
        width: 0.1 + Math.random() * 0.2,
        height: 0.1 + Math.random() * 0.2,
        intensity: Math.random() * 0.8 + 0.2
      }] : []
    };
  }

  private updateDeviceHealth(): void {
    for (const device of this.devices.values()) {
      // Simulate health fluctuations
      device.health.temperature += (Math.random() - 0.5) * 2;
      device.health.cpuUsage += (Math.random() - 0.5) * 5;
      device.health.memoryUsage += (Math.random() - 0.5) * 3;
      device.health.networkLatency += (Math.random() - 0.5) * 1;

      // Clamp values to reasonable ranges
      device.health.temperature = Math.max(20, Math.min(80, device.health.temperature));
      device.health.cpuUsage = Math.max(0, Math.min(100, device.health.cpuUsage));
      device.health.memoryUsage = Math.max(0, Math.min(100, device.health.memoryUsage));
      device.health.networkLatency = Math.max(1, Math.min(50, device.health.networkLatency));

      // Check for alerts
      this.checkDeviceAlerts(device);
    }
  }

  private checkDeviceAlerts(device: HardwareDevice): void {
    // Temperature alert
    if (device.health.temperature > 70) {
      this.createAlert(device.id, AlertType.TEMPERATURE_HIGH, AlertSeverity.HIGH, 
        `Device temperature is ${device.health.temperature.toFixed(1)}°C`);
    }

    // Disk usage alert
    if (device.configuration.storage && 
        (device.configuration.storage.usedSpace / device.configuration.storage.totalSpace) > 0.9) {
      this.createAlert(device.id, AlertType.DISK_FULL, AlertSeverity.MEDIUM,
        'Device storage is nearly full');
    }

    // Network latency alert
    if (device.health.networkLatency > 20) {
      this.createAlert(device.id, AlertType.NETWORK_DOWN, AlertSeverity.MEDIUM,
        `High network latency: ${device.health.networkLatency.toFixed(1)}ms`);
    }
  }

  private createAlert(deviceId: string, type: AlertType, severity: AlertSeverity, message: string): void {
    const device = this.devices.get(deviceId);
    if (!device) return;

    const alert: DeviceAlert = {
      id: `alert_${Date.now()}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      resolved: false
    };

    device.health.alerts.push(alert);
    this.publish('device_alert', { deviceId, alert });
  }

  // Public API Methods
  getDevices(venueId?: string): HardwareDevice[] {
    const devices = Array.from(this.devices.values());
    return venueId ? devices.filter(d => d.venueId === venueId) : devices;
  }

  getDevice(deviceId: string): HardwareDevice | null {
    return this.devices.get(deviceId) || null;
  }

  getSensorData(deviceId: string, limit: number = 100): SensorData[] {
    return this.sensorData.get(deviceId)?.slice(-limit) || [];
  }

  getCameraData(deviceId: string, limit: number = 50): CameraData[] {
    return this.cameraData.get(deviceId)?.slice(-limit) || [];
  }

  getVenueStatus(venueId: string): VenueHardwareStatus {
    const venueDevices = this.getDevices(venueId);
    const totalDevices = venueDevices.length;
    const onlineDevices = venueDevices.filter(d => d.status === DeviceStatus.ONLINE).length;
    const offlineDevices = venueDevices.filter(d => d.status === DeviceStatus.OFFLINE).length;
    const maintenanceDevices = venueDevices.filter(d => d.status === DeviceStatus.MAINTENANCE).length;
    const errorDevices = venueDevices.filter(d => d.status === DeviceStatus.ERROR).length;

    const allAlerts = venueDevices.flatMap(d => d.health.alerts);
    const activeAlerts = allAlerts.filter(a => !a.resolved);

    const performance: HardwarePerformance = {
      averageLatency: venueDevices.reduce((sum, d) => sum + d.health.networkLatency, 0) / totalDevices,
      averageThroughput: 100, // Mock value
      uptime: venueDevices.reduce((sum, d) => sum + d.health.uptime, 0) / totalDevices,
      errorRate: errorDevices / totalDevices,
      calibrationAccuracy: venueDevices.reduce((sum, d) => sum + (d.configuration.calibration?.accuracy || 0), 0) / totalDevices
    };

    return {
      venueId,
      totalDevices,
      onlineDevices,
      offlineDevices,
      maintenanceDevices,
      errorDevices,
      lastUpdate: new Date(),
      alerts: activeAlerts,
      performance
    };
  }

  async calibrateDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    device.status = DeviceStatus.CALIBRATING;
    this.publish('device_status_changed', { deviceId, status: device.status });

    // Simulate calibration process
    await new Promise(resolve => setTimeout(resolve, 5000));

    device.status = DeviceStatus.ONLINE;
    if (device.configuration.calibration) {
      device.configuration.calibration.lastCalibrated = new Date();
      device.configuration.calibration.accuracy = 0.95 + Math.random() * 0.05;
    }

    this.publish('device_status_changed', { deviceId, status: device.status });
    this.publish('calibration_completed', { deviceId, accuracy: device.configuration.calibration?.accuracy });

    return true;
  }

  async updateDeviceConfiguration(deviceId: string, config: Partial<DeviceConfiguration>): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) return false;

    device.configuration = { ...device.configuration, ...config };
    this.publish('device_configuration_updated', { deviceId, configuration: device.configuration });

    return true;
  }

  // Subscription System
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    this.subscribers.get(event)!.add(callback);

    return () => {
      const subscribers = this.subscribers.get(event);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  private publish(event: string, data: any): void {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in hardware service subscriber callback:', error);
        }
      });
    }
  }
}

export const venueHardwareService = new VenueHardwareService();
export default venueHardwareService; 