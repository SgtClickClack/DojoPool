describe('Feedback and Reporting System', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('GET', '/api/v1/auth/me', {
      statusCode: 200,
      body: {
        id: 'test-user-id',
        username: 'testuser',
        email: 'test@example.com',
      },
    }).as('getUser');

    // Mock feedback submission
    cy.intercept('POST', '/api/v1/feedback', {
      statusCode: 201,
      body: {
        id: 'feedback-123',
        message: 'Test feedback message',
        category: 'BUG',
        status: 'PENDING',
        priority: 'NORMAL',
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: 'test-user-id',
        user: {
          id: 'test-user-id',
          username: 'testuser',
          email: 'test@example.com',
        },
      },
    }).as('submitFeedback');

    // Mock file upload
    cy.intercept('POST', '/api/v1/upload/feedback-attachments', {
      statusCode: 200,
      body: {
        message: 'Files uploaded successfully',
        files: [
          {
            filename: 'test-screenshot.png',
            url: 'http://localhost:3002/uploads/test-screenshot.png',
            size: 1024,
            mimetype: 'image/png',
          },
        ],
        uploadedBy: 'test-user-id',
      },
    }).as('uploadFiles');

    // Visit the feedback page
    cy.visit('/feedback');
  });

  it('should display the feedback form correctly', () => {
    cy.get('[data-testid="feedback-form"]').should('be.visible');
    cy.get('h5').should('contain', 'Submit Feedback & Reports');
    cy.get('[data-testid="category-select"]').should('be.visible');
    cy.get('[data-testid="message-textarea"]').should('be.visible');
    cy.get('[data-testid="submit-button"]').should('be.visible');
  });

  it('should show all feedback categories', () => {
    cy.get('[data-testid="category-select"]').click();

    cy.contains('🐛 Bug Report').should('be.visible');
    cy.contains('💡 Feature Request').should('be.visible');
    cy.contains('💬 General Feedback').should('be.visible');
    cy.contains('🏢 Venue Issue').should('be.visible');
    cy.contains('🛠️ Technical Support').should('be.visible');
    cy.contains('🎨 UI/UX Improvement').should('be.visible');
    cy.contains('⚡ Performance Issue').should('be.visible');
    cy.contains('👤 Player Report').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.get('[data-testid="submit-button"]').click();

    // Should not submit without required fields
    cy.get('@submitFeedback').should('not.have.been.called');
  });

  it('should submit bug report successfully', () => {
    // Fill out the form
    cy.get('[data-testid="category-select"]').click();
    cy.contains('🐛 Bug Report').click();

    cy.get('[data-testid="message-textarea"]').type(
      'I encountered a bug where the game crashes when I try to start a match. This happens consistently on mobile devices.'
    );

    cy.get('[data-testid="additional-context"]').type(
      'Steps to reproduce: 1. Open the app on mobile 2. Navigate to match 3. Click start match 4. App crashes'
    );

    // Submit the form
    cy.get('[data-testid="submit-button"]').click();

    // Verify API call
    cy.wait('@submitFeedback').then((interception) => {
      expect(interception.request.body).to.deep.include({
        message:
          'I encountered a bug where the game crashes when I try to start a match. This happens consistently on mobile devices.',
        category: 'BUG',
        additionalContext:
          'Steps to reproduce: 1. Open the app on mobile 2. Navigate to match 3. Click start match 4. App crashes',
        attachments: [],
      });
    });

    // Verify success message
    cy.contains('✅ Feedback Submitted Successfully!').should('be.visible');
    cy.contains('Thank you for your feedback').should('be.visible');
  });

  it('should submit player report successfully', () => {
    // Fill out the form for player report
    cy.get('[data-testid="category-select"]').click();
    cy.contains('👤 Player Report').click();

    cy.get('[data-testid="message-textarea"]').type(
      'Player "toxicplayer123" has been harassing other players in the chat and using inappropriate language. They have been doing this for several days.'
    );

    cy.get('[data-testid="additional-context"]').type(
      'Screenshots of the harassment are attached. This player has been reported by multiple users.'
    );

    // Submit the form
    cy.get('[data-testid="submit-button"]').click();

    // Verify API call
    cy.wait('@submitFeedback').then((interception) => {
      expect(interception.request.body).to.deep.include({
        message:
          'Player "toxicplayer123" has been harassing other players in the chat and using inappropriate language. They have been doing this for several days.',
        category: 'PLAYER_REPORT',
        additionalContext:
          'Screenshots of the harassment are attached. This player has been reported by multiple users.',
        attachments: [],
      });
    });

    // Verify success message
    cy.contains('✅ Feedback Submitted Successfully!').should('be.visible');
  });

  it('should upload and attach files', () => {
    // Fill out basic form
    cy.get('[data-testid="category-select"]').click();
    cy.contains('🐛 Bug Report').click();

    cy.get('[data-testid="message-textarea"]').type(
      'Bug report with screenshot attached'
    );

    // Create a test file
    const fileName = 'test-screenshot.png';
    const fileContent =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    // Upload file
    cy.get('[data-testid="file-upload"]').selectFile({
      contents: Cypress.Buffer.from(fileContent, 'base64'),
      fileName: fileName,
      mimeType: 'image/png',
    });

    // Verify file upload
    cy.wait('@uploadFiles').then((interception) => {
      expect(interception.request.body).to.be.instanceOf(FormData);
    });

    // Verify file appears in UI
    cy.contains('test-screenshot.png').should('be.visible');
    cy.contains('(1 KB)').should('be.visible');

    // Submit the form
    cy.get('[data-testid="submit-button"]').click();

    // Verify API call includes attachments
    cy.wait('@submitFeedback').then((interception) => {
      expect(interception.request.body.attachments).to.have.length(1);
      expect(interception.request.body.attachments[0]).to.include(
        'test-screenshot.png'
      );
    });
  });

  it('should handle drag and drop file upload', () => {
    // Fill out basic form
    cy.get('[data-testid="category-select"]').click();
    cy.contains('🐛 Bug Report').click();

    cy.get('[data-testid="message-textarea"]').type(
      'Bug report with drag and drop file'
    );

    // Create test file
    const fileName = 'drag-drop-test.png';
    const fileContent =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    // Simulate drag and drop
    cy.get('[data-testid="file-drop-zone"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContent, 'base64'),
        fileName: fileName,
        mimeType: 'image/png',
      },
      { action: 'drag-drop' }
    );

    // Verify file appears
    cy.contains('drag-drop-test.png').should('be.visible');
  });

  it('should limit file uploads to 5 files', () => {
    // Fill out basic form
    cy.get('[data-testid="category-select"]').click();
    cy.contains('🐛 Bug Report').click();

    cy.get('[data-testid="message-textarea"]').type('Testing file limit');

    // Upload 6 files (should be limited to 5)
    const files = Array.from({ length: 6 }, (_, i) => ({
      contents: Cypress.Buffer.from('test content', 'utf8'),
      fileName: `test-file-${i}.txt`,
      mimeType: 'text/plain',
    }));

    cy.get('[data-testid="file-upload"]').selectFile(files);

    // Should show error message
    cy.contains('Maximum 5 attachments allowed').should('be.visible');
  });

  it('should validate file types', () => {
    // Fill out basic form
    cy.get('[data-testid="category-select"]').click();
    cy.contains('🐛 Bug Report').click();

    cy.get('[data-testid="message-textarea"]').type(
      'Testing file type validation'
    );

    // Try to upload an unsupported file type
    cy.get('[data-testid="file-upload"]').selectFile({
      contents: Cypress.Buffer.from('test content', 'utf8'),
      fileName: 'test-file.exe',
      mimeType: 'application/x-executable',
    });

    // Should show error message
    cy.contains('File type application/x-executable is not allowed').should(
      'be.visible'
    );
  });

  it('should show file preview', () => {
    // Fill out basic form
    cy.get('[data-testid="category-select"]').click();
    cy.contains('🐛 Bug Report').click();

    cy.get('[data-testid="message-textarea"]').type('Testing file preview');

    // Upload an image file
    const fileName = 'preview-test.png';
    const fileContent =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    cy.get('[data-testid="file-upload"]').selectFile({
      contents: Cypress.Buffer.from(fileContent, 'base64'),
      fileName: fileName,
      mimeType: 'image/png',
    });

    // Click on the uploaded file to preview
    cy.contains(fileName).click();

    // Verify preview dialog opens
    cy.get('[data-testid="file-preview-dialog"]').should('be.visible');
    cy.contains('File Preview:').should('be.visible');
    cy.contains(fileName).should('be.visible');
  });

  it('should handle submission errors gracefully', () => {
    // Mock API error
    cy.intercept('POST', '/api/v1/feedback', {
      statusCode: 500,
      body: { message: 'Internal server error' },
    }).as('submitFeedbackError');

    // Fill out the form
    cy.get('[data-testid="category-select"]').click();
    cy.contains('🐛 Bug Report').click();

    cy.get('[data-testid="message-textarea"]').type('This will cause an error');

    // Submit the form
    cy.get('[data-testid="submit-button"]').click();

    // Verify error message
    cy.wait('@submitFeedbackError');
    cy.contains('Failed to submit feedback').should('be.visible');
  });

  it('should clear form after successful submission', () => {
    // Fill out the form
    cy.get('[data-testid="category-select"]').click();
    cy.contains('🐛 Bug Report').click();

    cy.get('[data-testid="message-textarea"]').type('Test feedback message');

    cy.get('[data-testid="additional-context"]').type('Additional context');

    // Submit the form
    cy.get('[data-testid="submit-button"]').click();

    // Wait for success message
    cy.contains('✅ Feedback Submitted Successfully!').should('be.visible');

    // Wait for form to reset (after 2 seconds)
    cy.wait(2500);

    // Verify form is cleared
    cy.get('[data-testid="message-textarea"]').should('have.value', '');
    cy.get('[data-testid="additional-context"]').should('have.value', '');
  });
});
