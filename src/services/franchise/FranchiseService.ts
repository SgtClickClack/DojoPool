export interface Franchise {
  id: string;
  name: string;
  ownerId: string;
  country: string;
  region: string;
  status: FranchiseStatus;
  tier: FranchiseTier;
  venues: string[];
  revenue: FranchiseRevenue;
  performance: FranchisePerformance;
  settings: FranchiseSettings;
  createdAt: Date;
  updatedAt: Date;
}

export enum FranchiseStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  EXPANSION = 'expansion'
}

export enum FranchiseTier {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ELITE = 'elite',
  MASTER = 'master',
  LEGENDARY = 'legendary'
}

export interface FranchiseRevenue {
  monthly: number;
  quarterly: number;
  yearly: number;
  growth: number;
  projections: RevenueProjection[];
}

export interface RevenueProjection {
  period: string;
  projected: number;
  actual: number;
  variance: number;
}

export interface FranchisePerformance {
  totalVenues: number;
  activeVenues: number;
  totalRevenue: number;
  averageRating: number;
  customerSatisfaction: number;
  operationalEfficiency: number;
  marketShare: number;
  growthRate: number;
}

export interface FranchiseSettings {
  branding: BrandingSettings;
  operations: OperationalSettings;
  financial: FinancialSettings;
  compliance: ComplianceSettings;
}

export interface BrandingSettings {
  logo: string;
  colors: string[];
  name: string;
  tagline: string;
  website: string;
  socialMedia: SocialMediaSettings;
}

export interface SocialMediaSettings {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface OperationalSettings {
  businessHours: BusinessHours;
  pricing: PricingSettings;
  services: ServiceSettings;
  qualityStandards: QualityStandards;
}

export interface BusinessHours {
  monday: TimeRange;
  tuesday: TimeRange;
  wednesday: TimeRange;
  thursday: TimeRange;
  friday: TimeRange;
  saturday: TimeRange;
  sunday: TimeRange;
}

export interface TimeRange {
  open: string;
  close: string;
  closed: boolean;
}

export interface PricingSettings {
  baseHourlyRate: number;
  tournamentFees: number;
  membershipFees: number;
  equipmentRental: number;
  currency: string;
}

export interface ServiceSettings {
  tournaments: boolean;
  lessons: boolean;
  equipmentRental: boolean;
  foodService: boolean;
  barService: boolean;
  proShop: boolean;
  events: boolean;
}

export interface QualityStandards {
  cleanliness: number;
  equipment: number;
  service: number;
  atmosphere: number;
  safety: number;
}

export interface FinancialSettings {
  revenueSharing: number;
  franchiseFees: number;
  marketingFund: number;
  insurance: InsuranceSettings;
  taxes: TaxSettings;
}

export interface InsuranceSettings {
  liability: number;
  property: number;
  workersComp: number;
  cyber: number;
}

export interface TaxSettings {
  corporateTax: number;
  salesTax: number;
  propertyTax: number;
  payrollTax: number;
}

export interface ComplianceSettings {
  licenses: License[];
  permits: Permit[];
  certifications: Certification[];
  inspections: Inspection[];
}

export interface License {
  type: string;
  number: string;
  issuer: string;
  expiryDate: Date;
  status: 'active' | 'expired' | 'pending';
}

export interface Permit {
  type: string;
  number: string;
  issuer: string;
  expiryDate: Date;
  status: 'active' | 'expired' | 'pending';
}

export interface Certification {
  type: string;
  issuer: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'pending';
}

export interface Inspection {
  type: string;
  inspector: string;
  date: Date;
  result: 'pass' | 'fail' | 'pending';
  notes: string;
}

export interface VenueNetwork {
  id: string;
  franchiseId: string;
  venues: NetworkVenue[];
  performance: NetworkPerformance;
  connectivity: NetworkConnectivity;
}

export interface NetworkVenue {
  id: string;
  name: string;
  location: Location;
  status: VenueStatus;
  performance: VenuePerformance;
  connectivity: VenueConnectivity;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
}

export enum VenueStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
  EXPANSION = 'expansion'
}

export interface VenuePerformance {
  revenue: number;
  occupancy: number;
  rating: number;
  customerCount: number;
  efficiency: number;
}

export interface VenueConnectivity {
  internetSpeed: number;
  latency: number;
  uptime: number;
  lastSync: Date;
}

export interface NetworkPerformance {
  totalRevenue: number;
  averageOccupancy: number;
  averageRating: number;
  totalCustomers: number;
  efficiency: number;
}

