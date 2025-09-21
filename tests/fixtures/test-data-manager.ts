import { faker } from '@faker-js/faker';

/**
 * Centralized Test Data Management System
 * Provides fixtures and factories for consistent test data
 */

export interface TestDataFixture<T> {
  name: string;
  data: T;
  description?: string;
}

export interface TestDataFactory<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
  createWithVariants(variants: Partial<T>[]): T[];
}

/**
 * Base Test Data Factory
 */
export abstract class BaseTestDataFactory<T> implements TestDataFactory<T> {
  protected abstract getDefaults(): T;

  create(overrides: Partial<T> = {}): T {
    return {
      ...this.getDefaults(),
      ...overrides,
    };
  }

  createMany(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  createWithVariants(variants: Partial<T>[]): T[] {
    return variants.map((variant) => this.create(variant));
  }
}

/**
 * User Factory
 */
export class UserFactory extends BaseTestDataFactory<any> {
  protected getDefaults() {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      passwordHash: faker.internet.password(),
      role: 'USER',
      isBanned: false,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      dojoCoinBalance: faker.number.int({ min: 0, max: 10000 }),
      profile: null,
    };
  }

  createPlayer(overrides: Partial<any> = {}) {
    return this.create({
      role: 'USER',
      dojoCoinBalance: faker.number.int({ min: 100, max: 5000 }),
      ...overrides,
    });
  }

  createAdmin(overrides: Partial<any> = {}) {
    return this.create({
      role: 'ADMIN',
      ...overrides,
    });
  }

  createVenueOwner(overrides: Partial<any> = {}) {
    return this.create({
      role: 'VENUE_OWNER',
      ...overrides,
    });
  }
}

/**
 * Profile Factory
 */
export class ProfileFactory extends BaseTestDataFactory<any> {
  protected getDefaults() {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      displayName: faker.person.fullName(),
      bio: faker.lorem.sentence(),
      avatarUrl: faker.image.avatarGitHub(),
      location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
      skillRating: faker.number.int({ min: 1000, max: 2500 }),
      clanTitle: null,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  }

  createProPlayer(overrides: Partial<any> = {}) {
    return this.create({
      skillRating: faker.number.int({ min: 2000, max: 2500 }),
      bio: faker.lorem.sentences(2),
      ...overrides,
    });
  }

  createBeginner(overrides: Partial<any> = {}) {
    return this.create({
      skillRating: faker.number.int({ min: 1000, max: 1300 }),
      ...overrides,
    });
  }
}

/**
 * Tournament Factory
 */
export class TournamentFactory extends BaseTestDataFactory<any> {
  protected getDefaults() {
    const startDate = faker.date.future();
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 1 day later

    return {
      id: faker.string.uuid(),
      name: `${faker.location.city()} Pool Championship`,
      status: faker.helpers.arrayElement([
        'upcoming',
        'active',
        'completed',
      ] as const),
      participants: faker.number.int({ min: 4, max: 32 }),
      maxParticipants: faker.number.int({ min: 16, max: 64 }),
      startDate,
      endDate,
      venueId: faker.string.uuid(),
      prizePool: faker.number.int({ min: 500, max: 10000 }),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  }

  createActive(overrides: Partial<any> = {}) {
    return this.create({
      status: 'active',
      participants: faker.number.int({ min: 8, max: 32 }),
      ...overrides,
    });
  }

  createUpcoming(overrides: Partial<any> = {}) {
    return this.create({
      status: 'upcoming',
      participants: faker.number.int({ min: 0, max: 8 }),
      ...overrides,
    });
  }

  createCompleted(overrides: Partial<any> = {}) {
    return this.create({
      status: 'completed',
      ...overrides,
    });
  }
}

/**
 * Match Factory
 */
export class MatchFactory extends BaseTestDataFactory<any> {
  protected getDefaults() {
    const scoreA = faker.number.int({ min: 0, max: 9 });
    const scoreB = faker.number.int({ min: 0, max: 9 });
    const winnerId =
      scoreA > scoreB ? faker.string.uuid() : faker.string.uuid();

    return {
      id: faker.string.uuid(),
      tournamentId: faker.string.uuid(),
      playerAId: faker.string.uuid(),
      playerBId: faker.string.uuid(),
      status: faker.helpers.arrayElement([
        'scheduled',
        'in_progress',
        'completed',
      ] as const),
      scoreA,
      scoreB,
      winnerId,
      startTime: faker.date.recent(),
      endTime: faker.date.recent(),
      venueId: faker.string.uuid(),
      tableId: faker.string.uuid(),
    };
  }

