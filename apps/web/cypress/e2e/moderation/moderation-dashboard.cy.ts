describe('Moderation Dashboard E2E', () => {
  it('moderator can view and update a report', () => {
    // Programmatic login helper is assumed; replace with your login flow
    cy.visit('/login');
    cy.findByLabelText(/Email/i).type('moderator@example.com');
    cy.findByLabelText(/Password/i).type('password{enter}');

    // Navigate to moderation
    cy.visit('/moderation');
    cy.findByText(/Community Moderation/i).should('exist');

    // Table loads
    cy.findByRole('table').should('exist');

    // Open first update dialog
    cy.findAllByText('Update').first().click();
    cy.findByText('Update Feedback').should('exist');

    // Change status and add notes
    cy.findByLabelText('Status').click();
    cy.findByText('IN REVIEW').click();
    cy.findByLabelText('Admin Notes').type('Reviewing');
    cy.findByText('Save').click();

    // Confirm dialog closed
    cy.findByText('Update Feedback').should('not.exist');
  });
});
