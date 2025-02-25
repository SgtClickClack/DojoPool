describe('API Mocking Tests', () => {
  let users;
  let games;
  let venues;

  before(() => {
    cy.loadFixtures().then((fixtures) => {
      users = fixtures.users;
      games = fixtures.games;
      venues = fixtures.venues;
    });
  });

  beforeEach(() => {
    cy.login(users.validUser.email, users.validUser.password);
  });

  describe('Authentication API', () => {
    it('should handle invalid token responses', () => {
      cy.intercept('GET', '/api/auth/validate', {
        statusCode: 401,
        body: { error: 'Invalid token' }
      });

      cy.visit('/dashboard');
      cy.url().should('include', '/login');
      cy.findByText(/Session expired/i).should('exist');
    });

    it('should retry failed login attempts', () => {
      let attempts = 0;
      cy.intercept('POST', '/api/auth/login', (req) => {
        attempts++;
        if (attempts < 3) {
          req.reply({ statusCode: 500 });
        } else {
          req.reply({
            statusCode: 200,
            body: { token: 'valid-token', user: users.validUser }
          });
        }
      });

      cy.visit('/login');
      cy.findByLabelText(/email/i).type(users.validUser.email);
      cy.findByLabelText(/password/i).type(users.validUser.password);
      cy.findByRole('button', { name: /sign in/i }).click();

      cy.url().should('include', '/dashboard');
    });
  });

  describe('Game API', () => {
    it('should handle delayed game state updates', () => {
      cy.intercept('GET', '/api/games/*', (req) => {
        req.reply((res) => {
          res.delay(2000);
          res.send({
            statusCode: 200,
            body: games.activeGame
          });
        });
      });

      cy.visit(`/games/${games.activeGame.id}`);
      cy.findByTestId('loading-indicator').should('exist');
      cy.findByTestId('game-state').should('exist');
    });

    it('should queue offline actions', () => {
      const offlineActions = [];
      
      cy.intercept('POST', '/api/games/*/actions', (req) => {
        offlineActions.push(req.body);
        req.reply({ statusCode: 503 });
      });

      cy.visit(`/games/${games.activeGame.id}`);
      cy.makeShot(1, true);
      cy.makeShot(2, true);

      // Restore connection
      cy.intercept('POST', '/api/games/*/actions', (req) => {
        req.reply({ statusCode: 200 });
      });

      cy.window().then(() => {
        expect(offlineActions).to.have.length(2);
      });
    });
  });

  describe('WebSocket Mocking', () => {
    it('should handle WebSocket disconnections', () => {
      cy.visit(`/games/${games.activeGame.id}`);

      // Simulate WebSocket disconnect
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'));
        win.WebSocket.prototype.close.call(
          win.WebSocket.prototype
        );
      });

      cy.findByText(/Connection lost/i).should('exist');

      // Simulate reconnect
      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'));
      });

      cy.findByText(/Reconnected/i).should('exist');
    });

    it('should buffer messages during reconnection', () => {
      const bufferedMessages = [];
      
      cy.visit(`/games/${games.activeGame.id}`);

      // Intercept and buffer messages during disconnect
      cy.window().then((win) => {
        const originalSend = win.WebSocket.prototype.send;
        win.WebSocket.prototype.send = function(data) {
          bufferedMessages.push(JSON.parse(data));
        };

        // Simulate disconnect and actions
        win.dispatchEvent(new Event('offline'));
        cy.makeShot(1, true);
        cy.makeShot(2, true);

        // Restore connection
        win.WebSocket.prototype.send = originalSend;
        win.dispatchEvent(new Event('online'));
      });

      // Verify buffered messages sent
      cy.window().then(() => {
        expect(bufferedMessages).to.have.length(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting', () => {
      let requestCount = 0;
      cy.intercept('GET', '/api/**', (req) => {
        requestCount++;
        if (requestCount > 5) {
          req.reply({
            statusCode: 429,
            body: { error: 'Too many requests' }
          });
        }
      });

      cy.visit('/dashboard');
      cy.findByText(/Rate limit exceeded/i).should('exist');
    });

    it('should handle API validation errors', () => {
      cy.intercept('POST', '/api/games/new', {
        statusCode: 400,
        body: {
          errors: {
            player2Id: 'Invalid player ID',
            venue: 'Required field'
          }
        }
      });

      cy.visit('/games/new');
      cy.findByRole('button', { name: /create game/i }).click();
      cy.findByText(/Invalid player ID/i).should('exist');
      cy.findByText(/Required field/i).should('exist');
    });
  });

  describe('Cache Management', () => {
    it('should use cached data when offline', () => {
      // Prime the cache
      cy.visit('/venues');
      
      // Force offline and verify cached data
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'));
      });

      cy.reload();
      cy.findByTestId('venues-list').should('exist');
      cy.findByText(venues.venues[0].name).should('exist');
    });

    it('should update cache when back online', () => {
      const updatedVenue = {
        ...venues.venues[0],
        name: 'Updated Venue Name'
      };

      cy.visit('/venues');

      // Go offline with cached data
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'));
      });

      // Come back online with updated data
      cy.intercept('GET', '/api/venues/*', {
        statusCode: 200,
        body: updatedVenue
      });

      cy.window().then((win) => {
        win.dispatchEvent(new Event('online'));
      });

      cy.findByText('Updated Venue Name').should('exist');
    });
  });

  describe('Real-time Synchronization', () => {
    it('should handle concurrent updates', () => {
      cy.visit(`/games/${games.activeGame.id}`);

      // Simulate concurrent update
      cy.intercept('POST', '/api/games/*/actions', (req) => {
        // Simulate another player's action arriving first
        req.reply({
          statusCode: 409,
          body: {
            error: 'Conflict',
            currentState: {
              ...games.activeGame,
              currentTurn: 'user_456'
            }
          }
        });
      });

      cy.makeShot(1, true);
      cy.findByText(/Game state updated/i).should('exist');
      cy.findByText(/Your turn will be queued/i).should('exist');
    });

    it('should resolve conflicts in shot order', () => {
      const shotHistory = [];
      
      cy.intercept('POST', '/api/games/*/actions', (req) => {
        shotHistory.push(req.body);
        req.reply({ statusCode: 200 });
      });

      cy.visit(`/games/${games.activeGame.id}`);
      
      // Make simultaneous shots
      cy.makeShot(1, true);
      cy.makeShot(2, true);

      // Verify shot order maintained
      cy.window().then(() => {
        expect(shotHistory[0].timestamp).to.be.lessThan(shotHistory[1].timestamp);
      });
    });
  });
}); 