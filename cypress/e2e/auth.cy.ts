describe("Authentication", () => {
  beforeEach(() => {
    cy.visit("/auth/signin");
  });

  it("should sign in with email and password", () => {
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="signin-button"]').click();
    cy.url().should("eq", Cypress.config().baseUrl + "/dashboard");
  });

  it("should sign up with email and password", () => {
    cy.get('[data-testid="signup-link"]').click();
    cy.get('[data-testid="name-input"]').type("Test User");
    cy.get('[data-testid="email-input"]').type("newuser@example.com");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="confirm-password-input"]').type("password123");
    cy.get('[data-testid="signup-button"]').click();
    cy.url().should("eq", Cypress.config().baseUrl + "/dashboard");
  });

  it("should sign in with Google", () => {
    cy.get('[data-testid="google-signin"]').click();
    cy.window().then((win) => {
      cy.stub(win, "open").as("windowOpen");
    });
    cy.get("@windowOpen").should("be.called");
  });

  it("should sign in with Facebook", () => {
    cy.get('[data-testid="facebook-signin"]').click();
    cy.window().then((win) => {
      cy.stub(win, "open").as("windowOpen");
    });
    cy.get("@windowOpen").should("be.called");
  });

  it("should sign in with Twitter", () => {
    cy.get('[data-testid="twitter-signin"]').click();
    cy.window().then((win) => {
      cy.stub(win, "open").as("windowOpen");
    });
    cy.get("@windowOpen").should("be.called");
  });

  it("should sign in with GitHub", () => {
    cy.get('[data-testid="github-signin"]').click();
    cy.window().then((win) => {
      cy.stub(win, "open").as("windowOpen");
    });
    cy.get("@windowOpen").should("be.called");
  });

  it("should sign in with Apple", () => {
    cy.get('[data-testid="apple-signin"]').click();
    cy.window().then((win) => {
      cy.stub(win, "open").as("windowOpen");
    });
    cy.get("@windowOpen").should("be.called");
  });

  it("should reset password", () => {
    cy.get('[data-testid="forgot-password"]').click();
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="reset-button"]').click();
    cy.get('[data-testid="success-message"]').should("be.visible");
  });

  it("should sign out", () => {
    cy.login();
    cy.visit("/dashboard");
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="signout-button"]').click();
    cy.url().should("eq", Cypress.config().baseUrl + "/auth/signin");
  });

  it("should handle invalid credentials", () => {
    cy.get('[data-testid="email-input"]').type("invalid@example.com");
    cy.get('[data-testid="password-input"]').type("wrongpassword");
    cy.get('[data-testid="signin-button"]').click();
    cy.get('[data-testid="error-message"]').should("be.visible");
  });

  it("should validate email format", () => {
    cy.get('[data-testid="email-input"]').type("invalidemail");
    cy.get('[data-testid="signin-button"]').click();
    cy.get('[data-testid="email-error"]').should("be.visible");
  });

  it("should validate password length", () => {
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("short");
    cy.get('[data-testid="signin-button"]').click();
    cy.get('[data-testid="password-error"]').should("be.visible");
  });
});
