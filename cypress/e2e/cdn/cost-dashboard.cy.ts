import { faker } from '@faker-js/faker';

describe('CDN Cost Dashboard', () => {
  const mockUser = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    role: 'admin'
  };

  const mockCostReport = {
    optimization: {
      optimized: true,
      costs: {
        total_cost: 1000.0,
        bandwidth_cost: 600.0,
        request_cost: 400.0
      },
      savings: 200.0,
      optimization_time: 1.5,
      timestamp: new Date().toISOString()
    },
    usage: {
      hourly_usage: Array.from({ length: 24 }, (_, i) => ({ hour: i, value: 100 })),
      daily_usage: { '2024-01-01': 2400 },
      weekly_usage: { '2024-W01': 16800 }
    },
    projections: {
      daily: { '2024-01-02': 2500 },
      weekly: { '2024-W02': 17500 },
      monthly: { '2024-01': 70000 }
    },
    timestamp: new Date().toISOString()
  };

  beforeEach(() => {
    // Mock authentication
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: mockUser
    });

    // Mock cost report API
    cy.intercept('GET', '/api/cdn/cost', {
      statusCode: 200,
      body: mockCostReport
    });
  });

  it('should load the CDN cost dashboard', () => {
    cy.visit('/dashboard/cdn/cost');
    cy.get('[data-testid="cdn-cost-dashboard"]').should('exist');
    cy.get('[data-testid="cost-overview"]').should('exist');
    cy.get('[data-testid="usage-patterns"]').should('exist');
    cy.get('[data-testid="cost-projections"]').should('exist');
  });

  it('should display cost overview correctly', () => {
    cy.visit('/dashboard/cdn/cost');
    
    // Check total cost
    cy.get('[data-testid="total-cost"]')
      .should('contain', '$1,000.00');
    
    // Check cost breakdown
    cy.get('[data-testid="bandwidth-cost"]')
      .should('contain', '$600.00');
    cy.get('[data-testid="request-cost"]')
      .should('contain', '$400.00');
    
    // Check savings
    cy.get('[data-testid="cost-savings"]')
      .should('contain', '$200.00');
  });

  it('should display usage patterns correctly', () => {
    cy.visit('/dashboard/cdn/cost');
    
    // Check hourly usage chart
    cy.get('[data-testid="hourly-usage-chart"]')
      .should('exist')
      .and('be.visible');
    
    // Check daily usage
    cy.get('[data-testid="daily-usage"]')
      .should('contain', '2,400');
    
    // Check weekly usage
    cy.get('[data-testid="weekly-usage"]')
      .should('contain', '16,800');
  });

  it('should display cost projections correctly', () => {
    cy.visit('/dashboard/cdn/cost');
    
    // Check daily projection
    cy.get('[data-testid="daily-projection"]')
      .should('contain', '2,500');
    
    // Check weekly projection
    cy.get('[data-testid="weekly-projection"]')
      .should('contain', '17,500');
    
    // Check monthly projection
    cy.get('[data-testid="monthly-projection"]')
      .should('contain', '70,000');
  });

  it('should handle optimization controls', () => {
    cy.visit('/dashboard/cdn/cost');
    
    // Test cost threshold slider
    cy.get('[data-testid="cost-threshold-slider"]')
      .should('exist')
      .and('be.visible');
    
    // Test optimization button
    cy.get('[data-testid="optimize-costs-button"]')
      .should('exist')
      .and('be.visible')
      .click();
    
    // Check for optimization feedback
    cy.get('[data-testid="optimization-feedback"]')
      .should('exist')
      .and('contain', 'Optimization completed');
  });

  it('should handle error states', () => {
    // Mock API error
    cy.intercept('GET', '/api/cdn/cost', {
      statusCode: 500,
      body: { error: 'Failed to fetch cost data' }
    });

    cy.visit('/dashboard/cdn/cost');
    
    // Check error message
    cy.get('[data-testid="error-message"]')
      .should('exist')
      .and('contain', 'Failed to fetch cost data');
    
    // Check retry button
    cy.get('[data-testid="retry-button"]')
      .should('exist')
      .and('be.visible');
  });

  it('should handle loading states', () => {
    // Mock slow API response
    cy.intercept('GET', '/api/cdn/cost', (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: mockCostReport
      });
    });

    cy.visit('/dashboard/cdn/cost');
    
    // Check loading indicators
    cy.get('[data-testid="loading-indicator"]')
      .should('exist')
      .and('be.visible');
    
    // Wait for content to load
    cy.get('[data-testid="cdn-cost-dashboard"]')
      .should('exist')
      .and('be.visible');
  });

  it('should handle unauthorized access', () => {
    // Mock unauthorized user
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: { ...mockUser, role: 'user' }
    });

    cy.visit('/dashboard/cdn/cost');
    
    // Check unauthorized message
    cy.get('[data-testid="unauthorized-message"]')
      .should('exist')
      .and('contain', 'Insufficient permissions');
  });

  it('should handle data refresh', () => {
    cy.visit('/dashboard/cdn/cost');
    
    // Click refresh button
    cy.get('[data-testid="refresh-button"]')
      .should('exist')
      .and('be.visible')
      .click();
    
    // Check loading state
    cy.get('[data-testid="loading-indicator"]')
      .should('exist')
      .and('be.visible');
    
    // Wait for new data
    cy.get('[data-testid="cdn-cost-dashboard"]')
      .should('exist')
      .and('be.visible');
  });
}); 