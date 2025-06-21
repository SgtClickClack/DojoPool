import { io, Socket } from 'socket.io-client';

export interface VenueInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  description: string;
  capacity: number;
  tableCount: number;
  amenities: string[];
  operatingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
  rating: number;
  reviewCount: number;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface HardwareDevice {
  id: string;
  venueId: string;
  name: string;
  type: 'camera' | 'sensor' | 'display' | 'audio' | 'lighting' | 'table' | 'payment' | 'security';
  model: string;
  manufacturer: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen: Date;
  firmware: string;
  ipAddress?: string;
  macAddress?: string;
  location: string;
  configuration: any;
  health: {
    temperature: number;
    uptime: number;
    errors: number;
    warnings: number;
  };
}

export interface TableInfo {
  id: string;
  venueId: string;
  number: number;
  type: 'pool' | 'snooker' | 'carom';
  size: '7ft' | '8ft' | '9ft' | '12ft';
  brand: string;
  model: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentGame?: string;
  hourlyRate: number;
  lastMaintenance: Date;
  nextMaintenance: Date;
  usageHours: number;
  revenue: number;
  sensors: {
    occupancy: boolean;
    temperature: number;
    humidity: number;
    lighting: number;
  };
}

export interface VenueAnalytics {
  venueId: string;
  date: Date;
  totalVisitors: number;
  uniqueVisitors: number;
  tableUtilization: number;
  averageSessionTime: number;
  revenue: number;
  expenses: number;
  profit: number;
  popularTables: string[];
  peakHours: string[];
  customerSatisfaction: number;
  maintenanceIssues: number;
  hardwareAlerts: number;
}

export interface MaintenanceSchedule {
  id: string;
  venueId: string;
  deviceId?: string;
  tableId?: string;
  type: 'preventive' | 'corrective' | 'emergency';
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  assignedTechnician?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration: number;
  actualDuration?: number;
  cost: number;
  parts: string[];
  notes: string;
}

export interface VenueConfig {
  enableHardwareMonitoring: boolean;
  enableAutomatedMaintenance: boolean;
  enableSmartLighting: boolean;
  enableClimateControl: boolean;
  enableSecurityMonitoring: boolean;
  enablePaymentIntegration: boolean;
  enableAnalytics: boolean;
  alertThresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
    occupancy: number;
    revenue: number;
    errors: number;
  };
  maintenanceIntervals: {
    tables: number;
    cameras: number;
    sensors: number;
    displays: number;
  };
}

class VenueManagementService {
  private socket: Socket | null = null;
  private static instance: VenueManagementService;
  private config: VenueConfig;
  private venues: Map<string, VenueInfo> = new Map();
  private hardwareDevices: Map<string, HardwareDevice> = new Map();
  private tables: Map<string, TableInfo> = new Map();
  private analytics: Map<string, VenueAnalytics[]> = new Map();
  private maintenanceSchedules: Map<string, MaintenanceSchedule[]> = new Map();
  private _isConnected: boolean = false;

  private constructor() {
    this.config = {
      enableHardwareMonitoring: true,
      enableAutomatedMaintenance: true,
      enableSmartLighting: true,
      enableClimateControl: true,
      enableSecurityMonitoring: true,
      enablePaymentIntegration: true,
      enableAnalytics: true,
      alertThresholds: {
        temperature: { min: 18, max: 24 },
        humidity: { min: 40, max: 60 },
        occupancy: 80,
        revenue: 1000,
        errors: 5,
      },
      maintenanceIntervals: {
        tables: 30,
        cameras: 90,
        sensors: 180,
        displays: 365,
      },
    };
    this.initializeSocket();
    this.generateMockData();
  }

  public static getInstance(): VenueManagementService {
    if (!VenueManagementService.instance) {
      VenueManagementService.instance = new VenueManagementService();
    }
    return VenueManagementService.instance;
  }

  private initializeSocket(): void {
    this.socket = io('http://localhost:8080', {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('VenueManagementService connected to server');
      this._isConnected = true;
      this.requestVenueData();
    });

    this.socket.on('disconnect', () => {
      console.log('VenueManagementService disconnected from server');
      this._isConnected = false;
    });

    this.socket.on('venue-update', (data: any) => {
      this.handleVenueUpdate(data);
    });

    this.socket.on('hardware-update', (data: any) => {
      this.handleHardwareUpdate(data);
    });

    this.socket.on('table-update', (data: any) => {
      this.handleTableUpdate(data);
    });

    this.socket.on('maintenance-alert', (data: any) => {
      this.handleMaintenanceAlert(data);
    });
  }

