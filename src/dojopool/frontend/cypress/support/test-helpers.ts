// Helper function to generate unique test data
export const generateTestData = () => {
  const timestamp = Date.now();
  return {
    email: `test${timestamp}@example.com`,
    username: `TestUser${timestamp}`,
    password: "TestPass123!",
  };
};

// Helper function to generate mock game stats
export const generateGameStats = (options = {}) => {
  return {
    totalShots: options.totalShots || Math.floor(Math.random() * 20) + 1,
    successfulShots:
      options.successfulShots || Math.floor(Math.random() * 15) + 1,
    fouls: options.fouls || Math.floor(Math.random() * 5),
    longestStreak: options.longestStreak || Math.floor(Math.random() * 5) + 1,
  };
};

// Helper function to generate mock venue data
export const generateVenueData = (options = {}) => {
  return {
    id: options.id || `venue_${Date.now()}`,
    name: options.name || `Test Venue ${Date.now()}`,
    location: {
      latitude: options.latitude || 40.7128,
      longitude: options.longitude || -74.006,
      address: options.address || "123 Test St, Test City, TS 12345",
    },
    tables: options.tables || Math.floor(Math.random() * 8) + 2,
    activeGames: options.activeGames || Math.floor(Math.random() * 5),
    rating: options.rating || (Math.random() * 2 + 3).toFixed(1),
    features: options.features || ["tournaments", "coaching", "bar"],
  };
};

// Helper function to wait for map to be ready
export const waitForMap = () => {
  cy.findByTestId("google-map")
    .should("be.visible")
    .should("have.attr", "data-loaded", "true");
};

// Helper function to check map markers
export const checkMapMarkers = (
  markers: Array<{ id: string; type: string }>,
) => {
  markers.forEach((marker) => {
    cy.findByTestId(`marker-${marker.type}-${marker.id}`).should("be.visible");
  });
};

// Helper function to simulate network conditions
export const simulateNetwork = (condition: "online" | "offline" | "slow") => {
  if (condition === "offline") {
    cy.window().then((win) => {
      // @ts-ignore
      win.navigator.onLine = false;
      win.dispatchEvent(new Event("offline"));
    });
  } else if (condition === "online") {
    cy.window().then((win) => {
      // @ts-ignore
      win.navigator.onLine = true;
      win.dispatchEvent(new Event("online"));
    });
  } else if (condition === "slow") {
    cy.intercept("**/*", (req) => {
      req.on("response", (res) => {
        // Delay all responses by 2 seconds
        res.setDelay(2000);
      });
    });
  }
};

// Helper function to check error states
export const checkErrorState = (errorType: string) => {
  const errorMessages = {
    network: /Network error occurred/i,
    auth: /Authentication failed/i,
    validation: /Validation failed/i,
    notFound: /Not found/i,
    permission: /Permission denied/i,
  };

  cy.findByText(errorMessages[errorType]).should("exist");
};

// Helper function to check loading states
export const checkLoadingState = (elementTestId: string) => {
  cy.findByTestId(elementTestId)
    .should("have.attr", "aria-busy", "true")
    .should("contain", /loading/i);
};

// Helper function to check success states
export const checkSuccessState = (message: string) => {
  cy.findByRole("alert")
    .should("have.class", "success")
    .should("contain", message);
};

// Helper function to check form validation
export const checkFormValidation = (
  formTestId: string,
  fields: Array<{ name: string; error: string }>,
) => {
  cy.findByTestId(formTestId).within(() => {
    fields.forEach((field) => {
      cy.findByLabelText(field.name).focus().blur();
      cy.findByText(field.error).should("exist");
    });
  });
};