export interface NetworkConnectivity {
  averageSpeed: number;
  averageLatency: number;
  averageUptime: number;
  lastNetworkSync: Date;
}

export interface InternationalSettings {
  languages: string[];
  currencies: string[];
  timezones: string[];
  regulations: Regulation[];
  partnerships: Partnership[];
}

export interface Regulation {
  country: string;
  type: string;
  description: string;
  compliance: boolean;
  lastUpdated: Date;
}

export interface Partnership {
  partner: string;
  type: string;
  description: string;
  status: 'active' | 'pending' | 'expired';
  startDate: Date;
  endDate?: Date;
}

export interface FranchiseEvent {
  id: string;
  franchiseId: string;
  type: FranchiseEventType;
  title: string;
  description: string;
  data: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export enum FranchiseEventType {
  VENUE_ADDED = 'venue_added',
  VENUE_REMOVED = 'venue_removed',
  REVENUE_MILESTONE = 'revenue_milestone',
  PERFORMANCE_ALERT = 'performance_alert',
  COMPLIANCE_UPDATE = 'compliance_update',
  EXPANSION_ANNOUNCED = 'expansion_announced',
  PARTNERSHIP_FORMED = 'partnership_formed',
  REGULATION_CHANGE = 'regulation_change'
}

class FranchiseService {
  private franchises: Map<string, Franchise> = new Map();
  private networks: Map<string, VenueNetwork> = new Map();
  private events: FranchiseEvent[] = [];
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock franchise data
    const franchise: Franchise = {
      id: 'franchise_001',
      name: 'DojoPool Elite Network',
      ownerId: 'owner_001',
      country: 'United States',
      region: 'North America',
      status: FranchiseStatus.ACTIVE,
      tier: FranchiseTier.ELITE,
      venues: ['venue_001', 'venue_002', 'venue_003'],
      revenue: {
        monthly: 125000,
        quarterly: 375000,
        yearly: 1500000,
        growth: 15.5,
        projections: [
          {
            period: 'Q1 2025',
            projected: 350000,
            actual: 375000,
            variance: 7.1
          },
          {
            period: 'Q2 2025',
            projected: 400000,
            actual: 0,
            variance: 0
          }
        ]
      },
      performance: {
        totalVenues: 3,
        activeVenues: 3,
        totalRevenue: 1500000,
        averageRating: 4.7,
        customerSatisfaction: 92,
        operationalEfficiency: 88,
        marketShare: 15.2,
        growthRate: 15.5
      },
      settings: {
        branding: {
          logo: '/images/franchise-logo.png',
          colors: ['#00ff88', '#ff0099', '#00ccff'],
          name: 'DojoPool Elite',
          tagline: 'Where Champions Are Made',
          website: 'https://elite.dojopool.com',
          socialMedia: {
            facebook: 'https://facebook.com/dojopool-elite',
            instagram: 'https://instagram.com/dojopool-elite',
            twitter: 'https://twitter.com/dojopool-elite'
          }
        },
        operations: {
          businessHours: {
            monday: { open: '09:00', close: '23:00', closed: false },
            tuesday: { open: '09:00', close: '23:00', closed: false },
            wednesday: { open: '09:00', close: '23:00', closed: false },
            thursday: { open: '09:00', close: '23:00', closed: false },
            friday: { open: '09:00', close: '02:00', closed: false },
            saturday: { open: '10:00', close: '02:00', closed: false },
            sunday: { open: '10:00', close: '22:00', closed: false }
          },
          pricing: {
            baseHourlyRate: 25,
            tournamentFees: 50,
            membershipFees: 99,
            equipmentRental: 5,
            currency: 'USD'
          },
          services: {
            tournaments: true,
            lessons: true,
            equipmentRental: true,
            foodService: true,
            barService: true,
            proShop: true,
            events: true
          },
          qualityStandards: {
            cleanliness: 95,
            equipment: 98,
            service: 92,
            atmosphere: 94,
            safety: 99
          }
        },
        financial: {
          revenueSharing: 15,
          franchiseFees: 5000,
          marketingFund: 3,
          insurance: {
            liability: 1000000,
            property: 500000,
            workersComp: 100000,
            cyber: 250000
          },
          taxes: {
            corporateTax: 21,
            salesTax: 8.5,
            propertyTax: 2.5,
            payrollTax: 15.3
          }
        },
        compliance: {
          licenses: [
            {
              type: 'Business License',
              number: 'BL-2025-001',
              issuer: 'City of Los Angeles',
              expiryDate: new Date('2026-01-01'),
              status: 'active'
            }
          ],
          permits: [
            {
              type: 'Food Service Permit',
              number: 'FSP-2025-001',
              issuer: 'Health Department',
              expiryDate: new Date('2025-12-31'),
              status: 'active'
            }
          ],
          certifications: [
            {
              type: 'Pool Table Maintenance',
              issuer: 'Professional Billiards Association',
              issueDate: new Date('2024-06-01'),
              expiryDate: new Date('2025-06-01'),
              status: 'active'
            }
          ],
          inspections: [
            {
              type: 'Annual Safety Inspection',
              inspector: 'Safety Inspector',
              date: new Date('2025-01-15'),
              result: 'pass',
              notes: 'All safety standards met'
            }
          ]
        }
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };

    this.franchises.set(franchise.id, franchise);

    // Mock venue network
    const network: VenueNetwork = {
      id: 'network_001',
      franchiseId: 'franchise_001',
      venues: [
        {
          id: 'venue_001',
          name: 'DojoPool Downtown',
          location: {
            address: '123 Main Street',
            city: 'Los Angeles',
            state: 'CA',
            country: 'United States',
            postalCode: '90012',
            coordinates: { latitude: 34.0522, longitude: -118.2437 },
            timezone: 'America/Los_Angeles'
          },
          status: VenueStatus.ACTIVE,
          performance: {
            revenue: 500000,
            occupancy: 85,
            rating: 4.8,
            customerCount: 2500,
            efficiency: 92
          },
          connectivity: {
            internetSpeed: 1000,
            latency: 5,
            uptime: 99.9,
            lastSync: new Date()
          }
        },
        {
          id: 'venue_002',
          name: 'DojoPool Westside',
          location: {
            address: '456 Ocean Drive',
            city: 'Los Angeles',
            state: 'CA',
            country: 'United States',
            postalCode: '90210',
            coordinates: { latitude: 34.0736, longitude: -118.4004 },
            timezone: 'America/Los_Angeles'
          },
          status: VenueStatus.ACTIVE,
          performance: {
            revenue: 450000,
            occupancy: 78,
            rating: 4.6,
            customerCount: 2200,
            efficiency: 89
          },
          connectivity: {
            internetSpeed: 1000,
            latency: 8,
            uptime: 99.8,
            lastSync: new Date()
          }
        },
        {
          id: 'venue_003',
          name: 'DojoPool Valley',
          location: {
            address: '789 Valley Blvd',
            city: 'Los Angeles',
            state: 'CA',
            country: 'United States',
            postalCode: '91423',
            coordinates: { latitude: 34.1867, longitude: -118.4489 },
            timezone: 'America/Los_Angeles'
          },
          status: VenueStatus.ACTIVE,
          performance: {
            revenue: 300000,
            occupancy: 72,
            rating: 4.7,
            customerCount: 1800,
            efficiency: 87
          },
          connectivity: {
            internetSpeed: 500,
            latency: 12,
            uptime: 99.5,
            lastSync: new Date()
          }
        }
      ],
      performance: {
        totalRevenue: 1250000,
        averageOccupancy: 78.3,
        averageRating: 4.7,
        totalCustomers: 6500,
        efficiency: 89.3
      },
      connectivity: {
        averageSpeed: 833,
        averageLatency: 8.3,
        averageUptime: 99.7,
        lastNetworkSync: new Date()
      }
    };

    this.networks.set(network.id, network);
  }