  private handleVenueUpdate(data: any): void {
    if (data.venue) {
      this.venues.set(data.venue.id, data.venue);
    }
  }

  private handleHardwareUpdate(data: any): void {
    if (data.device) {
      this.hardwareDevices.set(data.device.id, data.device);
    }
  }

  private handleTableUpdate(data: any): void {
    if (data.table) {
      this.tables.set(data.table.id, data.table);
    }
  }

  private handleMaintenanceAlert(data: any): void {
    console.log('Maintenance alert received:', data);
    // Handle maintenance alerts
  }

  private requestVenueData(): void {
    this.socket?.emit('request-venue-data');
  }

  private generateMockData(): void {
    // Generate mock venues
    const mockVenues = [
      {
        id: 'v1',
        name: 'Championship Pool Hall',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        phone: '+1-555-0123',
        email: 'info@championshippool.com',
        website: 'https://championshippool.com',
        description: 'Premier pool hall with professional tables and tournament facilities',
        capacity: 200,
        tableCount: 12,
        amenities: ['Pro Shop', 'Bar', 'Food Service', 'Tournament Room', 'Parking'],
        operatingHours: {
          monday: { open: '10:00', close: '02:00' },
          tuesday: { open: '10:00', close: '02:00' },
          wednesday: { open: '10:00', close: '02:00' },
          thursday: { open: '10:00', close: '02:00' },
          friday: { open: '10:00', close: '02:00' },
          saturday: { open: '10:00', close: '02:00' },
          sunday: { open: '10:00', close: '02:00' },
        },
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        status: 'active',
        rating: 4.8,
        reviewCount: 156,
        revenue: 45000,
        expenses: 28000,
        profit: 17000,
      },
      {
        id: 'v2',
        name: 'Elite Billiards Club',
        address: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'USA',
        phone: '+1-555-0456',
        email: 'contact@elitebilliards.com',
        description: 'Exclusive billiards club with luxury amenities',
        capacity: 150,
        tableCount: 8,
        amenities: ['VIP Lounge', 'Bar', 'Restaurant', 'Private Rooms'],
        operatingHours: {
          monday: { open: '12:00', close: '00:00' },
          tuesday: { open: '12:00', close: '00:00' },
          wednesday: { open: '12:00', close: '00:00' },
          thursday: { open: '12:00', close: '00:00' },
          friday: { open: '12:00', close: '02:00' },
          saturday: { open: '12:00', close: '02:00' },
          sunday: { open: '12:00', close: '00:00' },
        },
        coordinates: { latitude: 34.0522, longitude: -118.2437 },
        status: 'active',
        rating: 4.9,
        reviewCount: 89,
        revenue: 35000,
        expenses: 22000,
        profit: 13000,
      },
    ];

    mockVenues.forEach(venue => {
      this.venues.set(venue.id, venue as VenueInfo);
    });

    // Generate mock hardware devices
    const mockDevices = [
      {
        id: 'hw1',
        venueId: 'v1',
        name: 'Security Camera 1',
        type: 'camera',
        model: 'IP-CAM-4K',
        manufacturer: 'SecureTech',
        serialNumber: 'ST-001-2024',
        status: 'online',
        lastSeen: new Date(),
        firmware: 'v2.1.4',
        ipAddress: '192.168.1.100',
        macAddress: '00:11:22:33:44:55',
        location: 'Main Entrance',
        configuration: { resolution: '4K', fps: 30, nightVision: true },
        health: { temperature: 45, uptime: 720, errors: 0, warnings: 1 },
      },
      {
        id: 'hw2',
        venueId: 'v1',
        name: 'Climate Sensor 1',
        type: 'sensor',
        model: 'CLIMATE-PRO',
        manufacturer: 'SensorTech',
        serialNumber: 'ST-002-2024',
        status: 'online',
        lastSeen: new Date(),
        firmware: 'v1.8.2',
        ipAddress: '192.168.1.101',
        location: 'Main Hall',
        configuration: { temperature: true, humidity: true, airQuality: true },
        health: { temperature: 25, uptime: 1440, errors: 0, warnings: 0 },
      },
      {
        id: 'hw3',
        venueId: 'v1',
        name: 'Smart Display 1',
        type: 'display',
        model: 'DISPLAY-55',
        manufacturer: 'DisplayTech',
        serialNumber: 'ST-003-2024',
        status: 'online',
        lastSeen: new Date(),
        firmware: 'v3.2.1',
        ipAddress: '192.168.1.102',
        location: 'Tournament Area',
        configuration: { resolution: '4K', brightness: 80, autoOff: true },
        health: { temperature: 38, uptime: 360, errors: 0, warnings: 0 },
      },
    ];

    mockDevices.forEach(device => {
      this.hardwareDevices.set(device.id, device as HardwareDevice);
    });

    // Generate mock tables
    const mockTables = [
      {
        id: 't1',
        venueId: 'v1',
        number: 1,
        type: 'pool',
        size: '9ft',
        brand: 'Diamond',
        model: 'Pro-Am',
        status: 'available',
        hourlyRate: 15,
        lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        usageHours: 120,
        revenue: 1800,
        sensors: {
          occupancy: false,
          temperature: 22,
          humidity: 45,
          lighting: 85,
        },
      },
      {
        id: 't2',
        venueId: 'v1',
        number: 2,
        type: 'pool',
        size: '9ft',
        brand: 'Diamond',
        model: 'Pro-Am',
        status: 'occupied',
        currentGame: 'game-123',
        hourlyRate: 15,
        lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        nextMaintenance: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        usageHours: 95,
        revenue: 1425,
        sensors: {
          occupancy: true,
          temperature: 23,
          humidity: 47,
          lighting: 90,
        },
      },
    ];

    mockTables.forEach(table => {
      this.tables.set(table.id, table as TableInfo);
    });

    // Generate mock analytics
    const mockAnalytics = [
      {
        venueId: 'v1',
        date: new Date(),
        totalVisitors: 85,
        uniqueVisitors: 72,
        tableUtilization: 75,
        averageSessionTime: 2.5,
        revenue: 1200,
        expenses: 800,
        profit: 400,
        popularTables: ['t1', 't2', 't3'],
        peakHours: ['19:00', '20:00', '21:00'],
        customerSatisfaction: 4.6,
        maintenanceIssues: 2,
        hardwareAlerts: 1,
      },
    ];

    mockAnalytics.forEach(analytics => {
      const venueAnalytics = this.analytics.get(analytics.venueId) || [];
      venueAnalytics.push(analytics as VenueAnalytics);
      this.analytics.set(analytics.venueId, venueAnalytics);
    });

    // Generate mock maintenance schedules
    const mockMaintenance = [
      {
        id: 'm1',
        venueId: 'v1',
        tableId: 't1',
        type: 'preventive',
        description: 'Regular table felt replacement and cushion check',
        scheduledDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        assignedTechnician: 'John Smith',
        status: 'scheduled',
        priority: 'medium',
        estimatedDuration: 120,
        cost: 200,
        parts: ['Felt', 'Cushions', 'Cleaner'],
        notes: 'Standard maintenance procedure',
      },
    ];

    mockMaintenance.forEach(maintenance => {
      const venueMaintenance = this.maintenanceSchedules.get(maintenance.venueId) || [];
      venueMaintenance.push(maintenance as MaintenanceSchedule);
      this.maintenanceSchedules.set(maintenance.venueId, venueMaintenance);
    });
  }

