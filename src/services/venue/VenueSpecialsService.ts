import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface VenueSpecial {
  id: string;
  venueId: string;
  name: string;
  description: string;
  type: 'happy_hour' | 'tournament_day' | 'member_exclusive' | 'seasonal' | 'special_event' | 'custom';
  discountType: 'percentage' | 'fixed_amount' | 'free_item' | 'buy_one_get_one';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  startTime?: string; // HH:MM format for daily specials
  endTime?: string; // HH:MM format for daily specials
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday) for recurring specials
  minimumSpend?: number;
  maximumDiscount?: number;
  applicableItems: string[]; // Product/service IDs
  excludedItems: string[];
  customerGroups: 'all' | 'members' | 'new_customers' | 'returning_customers' | 'vip';
  usageLimit?: number; // Total usage limit
  perCustomerLimit?: number; // Usage limit per customer
  currentUsage: number;
  status: 'active' | 'inactive' | 'scheduled' | 'expired';
  priority: number; // Higher number = higher priority
  autoActivate: boolean;
  conditions: SpecialCondition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SpecialCondition {
  type: 'time_based' | 'day_based' | 'weather_based' | 'event_based' | 'performance_based';
  condition: string;
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
}

export interface SpecialUsage {
  id: string;
  specialId: string;
  customerId: string;
  venueId: string;
  usageDate: Date;
  discountApplied: number;
  originalAmount: number;
  finalAmount: number;
  items: string[];
  transactionId?: string;
}

export interface SpecialAnalytics {
  specialId: string;
  totalUsage: number;
  totalDiscount: number;
  averageDiscount: number;
  customerCount: number;
  conversionRate: number;
  revenueImpact: number;
  popularItems: string[];
  peakUsageTimes: string[];
  customerSatisfaction: number;
}

export interface SpecialsConfig {
  autoActivation: boolean;
  conflictResolution: 'priority' | 'first_created' | 'highest_discount';
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  analyticsEnabled: boolean;
  maxActiveSpecials: number;
  defaultPriority: number;
}

class VenueSpecialsService extends EventEmitter {
  private static instance: VenueSpecialsService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  // Service state
  private specials: VenueSpecial[] = [];
  private usage: SpecialUsage[] = [];
  private analytics: SpecialAnalytics[] = [];
  private config: SpecialsConfig = {
    autoActivation: true,
    conflictResolution: 'priority',
    notificationSettings: {
      email: true,
      sms: false,
      push: true,
      inApp: true
    },
    analyticsEnabled: true,
    maxActiveSpecials: 10,
    defaultPriority: 1
  };

  private constructor() {
    super();
    this.initializeWebSocket();
    this.loadMockData();
    this.startMonitoring();
  }