  // Public API Methods
  getFranchises(): Franchise[] {
    return Array.from(this.franchises.values());
  }

  getFranchise(franchiseId: string): Franchise | null {
    return this.franchises.get(franchiseId) || null;
  }

  getVenueNetwork(franchiseId: string): VenueNetwork | null {
    return this.networks.get(franchiseId) || null;
  }

  createFranchise(data: Partial<Franchise>): Franchise {
    const franchise: Franchise = {
      id: `franchise_${Date.now()}`,
      name: data.name || 'New Franchise',
      ownerId: data.ownerId || 'owner_001',
      country: data.country || 'United States',
      region: data.region || 'North America',
      status: FranchiseStatus.PENDING,
      tier: FranchiseTier.STARTER,
      venues: [],
      revenue: {
        monthly: 0,
        quarterly: 0,
        yearly: 0,
        growth: 0,
        projections: []
      },
      performance: {
        totalVenues: 0,
        activeVenues: 0,
        totalRevenue: 0,
        averageRating: 0,
        customerSatisfaction: 0,
        operationalEfficiency: 0,
        marketShare: 0,
        growthRate: 0
      },
      settings: {
        branding: {
          logo: '',
          colors: ['#00ff88', '#ff0099'],
          name: '',
          tagline: '',
          website: '',
          socialMedia: {}
        },
        operations: {
          businessHours: {
            monday: { open: '09:00', close: '17:00', closed: false },
            tuesday: { open: '09:00', close: '17:00', closed: false },
            wednesday: { open: '09:00', close: '17:00', closed: false },
            thursday: { open: '09:00', close: '17:00', closed: false },
            friday: { open: '09:00', close: '17:00', closed: false },
            saturday: { open: '10:00', close: '16:00', closed: false },
            sunday: { open: '10:00', close: '16:00', closed: false }
          },
          pricing: {
            baseHourlyRate: 20,
            tournamentFees: 30,
            membershipFees: 50,
            equipmentRental: 3,
            currency: 'USD'
          },
          services: {
            tournaments: true,
            lessons: false,
            equipmentRental: true,
            foodService: false,
            barService: false,
            proShop: false,
            events: false
          },
          qualityStandards: {
            cleanliness: 90,
            equipment: 95,
            service: 85,
            atmosphere: 80,
            safety: 95
          }
        },
        financial: {
          revenueSharing: 10,
          franchiseFees: 2500,
          marketingFund: 2,
          insurance: {
            liability: 500000,
            property: 250000,
            workersComp: 50000,
            cyber: 100000
          },
          taxes: {
            corporateTax: 21,
            salesTax: 8.5,
            propertyTax: 2.5,
            payrollTax: 15.3
          }
        },
        compliance: {
          licenses: [],
          permits: [],
          certifications: [],
          inspections: []
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };

    this.franchises.set(franchise.id, franchise);
    this.publish('franchise_created', franchise);
    return franchise;
  }

  updateFranchise(franchiseId: string, updates: Partial<Franchise>): boolean {
    const franchise = this.franchises.get(franchiseId);
    if (!franchise) return false;

    Object.assign(franchise, updates, { updatedAt: new Date() });
    this.publish('franchise_updated', franchise);
    return true;
  }

  addVenueToFranchise(franchiseId: string, venueId: string): boolean {
    const franchise = this.franchises.get(franchiseId);
    if (!franchise) return false;

    if (!franchise.venues.includes(venueId)) {
      franchise.venues.push(venueId);
      franchise.performance.totalVenues = franchise.venues.length;
      franchise.performance.activeVenues = franchise.venues.length;
      franchise.updatedAt = new Date();
      
      this.publish('venue_added_to_franchise', { franchiseId, venueId });
      return true;
    }
    return false;
  }

  removeVenueFromFranchise(franchiseId: string, venueId: string): boolean {
    const franchise = this.franchises.get(franchiseId);
    if (!franchise) return false;

    const index = franchise.venues.indexOf(venueId);
    if (index > -1) {
      franchise.venues.splice(index, 1);
      franchise.performance.totalVenues = franchise.venues.length;
      franchise.performance.activeVenues = franchise.venues.length;
      franchise.updatedAt = new Date();
      
      this.publish('venue_removed_from_franchise', { franchiseId, venueId });
      return true;
    }
    return false;
  }

  upgradeFranchiseTier(franchiseId: string, newTier: FranchiseTier): boolean {
    const franchise = this.franchises.get(franchiseId);
    if (!franchise) return false;

    franchise.tier = newTier;
    franchise.updatedAt = new Date();
    
    this.publish('franchise_tier_upgraded', { franchiseId, newTier });
    return true;
  }

  getFranchisePerformance(franchiseId: string): FranchisePerformance | null {
    const franchise = this.franchises.get(franchiseId);
    return franchise ? franchise.performance : null;
  }

  getFranchiseRevenue(franchiseId: string): FranchiseRevenue | null {
    const franchise = this.franchises.get(franchiseId);
    return franchise ? franchise.revenue : null;
  }

  getFranchiseEvents(franchiseId: string, limit: number = 50): FranchiseEvent[] {
    return this.events
      .filter(event => event.franchiseId === franchiseId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
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
          console.error('Error in franchise service subscriber callback:', error);
        }
      });
    }
  }
}

export const franchiseService = new FranchiseService();
export default franchiseService; 