import { io, Socket } from 'socket.io-client';
import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';

export interface Equipment {
  id: string;
  venueId: string;
  name: string;
  type: 'table' | 'camera' | 'sensor' | 'display' | 'processor' | 'network' | 'lighting' | 'climate' | 'security';
  serialNumber: string;
  model: string;
  manufacturer: string;
  installationDate: Date;
  warrantyExpiry: Date;
  status: 'operational' | 'maintenance' | 'offline' | 'retired';
  location: string;
  assignedTable?: string;
  health: EquipmentHealth;
  maintenance: MaintenanceInfo;
  performance: PerformanceMetrics;
  cost: CostInfo;
}

export interface EquipmentHealth {
  overallHealth: number; // 0-100
  temperature: number;
  uptime: number;
  lastCheck: Date;
  alerts: EquipmentAlert[];
  issues: EquipmentIssue[];
}

export interface EquipmentAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export interface EquipmentIssue {
  id: string;
  type: 'hardware' | 'software' | 'network' | 'performance';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedDate: Date;
  resolvedDate?: Date;
  resolution?: string;
}

export interface MaintenanceInfo {
  lastMaintenance: Date;
  nextScheduledMaintenance: Date;
  maintenanceHistory: MaintenanceRecord[];
  maintenanceSchedule: MaintenanceSchedule;
  vendor: VendorInfo;
  warranty: WarrantyInfo;
}

export interface MaintenanceRecord {
  id: string;
  date: Date;
  type: 'preventive' | 'corrective' | 'emergency';
  description: string;
  performedBy: string;
  cost: number;
  duration: number; // hours
  parts: MaintenancePart[];
  notes: string;
}

export interface MaintenancePart {
  id: string;
  name: string;
  partNumber: string;
  cost: number;
  supplier: string;
  warranty: Date;
}

export interface MaintenanceSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastCompleted: Date;
  nextDue: Date;
  tasks: MaintenanceTask[];
}

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  estimatedDuration: number; // minutes
  requiredParts: string[];
  instructions: string;
  lastCompleted?: Date;
  nextDue: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

export interface VendorInfo {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  serviceArea: string;
  responseTime: number; // hours
  rating: number;
  contractExpiry: Date;
}

export interface WarrantyInfo {
  type: 'manufacturer' | 'extended' | 'service';
  startDate: Date;
  endDate: Date;
  terms: string;
  coverage: string[];
  exclusions: string[];
}

export interface PerformanceMetrics {
  utilization: number; // 0-100
  efficiency: number; // 0-100
  reliability: number; // 0-100
  availability: number; // 0-100
  responseTime: number; // milliseconds
  throughput: number; // operations per hour
  errorRate: number; // percentage
  lastUpdated: Date;
}

export interface CostInfo {
  purchaseCost: number;
  installationCost: number;
  maintenanceCost: number;
  operationalCost: number;
  totalCost: number;
  costPerHour: number;
  roi: number; // return on investment percentage
  depreciation: number;
  replacementValue: number;
}

export interface EquipmentInventory {
  venueId: string;
  totalEquipment: number;
  operationalEquipment: number;
  maintenanceEquipment: number;
  offlineEquipment: number;
  retiredEquipment: number;
  equipmentByType: Record<string, number>;
  equipmentByStatus: Record<string, number>;
  totalValue: number;
  maintenanceCost: number;
  lastUpdated: Date;
}