  createCompleted(overrides: Partial<any> = {}) {
    const scoreA = faker.number.int({ min: 0, max: 9 });
    const scoreB = faker.number.int({ min: 0, max: 9 });
    const playerAId = faker.string.uuid();
    const playerBId = faker.string.uuid();

    return this.create({
      status: 'completed',
      scoreA,
      scoreB,
      playerAId,
      playerBId,
      winnerId: scoreA > scoreB ? playerAId : playerBId,
      endTime: faker.date.recent(),
      ...overrides,
    });
  }

  createInProgress(overrides: Partial<any> = {}) {
    return this.create({
      status: 'in_progress',
      scoreA: faker.number.int({ min: 0, max: 4 }),
      scoreB: faker.number.int({ min: 0, max: 4 }),
      winnerId: null,
      endTime: null,
      ...overrides,
    });
  }
}

/**
 * Venue Factory
 */
export class VenueFactory extends BaseTestDataFactory<any> {
  protected getDefaults() {
    return {
      id: faker.string.uuid(),
      name: `${faker.company.name()} Pool Hall`,
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      website: faker.internet.url(),
      ownerId: faker.string.uuid(),
      isActive: true,
      tablesCount: faker.number.int({ min: 4, max: 20 }),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  }

  createPremium(overrides: Partial<any> = {}) {
    return this.create({
      tablesCount: faker.number.int({ min: 12, max: 20 }),
      website: faker.internet.url(),
      ...overrides,
    });
  }

  createLocal(overrides: Partial<any> = {}) {
    return this.create({
      tablesCount: faker.number.int({ min: 4, max: 8 }),
      website: null,
      ...overrides,
    });
  }
}

/**
 * Clan Factory
 */
export class ClanFactory extends BaseTestDataFactory<any> {
  protected getDefaults() {
    return {
      id: faker.string.uuid(),
      name: `${faker.company.buzzAdjective()} ${faker.animal.type()}`,
      description: faker.lorem.sentences(2),
      leaderId: faker.string.uuid(),
      memberCount: faker.number.int({ min: 5, max: 50 }),
      totalPoints: faker.number.int({ min: 1000, max: 50000 }),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  }

  createElite(overrides: Partial<any> = {}) {
    return this.create({
      memberCount: faker.number.int({ min: 20, max: 50 }),
      totalPoints: faker.number.int({ min: 20000, max: 50000 }),
      ...overrides,
    });
  }

  createNew(overrides: Partial<any> = {}) {
    return this.create({
      memberCount: faker.number.int({ min: 5, max: 15 }),
      totalPoints: faker.number.int({ min: 1000, max: 5000 }),
      createdAt: faker.date.recent(),
      ...overrides,
    });
  }
}

/**
 * Test Data Fixtures Registry
 */
export class TestDataFixtures {
  private static fixtures = new Map<string, TestDataFixture<any>[]>();

  static register(category: string, fixtures: TestDataFixture<any>[]): void {
    this.fixtures.set(category, fixtures);
  }

  static get(category: string): TestDataFixture<any>[] {
    return this.fixtures.get(category) || [];
  }

  static getByName(
    category: string,
    name: string
  ): TestDataFixture<any> | undefined {
    const fixtures = this.get(category);
    return fixtures.find((fixture) => fixture.name === name);
  }

