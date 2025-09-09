describe('Avatar Customization', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'mock-jwt-token');
    });

    // Intercept API calls
    cy.intercept('GET', '/api/v1/avatar/me', {
      fixture: 'user-avatar.json',
    }).as('getUserAvatar');
    cy.intercept('GET', '/api/v1/avatar/my-assets', {
      fixture: 'user-avatar-assets.json',
    }).as('getUserAssets');
    cy.intercept('GET', '/api/v1/avatar/assets', {
      fixture: 'avatar-assets.json',
    }).as('getAllAssets');
    cy.intercept('POST', '/api/v1/avatar/customize', {
      success: true,
      message: 'Avatar customized!',
    }).as('customizeAvatar');
    cy.intercept('POST', '/api/v1/avatar/purchase', { success: true }).as(
      'purchaseAsset'
    );
    cy.intercept('POST', '/api/v1/avatar/reset', {
      success: true,
      message: 'Avatar reset!',
    }).as('resetAvatar');

    // Visit the avatar customization page
    cy.visit('/profile/avatar');
  });

  it('should load the avatar customization page', () => {
    cy.wait(['@getUserAvatar', '@getUserAssets', '@getAllAssets']);

    // Check page title and description
    cy.contains('Avatar Customization').should('be.visible');
    cy.contains('Express your unique style').should('be.visible');

    // Check main components are loaded
    cy.get('[data-cy="avatar-preview"]').should('be.visible');
    cy.get('[data-cy="avatar-gallery"]').should('be.visible');
    cy.get('[data-cy="customization-tabs"]').should('be.visible');
  });

  it('should display user avatar preview with current configuration', () => {
    cy.wait(['@getUserAvatar', '@getUserAssets']);

    // Check avatar preview section
    cy.get('[data-cy="avatar-preview"]').within(() => {
      cy.get('[data-cy="avatar-image"]').should('be.visible');
      cy.get('[data-cy="avatar-username"]').should('contain', 'TestUser');
      cy.get('[data-cy="avatar-equipment-count"]').should('be.visible');
      cy.get('[data-cy="save-customization-btn"]').should('be.visible');
      cy.get('[data-cy="reset-avatar-btn"]').should('be.visible');
    });
  });

  it('should show avatar asset categories in tabs', () => {
    cy.wait('@getAllAssets');

    // Check tab navigation
    cy.get('[data-cy="customization-tabs"]').within(() => {
      cy.contains('Appearance').should('be.visible');
      cy.contains('Clothing').should('be.visible');
      cy.contains('Accessories').should('be.visible');
      cy.contains('Special').should('be.visible');
    });

    // Check that appearance tab is active by default
    cy.get('[data-cy="appearance-tab"]').should('have.class', 'Mui-selected');
  });

  it('should display avatar assets in gallery', () => {
    cy.wait('@getAllAssets');

    // Check assets are displayed
    cy.get('[data-cy="avatar-asset-card"]').should(
      'have.length.greaterThan',
      0
    );

    // Check asset card structure
    cy.get('[data-cy="avatar-asset-card"]')
      .first()
      .within(() => {
        cy.get('[data-cy="asset-name"]').should('be.visible');
        cy.get('[data-cy="asset-thumbnail"]').should('be.visible');
        cy.get('[data-cy="asset-price"]').should('be.visible');
        cy.get('[data-cy="asset-rarity-badge"]').should('be.visible');
      });
  });

  it('should filter assets by ownership status', () => {
    cy.wait(['@getUserAssets', '@getAllAssets']);

    // Check owned assets have different styling
    cy.get('[data-cy="owned-asset-card"]').should('have.length.greaterThan', 0);
    cy.get('[data-cy="unowned-asset-card"]').should(
      'have.length.greaterThan',
      0
    );

    // Owned assets should show "Equip" button
    cy.get('[data-cy="owned-asset-card"]')
      .first()
      .within(() => {
        cy.contains('Equip').should('be.visible');
      });

    // Unowned assets should show price and "Buy" button
    cy.get('[data-cy="unowned-asset-card"]')
      .first()
      .within(() => {
        cy.contains('Buy').should('be.visible');
        cy.get('[data-cy="asset-price"]').should('be.visible');
      });
  });

  it('should allow equipping owned avatar assets', () => {
    cy.wait(['@getUserAssets', '@getAllAssets']);

    // Click on an owned asset
    cy.get('[data-cy="owned-asset-card"]').first().click();

    // Check that asset is marked as equipped
    cy.get('[data-cy="equipped-asset-indicator"]').should('be.visible');

    // Check that equipment count in preview updates
    cy.get('[data-cy="avatar-equipment-count"]').should('contain', '1');
  });

  it('should show purchase dialog for unowned assets', () => {
    cy.wait(['@getUserAssets', '@getAllAssets']);

    // Click on an unowned asset
    cy.get('[data-cy="unowned-asset-card"]').first().click();

    // Check that purchase dialog opens
    cy.get('[data-cy="purchase-dialog"]').should('be.visible');

    // Check dialog content
    cy.get('[data-cy="purchase-dialog"]').within(() => {
      cy.get('[data-cy="asset-name"]').should('be.visible');
      cy.get('[data-cy="asset-description"]').should('be.visible');
      cy.get('[data-cy="asset-price"]').should('be.visible');
      cy.get('[data-cy="purchase-btn"]').should('be.visible');
      cy.get('[data-cy="cancel-purchase-btn"]').should('be.visible');
    });
  });

  it('should allow purchasing avatar assets', () => {
    cy.wait(['@getUserAssets', '@getAllAssets']);

    // Click on an unowned asset
    cy.get('[data-cy="unowned-asset-card"]').first().click();

    // Click purchase button
    cy.get('[data-cy="purchase-btn"]').click();

    // Wait for purchase request
    cy.wait('@purchaseAsset');

    // Check success notification
    cy.get('[data-cy="purchase-success-notification"]').should('be.visible');

    // Check that asset is now owned
    cy.get('[data-cy="owned-asset-card"]').should('have.length.greaterThan', 0);
  });

  it('should allow saving avatar customization', () => {
    cy.wait(['@getUserAvatar', '@getUserAssets', '@getAllAssets']);

    // Equip some assets
    cy.get('[data-cy="owned-asset-card"]').first().click();

    // Click save button
    cy.get('[data-cy="save-customization-btn"]').click();

    // Wait for save request
    cy.wait('@customizeAvatar');

    // Check success notification
    cy.get('[data-cy="customization-success-notification"]').should(
      'be.visible'
    );

    // Check that avatar preview reflects changes
    cy.get('[data-cy="avatar-equipment-count"]').should('not.contain', '0');
  });

  it('should allow resetting avatar to default', () => {
    cy.wait(['@getUserAvatar', '@getUserAssets']);

    // Click reset button
    cy.get('[data-cy="reset-avatar-btn"]').click();

    // Wait for reset request
    cy.wait('@resetAvatar');

    // Check success notification
    cy.get('[data-cy="reset-success-notification"]').should('be.visible');

    // Check that avatar is reset
    cy.get('[data-cy="avatar-equipment-count"]').should('contain', '0');
  });

  it('should show asset rarity with appropriate colors', () => {
    cy.wait('@getAllAssets');

    // Check rarity colors
    cy.get('[data-cy="rarity-common"]')
      .should('have.css', 'background-color')
      .and('equal', 'rgb(136, 136, 136)'); // #888

    cy.get('[data-cy="rarity-uncommon"]')
      .should('have.css', 'background-color')
      .and('equal', 'rgb(0, 168, 255)'); // #00a8ff

    cy.get('[data-cy="rarity-rare"]')
      .should('have.css', 'background-color')
      .and('equal', 'rgb(255, 170, 0)'); // #ffaa00

    cy.get('[data-cy="rarity-epic"]')
      .should('have.css', 'background-color')
      .and('equal', 'rgb(255, 107, 107)'); // #ff6b6b

    cy.get('[data-cy="rarity-legendary"]')
      .should('have.css', 'background-color')
      .and('equal', 'rgb(0, 255, 157)'); // #00ff9d
  });

  it('should show asset categories correctly', () => {
    cy.wait('@getAllAssets');

    // Check appearance tab content
    cy.get('[data-cy="appearance-tab"]').click();
    cy.get('[data-cy="hair-asset"]').should('be.visible');
    cy.get('[data-cy="face-asset"]').should('be.visible');

    // Check clothing tab content
    cy.get('[data-cy="clothing-tab"]').click();
    cy.get('[data-cy="clothes-top-asset"]').should('be.visible');
    cy.get('[data-cy="clothes-bottom-asset"]').should('be.visible');
    cy.get('[data-cy="shoes-asset"]').should('be.visible');

    // Check accessories tab content
    cy.get('[data-cy="accessories-tab"]').click();
    cy.get('[data-cy="accessory-head-asset"]').should('be.visible');
    cy.get('[data-cy="accessory-neck-asset"]').should('be.visible');

    // Check special tab content
    cy.get('[data-cy="special-tab"]').click();
    cy.get('[data-cy="weapon-asset"]').should('be.visible');
    cy.get('[data-cy="pet-asset"]').should('be.visible');
  });

  it('should handle loading states properly', () => {
    // Visit page without intercepting requests first
    cy.visit('/profile/avatar');

    // Check loading spinner
    cy.get('[data-cy="avatar-loading-spinner"]').should('be.visible');

    // Wait for requests to complete
    cy.wait(['@getUserAvatar', '@getUserAssets', '@getAllAssets']);

    // Check loading spinner is gone
    cy.get('[data-cy="avatar-loading-spinner"]').should('not.exist');
  });

  it('should handle API errors gracefully', () => {
    // Intercept with error responses
    cy.intercept('GET', '/api/v1/avatar/me', { statusCode: 500 }).as(
      'getUserAvatarError'
    );

    cy.visit('/profile/avatar');
    cy.wait('@getUserAvatarError');

    // Check error message is displayed
    cy.get('[data-cy="avatar-error-message"]').should('be.visible');
    cy.contains('Failed to load avatar data').should('be.visible');

    // Check retry button is available
    cy.get('[data-cy="retry-load-avatar"]').should('be.visible');
  });

  it('should show equipped assets with visual indicators', () => {
    cy.wait(['@getUserAssets', '@getAllAssets']);

    // Equip an asset
    cy.get('[data-cy="owned-asset-card"]').first().click();

    // Check equipped indicator
    cy.get('[data-cy="equipped-indicator"]').should('be.visible');

    // Check equipped asset has different styling
    cy.get('[data-cy="equipped-asset-card"]')
      .should('have.css', 'border-color')
      .and('equal', 'rgb(0, 255, 157)'); // #00ff9d
  });

  it('should show asset tooltips with detailed information', () => {
    cy.wait('@getAllAssets');

    // Hover over an asset card
    cy.get('[data-cy="avatar-asset-card"]').first().trigger('mouseover');

    // Check tooltip appears
    cy.get('[data-cy="asset-tooltip"]').should('be.visible');

    // Check tooltip content
    cy.get('[data-cy="asset-tooltip"]').within(() => {
      cy.get('[data-cy="asset-description"]').should('be.visible');
      cy.get('[data-cy="asset-stats"]').should('be.visible');
      cy.get('[data-cy="asset-rarity"]').should('be.visible');
    });
  });

  it('should handle empty asset categories gracefully', () => {
    // Mock empty assets for special category
    cy.intercept('GET', '/api/v1/avatar/assets?type=EFFECT', { body: [] }).as(
      'getEmptyAssets'
    );

    cy.get('[data-cy="special-tab"]').click();

    // Check empty state message
    cy.contains('No special items available yet').should('be.visible');
    cy.contains('Check back later for new customization options').should(
      'be.visible'
    );
  });

  it('should maintain customization state across tab switches', () => {
    cy.wait(['@getUserAssets', '@getAllAssets']);

    // Equip assets in different categories
    cy.get('[data-cy="appearance-tab"]').click();
    cy.get('[data-cy="owned-asset-card"]').first().click();

    cy.get('[data-cy="clothing-tab"]').click();
    cy.get('[data-cy="owned-asset-card"]').first().click();

    // Check that equipment count reflects both equipped items
    cy.get('[data-cy="avatar-equipment-count"]').should('contain', '2');

    // Switch back to appearance tab
    cy.get('[data-cy="appearance-tab"]').click();

    // Check that equipped asset still shows as equipped
    cy.get('[data-cy="equipped-asset-card"]').should('be.visible');
  });
});
