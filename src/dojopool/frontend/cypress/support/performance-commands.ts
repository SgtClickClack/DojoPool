// @ts-nocheck
declare namespace Cypress {
  interface Chainable {
    measurePerformance(name: string, operation: () => void, threshold: number): Chainable<void>;
    monitorMemory(operation: () => void, maxIncreaseMB: number): Chainable<void>;
    measureNetworkPerformance(route: string, maxSize: number, maxRequests: number): Chainable<void>;
    measureAnimationPerformance(selector: string, duration: number, minFPS: number): Chainable<void>;
  }
}

// Performance measurement command
Cypress.Commands.add('measurePerformance', (name, operation, threshold) => {
  cy.window().then((win) => {
    win.performance.mark(`${name}-start`);
    operation();
    win.performance.mark(`${name}-end`);
    win.performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = win.performance.getEntriesByName(name)[0];
    expect(measure.duration).to.be.lessThan(threshold);
  });
});

// Memory monitoring command
Cypress.Commands.add('monitorMemory', (operation, maxIncreaseMB) => {
  cy.window().then((win) => {
    const initialMemory = win.performance.memory?.usedJSHeapSize || 0;
    operation();
    const finalMemory = win.performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
    expect(memoryIncrease).to.be.lessThan(maxIncreaseMB);
  });
});

// Network performance measurement command
Cypress.Commands.add('measureNetworkPerformance', (route, maxSize, maxRequests) => {
  const resources = [];
  
  cy.window().then((win) => {
    const observer = new win.PerformanceObserver((list) => {
      resources.push(...list.getEntries());
    });
    observer.observe({ entryTypes: ['resource'] });
  });

  cy.visit(route);

  cy.window().then(() => {
    const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    expect(totalSize).to.be.lessThan(maxSize);
    expect(resources.length).to.be.lessThan(maxRequests);
  });
});

// Animation performance measurement command
Cypress.Commands.add('measureAnimationPerformance', (selector, duration, minFPS) => {
  let frameCount = 0;
  
  cy.get(selector).should('exist').then(() => {
    cy.window().then((win) => {
      win.requestAnimationFrame(function count() {
        frameCount++;
        win.requestAnimationFrame(count);
      });
    });

    cy.wait(duration).then(() => {
      const fps = frameCount / (duration / 1000);
      expect(fps).to.be.greaterThan(minFPS);
    });
  });
}); 