  static getAll(): Record<string, TestDataFixture<any>[]> {
    const result: Record<string, TestDataFixture<any>[]> = {};
    this.fixtures.forEach((fixtures, category) => {
      result[category] = fixtures;
    });
    return result;
  }
}

/**
 * Predefined Test Data Fixtures
 */
export const predefinedFixtures = {
  users: [
    {
      name: 'basic-user',
      description: 'Basic user with minimal data',
      data: new UserFactory().createPlayer(),
    },
    {
      name: 'admin-user',
      description: 'Administrator user',
      data: new UserFactory().createAdmin(),
    },
    {
      name: 'venue-owner',
      description: 'Venue owner user',
      data: new UserFactory().createVenueOwner(),
    },
  ],

  tournaments: [
    {
      name: 'active-tournament',
      description: 'Currently active tournament',
      data: new TournamentFactory().createActive(),
    },
    {
      name: 'upcoming-tournament',
      description: 'Tournament starting soon',
      data: new TournamentFactory().createUpcoming(),
    },
    {
      name: 'completed-tournament',
      description: 'Finished tournament',
      data: new TournamentFactory().createCompleted(),
    },
  ],

  matches: [
    {
      name: 'completed-match',
      description: 'Finished match with scores',
      data: new MatchFactory().createCompleted(),
    },
    {
      name: 'ongoing-match',
      description: 'Match currently in progress',
      data: new MatchFactory().createInProgress(),
    },
  ],

  venues: [
    {
      name: 'premium-venue',
      description: 'High-end venue with many tables',
      data: new VenueFactory().createPremium(),
    },
    {
      name: 'local-venue',
      description: 'Local pool hall',
      data: new VenueFactory().createLocal(),
    },
  ],

  clans: [
    {
      name: 'elite-clan',
      description: 'Large, successful clan',
      data: new ClanFactory().createElite(),
    },
    {
      name: 'new-clan',
      description: 'Recently formed clan',
      data: new ClanFactory().createNew(),
    },
  ],
};

/**
 * Initialize predefined fixtures
 */
export function initializeFixtures(): void {
  Object.entries(predefinedFixtures).forEach(([category, fixtures]) => {
    TestDataFixtures.register(category, fixtures);
  });
}

/**
 * Test Data Manager
 * Main interface for accessing test data
 */
class TestDataManager {
  private static factories = new Map<string, TestDataFactory<any>>();
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;

    // Register factories
    this.factories.set('user', new UserFactory());
    this.factories.set('profile', new ProfileFactory());
    this.factories.set('tournament', new TournamentFactory());
    this.factories.set('match', new MatchFactory());
    this.factories.set('venue', new VenueFactory());
    this.factories.set('clan', new ClanFactory());

    // Initialize fixtures
    initializeFixtures();

    this.initialized = true;
  }

  static getFactory<T>(name: string): TestDataFactory<T> {
    this.initialize();
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Factory '${name}' not found`);
    }
    return factory;
  }

  static create<T>(factoryName: string, overrides?: Partial<T>): T {
    return this.getFactory<T>(factoryName).create(overrides);
  }

  static createMany<T>(
    factoryName: string,
    count: number,
    overrides?: Partial<T>
  ): T[] {
    return this.getFactory<T>(factoryName).createMany(count, overrides);
  }

  static getFixture<T>(category: string, name: string): T {
    const fixture = TestDataFixtures.getByName(category, name);
    if (!fixture) {
      throw new Error(`Fixture '${name}' not found in category '${category}'`);
    }
    return fixture.data;
  }

  static createRelatedData(): {
    user: any;
    profile: any;
    venue: any;
    tournament: any;
    match: any;
  } {
    const user = this.create('user');
    const profile = this.create('profile', { userId: user.id });
    const venue = this.create('venue', { ownerId: user.id });
    const tournament = this.create('tournament', { venueId: venue.id });
    const match = this.create('match', {
      tournamentId: tournament.id,
      playerAId: user.id,
      venueId: venue.id,
    });

    return { user, profile, venue, tournament, match };
  }
}

// Initialize on module load
TestDataManager.initialize();

/**
 * Test Data Scenarios
 * Predefined scenarios for complex test cases
 */
export class TestDataScenarios {
  static createTournamentScenario() {
    const { user, profile, venue, tournament } =
      TestDataManager.createRelatedData();
    const participants = TestDataManager.createMany('user', 8);

    return {
      organizer: user,
      organizerProfile: profile,
      venue,
      tournament,
      participants,
      matches: participants.map((participant, index) =>
        TestDataManager.create('match', {
          tournamentId: tournament.id,
          playerAId: user.id,
          playerBId: participant.id,
          venueId: venue.id,
        })
      ),
    };
  }

  static createClanScenario() {
    const clan = TestDataManager.create('clan');
    const leader = TestDataManager.create('user');
    const members = TestDataManager.createMany('user', clan.memberCount - 1);

    return {
      clan,
      leader,
      members: [leader, ...members],
      profiles: [leader, ...members].map((member) =>
        TestDataManager.create('profile', { userId: member.id })
      ),
    };
  }

  static createVenueScenario() {
    const venue = TestDataManager.create('venue');
    const owner = TestDataManager.create('user', { id: venue.ownerId });
    const tournaments = TestDataManager.createMany('tournament', 3, {
      venueId: venue.id,
    });

    return {
      venue,
      owner,
      tournaments,
      activeTournament: tournaments.find((t) => t.status === 'active'),
    };
  }
}

export { TestDataManager };
