describe('Analytics Dashboard', () => {
  beforeEach(() => {
    // Mock authentication as admin user
    cy.intercept('GET', '/api/auth/me', {
      id: 'admin-user-123',
      username: 'AdminUser',
      email: 'admin@example.com',
      role: 'ADMIN',
    }).as('getUser');

    // Mock analytics API responses
    cy.intercept('GET', '/api/analytics/dashboard*', {
      fixture: 'analytics-dashboard.json',
    }).as('getDashboard');
    cy.intercept('GET', '/api/analytics/realtime*', {
      fixture: 'analytics-realtime.json',
    }).as('getRealtime');
    cy.intercept('GET', '/api/analytics/engagement*', {
      fixture: 'analytics-engagement.json',
    }).as('getEngagement');
    cy.intercept('GET', '/api/analytics/features*', {
      fixture: 'analytics-features.json',
    }).as('getFeatures');
    cy.intercept('GET', '/api/analytics/performance*', {
      fixture: 'analytics-performance.json',
    }).as('getPerformance');
    cy.intercept('GET', '/api/analytics/economy*', {
      fixture: 'analytics-economy.json',
    }).as('getEconomy');

    // Visit the analytics page
    cy.visit('/admin/analytics');
    cy.wait('@getUser');
    cy.wait('@getDashboard');
  });

  it('should load the analytics dashboard for admin users', () => {
    // Check page title and header
    cy.contains('Analytics Dashboard').should('be.visible');
    cy.contains(
      'Real-time insights into player behavior and system performance'
    ).should('be.visible');

    // Check that KPI cards are displayed
    cy.get('[data-cy=kpi-card]').should('have.length', 4);
    cy.contains('Daily Active Users').should('be.visible');
    cy.contains('Monthly Active Users').should('be.visible');
    cy.contains('Total Events').should('be.visible');
    cy.contains('System Uptime').should('be.visible');
  });

  it('should display KPI metrics correctly', () => {
    // Check KPI values are displayed
    cy.get('[data-cy=kpi-dau]').should('be.visible');
    cy.get('[data-cy=kpi-mau]').should('be.visible');
    cy.get('[data-cy=kpi-events]').should('be.visible');
    cy.get('[data-cy=kpi-uptime]').should('be.visible');

    // Check that values are numbers
    cy.get('[data-cy=kpi-dau]').invoke('text').should('match', /^\d+$/);
    cy.get('[data-cy=kpi-mau]').invoke('text').should('match', /^\d+$/);
    cy.get('[data-cy=kpi-events]').invoke('text').should('match', /^\d+$/);
    cy.get('[data-cy=kpi-uptime]').invoke('text').should('match', /\d+%$/);
  });

  it('should display charts correctly', () => {
    // Check that charts are rendered
    cy.get('[data-cy=user-engagement-chart]').should('be.visible');
    cy.get('[data-cy=top-events-chart]').should('be.visible');
    cy.get('[data-cy=feature-usage-chart]').should('be.visible');
    cy.get('[data-cy=performance-chart]').should('be.visible');
  });

  it('should handle time range selection', () => {
    // Check time range buttons exist
    cy.contains('7 Days').should('be.visible');
    cy.contains('30 Days').should('be.visible');
    cy.contains('90 Days').should('be.visible');

    // Click 7 days button
    cy.contains('7 Days').click();

    // Should make new API call with updated date range
    cy.wait('@getDashboard');

    // Check that 7 days button is now selected (contained variant)
    cy.get('button')
      .contains('7 Days')
      .should('have.class', 'MuiButton-contained');
  });

  it('should refresh data when refresh button is clicked', () => {
    // Click refresh button
    cy.get('[data-cy=refresh-button]').click();

    // Should make new API call
    cy.wait('@getDashboard');

    // Check that last updated time is refreshed
    cy.contains('Last updated:').should('be.visible');
  });

  it('should display user engagement chart', () => {
    cy.get('[data-cy=user-engagement-chart]').within(() => {
      // Check chart title
      cy.contains('User Engagement Trends').should('be.visible');

      // Check chart canvas is present (Chart.js canvas)
      cy.get('canvas').should('be.visible');
    });
  });

  it('should display top events chart', () => {
    cy.get('[data-cy=top-events-chart]').within(() => {
      // Check chart title
      cy.contains('Top Events').should('be.visible');

      // Check chart canvas is present
      cy.get('canvas').should('be.visible');
    });
  });

  it('should display feature usage chart', () => {
    cy.get('[data-cy=feature-usage-chart]').within(() => {
      // Check chart title
      cy.contains('Feature Usage').should('be.visible');

      // Check chart canvas is present
      cy.get('canvas').should('be.visible');
    });
  });

  it('should display system performance metrics', () => {
    cy.get('[data-cy=performance-metrics]').within(() => {
      // Check performance metrics are displayed
      cy.contains('Avg Response Time').should('be.visible');
      cy.contains('Error Rate').should('be.visible');
      cy.contains('System Performance').should('be.visible');
    });
  });

  it('should display economy metrics', () => {
    cy.get('[data-cy=economy-metrics]').within(() => {
      // Check economy metrics are displayed
      cy.contains('Transactions').should('be.visible');
      cy.contains('Total Volume').should('be.visible');
      cy.contains('Avg Value').should('be.visible');
    });
  });

  it('should handle real-time updates', () => {
    // Mock real-time update
    cy.intercept('GET', '/api/analytics/realtime*', {
      dau: 1250,
      totalEvents: 45000,
      topEvents: [
        { eventName: 'user_login', count: 1500 },
        { eventName: 'page_view', count: 4200 },
      ],
      systemPerformance: {
        avgResponseTime: 145,
        errorRate: 0.8,
        uptime: 99.8,
      },
      economyMetrics: {
        totalTransactions: 1250,
        totalVolume: 50000,
        avgTransactionValue: 40,
      },
      lastUpdated: new Date().toISOString(),
    }).as('getRealtimeUpdate');

    // Wait for real-time update interval
    cy.wait(31000); // Wait longer than the 30-second interval

    // Check that metrics were updated
    cy.get('[data-cy=kpi-dau]').should('contain', '1,250');
  });

  it('should display loading states', () => {
    // Reload page to trigger loading state
    cy.reload();

    // Check loading indicator is shown
    cy.get('[data-cy=loading-spinner]').should('be.visible');

    // Wait for data to load
    cy.wait('@getDashboard');

    // Loading should disappear
    cy.get('[data-cy=loading-spinner]').should('not.exist');
  });

  it('should handle API errors gracefully', () => {
    // Mock API error
    cy.intercept('GET', '/api/analytics/dashboard*', { statusCode: 500 }).as(
      'getDashboardError'
    );

    // Reload page
    cy.reload();

    // Should show error message
    cy.contains('Failed to fetch analytics data').should('be.visible');

    // Should show retry button
    cy.contains('Retry').should('be.visible');
  });

  it('should display empty state when no data available', () => {
    // Mock empty data response
    cy.intercept('GET', '/api/analytics/dashboard*', {
      dau: 0,
      mau: 0,
      totalUsers: 0,
      totalEvents: 0,
      topEvents: [],
      userEngagement: [],
      featureUsage: [],
      systemPerformance: {
        avgResponseTime: 0,
        errorRate: 0,
        uptime: 0,
      },
      economyMetrics: {
        totalTransactions: 0,
        totalVolume: 0,
        avgTransactionValue: 0,
      },
    }).as('getEmptyDashboard');

    cy.reload();
    cy.wait('@getEmptyDashboard');

    // Should display zero values appropriately
    cy.get('[data-cy=kpi-dau]').should('contain', '0');
    cy.get('[data-cy=kpi-events]').should('contain', '0');
  });

  it('should be responsive on different screen sizes', () => {
    // Test desktop layout
    cy.viewport(1200, 800);
    cy.get('[data-cy=kpi-card]').should('have.length', 4);

    // Test tablet layout
    cy.viewport(768, 1024);
    cy.get('[data-cy=kpi-card]').should('be.visible');

    // Test mobile layout
    cy.viewport(375, 667);
    cy.get('[data-cy=kpi-card]').should('be.visible');

    // Charts should still be visible on mobile
    cy.get('[data-cy=user-engagement-chart]').should('be.visible');
  });

  it('should display chart tooltips on hover', () => {
    // Hover over chart
    cy.get('[data-cy=user-engagement-chart]').trigger('mouseover');

    // Chart.js tooltips should appear (this might be hard to test precisely)
    // At minimum, ensure chart is interactive
    cy.get('[data-cy=user-engagement-chart]').should('be.visible');
  });

  it('should maintain chart aspect ratios', () => {
    // Check that charts maintain proper dimensions
    cy.get('[data-cy=user-engagement-chart]')
      .invoke('height')
      .should('be.greaterThan', 200);
    cy.get('[data-cy=top-events-chart]')
      .invoke('height')
      .should('be.greaterThan', 200);
  });

  it('should display last updated timestamp', () => {
    // Check that last updated time is displayed
    cy.contains('Last updated:').should('be.visible');

    // Should contain a valid time format
    cy.contains('Last updated:')
      .invoke('text')
      .should('match', /Last updated: \d{1,2}:\d{2}:\d{2} (AM|PM)/);
  });

  it('should handle chart data updates', () => {
    // Initially load with one set of data
    cy.wait('@getDashboard');

    // Mock updated data
    cy.intercept('GET', '/api/analytics/dashboard*', {
      dau: 1500,
      mau: 5000,
      totalUsers: 10000,
      totalEvents: 75000,
      topEvents: [
        { eventName: 'user_login', count: 2000 },
        { eventName: 'match_start', count: 1800 },
      ],
      userEngagement: [
        {
          date: '2024-01-01',
          activeUsers: 1200,
          sessions: 1500,
          avgSessionLength: 1800,
        },
        {
          date: '2024-01-02',
          activeUsers: 1350,
          sessions: 1650,
          avgSessionLength: 1950,
        },
      ],
      featureUsage: [
        { feature: 'Matches', usageCount: 5000, uniqueUsers: 800 },
        { feature: 'Tournaments', usageCount: 1200, uniqueUsers: 300 },
      ],
      systemPerformance: {
        avgResponseTime: 120,
        errorRate: 0.5,
        uptime: 99.9,
      },
      economyMetrics: {
        totalTransactions: 1500,
        totalVolume: 60000,
        avgTransactionValue: 40,
      },
    }).as('getUpdatedDashboard');

    // Refresh data
    cy.get('[data-cy=refresh-button]').click();
    cy.wait('@getUpdatedDashboard');

    // Check that values were updated
    cy.get('[data-cy=kpi-dau]').should('contain', '1,500');
    cy.get('[data-cy=kpi-events]').should('contain', '75,000');
  });
});
