// Test Data Cleanup Utilities
// This file provides utilities for managing test data and ensuring test isolation

export class TestDataCleanup {
  private static testUsers: string[] = [];
  private static testEmails: string[] = [];

  /**
   * Register a test user for cleanup
   */
  static registerTestUser(email: string): void {
    this.testUsers.push(email);
  }

  /**
   * Register a test email for cleanup
   */
  static registerTestEmail(email: string): void {
    this.testEmails.push(email);
  }

  /**
   * Clean up all registered test data
   */
  static async cleanupTestData(): Promise<void> {
    try {
      // Clean up test users from database
      for (const email of this.testUsers) {
        await this.deleteTestUser(email);
      }

      // Clean up test emails
      for (const email of this.testEmails) {
        await this.deleteTestEmail(email);
      }

      // Clear arrays
      this.testUsers = [];
      this.testEmails = [];

      cy.log('Test data cleanup completed');
    } catch (error) {
      cy.log(`Error during test data cleanup: ${error}`);
    }
  }

  /**
   * Delete a test user from the database
   */
  private static async deleteTestUser(email: string): Promise<void> {
    try {
      // Make API call to delete test user
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/api/test/users/${encodeURIComponent(
          email
        )}`,
        headers: {
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      });
    } catch (error) {
      cy.log(`Failed to delete test user ${email}: ${error}`);
    }
  }

  /**
   * Delete a test email from the database
   */
  private static async deleteTestEmail(email: string): Promise<void> {
    try {
      // Make API call to delete test email
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/api/test/emails/${encodeURIComponent(
          email
        )}`,
        headers: {
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      });
    } catch (error) {
      cy.log(`Failed to delete test email ${email}: ${error}`);
    }
  }

  /**
   * Generate a unique test identifier
   */
  static generateTestId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-${timestamp}-${random}`;
  }

  /**
   * Generate a unique test email
   */
  static generateTestEmail(): string {
    const testId = this.generateTestId();
    return `${testId}@test.dojopool.com`;
  }
}

// Add cleanup command to Cypress
Cypress.Commands.add('cleanupTestData', () => {
  TestDataCleanup.cleanupTestData();
});

// Add test data registration commands
Cypress.Commands.add('registerTestUser', (email: string) => {
  TestDataCleanup.registerTestUser(email);
});

Cypress.Commands.add('registerTestEmail', (email: string) => {
  TestDataCleanup.registerTestEmail(email);
});

// Extend Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      cleanupTestData(): Chainable<void>;
      registerTestUser(email: string): Chainable<void>;
      registerTestEmail(email: string): Chainable<void>;
    }
  }
}
