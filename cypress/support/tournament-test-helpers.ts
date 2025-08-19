// Tournament Test Helpers
// This file provides utilities for tournament testing and test data management

export interface TournamentTestData {
  name: string;
  description: string;
  tournamentType: string;
  gameType: string;
  maxParticipants: number;
  entryFee: number;
  startDate: string;
  endDate: string;
  rules: string;
}

export class TournamentTestHelpers {
  /**
   * Generate unique tournament test data
   */
  static generateTournamentData(
    overrides: Partial<TournamentTestData> = {}
  ): TournamentTestData {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);

    // Default test data
    const defaultData: TournamentTestData = {
      name: `Test Tournament ${timestamp}-${randomString}`,
      description: `Automated test tournament created at ${new Date().toISOString()}`,
      tournamentType: 'SINGLE_ELIMINATION',
      gameType: '8_BALL',
      maxParticipants: 16,
      entryFee: 50,
      startDate: this.generateFutureDate(1), // Tomorrow
      endDate: this.generateFutureDate(2), // Day after tomorrow
      rules: 'Standard pool rules apply. No coaching allowed during matches.',
    };

    return { ...defaultData, ...overrides };
  }

  /**
   * Generate a future date string for testing
   */
  static generateFutureDate(daysFromNow: number): string {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysFromNow);
    return futureDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  }

  /**
   * Generate tournament data for different game types
   */
  static generateGameTypeSpecificData(
    gameType: string
  ): Partial<TournamentTestData> {
    const gameTypeConfigs = {
      '8_BALL': {
        description: '8-Ball Pool Tournament - Standard rules',
        rules: 'Standard 8-ball rules. Call your shots clearly.',
        maxParticipants: 16,
        entryFee: 50,
      },
      '9_BALL': {
        description: '9-Ball Pool Tournament - Fast-paced action',
        rules: '9-ball rules. Lowest numbered ball first.',
        maxParticipants: 32,
        entryFee: 75,
      },
      '10_BALL': {
        description: '10-Ball Pool Tournament - Call shot required',
        rules: '10-ball rules. All shots must be called.',
        maxParticipants: 24,
        entryFee: 60,
      },
      STRAIGHT_POOL: {
        description: 'Straight Pool Tournament - Classic 14.1',
        rules: 'Straight pool rules. Race to 100 points.',
        maxParticipants: 8,
        entryFee: 100,
      },
    };

    return gameTypeConfigs[gameType] || {};
  }

  /**
   * Generate tournament data for different tournament types
   */
  static generateTournamentTypeSpecificData(
    tournamentType: string
  ): Partial<TournamentTestData> {
    const tournamentTypeConfigs = {
      SINGLE_ELIMINATION: {
        description: 'Single Elimination Tournament',
        maxParticipants: 16,
        rules: "Single elimination format. Lose once and you're out.",
      },
      DOUBLE_ELIMINATION: {
        description: 'Double Elimination Tournament',
        maxParticipants: 32,
        rules: 'Double elimination format. Second chance bracket available.',
      },
      ROUND_ROBIN: {
        description: 'Round Robin Tournament',
        maxParticipants: 8,
        rules: 'Round robin format. Everyone plays everyone.',
      },
      SWISS_SYSTEM: {
        description: 'Swiss System Tournament',
        maxParticipants: 64,
        rules: 'Swiss system format. Players matched by similar records.',
      },
    };

    return tournamentTypeConfigs[tournamentType] || {};
  }

  /**
   * Create a comprehensive tournament test scenario
   */
  static createTournamentScenario(
    scenario: 'basic' | 'premium' | 'large' | 'free'
  ): TournamentTestData {
    const scenarios = {
      basic: {
        name: 'Basic Pool Tournament',
        tournamentType: 'SINGLE_ELIMINATION',
        gameType: '8_BALL',
        maxParticipants: 16,
        entryFee: 25,
      },
      premium: {
        name: 'Premium 9-Ball Championship',
        tournamentType: 'DOUBLE_ELIMINATION',
        gameType: '9_BALL',
        maxParticipants: 64,
        entryFee: 150,
      },
      large: {
        name: 'Large Scale Tournament',
        tournamentType: 'SWISS_SYSTEM',
        gameType: '10_BALL',
        maxParticipants: 128,
        entryFee: 75,
      },
      free: {
        name: 'Free Entry Tournament',
        tournamentType: 'ROUND_ROBIN',
        gameType: '8_BALL',
        maxParticipants: 8,
        entryFee: 0,
      },
    };

    const baseData = this.generateTournamentData();
    const scenarioData = scenarios[scenario];

    return {
      ...baseData,
      ...scenarioData,
      name: `${scenarioData.name} ${Date.now()}`,
    };
  }

  /**
   * Validate tournament form data
   */
  static validateTournamentFormData(data: TournamentTestData): string[] {
    const errors: string[] = [];

    if (!data.name.trim()) {
      errors.push('Tournament name is required');
    }

    if (!data.startDate) {
      errors.push('Start date is required');
    }

    if (!data.endDate) {
      errors.push('End date is required');
    }

    if (data.startDate && data.endDate) {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (startDate >= endDate) {
        errors.push('End date must be after start date');
      }
    }

    if (data.maxParticipants < 2) {
      errors.push('Minimum 2 participants required');
    }

    if (data.entryFee < 0) {
      errors.push('Entry fee cannot be negative');
    }

    return errors;
  }

  /**
   * Generate test data for edge cases
   */
  static generateEdgeCaseData(): Partial<TournamentTestData>[] {
    return [
      {
        name: 'A'.repeat(101), // Name too long
        description: 'Test description',
        startDate: '2024-12-31T10:00',
        endDate: '2025-01-01T10:00',
      },
      {
        name: 'Valid Name',
        startDate: '2024-12-31T10:00',
        endDate: '2024-12-30T10:00', // End before start
      },
      {
        name: 'Valid Name',
        startDate: '2024-12-31T10:00',
        endDate: '2025-01-01T10:00',
        maxParticipants: 1, // Too few participants
      },
      {
        name: 'Valid Name',
        startDate: '2024-12-31T10:00',
        endDate: '2025-01-01T10:00',
        entryFee: -50, // Negative entry fee
      },
    ];
  }
}

