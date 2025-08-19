import { addMatchImageSnapshotCommand } from 'cypress-image-snapshot/command';

addMatchImageSnapshotCommand();

describe('Map Component Visual Regression', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
    cy.createGame('player1', 'player2');
    cy.wait(1000); // Wait for map to fully load
  });

  it('should match base map snapshot', () => {
    cy.findByTestId('google-map')
      .should('be.visible')
      .matchImageSnapshot('base-map');
  });

  it('should match map with player markers snapshot', () => {
    // Add mock player positions
    cy.window().then((win) => {
      const mockGeolocation = {
        getCurrentPosition: (cb: Function) => {
          cb({
            coords: {
              latitude: 40.7128,
              longitude: -74.006,
            },
          });
        },
      };
      // @ts-ignore
      win.navigator.geolocation = mockGeolocation;
    });

    cy.findByTestId('google-map')
      .should('be.visible')
      .matchImageSnapshot('map-with-players');
  });

  it('should match map with range circle snapshot', () => {
    cy.findByTestId('map-circle').should('be.visible');

    cy.findByTestId('google-map')
      .should('be.visible')
      .matchImageSnapshot('map-with-range');
  });

  describe('Map Theme Tests', () => {
    it('should match light theme snapshot', () => {
      cy.findByRole('button', { name: /light theme/i }).click();
      cy.findByTestId('google-map')
        .should('be.visible')
        .matchImageSnapshot('map-light-theme');
    });

    it('should match dark theme snapshot', () => {
      cy.findByRole('button', { name: /dark theme/i }).click();
      cy.findByTestId('google-map')
        .should('be.visible')
        .matchImageSnapshot('map-dark-theme');
    });
  });

  describe('Map Controls Tests', () => {
    it('should match zoomed map snapshot', () => {
      cy.findByRole('button', { name: /zoom in/i }).click();
      cy.findByTestId('google-map')
        .should('be.visible')
        .matchImageSnapshot('map-zoomed');
    });

    it('should match map with opened info window', () => {
      cy.findByTestId('player-marker').click();
      cy.findByTestId('info-window').should('be.visible');

      cy.findByTestId('google-map')
        .should('be.visible')
        .matchImageSnapshot('map-info-window');
    });
  });

  describe('Responsive Tests', () => {
    it('should match mobile view snapshot', () => {
      cy.viewport('iphone-x');
      cy.findByTestId('google-map')
        .should('be.visible')
        .matchImageSnapshot('map-mobile');
    });

    it('should match tablet view snapshot', () => {
      cy.viewport('ipad-2');
      cy.findByTestId('google-map')
        .should('be.visible')
        .matchImageSnapshot('map-tablet');
    });
  });
});
