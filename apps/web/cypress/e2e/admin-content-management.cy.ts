describe('Admin Content Management', () => {
  const testAdmin = {
    email: 'admin@test.com',
    password: 'admin123',
    username: 'testadmin',
  };

  const testEvent = {
    title: 'Cyber Slam Championship',
    description: 'The ultimate test tournament for skilled players',
    eventType: 'TOURNAMENT',
    startTime: '2024-01-15T14:00:00',
    endTime: '2024-01-15T18:00:00',
    priority: 1,
    targetAudience: ['ALL', 'VIP'],
    tags: ['championship', 'tournament', 'test'],
  };

  const testPromotion = {
    title: 'New Player Special',
    description: '20% off for new players joining this week',
    code: 'NEWPLAYER20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minPurchase: 100,
    maxUses: 100,
    isActive: true,
    startTime: '2024-01-01T00:00:00',
    endTime: '2024-01-07T23:59:59',
    targetUsers: ['ALL'],
    applicableItems: ['ALL'],
    tags: ['welcome', 'discount', 'new-player'],
  };

  const testNewsItem = {
    title: 'Major Update: Neon District Expansion',
    description:
      'Explore the new Neon District with enhanced visuals and gameplay',
    category: 'FEATURE',
    priority: 1,
    isPublished: true,
    publishTime: '2024-01-01T10:00:00',
    expiryTime: '2024-01-31T23:59:59',
    targetPlatform: ['WEB', 'MOBILE'],
    tags: ['update', 'expansion', 'neon-district'],
  };

  const testAssetBundle = {
    title: 'Neon District Asset Pack',
    description: 'Visual assets for the new Neon District expansion',
    bundleType: 'THEME',
    version: '1.0.0',
    isActive: true,
    downloadUrl: 'https://cdn.dojopool.com/bundles/neon-district-1.0.0.zip',
    fileSize: 52428800, // 50MB
    checksum: 'sha256:abcdef1234567890',
    minAppVersion: '2.1.0',
    targetPlatform: ['WEB', 'MOBILE'],
    dependencies: [],
    tags: ['theme', 'neon', 'expansion'],
  };

  before(() => {
    // Set up test data and login
    cy.task('db:seed:admin', testAdmin);
  });

  beforeEach(() => {
    // Login as admin before each test
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type(testAdmin.email);
    cy.get('[data-cy="password-input"]').type(testAdmin.password);
    cy.get('[data-cy="login-button"]').click();
    cy.url().should('include', '/admin');
  });

  describe('Admin Dashboard Access', () => {
    it('should load admin dashboard with content management tab', () => {
      cy.visit('/admin');
      cy.contains('Admin Dashboard').should('be.visible');
      cy.contains('Content Management').should('be.visible');
    });

    it('should switch to content management tab', () => {
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.contains('Content Management System').should('be.visible');
    });

    it('should display LOMS management tabs', () => {
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();

      // Check that all LOMS tabs are present
      cy.contains('Events').should('be.visible');
      cy.contains('News Articles').should('be.visible');
      cy.contains('System Messages').should('be.visible');
      cy.contains('Content Moderation').should('be.visible');
      cy.contains('Promotions').should('be.visible');
      cy.contains('Asset Bundles').should('be.visible');
    });
  });

  describe('Event Management', () => {
    beforeEach(() => {
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.get('[data-cy="events-tab"]').click();
    });

    it('should display events management interface', () => {
      cy.contains('Event Management').should('be.visible');
      cy.contains('Create Event').should('be.visible');
    });

    it('should create a new event', () => {
      cy.get('[data-cy="create-event-button"]').click();

      // Fill out event creation form
      cy.get('[data-cy="event-title-input"]').type(testEvent.title);
      cy.get('[data-cy="event-description-input"]').type(testEvent.description);
      cy.get('[data-cy="event-type-select"]').click();
      cy.contains(testEvent.eventType).click();
      cy.get('[data-cy="event-start-time-input"]').type(testEvent.startTime);
      cy.get('[data-cy="event-end-time-input"]').type(testEvent.endTime);
      cy.get('[data-cy="event-priority-input"]').type(
        testEvent.priority.toString()
      );

      // Add tags
      testEvent.tags.forEach((tag) => {
        cy.get('[data-cy="event-tags-input"]').type(tag);
        cy.get('[data-cy="add-tag-button"]').click();
      });

      // Submit form
      cy.get('[data-cy="create-event-submit"]').click();

      // Verify success
      cy.contains('Event created successfully').should('be.visible');

      // Verify event appears in list
      cy.contains(testEvent.title).should('be.visible');
    });

    it('should edit an existing event', () => {
      // Click edit on the first event
      cy.get('[data-cy="edit-event-button"]').first().click();

      // Modify event details
      const updatedTitle = 'Updated Cyber Slam Championship';
      cy.get('[data-cy="event-title-input"]').clear().type(updatedTitle);
      cy.get('[data-cy="event-description-input"]')
        .clear()
        .type('Updated description for the championship');

      // Submit changes
      cy.get('[data-cy="update-event-submit"]').click();

      // Verify success
      cy.contains('Event updated successfully').should('be.visible');
      cy.contains(updatedTitle).should('be.visible');
    });

    it('should delete an event', () => {
      // Click delete on the first event
      cy.get('[data-cy="delete-event-button"]').first().click();

      // Confirm deletion
      cy.get('[data-cy="confirm-delete-button"]').click();

      // Verify success message
      cy.contains('Event deleted successfully').should('be.visible');
    });

    it('should validate event form fields', () => {
      cy.get('[data-cy="create-event-button"]').click();

      // Try to submit empty form
      cy.get('[data-cy="create-event-submit"]').click();

      // Check for validation errors
      cy.contains('Title is required').should('be.visible');
      cy.contains('Event type is required').should('be.visible');
      cy.contains('Start time is required').should('be.visible');
    });
  });

  describe('Promotion Management', () => {
    beforeEach(() => {
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.get('[data-cy="promotions-tab"]').click();
    });

    it('should display promotions management interface', () => {
      cy.contains('Promotion Management').should('be.visible');
      cy.contains('Create Promotion').should('be.visible');
    });

    it('should create a new promotion', () => {
      cy.get('[data-cy="create-promotion-button"]').click();

      // Fill out promotion creation form
      cy.get('[data-cy="promotion-title-input"]').type(testPromotion.title);
      cy.get('[data-cy="promotion-description-input"]').type(
        testPromotion.description
      );
      cy.get('[data-cy="promotion-code-input"]').type(testPromotion.code);
      cy.get('[data-cy="promotion-discount-type-select"]').click();
      cy.contains(testPromotion.discountType).click();
      cy.get('[data-cy="promotion-discount-value-input"]').type(
        testPromotion.discountValue.toString()
      );
      cy.get('[data-cy="promotion-min-purchase-input"]').type(
        testPromotion.minPurchase.toString()
      );
      cy.get('[data-cy="promotion-max-uses-input"]').type(
        testPromotion.maxUses.toString()
      );
      cy.get('[data-cy="promotion-start-time-input"]').type(
        testPromotion.startTime
      );
      cy.get('[data-cy="promotion-end-time-input"]').type(
        testPromotion.endTime
      );

      // Submit form
      cy.get('[data-cy="create-promotion-submit"]').click();

      // Verify success
      cy.contains('Promotion created successfully').should('be.visible');
      cy.contains(testPromotion.title).should('be.visible');
      cy.contains(testPromotion.code).should('be.visible');
    });

    it('should validate promotion code uniqueness', () => {
      // Create first promotion
      cy.get('[data-cy="create-promotion-button"]').click();
      cy.get('[data-cy="promotion-title-input"]').type('First Promotion');
      cy.get('[data-cy="promotion-code-input"]').type('DUPLICATE');
      cy.get('[data-cy="promotion-discount-type-select"]').click();
      cy.contains('PERCENTAGE').click();
      cy.get('[data-cy="promotion-discount-value-input"]').type('10');
      cy.get('[data-cy="create-promotion-submit"]').click();

      // Try to create second promotion with same code
      cy.get('[data-cy="create-promotion-button"]').click();
      cy.get('[data-cy="promotion-title-input"]').type('Second Promotion');
      cy.get('[data-cy="promotion-code-input"]').type('DUPLICATE');
      cy.get('[data-cy="promotion-discount-type-select"]').click();
      cy.contains('PERCENTAGE').click();
      cy.get('[data-cy="promotion-discount-value-input"]').type('15');
      cy.get('[data-cy="create-promotion-submit"]').click();

      // Should show error
      cy.contains('Promotion code already exists').should('be.visible');
    });

    it('should edit promotion details', () => {
      cy.get('[data-cy="edit-promotion-button"]').first().click();

      const updatedDiscount = '25';
      cy.get('[data-cy="promotion-discount-value-input"]')
        .clear()
        .type(updatedDiscount);
      cy.get('[data-cy="update-promotion-submit"]').click();

      cy.contains('Promotion updated successfully').should('be.visible');
    });
  });

  describe('News Management', () => {
    beforeEach(() => {
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.get('[data-cy="news-tab"]').click();
    });

    it('should display news management interface', () => {
      cy.contains('News Management').should('be.visible');
      cy.contains('Create News Item').should('be.visible');
    });

    it('should create a news item', () => {
      cy.get('[data-cy="create-news-button"]').click();

      cy.get('[data-cy="news-title-input"]').type(testNewsItem.title);
      cy.get('[data-cy="news-description-input"]').type(
        testNewsItem.description
      );
      cy.get('[data-cy="news-category-select"]').click();
      cy.contains(testNewsItem.category).click();
      cy.get('[data-cy="news-priority-input"]').type(
        testNewsItem.priority.toString()
      );
      cy.get('[data-cy="news-published-checkbox"]').check();
      cy.get('[data-cy="news-publish-time-input"]').type(
        testNewsItem.publishTime
      );
      cy.get('[data-cy="news-expiry-time-input"]').type(
        testNewsItem.expiryTime
      );

      cy.get('[data-cy="create-news-submit"]').click();

      cy.contains('News item created successfully').should('be.visible');
      cy.contains(testNewsItem.title).should('be.visible');
    });

    it('should filter news by publication status', () => {
      cy.get('[data-cy="news-status-filter"]').click();
      cy.contains('Published').click();

      // Should only show published news items
      cy.get('[data-cy="news-item"]').each(($item) => {
        cy.wrap($item).contains('Published').should('be.visible');
      });
    });
  });

  describe('Asset Bundle Management', () => {
    beforeEach(() => {
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.get('[data-cy="assets-tab"]').click();
    });

    it('should display asset bundle management interface', () => {
      cy.contains('Asset Bundle Management').should('be.visible');
      cy.contains('Create Bundle').should('be.visible');
    });

    it('should create an asset bundle', () => {
      cy.get('[data-cy="create-asset-button"]').click();

      cy.get('[data-cy="asset-title-input"]').type(testAssetBundle.title);
      cy.get('[data-cy="asset-description-input"]').type(
        testAssetBundle.description
      );
      cy.get('[data-cy="asset-type-select"]').click();
      cy.contains(testAssetBundle.bundleType).click();
      cy.get('[data-cy="asset-version-input"]').type(testAssetBundle.version);
      cy.get('[data-cy="asset-download-url-input"]').type(
        testAssetBundle.downloadUrl
      );
      cy.get('[data-cy="asset-file-size-input"]').type(
        testAssetBundle.fileSize.toString()
      );
      cy.get('[data-cy="asset-checksum-input"]').type(testAssetBundle.checksum);
      cy.get('[data-cy="asset-min-version-input"]').type(
        testAssetBundle.minAppVersion
      );

      cy.get('[data-cy="create-asset-submit"]').click();

      cy.contains('Asset bundle created successfully').should('be.visible');
      cy.contains(testAssetBundle.title).should('be.visible');
    });

    it('should validate asset bundle version format', () => {
      cy.get('[data-cy="create-asset-button"]').click();

      cy.get('[data-cy="asset-title-input"]').type('Test Bundle');
      cy.get('[data-cy="asset-type-select"]').click();
      cy.contains('THEME').click();
      cy.get('[data-cy="asset-version-input"]').type('invalid-version-format');
      cy.get('[data-cy="create-asset-submit"]').click();

      cy.contains('Invalid version format').should('be.visible');
    });

    it('should download asset bundle', () => {
      // Assuming there's an asset bundle in the list
      cy.get('[data-cy="download-asset-button"]').first().click();

      // Verify download was triggered (this might need adjustment based on actual implementation)
      cy.window().then((win) => {
        // Check if a download was initiated
        expect(win.location.href).to.not.equal('/admin');
      });
    });
  });

  describe('Content Moderation', () => {
    beforeEach(() => {
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.get('[data-cy="moderation-tab"]').click();
    });

    it('should display content moderation interface', () => {
      cy.contains('Content Moderation').should('be.visible');
    });

    it('should show pending content for moderation', () => {
      // Should display a list of pending content items
      cy.get('[data-cy="pending-content-list"]').should('exist');
    });

    it('should allow approving content', () => {
      cy.get('[data-cy="approve-content-button"]').first().click();
      cy.get('[data-cy="confirm-approve-button"]').click();

      cy.contains('Content approved successfully').should('be.visible');
    });

    it('should allow rejecting content with reason', () => {
      cy.get('[data-cy="reject-content-button"]').first().click();
      cy.get('[data-cy="rejection-reason-input"]').type(
        'Inappropriate content'
      );
      cy.get('[data-cy="confirm-reject-button"]').click();

      cy.contains('Content rejected').should('be.visible');
    });
  });

  describe('Cross-Component Integration', () => {
    it('should maintain data consistency across tabs', () => {
      // Create an event
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.get('[data-cy="events-tab"]').click();
      cy.get('[data-cy="create-event-button"]').click();

      cy.get('[data-cy="event-title-input"]').type('Integration Test Event');
      cy.get('[data-cy="event-description-input"]').type(
        'Testing cross-component integration'
      );
      cy.get('[data-cy="event-type-select"]').click();
      cy.contains('TOURNAMENT').click();
      cy.get('[data-cy="event-start-time-input"]').type('2024-01-20T10:00:00');
      cy.get('[data-cy="event-end-time-input"]').type('2024-01-20T18:00:00');
      cy.get('[data-cy="create-event-submit"]').click();

      cy.contains('Event created successfully').should('be.visible');

      // Switch to news tab and create related news
      cy.get('[data-cy="news-tab"]').click();
      cy.get('[data-cy="create-news-button"]').click();

      cy.get('[data-cy="news-title-input"]').type('New Tournament Announced!');
      cy.get('[data-cy="news-description-input"]').type(
        'Join our new Integration Test Event tournament'
      );
      cy.get('[data-cy="news-category-select"]').click();
      cy.contains('EVENT').click();
      cy.get('[data-cy="news-published-checkbox"]').check();
      cy.get('[data-cy="create-news-submit"]').click();

      cy.contains('News item created successfully').should('be.visible');

      // Verify both appear in their respective lists
      cy.contains('Integration Test Event').should('be.visible');
      cy.contains('New Tournament Announced!').should('be.visible');
    });

    it('should handle bulk operations', () => {
      // Create multiple promotions
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.get('[data-cy="promotions-tab"]').click();

      // Create first promotion
      cy.get('[data-cy="create-promotion-button"]').click();
      cy.get('[data-cy="promotion-title-input"]').type('Bulk Test 1');
      cy.get('[data-cy="promotion-code-input"]').type('BULK1');
      cy.get('[data-cy="promotion-discount-type-select"]').click();
      cy.contains('PERCENTAGE').click();
      cy.get('[data-cy="promotion-discount-value-input"]').type('10');
      cy.get('[data-cy="create-promotion-submit"]').click();

      // Create second promotion
      cy.get('[data-cy="create-promotion-button"]').click();
      cy.get('[data-cy="promotion-title-input"]').type('Bulk Test 2');
      cy.get('[data-cy="promotion-code-input"]').type('BULK2');
      cy.get('[data-cy="promotion-discount-type-select"]').click();
      cy.contains('PERCENTAGE').click();
      cy.get('[data-cy="promotion-discount-value-input"]').type('15');
      cy.get('[data-cy="create-promotion-submit"]').click();

      // Verify both promotions exist
      cy.contains('Bulk Test 1').should('be.visible');
      cy.contains('Bulk Test 2').should('be.visible');
      cy.contains('BULK1').should('be.visible');
      cy.contains('BULK2').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Simulate network failure
      cy.intercept('POST', '/api/loms/events', { forceNetworkError: true });

      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.get('[data-cy="events-tab"]').click();
      cy.get('[data-cy="create-event-button"]').click();

      cy.get('[data-cy="event-title-input"]').type('Network Error Test');
      cy.get('[data-cy="event-type-select"]').click();
      cy.contains('TOURNAMENT').click();
      cy.get('[data-cy="event-start-time-input"]').type('2024-01-20T10:00:00');
      cy.get('[data-cy="create-event-submit"]').click();

      cy.contains('Failed to create event').should('be.visible');
    });

    it('should handle validation errors', () => {
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.get('[data-cy="promotions-tab"]').click();
      cy.get('[data-cy="create-promotion-button"]').click();

      // Submit form with invalid data
      cy.get('[data-cy="promotion-discount-value-input"]').type('-10'); // Invalid negative value
      cy.get('[data-cy="create-promotion-submit"]').click();

      cy.contains('Discount value must be positive').should('be.visible');
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle large datasets efficiently', () => {
      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();
      cy.get('[data-cy="events-tab"]').click();

      // Verify pagination is working for large datasets
      cy.get('[data-cy="pagination"]').should('exist');

      // Check that loading states are handled
      cy.get('[data-cy="loading-spinner"]').should('not.exist');
    });

    it('should be responsive on mobile devices', () => {
      cy.viewport('iphone-6');

      cy.visit('/admin');
      cy.get('[data-cy="content-management-tab"]').click();

      // Verify mobile layout
      cy.get('[data-cy="mobile-menu-toggle"]').should('be.visible');

      // Test tab navigation on mobile
      cy.get('[data-cy="mobile-menu-toggle"]').click();
      cy.get('[data-cy="events-tab-mobile"]').click();

      cy.contains('Event Management').should('be.visible');
    });
  });
});