// Add tournament helper commands to Cypress
Cypress.Commands.add(
  'createTournament',
  (scenario: 'basic' | 'premium' | 'large' | 'free' = 'basic') => {
    const tournamentData =
      TournamentTestHelpers.createTournamentScenario(scenario);

    // Open create tournament modal
    cy.get('button').contains('🏆 Create Tournament').click();

    // Fill form with generated data
    cy.get('[name=name]').type(tournamentData.name);
    cy.get('[name=description]').type(tournamentData.description);
    cy.get('[name=tournamentType]').select(tournamentData.tournamentType);
    cy.get('[name=gameType]').select(tournamentData.gameType);
    cy.get('[name=maxParticipants]')
      .clear()
      .type(tournamentData.maxParticipants.toString());
    cy.get('[name=entryFee]').clear().type(tournamentData.entryFee.toString());
    cy.get('[name=startDate]').type(tournamentData.startDate);
    cy.get('[name=endDate]').type(tournamentData.endDate);
    cy.get('[name=rules]').type(tournamentData.rules);

    // Submit form
    cy.get('button[type=submit]').click();

    // Return the tournament data for further assertions
    return tournamentData;
  }
);

Cypress.Commands.add(
  'generateTournamentData',
  (overrides?: Partial<TournamentTestData>) => {
    return TournamentTestHelpers.generateTournamentData(overrides);
  }
);

// Extend Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      createTournament(
        scenario?: 'basic' | 'premium' | 'large' | 'free'
      ): Chainable<TournamentTestData>;
      generateTournamentData(
        overrides?: Partial<TournamentTestData>
      ): Chainable<TournamentTestData>;
    }
  }
}