  public static getInstance(): VenueSpecialsService {
    if (!VenueSpecialsService.instance) {
      VenueSpecialsService.instance = new VenueSpecialsService();
    }
    return VenueSpecialsService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('🎯 Venue Specials service connected to WebSocket');
        this._isConnected = true;
        this.reconnectAttempts = 0;
        this.socket?.emit('specials:join', { service: 'venue_specials' });
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Venue Specials service disconnected from WebSocket');
        this._isConnected = false;
        this.handleReconnection();
      });

      this.socket.on('specials:special_created', (data: VenueSpecial) => {
        this.addSpecial(data);
      });

      this.socket.on('specials:usage_recorded', (data: SpecialUsage) => {
        this.addUsage(data);
      });

    } catch (error) {
      console.error('❌ Failed to initialize venue specials WebSocket:', error);
      this.handleReconnection();
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval);
    }
  }

  // Special Management
  public async createSpecial(special: Omit<VenueSpecial, 'id' | 'currentUsage' | 'createdAt' | 'updatedAt'>): Promise<VenueSpecial> {
    const newSpecial: VenueSpecial = {
      ...special,
      id: this.generateId(),
      currentUsage: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate special
    this.validateSpecial(newSpecial);

    // Check for conflicts
    const conflicts = this.findConflicts(newSpecial);
    if (conflicts.length > 0) {
      throw new Error(`Special conflicts with existing specials: ${conflicts.map(c => c.name).join(', ')}`);
    }

    this.specials.push(newSpecial);
    this.socket?.emit('specials:special_created', newSpecial);
    this.emit('specialCreated', newSpecial);

    return newSpecial;
  }

  public async updateSpecial(specialId: string, updates: Partial<VenueSpecial>): Promise<VenueSpecial> {
    const index = this.specials.findIndex(s => s.id === specialId);
    if (index === -1) {
      throw new Error('Special not found');
    }

    const updatedSpecial = {
      ...this.specials[index],
      ...updates,
      updatedAt: new Date()
    };

    // Validate updated special
    this.validateSpecial(updatedSpecial);

    this.specials[index] = updatedSpecial;
    this.socket?.emit('specials:special_updated', updatedSpecial);
    this.emit('specialUpdated', updatedSpecial);

    return updatedSpecial;
  }

  public async deleteSpecial(specialId: string): Promise<void> {
    const index = this.specials.findIndex(s => s.id === specialId);
    if (index === -1) {
      throw new Error('Special not found');
    }

    const deletedSpecial = this.specials[index];
    this.specials.splice(index, 1);
    this.socket?.emit('specials:special_deleted', deletedSpecial);
    this.emit('specialDeleted', deletedSpecial);
  }

  public getSpecials(venueId?: string): VenueSpecial[] {
    let filtered = this.specials;
    if (venueId) {
      filtered = filtered.filter(s => s.venueId === venueId);
    }
    return filtered.sort((a, b) => b.priority - a.priority);
  }

  public getSpecialById(id: string): VenueSpecial | undefined {
    return this.specials.find(s => s.id === id);
  }

  public getActiveSpecials(venueId: string, date: Date = new Date()): VenueSpecial[] {
    return this.specials.filter(special => 
      special.venueId === venueId &&
      special.status === 'active' &&
      special.startDate <= date &&
      special.endDate >= date &&
      this.isSpecialApplicable(special, date)
    ).sort((a, b) => b.priority - a.priority);
  }

  // Usage Tracking
  public async recordUsage(usage: Omit<SpecialUsage, 'id' | 'usageDate'>): Promise<SpecialUsage> {
    const newUsage: SpecialUsage = {
      ...usage,
      id: this.generateId(),
      usageDate: new Date()
    };

    // Validate usage
    const special = this.specials.find(s => s.id === usage.specialId);
    if (!special) {
      throw new Error('Special not found');
    }

    if (special.status !== 'active') {
      throw new Error('Special is not active');
    }

    if (special.usageLimit && special.currentUsage >= special.usageLimit) {
      throw new Error('Special usage limit reached');
    }

    // Check per-customer limit
    if (special.perCustomerLimit) {
      const customerUsage = this.usage.filter(u => 
        u.specialId === usage.specialId && 
        u.customerId === usage.customerId
      ).length;
      if (customerUsage >= special.perCustomerLimit) {
        throw new Error('Per-customer usage limit reached');
      }
    }

    // Calculate discount
    const discount = this.calculateDiscount(special, usage.originalAmount);
    newUsage.discountApplied = discount;
    newUsage.finalAmount = usage.originalAmount - discount;

    this.usage.push(newUsage);
    special.currentUsage++;

    this.socket?.emit('specials:usage_recorded', newUsage);
    this.emit('usageRecorded', newUsage);

    return newUsage;
  }

  public getUsage(specialId?: string, customerId?: string): SpecialUsage[] {
    let filtered = this.usage;
    if (specialId) {
      filtered = filtered.filter(u => u.specialId === specialId);
    }
    if (customerId) {
      filtered = filtered.filter(u => u.customerId === customerId);
    }
    return filtered.sort((a, b) => b.usageDate.getTime() - a.usageDate.getTime());
  }

  // Analytics
  public getAnalytics(specialId?: string): SpecialAnalytics[] {
    let filtered = this.analytics;
    if (specialId) {
      filtered = filtered.filter(a => a.specialId === specialId);
    }
    return filtered;
  }

  public async generateAnalytics(specialId: string): Promise<SpecialAnalytics> {
    const special = this.specials.find(s => s.id === specialId);
    if (!special) {
      throw new Error('Special not found');
    }

    const specialUsage = this.usage.filter(u => u.specialId === specialId);
    const totalUsage = specialUsage.length;
    const totalDiscount = specialUsage.reduce((sum, u) => sum + u.discountApplied, 0);
    const averageDiscount = totalUsage > 0 ? totalDiscount / totalUsage : 0;
    const customerCount = new Set(specialUsage.map(u => u.customerId)).size;
    const conversionRate = totalUsage > 0 ? (customerCount / totalUsage) * 100 : 0;
    const revenueImpact = specialUsage.reduce((sum, u) => sum + u.finalAmount, 0);

    const analytics: SpecialAnalytics = {
      specialId,
      totalUsage,
      totalDiscount,
      averageDiscount,
      customerCount,
      conversionRate,
      revenueImpact,
      popularItems: this.getPopularItems(specialId),
      peakUsageTimes: this.getPeakUsageTimes(specialId),
      customerSatisfaction: this.calculateCustomerSatisfaction(specialId)
    };

    const index = this.analytics.findIndex(a => a.specialId === specialId);
    if (index !== -1) {
      this.analytics[index] = analytics;
    } else {
      this.analytics.push(analytics);
    }

    return analytics;
  }

  // Configuration
  public getConfig(): SpecialsConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: Partial<SpecialsConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('specials:config_updated', this.config);
  }

  // Utility Methods
  private validateSpecial(special: VenueSpecial): void {
    if (special.startDate >= special.endDate) {
      throw new Error('Start date must be before end date');
    }

    if (special.discountValue <= 0) {
      throw new Error('Discount value must be positive');
    }

    if (special.discountType === 'percentage' && special.discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    if (special.usageLimit && special.usageLimit <= 0) {
      throw new Error('Usage limit must be positive');
    }

    if (special.perCustomerLimit && special.perCustomerLimit <= 0) {
      throw new Error('Per-customer limit must be positive');
    }
  }

  private findConflicts(special: VenueSpecial): VenueSpecial[] {
    return this.specials.filter(existing => 
      existing.venueId === special.venueId &&
      existing.status === 'active' &&
      this.hasTimeOverlap(existing, special) &&
      this.hasItemOverlap(existing, special)
    );
  }

  private hasTimeOverlap(special1: VenueSpecial, special2: VenueSpecial): boolean {
    return special1.startDate < special2.endDate && special2.startDate < special1.endDate;
  }

  private hasItemOverlap(special1: VenueSpecial, special2: VenueSpecial): boolean {
    return special1.applicableItems.some(item => special2.applicableItems.includes(item));
  }

  private isSpecialApplicable(special: VenueSpecial, date: Date): boolean {
    // Check day of week for recurring specials
    if (special.daysOfWeek && special.daysOfWeek.length > 0) {
      const dayOfWeek = date.getDay();
      if (!special.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }

    // Check time for daily specials
    if (special.startTime && special.endTime) {
      const currentTime = date.toTimeString().slice(0, 5); // HH:MM format
      if (currentTime < special.startTime || currentTime > special.endTime) {
        return false;
      }
    }

    // Check conditions
    return this.evaluateConditions(special.conditions, date);
  }

  private evaluateConditions(conditions: SpecialCondition[], date: Date): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'time_based':
          const currentTime = date.getHours();
          const targetTime = parseInt(condition.value);
          return this.evaluateOperator(currentTime, targetTime, condition.operator);
        case 'day_based':
          const currentDay = date.getDay();
          const targetDay = parseInt(condition.value);
          return this.evaluateOperator(currentDay, targetDay, condition.operator);
        default:
          return true; // Default to true for unimplemented conditions
      }
    });
  }

  private evaluateOperator(actual: number, expected: number, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      default:
        return true;
    }
  }

  private calculateDiscount(special: VenueSpecial, originalAmount: number): number {
    let discount = 0;

    switch (special.discountType) {
      case 'percentage':
        discount = (originalAmount * special.discountValue) / 100;
        break;
      case 'fixed_amount':
        discount = special.discountValue;
        break;
      case 'buy_one_get_one':
        // Implement BOGO logic
        discount = originalAmount / 2;
        break;
      default:
        discount = 0;
    }

    // Apply minimum spend check
    if (special.minimumSpend && originalAmount < special.minimumSpend) {
      return 0;
    }

    // Apply maximum discount limit
    if (special.maximumDiscount) {
      discount = Math.min(discount, special.maximumDiscount);
    }

    return Math.min(discount, originalAmount);
  }

  private getPopularItems(specialId: string): string[] {
    const specialUsage = this.usage.filter(u => u.specialId === specialId);
    const itemCounts: Record<string, number> = {};
    
    specialUsage.forEach(usage => {
      usage.items.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
      });
    });

    return Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([item]) => item);
  }

  private getPeakUsageTimes(specialId: string): string[] {
    const specialUsage = this.usage.filter(u => u.specialId === specialId);
    const hourCounts: Record<string, number> = {};
    
    specialUsage.forEach(usage => {
      const hour = usage.usageDate.getHours().toString().padStart(2, '0');
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
  }

  private calculateCustomerSatisfaction(specialId: string): number {
    // Mock satisfaction calculation - in real implementation, this would use customer feedback
    const specialUsage = this.usage.filter(u => u.specialId === specialId);
    if (specialUsage.length === 0) return 0;

    // Simple satisfaction based on usage frequency and discount amount
    const avgDiscount = specialUsage.reduce((sum, u) => sum + u.discountApplied, 0) / specialUsage.length;
    const usageFrequency = specialUsage.length / 30; // Assuming 30-day period

    return Math.min(100, (avgDiscount * 10 + usageFrequency * 20));
  }

  private addSpecial(special: VenueSpecial): void {
    const existingIndex = this.specials.findIndex(s => s.id === special.id);
    if (existingIndex !== -1) {
      this.specials[existingIndex] = special;
    } else {
      this.specials.push(special);
    }
  }

  private addUsage(usage: SpecialUsage): void {
    const existingIndex = this.usage.findIndex(u => u.id === usage.id);
    if (existingIndex !== -1) {
      this.usage[existingIndex] = usage;
    } else {
      this.usage.push(usage);
    }
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.updateSpecialStatuses();
    }, 60000); // Check every minute
  }

  private updateSpecialStatuses(): void {
    const now = new Date();
    this.specials.forEach(special => {
      if (special.status === 'scheduled' && special.startDate <= now) {
        special.status = 'active';
        this.socket?.emit('specials:special_activated', special);
      } else if (special.status === 'active' && special.endDate <= now) {
        special.status = 'expired';
        this.socket?.emit('specials:special_expired', special);
      }
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private loadMockData(): void {
    this.specials = [
      {
        id: 'special1',
        venueId: 'venue1',
        name: 'Happy Hour',
        description: '50% off all drinks during happy hour',
        type: 'happy_hour',
        discountType: 'percentage',
        discountValue: 50,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        startTime: '17:00',
        endTime: '19:00',
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        applicableItems: ['drink1', 'drink2', 'drink3'],
        excludedItems: [],
        customerGroups: 'all',
        status: 'active',
        priority: 1,
        autoActivate: true,
        conditions: [
          {
            type: 'time_based',
            condition: 'happy_hour',
            value: 17,
            operator: 'greater_than'
          }
        ],
        currentUsage: 45,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'special2',
        venueId: 'venue1',
        name: 'Tournament Day Special',
        description: 'Free appetizer with any tournament entry',
        type: 'tournament_day',
        discountType: 'free_item',
        discountValue: 1,
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        applicableItems: ['appetizer1', 'appetizer2'],
        excludedItems: [],
        customerGroups: 'all',
        status: 'active',
        priority: 2,
        autoActivate: true,
        conditions: [],
        currentUsage: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  public isConnected(): boolean {
    return this._isConnected;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._isConnected = false;
  }
}

export default VenueSpecialsService; 