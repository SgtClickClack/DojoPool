// project_roadmap.ts
// A comprehensive, structured list of tasks for the Cursor background agent to execute.
// This roadmap covers the entire project from tournament systems to deployment.

interface Task {
  id: string;
  phase: string;
  description: string;
  prompt: string;
  relevantFiles: string[];
}

export const taskList: Task[] = [
  // --- PHASE 1: TOURNAMENT SYSTEM COMPLETION ---
  {
    id: '1.1',
    phase: 'Tournament System Completion',
    description: 'Tournament Registration Flow',
    prompt:
      "Enhance the existing `TournamentRegistration.tsx` and create the new components `TournamentDiscovery.tsx` and `TournamentPayment.tsx`. Also, create a new stylesheet `src/styles/tournament.scss`. The goal is a complete tournament registration flow with the following features:\n1. A discovery page with filters for venue, date, and format.\n2. A registration workflow that integrates with a user's wallet.\n3. An entry fee payment system using 'Dojo Coins'.\n4. Real-time registration status updates.\n5. Apply cyberpunk styling with neon effects.",
    relevantFiles: [
      'src/components/tournament/TournamentRegistration.tsx',
      'src/components/tournament/TournamentDiscovery.tsx',
      'src/components/tournament/TournamentPayment.tsx',
      'src/styles/tournament.scss',
    ],
  },
  {
    id: '1.2',
    phase: 'Tournament System Completion',
    description: 'Tournament Bracket Enhancement',
    prompt:
      'Enhance the existing `TournamentBracket.tsx` and create a new `BracketVisualization.tsx` component. The objective is to build an interactive bracket visualization that features real-time match updates and tracks player progression. Style the bracket with a cyberpunk grid aesthetic.',
    relevantFiles: [
      'src/components/tournament/TournamentBracket.tsx',
      'src/components/tournament/BracketVisualization.tsx',
    ],
  },

  // --- PHASE 2: VENUE INTEGRATION COMPLETION ---
  {
    id: '2.1',
    phase: 'Venue Integration Completion',
    description: 'Venue Check-in System',
    prompt:
      "Enhance `CheckInSystem.tsx` and create new components `QRCodeScanner.tsx` and `GeolocationCheckIn.tsx`. Also create `src/styles/venue.scss`. Implement a venue check-in system with:\n1. QR code scanning functionality.\n2. Geolocation verification to confirm physical presence.\n3. A system to link a user's digital presence with their physical check-in.\n4. Real-time venue status updates for dashboards.",
    relevantFiles: [
      'src/components/venue/CheckInSystem.tsx',
      'src/components/venue/QRCodeScanner.tsx',
      'src/components/venue/GeolocationCheckIn.tsx',
      'src/styles/venue.scss',
    ],
  },
  {
    id: '2.2',
    phase: 'Venue Integration Completion',
    description: 'Venue Dashboard Enhancement',
    prompt:
      'Enhance the `VenueDashboard.tsx` and create a new `TableManagement.tsx` component. The dashboard should be updated to include:\n1. Live tracking of table occupancy.\n2. A tournament management interface for venue owners.\n3. A display for revenue analytics.\n4. Apply a cyberpunk dashboard styling.',
    relevantFiles: [
      'src/components/venue/VenueDashboard.tsx',
      'src/components/venue/TableManagement.tsx',
    ],
  },

  // --- PHASE 3: GAME FLOW INTEGRATION ---
  {
    id: '3.1',
    phase: 'Game Flow Integration',
    description: 'Game Flow Orchestration',
    prompt:
      'Create several new components and a hook: `GameFlowOrchestrator.tsx`, `GameStateManager.tsx`, and `useGameFlow.ts`. Also create `src/styles/gameflow.scss`. This task is to build the core game flow orchestration, managing the complete user journey from registration to post-game results. Implement robust state management and ensure seamless transitions between all game phases, including error handling and recovery.',
    relevantFiles: [
      'src/components/gameflow/GameFlowOrchestrator.tsx',
      'src/components/gameflow/GameStateManager.tsx',
      'src/hooks/useGameFlow.ts',
      'src/styles/gameflow.scss',
    ],
  },
  {
    id: '3.2',
    phase: 'Game Flow Integration',
    description: 'Real-time Game Integration',
    prompt:
      'Enhance `GamePlay.tsx` and `LiveGameDisplay.tsx`, and create a new `GameAnalytics.tsx` component. Integrate the AI ball tracking system, enable real-time score updates, implement a live commentary system, and develop a post-game analytics display.',
    relevantFiles: [
      'src/components/game/GamePlay.tsx',
      'src/components/game/LiveGameDisplay.tsx',
      'src/components/game/GameAnalytics.tsx',
    ],
  },

  // --- PHASE 4: CSS STYLING COMPLETION ---
  {
    id: '4.1',
    phase: 'CSS Styling Completion',
    description: 'Cyberpunk Theme Application',
    prompt:
      'Create new SCSS partials for tournament, venue, and gameflow components, and enhance the existing game styles. Apply a consistent cyberpunk theme across the entire application, featuring neon effects, animations, a dark theme with accent colors, and ensure a responsive design for all screen sizes.',
    relevantFiles: [
      'src/styles/components/_tournament.scss',
      'src/styles/components/_venue.scss',
      'src/styles/components/_gameflow.scss',
      'src/styles/components/_game.scss',
    ],
  },
  {
    id: '4.2',
    phase: 'CSS Styling Completion',
    description: 'Animation and Effects',
    prompt:
      'Create new SCSS files dedicated to animations and effects: `_cyberpunk.scss`, `_neon.scss`, and `_glow.scss`. Implement smooth transitions between game states, neon text and border effects, loading animations, and engaging hover effects and interactions.',
    relevantFiles: [
      'src/styles/animations/_cyberpunk.scss',
      'src/styles/effects/_neon.scss',
      'src/styles/effects/_glow.scss',
    ],
  },

  // --- PHASE 5: INTEGRATION & TESTING ---
  {
    id: '5.1',
    phase: 'Integration & Testing',
    description: 'Component Integration',
    prompt:
      'Integrate all newly created components. Update `App.tsx` with the complete routing setup. Update `Dashboard.tsx` to integrate the new components. Enhance `useAuth.ts` to support the full game flow. Implement component state management and error boundaries.',
    relevantFiles: [
      'src/App.tsx',
      'src/components/Dashboard.tsx',
      'src/hooks/useAuth.ts',
    ],
  },
  {
    id: '5.2',
    phase: 'Integration & Testing',
    description: 'Testing and Quality Assurance',
    prompt:
      'Create a comprehensive test suite. Write end-to-end (E2E) tests using Cypress for the tournament, check-in, and game flows. Implement component unit tests and integration tests for API calls in the `src/components/__tests__/` directory, aiming for over 80% test coverage. Conduct performance testing.',
    relevantFiles: [
      'cypress/e2e/tournament-flow.cy.ts',
      'cypress/e2e/venue-checkin.cy.ts',
      'cypress/e2e/game-flow-integration.cy.ts',
      'src/components/__tests__/',
    ],
  },

  // --- PHASE 6: MOBILE OPTIMIZATION ---
  {
    id: '6.1',
    phase: 'Mobile Optimization',
    description: 'Responsive Design',
    prompt:
      'Implement a mobile-first responsive design. Create new SCSS files for mobile and tablet breakpoints. Update all relevant component CSS files to be fully responsive, ensuring touch-friendly interactions, optimized layouts for small screens, and high performance on mobile devices.',
    relevantFiles: [
      'src/styles/responsive/_mobile.scss',
      'src/styles/responsive/_tablet.scss',
    ],
  },

  // --- PHASE 7: DEPLOYMENT PREPARATION ---
  {
    id: '7.1',
    phase: 'Deployment Preparation',
    description: 'Production Optimization',
    prompt:
      'Prepare the application for production. Optimize the build configuration in `vite.config.ts`. Review production dependencies in `package.json`. Implement code splitting, lazy loading, and asset optimization. Set up performance monitoring and error tracking integrations via environment configuration files.',
    relevantFiles: ['vite.config.ts', 'package.json', '.env.production'],
  },
  {
    id: '7.2',
    phase: 'Deployment Preparation',
    description: 'Documentation and Handoff',
    prompt:
      'Create comprehensive documentation for the project. Write a `GAME_FLOW_IMPLEMENTATION.md` and a `CSS_STYLING_GUIDE.md` in the `docs/` directory. The documentation should include component usage examples, styling guidelines, and clear deployment instructions.',
    relevantFiles: [
      'docs/GAME_FLOW_IMPLEMENTATION.md',
      'docs/CSS_STYLING_GUIDE.md',
    ],
  },
];