export interface PredictiveMaintenance {
  equipmentId: string;
  predictedFailureDate: Date;
  confidence: number; // 0-100
  failureType: string;
  recommendedActions: string[];
  estimatedCost: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class EquipmentManagementService extends BrowserEventEmitter {
  private static instance: EquipmentManagementService;
  private socket: Socket | null = null;
  private equipment: Map<string, Equipment> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {
    super();
    this.initializeSocket();
  }

  public static getInstance(): EquipmentManagementService {
    if (!EquipmentManagementService.instance) {
      EquipmentManagementService.instance = new EquipmentManagementService();
    }
    return EquipmentManagementService.instance;
  }

  private initializeSocket(): void {
    try {
      this.socket = io('http://localhost:3002/equipment', {
        transports: ['websocket'],
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        console.log('Equipment Management Service connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      });

      this.socket.on('disconnect', () => {
        console.log('Equipment Management Service disconnected');
        this.isConnected = false;
        this.emit('disconnected');
        this.handleReconnect();
      });

      this.socket.on('equipment_update', (data: Equipment) => {
        this.equipment.set(data.id, data);
        this.emit('equipment_updated', data);
      });

      this.socket.on('maintenance_alert', (data: EquipmentAlert) => {
        this.emit('maintenance_alert', data);
      });

      this.socket.on('predictive_maintenance', (data: PredictiveMaintenance) => {
        this.emit('predictive_maintenance', data);
      });

      this.socket.on('health_update', (data: { equipmentId: string; health: EquipmentHealth }) => {
        const equipment = this.equipment.get(data.equipmentId);
        if (equipment) {
          equipment.health = data.health;
          this.equipment.set(data.equipmentId, equipment);
          this.emit('health_updated', equipment);
        }
      });

    } catch (error) {
      console.error('Failed to initialize Equipment Management Service socket:', error);
      this.isConnected = false;
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect Equipment Management Service (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeSocket();
      }, 5000 * this.reconnectAttempts);
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getEquipment(venueId: string): Equipment[] {
    return Array.from(this.equipment.values()).filter(eq => eq.venueId === venueId);
  }

  public getEquipmentById(equipmentId: string): Equipment | undefined {
    return this.equipment.get(equipmentId);
  }

  public getEquipmentByType(venueId: string, type: string): Equipment[] {
    return this.getEquipment(venueId).filter(eq => eq.type === type);
  }

  public getEquipmentByStatus(venueId: string, status: string): Equipment[] {
    return this.getEquipment(venueId).filter(eq => eq.status === status);
  }

  public getInventory(venueId: string): EquipmentInventory {
    const equipment = this.getEquipment(venueId);
    const equipmentByType: Record<string, number> = {};
    const equipmentByStatus: Record<string, number> = {};

    let totalValue = 0;
    let maintenanceCost = 0;

    equipment.forEach(eq => {
      // Count by type
      equipmentByType[eq.type] = (equipmentByType[eq.type] || 0) + 1;
      
      // Count by status
      equipmentByStatus[eq.status] = (equipmentByStatus[eq.status] || 0) + 1;
      
      // Calculate costs
      totalValue += eq.cost.totalCost;
      maintenanceCost += eq.cost.maintenanceCost;
    });

    return {
      venueId,
      totalEquipment: equipment.length,
      operationalEquipment: equipmentByStatus['operational'] || 0,
      maintenanceEquipment: equipmentByStatus['maintenance'] || 0,
      offlineEquipment: equipmentByStatus['offline'] || 0,
      retiredEquipment: equipmentByStatus['retired'] || 0,
      equipmentByType,
      equipmentByStatus,
      totalValue,
      maintenanceCost,
      lastUpdated: new Date(),
    };
  }

  public getMaintenanceSchedule(venueId: string): MaintenanceTask[] {
    const equipment = this.getEquipment(venueId);
    const tasks: MaintenanceTask[] = [];
    
    equipment.forEach(eq => {
      tasks.push(...eq.maintenance.maintenanceSchedule.tasks);
    });

    return tasks.sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime());
  }

  public getOverdueMaintenance(venueId: string): MaintenanceTask[] {
    const tasks = this.getMaintenanceSchedule(venueId);
    const now = new Date();
    
    return tasks.filter(task => 
      task.status === 'overdue' || 
      (task.nextDue < now && task.status !== 'completed')
    );
  }

  public getUpcomingMaintenance(venueId: string, days: number = 7): MaintenanceTask[] {
    const tasks = this.getMaintenanceSchedule(venueId);
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => 
      task.nextDue >= now && 
      task.nextDue <= futureDate && 
      task.status !== 'completed'
    );
  }

  public getEquipmentHealth(venueId: string): EquipmentHealth[] {
    const equipment = this.getEquipment(venueId);
    return equipment.map(eq => eq.health);
  }

  public getCriticalAlerts(venueId: string): EquipmentAlert[] {
    const equipment = this.getEquipment(venueId);
    const alerts: EquipmentAlert[] = [];
    
    equipment.forEach(eq => {
      alerts.push(...eq.health.alerts.filter(alert => 
        alert.type === 'critical' && !alert.resolved
      ));
    });

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getPerformanceMetrics(venueId: string): PerformanceMetrics[] {
    const equipment = this.getEquipment(venueId);
    return equipment.map(eq => eq.performance);
  }

  public getPredictiveMaintenance(venueId: string): PredictiveMaintenance[] {
    // This would typically come from the backend AI service
    // For now, return mock data
    return [];
  }

  public scheduleMaintenance(equipmentId: string, task: MaintenanceTask): boolean {
    try {
      const equipment = this.equipment.get(equipmentId);
      if (!equipment) return false;

      equipment.maintenance.maintenanceSchedule.tasks.push(task);
      this.equipment.set(equipmentId, equipment);
      
      if (this.socket) {
        this.socket.emit('schedule_maintenance', { equipmentId, task });
      }

      this.emit('maintenance_scheduled', { equipmentId, task });
      return true;
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      return false;
    }
  }

  public completeMaintenance(equipmentId: string, taskId: string, record: MaintenanceRecord): boolean {
    try {
      const equipment = this.equipment.get(equipmentId);
      if (!equipment) return false;

      // Update task status
      const task = equipment.maintenance.maintenanceSchedule.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = 'completed';
        task.lastCompleted = new Date();
      }

      // Add maintenance record
      equipment.maintenance.maintenanceHistory.push(record);
      equipment.maintenance.lastMaintenance = new Date();

      // Update equipment health
      equipment.health.overallHealth = Math.min(100, equipment.health.overallHealth + 10);
      equipment.health.alerts = equipment.health.alerts.filter(alert => !alert.resolved);

      this.equipment.set(equipmentId, equipment);
      
      if (this.socket) {
        this.socket.emit('complete_maintenance', { equipmentId, taskId, record });
      }

      this.emit('maintenance_completed', { equipmentId, taskId, record });
      return true;
    } catch (error) {
      console.error('Error completing maintenance:', error);
      return false;
    }
  }

  public acknowledgeAlert(equipmentId: string, alertId: string): boolean {
    try {
      const equipment = this.equipment.get(equipmentId);
      if (!equipment) return false;

      const alert = equipment.health.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        this.equipment.set(equipmentId, equipment);
        
        if (this.socket) {
          this.socket.emit('acknowledge_alert', { equipmentId, alertId });
        }

        this.emit('alert_acknowledged', { equipmentId, alertId });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return false;
    }
  }

  public resolveAlert(equipmentId: string, alertId: string): boolean {
    try {
      const equipment = this.equipment.get(equipmentId);
      if (!equipment) return false;

      const alert = equipment.health.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        this.equipment.set(equipmentId, equipment);
        
        if (this.socket) {
          this.socket.emit('resolve_alert', { equipmentId, alertId });
        }

        this.emit('alert_resolved', { equipmentId, alertId });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }

  public addEquipment(equipment: Equipment): boolean {
    try {
      this.equipment.set(equipment.id, equipment);
      
      if (this.socket) {
        this.socket.emit('add_equipment', equipment);
      }

      this.emit('equipment_added', equipment);
      return true;
    } catch (error) {
      console.error('Error adding equipment:', error);
      return false;
    }
  }

  public updateEquipment(equipmentId: string, updates: Partial<Equipment>): boolean {
    try {
      const equipment = this.equipment.get(equipmentId);
      if (!equipment) return false;

      const updatedEquipment = { ...equipment, ...updates };
      this.equipment.set(equipmentId, updatedEquipment);
      
      if (this.socket) {
        this.socket.emit('update_equipment', { equipmentId, updates });
      }

      this.emit('equipment_updated', updatedEquipment);
      return true;
    } catch (error) {
      console.error('Error updating equipment:', error);
      return false;
    }
  }

  public removeEquipment(equipmentId: string): boolean {
    try {
      const equipment = this.equipment.get(equipmentId);
      if (!equipment) return false;

      this.equipment.delete(equipmentId);
      
      if (this.socket) {
        this.socket.emit('remove_equipment', equipmentId);
      }

      this.emit('equipment_removed', equipment);
      return true;
    } catch (error) {
      console.error('Error removing equipment:', error);
      return false;
    }
  }

  public getVendorInfo(venueId: string): VendorInfo[] {
    const equipment = this.getEquipment(venueId);
    const vendors = new Map<string, VendorInfo>();
    
    equipment.forEach(eq => {
      if (eq.maintenance.vendor) {
        vendors.set(eq.maintenance.vendor.id, eq.maintenance.vendor);
      }
    });

    return Array.from(vendors.values());
  }

  public getWarrantyInfo(venueId: string): WarrantyInfo[] {
    const equipment = this.getEquipment(venueId);
    const warranties: WarrantyInfo[] = [];
    
    equipment.forEach(eq => {
      if (eq.maintenance.warranty) {
        warranties.push(eq.maintenance.warranty);
      }
    });

    return warranties.sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
  }

  public getExpiringWarranties(venueId: string, days: number = 30): WarrantyInfo[] {
    const warranties = this.getWarrantyInfo(venueId);
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return warranties.filter(warranty => 
      warranty.endDate >= now && 
      warranty.endDate <= futureDate
    );
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
} 