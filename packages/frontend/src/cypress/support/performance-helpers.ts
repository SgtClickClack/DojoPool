import { performanceThresholds } from '../config/performance-thresholds';

export const performanceHelpers = {
  // Core Web Vitals monitoring
  monitorWebVitals() {
    cy.measurePerformance('LCP', () => {
      cy.visit('/dashboard');
      cy.findByTestId('dashboard-content').should('exist');
    }, performanceThresholds.webVitals.lcp);

    cy.measurePerformance('FID', () => {
      cy.findByRole('button', { name: /create game/i }).click();
    }, performanceThresholds.webVitals.fid);
  },

  // Game performance monitoring
  monitorGamePerformance(gameId: string) {
    // Game initialization
    cy.measurePerformance('game-init', () => {
      cy.visit(`/games/${gameId}`);
      cy.findByRole('button', { name: /make shot/i }).should('be.enabled');
    }, performanceThresholds.criticalPath.gameInitialization);

    // Shot response time
    cy.measurePerformance('shot-response', () => {
      cy.makeShot(1, true);
    }, performanceThresholds.criticalPath.shotResponse);

    // State updates
    cy.measurePerformance('state-update', () => {
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('stateUpdate', {
          detail: { newState: true }
        }));
      });
    }, performanceThresholds.criticalPath.stateUpdate);
  },

  // Memory monitoring
  monitorMemoryUsage(operation: () => void) {
    cy.monitorMemory(operation, performanceThresholds.memory.maxSessionIncrease);
  },

  // Network performance monitoring
  monitorNetworkPerformance(route: string) {
    cy.measureNetworkPerformance(
      route,
      performanceThresholds.network.maxTransferSize,
      performanceThresholds.network.maxRequests
    );
  },

  // Animation performance monitoring
  monitorAnimationPerformance(selector: string) {
    cy.measureAnimationPerformance(
      selector,
      1000, // 1 second measurement
      performanceThresholds.animation.minFPS
    );
  },

  // Resource usage monitoring
  monitorResourceUsage() {
    cy.window().then((win) => {
      // @ts-ignore
      const cpuUsage = win.performance?.cpu?.usage || 0;
      expect(cpuUsage).to.be.lessThan(performanceThresholds.resources.maxCPUUsage);

      // @ts-ignore
      const memoryUsage = win.performance?.memory?.usedJSHeapSize / (1024 * 1024);
      expect(memoryUsage).to.be.lessThan(performanceThresholds.resources.maxRAMUsage);
    });
  },

  // API performance monitoring
  monitorAPIPerformance(endpoint: string) {
    let startTime: number;
    
    cy.intercept(endpoint, (req) => {
      startTime = Date.now();
      req.continue();
    }).as('apiRequest');

    cy.wait('@apiRequest').then(() => {
      const responseTime = Date.now() - startTime;
      expect(responseTime).to.be.lessThan(performanceThresholds.api.maxResponseTime);
    });
  },

  // Real-time updates monitoring
  monitorRealtimePerformance() {
    let messageCount = 0;
    let latencySum = 0;

    cy.window().then((win) => {
      win.addEventListener('message', (event) => {
        if (event.data.type === 'websocket') {
          messageCount++;
          latencySum += event.data.latency;
        }
      });
    });

    cy.wrap(null).then(() => {
      if (messageCount > 0) {
        const avgLatency = latencySum / messageCount;
        expect(avgLatency).to.be.lessThan(performanceThresholds.realtime.maxLatency);
      }
    });
  },

  // Asset loading monitoring
  monitorAssetLoading() {
    const loadTimes: number[] = [];

    cy.window().then((win) => {
      win.performance.getEntriesByType('resource').forEach((entry) => {
        if (entry.initiatorType === 'img') {
          loadTimes.push(entry.duration);
        }
      });

      const maxLoadTime = Math.max(...loadTimes);
      expect(maxLoadTime).to.be.lessThan(performanceThresholds.assets.maxImageLoadTime);
    });
  },

  // Venue performance monitoring
  monitorVenuePerformance(venueId: string) {
    cy.measurePerformance('venue-load', () => {
      cy.visit(`/venues/${venueId}`);
      cy.findByTestId('venue-content').should('exist');
    }, performanceThresholds.venue.maxLoadTime);

    // Monitor concurrent players
    cy.window().then((win) => {
      const playerCount = win.document.querySelectorAll('[data-testid="player-avatar"]').length;
      expect(playerCount).to.be.lessThan(performanceThresholds.venue.maxConcurrentPlayers);
    });
  }
}; 