  // Public Methods
  public getVenues(): VenueInfo[] {
    return Array.from(this.venues.values());
  }

  public getVenue(venueId: string): VenueInfo | null {
    return this.venues.get(venueId) || null;
  }

  public getHardwareDevices(venueId?: string): HardwareDevice[] {
    if (venueId) {
      return Array.from(this.hardwareDevices.values()).filter(device => device.venueId === venueId);
    }
    return Array.from(this.hardwareDevices.values());
  }

  public getTables(venueId?: string): TableInfo[] {
    if (venueId) {
      return Array.from(this.tables.values()).filter(table => table.venueId === venueId);
    }
    return Array.from(this.tables.values());
  }

  public getAnalytics(venueId: string, days: number = 30): VenueAnalytics[] {
    const venueAnalytics = this.analytics.get(venueId) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return venueAnalytics.filter(analytics => analytics.date >= cutoffDate);
  }

  public getMaintenanceSchedules(venueId?: string): MaintenanceSchedule[] {
    if (venueId) {
      return this.maintenanceSchedules.get(venueId) || [];
    }
    return Array.from(this.maintenanceSchedules.values()).flat();
  }

  public getConfig(): VenueConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<VenueConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('venue-config-updated', this.config);
  }

  public addVenue(venue: Omit<VenueInfo, 'id'>): string {
    const id = `v${Date.now()}`;
    const newVenue: VenueInfo = { ...venue, id };
    this.venues.set(id, newVenue);
    this.socket?.emit('venue-added', newVenue);
    return id;
  }

  public updateVenue(venueId: string, updates: Partial<VenueInfo>): void {
    const venue = this.venues.get(venueId);
    if (venue) {
      const updatedVenue = { ...venue, ...updates };
      this.venues.set(venueId, updatedVenue);
      this.socket?.emit('venue-updated', updatedVenue);
    }
  }

  public addHardwareDevice(device: Omit<HardwareDevice, 'id'>): string {
    const id = `hw${Date.now()}`;
    const newDevice: HardwareDevice = { ...device, id };
    this.hardwareDevices.set(id, newDevice);
    this.socket?.emit('hardware-device-added', newDevice);
    return id;
  }

  public updateHardwareDevice(deviceId: string, updates: Partial<HardwareDevice>): void {
    const device = this.hardwareDevices.get(deviceId);
    if (device) {
      const updatedDevice = { ...device, ...updates };
      this.hardwareDevices.set(deviceId, updatedDevice);
      this.socket?.emit('hardware-device-updated', updatedDevice);
    }
  }

  public addTable(table: Omit<TableInfo, 'id'>): string {
    const id = `t${Date.now()}`;
    const newTable: TableInfo = { ...table, id };
    this.tables.set(id, newTable);
    this.socket?.emit('table-added', newTable);
    return id;
  }

  public updateTable(tableId: string, updates: Partial<TableInfo>): void {
    const table = this.tables.get(tableId);
    if (table) {
      const updatedTable = { ...table, ...updates };
      this.tables.set(tableId, updatedTable);
      this.socket?.emit('table-updated', updatedTable);
    }
  }

  public scheduleMaintenance(maintenance: Omit<MaintenanceSchedule, 'id'>): string {
    const id = `m${Date.now()}`;
    const newMaintenance: MaintenanceSchedule = { ...maintenance, id };
    const venueMaintenance = this.maintenanceSchedules.get(maintenance.venueId) || [];
    venueMaintenance.push(newMaintenance);
    this.maintenanceSchedules.set(maintenance.venueId, venueMaintenance);
    this.socket?.emit('maintenance-scheduled', newMaintenance);
    return id;
  }

  public updateMaintenance(maintenanceId: string, updates: Partial<MaintenanceSchedule>): void {
    for (const [venueId, maintenanceList] of this.maintenanceSchedules.entries()) {
      const maintenance = maintenanceList.find(m => m.id === maintenanceId);
      if (maintenance) {
        const updatedMaintenance = { ...maintenance, ...updates };
        const updatedList = maintenanceList.map(m => m.id === maintenanceId ? updatedMaintenance : m);
        this.maintenanceSchedules.set(venueId, updatedList);
        this.socket?.emit('maintenance-updated', updatedMaintenance);
        break;
      }
    }
  }

  public getVenueHealth(venueId: string): any {
    const devices = this.getHardwareDevices(venueId);
    const tables = this.getTables(venueId);
    const analytics = this.getAnalytics(venueId, 1)[0];

    const onlineDevices = devices.filter(d => d.status === 'online').length;
    const availableTables = tables.filter(t => t.status === 'available').length;
    const totalRevenue = analytics?.revenue || 0;
    const totalErrors = devices.reduce((sum, d) => sum + d.health.errors, 0);

    return {
      deviceHealth: (onlineDevices / devices.length) * 100,
      tableAvailability: (availableTables / tables.length) * 100,
      revenue: totalRevenue,
      errors: totalErrors,
      alerts: devices.filter(d => d.health.warnings > 0).length,
    };
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  public disconnect(): void {
    this.socket?.disconnect();
  }
}

export default VenueManagementService; 