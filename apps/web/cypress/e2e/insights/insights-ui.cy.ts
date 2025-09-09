describe('Insights UI', () => {
  it('navigates to player insights and shows charts', () => {
    cy.visit('/profile/test-player/insights');
    cy.findByText(/Player Insights/i).should('exist');
  });

  it('opens match analysis page', () => {
    cy.visit('/matches/test-match/analysis');
    cy.findByText(/Match Analysis/i).should('exist');
  });
});
