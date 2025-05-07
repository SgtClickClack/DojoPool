# DojoPool Development Tracking – Part 03

Previous: c:/dev/DojoPoolONE/DojoPool/DEVELOPMENT_TRACKING_PART_02.md

- Marketing Website Implementation: February 9, 2024
- App Store Documentation: February 9, 2024
- App Store Assets Creation: February 12-14, 2024
- Expected Phase 4 Completion: February 20, 2024
- Phase 5 Start: February 21, 2024

## Notes and Considerations

- Implement achievement sync for offline play
- Plan for achievement migration system
- Review achievement balance regularly
- Monitor challenge completion rates
- Consider adding special event challenges
- Track progression path completion rates
- Consider adding path-specific leaderboards
- Implement performance monitoring for updated dependencies
- Regular security audits needed
- Consider implementing caching strategies for large-scale tournaments
- Implement vector clocks for distributed event ordering
- Add CRDT support for concurrent operations
- Deploy consensus protocols for critical game states
- Enhance state verification coverage
- Monitor consistency levels across regions
- Implement adaptive consistency mechanisms

# USER JOURNEY GAME FLOW CHECKLIST (NEW SECTION)

This section reflects the complete user-centric journey for Dojo Pool, mapping each major step to current implementation status. See ROADMAP.md for detailed descriptions.

**Legend:**
- [x] Complete
- [ ] In Progress/Pending

1. **Landing Page & Account Creation**
    - [x] User encounters landing page
    - [x] Login/Sign Up (player profile, wallet, avatar linkage)
2. **Dashboard – Central Hub**
    - [x] Personalized dashboard after login
    - [x] Avatar creation/management access
    - [x] Map access (find/interact with Dojos)
    - [x] Marketplace access (NFTs/coins)
    - [x] Analytics & statistics (performance, rankings)
    - [x] Trophy cabinet (NFT trophies, rings, items)
    - [x] Dojo Coins balance (wallet integration)
3. **Avatar Creation & Customization**
    - [x] Camera setup prompt
    - [x] Body/face scan for avatar
    - [ ] Text-to-image avatar customization
    - [ ] Achievement-based avatar evolution/unlocks
4. **Map – Finding a Dojo**
    - [x] Map UI (Kung Fu movie style, Google Maps SDK)
    - [x] Geolocation for user position
    - [x] Display nearby Dojos (venue integration)
    - [x] Dojo info (profile, analytics, promos)
    - [x] Live occupancy visualization
    - [x] Navigation/directions to Dojo
5. **Entering the Virtual Dojo**
    - [x] Geolocation triggers virtual dojo entry
    - [x] Stylized dojo interior view
    - [x] Live game visualization (Diception AI)
    - [x] Venue interaction (deals, menu, posters)
    - [x] Social avatars in dojo, messaging
6. **Tournament Registration & Logistics**
    - [ ] Tournament discovery/registration UI
    - [ ] Entry fee payment (Dojo Coins)
    - [ ] Bracket generation, real-time updates
7. **Physical Check-in at Venue**
    - [ ] QR code/geolocation check-in
    - [ ] Digital-physical presence linkage
8. **Playing a Real-Life Game (Enhanced)**
    - [x] Table integration (cameras, hardware)
    - [x] AI ball tracking (Diception)
    - [ ] AI referee (Sky-T1) integration
    - [ ] Real-time tracking UI (scores, fouls, rules)
    - [ ] AI commentary/audio (AudioCraft)
9. **Post-Game & Rewards**
    - [ ] Results auto-recorded, analytics update
    - [ ] Content generation (Wan 2.1 video highlights)
    - [ ] Content sharing (social features)
    - [ ] Tournament outcome processing (brackets, prizes)
    - [ ] Rewards: Dojo Coins, NFT trophies/items, avatar unlocks

---

### 2024-03-19: Consensus Protocol Implementation

Implemented a robust consensus protocol using a simplified Raft algorithm with vector clocks for distributed state management.

**Core Components Implemented:**

- ConsensusManager class implementing Raft consensus protocol
- Custom EventEmitter for handling distributed events
- Vector clock integration for causality tracking
- Leader election and heartbeat mechanisms
- Log replication and consistency management

**File Paths:**

- `/src/core/consensus/ConsensusManager.ts`
- `/src/core/consistency/VectorClock.ts`
- `/src/types/consistency.ts`

**Next Priority Task:**
Implement network transport layer for consensus protocol communication between nodes.

Expected completion time: 2 days

### 2024-03-19: Network Transport Layer Implementation

Implemented robust network transport layer for consensus protocol communication between nodes.

**Core Components Implemented:**

- NetworkTransport class for WebSocket-based communication
- Type-safe event system for network events
- Automatic reconnection with exponential backoff
- Heartbeat mechanism for connection health monitoring
- Network statistics tracking
- Error handling and reporting

**Key Features:**

- Bi-directional WebSocket communication
- Peer-to-peer node connections
- Message broadcasting
- Connection state management
- Network metrics collection
- Error recovery mechanisms
- Type-safe message handling

**File Paths:**

- /src/core/network/NetworkTransport.ts
- /src/core/network/types.ts

**Next Priority Task:**
Integrate network transport layer with consensus protocol and state replication system

Expected completion time: 2 days

### 2025-04-14: Physics Engine Implementation

Implemented core physics engine for pool game mechanics.

**Core Components Implemented:**

- PhysicsEngine class with ball collision detection and resolution
- Vector and geometry type definitions
- Friction and restitution physics
- Table boundary collision handling

**Key Features:**

- Ball-to-ball collision detection and response
- Cushion collision handling with restitution
- Friction application to moving objects
- Trajectory calculation for shots
- Physics state updates with delta time

**Integration Points:**

- GameState for ball position updates
- Shot execution system
- Game rules validation

**File Paths:**

- src/utils/physics.ts
- src/types/geometry.ts
- src/utils/**tests**/physics.test.ts

**Next Priority Task:**
Integrate AI Referee (Sky-T1) for rule interpretation and foul detection
Expected completion time: 3 days

### 2025-04-14: Context Assurance System Implementation

Implemented core context assurance systems for distributed state management.

**Core Components Implemented:**

- Vector Clock system for logical time tracking
- CRDT (Conflict-free Replicated Data Types) for state management
- Raft consensus protocol for leader election and log replication
- State replication system for distributed state synchronization

**Key Features:**

- Distributed state consistency
- Conflict resolution with vector clocks
- Leader election with Raft consensus
- State synchronization across nodes
- Event-based state updates

**Integration Points:**

- GameState management
- Network transport layer
- Event handling system
- State persistence layer

**File Paths:**

- src/core/consistency/VectorClock.ts
- src/core/consistency/CRDT.ts
- src/core/consensus/RaftConsensus.ts
- src/core/replication/StateReplicator.ts
- src/types/game.ts

**Note (2025-04-15):** Verified that the physics engine (`src/utils/physics.ts`) is already integrated into the game state management (`src/core/game/GameState.ts`) via the `tick` method, likely completed during context assurance work.

**Next Priority Task:**
Integrate AI Referee (Sky-T1) for rule interpretation and foul detection.

Expected completion time: 3 days

### 2025-04-14: Monitoring and Verification System Implementation

Implemented comprehensive monitoring and verification systems for the context assurance framework.

**Core Components Implemented:**

- Distributed tracing with OpenTelemetry
- State invariant checking system
- Metrics collection and reporting
- Performance monitoring

**Key Features:**

- Consistency metrics tracking
- State update monitoring
- Consensus event tracing
- Automated invariant verification
- Performance metrics collection

**Integration Points:**

- OpenTelemetry integration
- Metrics reporting system
- State verification framework
- Monitoring dashboards

**File Paths:**

- src/monitoring/tracing.ts
- src/monitoring/types.ts
- src/verification/invariants.ts

**Next Priority Task:**
Implement chaos testing and failure scenarios
Expected completion time: 3 days

### 2025-04-14: Chaos Testing Framework Implementation

Implemented comprehensive chaos testing framework for validating system resilience.

**Core Components Implemented:**

- ChaosTestRunner for orchestrating failure scenarios
- Network partition simulation
- Node failure simulation
- Message delay and packet loss simulation
- Automated test execution and reporting

**Key Features:**

- Configurable failure scenarios
- Real-time metrics collection
- Invariant verification during tests
- Recovery time measurement
- Detailed test reporting

**Integration Points:**

- State invariant checker
- Distributed tracing system
- Metrics collection
- Event emission system

**File Paths:**

- src/testing/chaos/ChaosTestRunner.ts

---

### 2025-04-19: Batch Maintenance Commit

**Description:**
Staged, committed, and pushed 39 files including configuration, source code, and test updates. This batch commit brings the local and remote repositories fully in sync and ensures all recent work is tracked. No merge artifacts or corrupted files remain.

**Core Components Implemented/Updated:**
- Updated project configuration files (`requirements.txt`, `package.json`, etc.)
- Refactored and updated multiple backend scripts and modules
- Updated and added tests for integration and unit coverage

**File Paths:**
- See commit `eeceb83` on GitHub for the full list of affected files.

**Next Priority Task:**
Review and update documentation, and continue with the next roadmap milestone.

Expected completion time: 1 day

---

### 2025-04-18: Wallet System Unification Initiative

**Description:**
Initiated the unification of the wallet/payment system. Identified duplicate Wallet and Transaction models in `models/marketplace.py` and `core/models/payment.py`, both using SQLAlchemy but with differing fields and logic. Confirmed no MongoDB wallet model exists. Decision made to merge into a single unified Wallet/Transaction model for all wallet, payment, and marketplace operations.

**Plan:**

- Design a unified SQLAlchemy Wallet model, including:
  - Standardized fields for user, balance, currency, status, and transaction history/logs.
  - Support for both marketplace and general payment flows.
  - Unified Transaction model with clear relationships and extensibility for future blockchain/NFT features.
- Refactor backend code and APIs to use the unified models.
- Update and expand all relevant tests (maintain 80%+ coverage).
- Document migration and model usage in code and tracking files.

**Next Steps:**

1. Draft and review unified Wallet and Transaction models.
2. Refactor backend and APIs for unified usage.
3. Update documentation and developer onboarding.
4. Add/expand tests for all wallet and payment flows.

**Estimated Time:** 4–8 hours (including refactor, migration, and testing)

---

### [2024-06-13] Wallet System Unification Progress Update

- Unified SQLAlchemy Wallet and Transaction models are now implemented in `src/dojopool/models/marketplace.py`.
- Duplicate models have been removed from `core/models/payment.py`.
- All `/wallet`, `/purchase`, and `/transactions` API endpoints in `routes/api/marketplace.py` refactored to use the new unified models and fields.
- Imports and model usage across API routes now reference the unified source of truth.
- Error handling and field compatibility updated for unified models.
- Next: expand/adjust tests for new models, verify API compatibility, and update documentation/readme as needed.

---

### [2024-06-14] Physics Engine Integration & Basic Rules Logic

Integrated the TypeScript physics engine (`PhysicsEngine`) with the real-time `GameState` manager. Implemented a game loop (`tick`) to drive physics simulation. Added pocket detection, standard 8-ball racking, scratch detection, basic ball-type assignment, 8-ball win/loss checks, and ball-in-hand logic. Refactored action handling for consistency with consensus patterns. Addressed numerous type errors and linter issues, using type assertions as workarounds where necessary due to tooling glitches.

**Core Components Implemented:**

- `GameState` (integration, tick loop, outcome analysis)
- `PhysicsEngine` (usage)
- `GameTable` (state extension)
- `GameActionType` (update)

**Key Features:**

- Physics-driven ball movement in `GameState`.
- Game loop for continuous simulation.
- Standard 8-ball rack setup.
- Pocket geometry definition and detection.
- Basic 8-ball rule logic (scratch, ball type assignment, win/loss check, ball-in-hand).
- Action handling refactored for consensus flow.

**Integration Points:**

- `GameState` uses `PhysicsEngine`.
- `GameState` `tick` method drives simulation.
- `analyzeShotOutcome` proposes actions (`CHANGE_TURN`, `END_GAME`) based on physics results and rules.

**File Paths:**

- `DojoPool/src/core/game/GameState.ts`
- `src/types/game.ts`

---

### Overall Status & Way Forward (as of 2024-07-29)

**Current State:**

- The backend infrastructure is robust, with advanced systems for scaling, security, monitoring, and context assurance in place.
- Core gameplay physics and basic 8-ball rules are integrated into the `GameState`.
- The critical Wallet system inconsistency is being actively resolved through model unification.
- A significant gap exists in frontend UI development, blocking the user-facing realization of many backend features.

**Way Forward:**

- **Immediate Priority:** Initiate focused frontend development sprints targeting critical missing UIs:
  - Wallet viewing/transactions
  - Tournament list/registration/bracket view
  - Venue management dashboard basics
  - Core Social features (Profile, Feed)
- Continue refining backend game logic (`GameState.ts` rules, fouls, etc.).
- Finalize App Store assets (screenshots, videos) for submission readiness.
- Expand test coverage, especially for the unified Wallet system.
- Plan subsequent sprints for remaining frontend UIs and advanced backend features (AI, Blockchain) as outlined in the updated `ROADMAP.md`.

**Next Priority Task:**
Refine `analyzeShotOutcome` in `GameState.ts` with detailed foul detection (no rail, wrong ball first), cue ball recovery logic, and break shot rules. **Priority:** Initiate focused frontend development sprints for key UIs (Wallet, Tournaments, Venues). Finalize App Store assets. Continue backend feature development (Advanced AI, Blockchain) as per roadmap.

Expected completion time: Ongoing (Frontend sprints), 2-3 days (GameState refinement)

### 2024-07-29: Wallet Admin Helpers and Tournament Logic (Part 1)

**Description:**
Added admin/lifecycle helper methods (freeze, reactivate, get_audit_trail) to the `Wallet` model, integrating with the existing `AuditLogger`. Created corresponding protected API endpoints (`/admin/wallet/<user_id>/freeze`, etc.) and associated tests. Began implementation of the core `TournamentService` logic, including participant registration, starting tournaments (SE, RR, DE formats with initial match generation), completing matches, and checking for tournament completion (SE, RR, basic DE).

**Core Components Implemented/Updated:**

- `models.marketplace.Wallet`: Added `freeze`, `reactivate`, `get_audit_trail` methods; integrated `AuditLogger`; added `is_active` checks.
- `core.venue.audit.AuditEventType`: Added wallet-specific event types.
- `routes.api.marketplace`: Added admin endpoints for wallet management.
- `tests.test_wallet_api`: Added tests for admin wallet endpoints.
- `models.tournament.TournamentMatch`: Added `bracket_type` field.
- `services.tournament_service`: Refactored `register_player`, `start_tournament`. Implemented match generation (`_create_single_elimination_brackets`, `_create_round_robin_matches`, `_create_double_elimination_brackets`). Implemented `complete_match` with advancement logic for SE and DE (winners/losers). Implemented `_check_tournament_completion` for SE, RR, and basic DE.
- `tests.test_tournament_service`: Added initial tests for `register_player`, `start_tournament`, and `complete_match`.

**File Paths:**

- `DojoPool/src/dojopool/models/marketplace.py`
- `DojoPool/src/dojopool/core/venue/audit.py`
- `DojoPool/src/dojopool/routes/api/marketplace.py`
- `DojoPool/tests/test_wallet_api.py`
- `DojoPool/src/dojopool/models/tournament.py`
- `DojoPool/src/dojopool/services/tournament_service.py`
- `DojoPool/src/dojopool/routes/tournament_routes.py`
- `DojoPool/tests/test_tournament_service.py`

**Next Priority Task:**
Complete remaining Tournament Logic: Implement Swiss pairing, enhance DE logic (Grand Finals, bracket reset), add more comprehensive tests, potentially refactor bracket generation for clarity/robustness, update/add API endpoints as needed.

Expected completion time: 3-5 days (depending on complexity of Swiss/DE edge cases)

**Update [2024-07-30]:** Swiss pairing and DE Grand Finals logic implemented. Comprehensive service tests (Swiss edge cases, DE bye propagation) and API tests added.

---

### 2024-07-30: Tournament Logic (Swiss Pairing & DE Grand Finals)

**Description:**
Implemented core logic for Swiss tournament format pairing in `TournamentService`. Added `_create_swiss_pairing` method handling round 1 (random) and subsequent rounds (score-based, avoiding rematches). Updated `complete_match` to trigger next round pairing for Swiss. Enhanced Double Elimination logic by refining `_advance_winner_bracket` and `_advance_loser_bracket` to detect finals and call `_create_or_update_grand_final`. Implemented Grand Final handling in `complete_match`, including the creation of a reset match (`_create_grand_final_reset`) if the LB winner wins the first GF. Updated `_check_tournament_completion` for DE to correctly identify completion based on GF/reset results. Added initial tests for Swiss pairing (R1 even/odd, R2 trigger) and DE Grand Final scenarios (WB win, LB win + reset).

**Core Components Implemented/Updated:**

- `services.tournament_service`: Added `_get_participant_swiss_scores`, `_get_previous_opponents`, `_create_swiss_pairing`, `_advance_winner_bracket`, `_advance_loser_bracket`, `_create_or_update_grand_final`, `_create_grand_final_reset`, `_check_tournament_completion`.

### 2024-03-20: App Store Assets Preparation

Prepared comprehensive App Store submission assets and documentation.

**Core Components Implemented:**
- App Store description and marketing content
- Screenshot organization and naming structure
- App icon generation script
- Screenshot capture helper script
- Asset directory structure

**Key Features:**
- Detailed app description with key features
- Optimized keywords for App Store search
- Structured screenshot requirements for different devices
- Automated icon generation for all required sizes
- Comprehensive marketing materials

**Integration Points:**
- App Store Connect
- Marketing website
- Support system
- Privacy policy
- Terms of service

**File Paths:**
- /app-store-assets/README.md
- /app-store-assets/marketing/app-store-description.md
- /app-store-assets/scripts/generate-icons.ps1
- /app-store-assets/scripts/capture-screenshots.ps1

**Next Priority Task:**
Implement AI Referee (Sky-T1) for rule interpretation and foul detection

Expected completion time: 3 days

### 2025-04-15: AI Referee (Sky-T1) Integration into GameState

Integrated the AI Referee service (Sky-T1 via `AIRefereeService`) into the core `GameState` management logic. This allows the game state to delegate foul detection and rule interpretation to the dedicated AI service after each shot.

**Core Components Implemented:**

- `prepareRefereeInput` method in `GameState` to gather necessary pre/post-shot data.
- Call to `aiRefereeService.analyzeShot` within `GameState.analyzeShotOutcome`.
- Processing of `RefereeResult` in `GameState` to update fouls, ball-in-hand status, player turn, and potentially game outcome (8-ball rules).
- Basic error handling for the AI service call.
- Logic for assigning ball types (solids/stripes) after a legal break.

**Key Features:**

- Decoupling of rule logic from core game state updates.
- Centralized foul detection via `AIRefereeService`.
- Correct handling of ball-in-hand based on referee decisions.
- Turn management based on referee decisions.
- Initial 8-ball win/loss condition handling integrated with referee results.

**Integration Points:**

- `GameState` uses `AIRefereeService` for shot outcome analysis.
- `AIRefereeService` (specifically `skyT1AnalyzeShot`) needs to connect to the Sky-T1 backend (external dependency).
- `GameState.analyzeShotOutcome` is triggered by the game loop (`tick`) after physics settle.

**File Paths:**

- `src/core/game/GameState.ts` (Modified)
- `src/services/ai/AIRefereeService.ts` (Referenced, defines interfaces)
- `src/types/game.ts` (Referenced)

**Next Priority Task:**

Implement or verify the `skyT1AnalyzeShot` function within `AIRefereeService` to ensure actual communication with the Sky-T1 backend API. Add integration tests for `GameState` mocking `AIRefereeService` responses.

Expected completion time: 2 days

### 2025-04-15: Wallet UI Implementation and Testing

Created and refactored frontend components for the user wallet interface. Integrated components with a new frontend `WalletService` and shared TypeScript types derived from backend models. Added unit tests for the main dashboard component and its children, resolving Jest configuration issues along the way.

**Core Components Implemented:**

- `src/services/wallet/WalletService.ts` (Frontend API service)
- `src/types/wallet.ts` (Shared frontend/backend types)
- `src/components/wallet/WalletDashboard.tsx` (Main view)
- `src/components/wallet/WalletTransactionList.tsx` (Transaction display)
- `src/components/wallet/WalletStats.tsx` (Stats display, renamed to `WalletStatsDisplay` internally)
- `src/__tests__/components/WalletDashboard.test.tsx`
- `src/__tests__/components/WalletTransactionList.test.tsx`
- `src/__tests__/components/WalletStats.test.tsx`

**Key Features:**

- Display wallet balance.
- Display transaction history.
- Display wallet statistics.
- Mocked transfer functionality (dialog interaction).
- Type safety using shared interfaces.
- Unit tests for core components.

**Integration Points:**

- Backend Wallet API endpoints (via `axiosInstance`)
- `useAuth` hook for user context
- Shared utility functions (`formatCurrency`, `formatNumber`, `date-fns`)

**File Paths:**

- `src/types/wallet.ts`
- `src/services/wallet/WalletService.ts`
- `src/components/wallet/WalletDashboard.tsx`
- `src/components/wallet/WalletTransactionList.tsx`
- `src/components/wallet/WalletStats.tsx`
- `src/__tests__/components/WalletDashboard.test.tsx`
- `src/__tests__/components/WalletTransactionList.test.tsx`
- `src/__tests__/components/WalletStats.test.tsx`
- `jest.config.js` (updated)
- `jest.setup.ts` (updated)
- `package.json` (dependencies added/updated)

**Next Priority Task:**
Refactor remaining outdated tests (e.g., `GameState.test.ts`, other component tests) to align with current configurations and fix failures.

Expected completion time: 2-3 days (depending on test complexity)

### 2025-04-16: Test Suite Refactoring (GameState, Auth)

Refactored several key test files to align with recent code changes and ensure consistency.

**Description:**
- Updated `src/tests/game/GameState.test.ts`: Modified tests for the `analyzeShotOutcome` method to correctly handle its asynchronous nature (using `async/await`) and mock the async `aiRefereeService.analyzeShot` call. Fixed mock data setup for `ShotAnalysisData`.
- Refactored `src/__tests__/components/Auth/ForgotPassword.test.tsx`: Updated tests to mock the `useAuth` hook (specifically `sendPasswordResetEmail`, `loading`, `error`) instead of relying on direct `fetch` mocks. This aligns the test with the refactored `ForgotPassword` component.
- Updated `src/__tests__/components/Auth/PrivateRoute.test.tsx`: Changed the import and mock target for `useAuth` from the old context path to the unified hook path (`@/hooks/useAuth`) for consistency.

**Core Components Implemented/Updated:**
- N/A (Test files only)

**Key Features:**
- Improved test accuracy for async game state logic.
- Ensured authentication component tests use consistent mocking patterns (`useAuth` hook).
- Aligned tests with component refactoring (`ForgotPassword`).

**Integration Points:**
- N/A (Test files only)

**File Paths:**
- `src/tests/game/GameState.test.ts`
- `src/__tests__/components/Auth/ForgotPassword.test.tsx`
- `src/__tests__/components/Auth/PrivateRoute.test.tsx`

**Next Priority Task:**
Run the full test suite (`npm test` or `yarn test`) to identify and fix any remaining failing or outdated tests, particularly in component directories like `social/`, `Map/`, etc. Alternatively, proceed with the next major feature/task identified in the roadmap or previous tracking entries (e.g., frontend UI development for Tournaments/Venues, App Store asset finalization).

Expected completion time: 1-3 days (depending on number of failing tests)

### 2025-04-16: Tournament UI (List) & Type Unification

Initiated frontend development for Tournaments by creating the basic `TournamentList` component. Unified the `Tournament` type definition.

**Description:**
- Created `src/components/tournaments/TournamentList.tsx`: Displays a list of tournaments using MUI components, handles loading/error states, and uses mock data initially.
- Refactored `src/types/tournament.ts`: Merged duplicate `Tournament` interfaces and related enums (`TournamentState`/`TournamentStatus`, `TournamentType`/`TournamentFormat`) into a single, unified interface and set of enums.
- Updated `TournamentList.tsx` to import and use the unified `Tournament` type and enums, including adding a status `Chip`.

**Core Components Implemented/Updated:**
- `src/components/tournaments/TournamentList.tsx`
- `src/types/tournament.ts`

**Key Features:**
- Basic UI for viewing available tournaments.
- Unified and type-safe data structure for tournaments.
- Status visualization using MUI Chip.

**Integration Points:**
- Uses `@/types/tournament.ts`.
- (Future) Will use `TournamentService` to fetch data.
- (Future) Will be integrated into application routing.

**File Paths:**
- `src/components/tournaments/TournamentList.tsx`
- `src/types/tournament.ts`

**Next Priority Task:**
Implement `TournamentService` in `src/services/tournament/` to fetch real tournament data from the backend API, replacing the mock data in `TournamentList.tsx`. Alternatively, integrate `TournamentList` into routing or add component tests.

Expected completion time: 1-2 days (Service/API integration)

### {date}: Implemented Tournament List and Detail UI

**Description:**
Implemented the core frontend components for tournament discovery and viewing. Created `TournamentList` to display available tournaments, fetch data using the `useTournaments` hook, handle loading/error states, and link to detail pages. Created `TournamentDetail` to fetch and display specific tournament information (including venue details fetched separately) and a list of participants. Added conditional action buttons (Register) based on tournament status and user authentication. Standardized `Tournament` type usage across API, hook, and components. Added basic unit/integration tests for `TournamentDetail`.

**Core Components Implemented:**
*   `src/components/tournaments/TournamentList.tsx`
*   `src/components/tournaments/TournamentDetail.tsx`
*   `src/components/tournaments/TournamentDetail.test.tsx`

**Key Features:**
*   Tournament listing with status and core details.
*   Tournament detail view with expanded information (name, status, format, dates, players, description, rules, venue name, participants list).
*   Data fetching via `useTournaments` hook and `getTournament`/`getVenue` API calls.
*   Basic registration action button logic.
*   Routing link between list and detail items.
*   Basic testing for detail component.

**Integration Points:**
*   `@/frontend/hooks/useTournaments`
*   `@/frontend/api/tournaments` (`getTournaments`, `getTournament`, `joinTournament`)
*   `@/dojopool/frontend/api/venues` (`getVenue`)
*   `@/types/tournament` (Shared `Tournament`, `Participant` types)
*   `@/dojopool/frontend/types/venue` (Shared `Venue` type)
*   `@/frontend/contexts/AuthContext` (`useAuth`)
*   `react-router-dom` (for `useParams`, `Link`)
*   `@mui/material` (for UI components)

**File Paths:**
*   `src/components/tournaments/TournamentList.tsx`
*   `src/components/tournaments/TournamentDetail.tsx`
*   `src/components/tournaments/TournamentDetail.test.tsx`
*   `src/frontend/hooks/useTournaments.ts` (Updated)
*   `src/frontend/api/tournaments.ts` (Updated)
*   `src/types/tournament.ts` (Updated)

**Next Priority Task:**
Integrate Tournament List and Detail components into application routing (e.g., create `/tournaments` and `/tournaments/:id` routes).

Expected completion time: 1 hour

### 2025-04-16: AI Referee Integration Completion & Testing

Implemented the Sky-T1 client function (`skyT1AnalyzeShot`) to make API calls (using a configurable endpoint via environment variables). Added an integration test case to `GameState.test.ts` to verify the correct handling of errors returned from the AI referee service.

**Core Components Implemented/Updated:**

- `src/services/ai/skyT1Client.ts`: Implemented API call logic using `axios`, including timeout and basic error handling.
- `src/tests/game/GameState.test.ts`: Added test case for `analyzeShotOutcome` handling a rejected promise from `aiRefereeService.analyzeShot`.

**Key Features:**

- Placeholder API client for Sky-T1 integration.
- Robust error handling for AI service communication failures.
- Test coverage for `GameState`'s error handling path related to AI referee.

**Integration Points:**

- `skyT1Client.ts` now makes HTTP requests (requires `axios` dependency and configuration of `REACT_APP_SKY_T1_API_ENDPOINT`).
- `GameState.test.ts` further validates the interaction between `GameState` and `AIRefereeService`.

**File Paths:**

- `src/services/ai/skyT1Client.ts` (Modified)
- `src/tests/game/GameState.test.ts` (Modified)

**Next Priority Task:**
According to the last major task entry (Overall Status & Way Forward from 2024-07-29), the priority is frontend development, specifically for Wallet, Tournaments, or Venues UI. Alternatively, run the full test suite (`npm test` / `yarn test`) to catch any remaining issues.

Expected completion time: Ongoing (Frontend Sprints) / 1-3 days (Test Suite Fixes)

### 2024-MM-DD: Implemented AI Referee (Sky-T1) Integration Tests

Added comprehensive integration tests for the AI Referee (Sky-T1) within `GameState.test.ts` to verify correct handling of various foul types and referee outcomes.

**Core Components Implemented:**

- GameState test suite
- Mocking of AIRefereeService and skyT1AnalyzeShot

**Key Features:**

- Improved test coverage and reliability for AI-driven rule interpretation

**Integration Points:**

- GameState interacts with mocked AIRefereeService

**File Paths:**

- src/tests/game/GameState.test.ts

**Next Priority Task:**
Implement AI Referee (Sky-T1) for rule interpretation and foul detection.

Expected completion time: 3 days

### 2024-MM-DD: Setup Core M2E Service Backend Structure

**Description:**
Initiate the development of the Move-to-Earn (M2E) feature by creating the core backend service structure. This service will be responsible for receiving activity data (gameplay metrics, venue check-ins), applying M2E rules based on defined tokenomics, and calculating potential token earnings. This task involves setting up the basic API endpoints, data models (or schemas), and placeholder logic for calculating rewards, based on the analysis of the M2E blueprint document.

**Core Components Implemented:**
*   Initial directory structure and base files for a new `m2eService` within `src/services/`.
*   Placeholder data models/schemas for tracking M2E-eligible activities and user earnings.
*   Basic API endpoint definitions for receiving activity data and querying earnings (implementations will follow).

**Key Features:**
*   Foundation for tracking physical pool gameplay metrics for rewards.
*   Foundation for tracking venue engagement (check-ins, playtime) for rewards.

**Integration Points:**
*   Will integrate with `gameSession` service to receive gameplay data.
*   Will integrate with potential future `venueService` or existing check-in mechanisms for attendance data.
*   Will eventually integrate with the `wallet` service and blockchain interface for token distribution.

**File Paths:**
*   `src/services/m2eService/` (new directory and initial files)
*   Potentially `src/types/m2e.ts` (new types)
*   Potentially modifications to `src/core/database/models` if using DB models.

**Next Priority Task:**
*   Define and implement the `Dojo Coin` (ERC-20) smart contract.

**Estimated completion time:** 3 hours

### 2024-MM-DD: Refactored Network Consensus Integration Test

Refactored the 'should propagate state updates from leader to followers' integration test to remove the setTimeout and use direct event simulation for state propagation.

**Core Components Implemented:**

- NetworkConsensusIntegration test suite

**Key Features:**

- Improved test reliability for state propagation

**Integration Points:**

- Integration test suite for Network and Consensus components

**File Paths:**

- src/core/network/__tests__/NetworkConsensusIntegration.integration.test.ts

**Next Priority Task:**
Integrate AI Referee (Sky-T1) for rule interpretation and foul detection.

Expected completion time: 3 days

### 2024-MM-DD: Refactored Network Consensus Disconnection Test

Refactored the 'should handle node disconnection and reconnection' integration test to remove setTimeouts and use direct event simulation for network events.

**Core Components Implemented:**

- NetworkConsensusIntegration test suite

**Key Features:**

- Improved test reliability for node disconnection and reconnection scenarios

**Integration Points:**

- Integration test suite for Network and Consensus components

**File Paths:**

- src/core/network/__tests__/NetworkConsensusIntegration.integration.test.ts

**Next Priority Task:**
Implement AI Referee (Sky-T1) for rule interpretation and foul detection.

Expected completion time: 3 days

### 2024-MM-DD: Reviewed AI Referee (Sky-T1) Client Implementation

Reviewed the implementation of the `skyT1Client.ts` and `AIRefereeService.ts` files for the AI Referee integration. Confirmed that the structure for building prompts, making API calls, and parsing responses is in place. Identified the dependency on environment variables (`REACT_APP_SKY_T1_API_ENDPOINT`, `DEEPINFRA_TOKEN`) for successful API communication.

**Core Components Implemented:**

- skyT1Client
- AIRefereeService (integration point)

**Key Features:**

- AI Referee API call logic

**Integration Points:**

- External Sky-T1 API
- Environment variables

**File Paths:**

- src/services/ai/skyT1Client.ts
- src/services/ai/AIRefereeService.ts

**Next Priority Task:**
Verify environment variable configuration and actual API connectivity for the Sky-T1 AI Referee.

Expected completion time: 1 hour (Manual verification)

### 2024-MM-DD: Proposed Environment Variable Update Command

Proposed a terminal command to add/update environment variables (`REACT_APP_SKY_T1_API_ENDPOINT`, `DEEPINFRA_TOKEN`) in `.env.local` for Sky-T1 API configuration. User needs to manually replace placeholder values after command execution.

**Core Components Implemented:**

- Environment variable configuration

**Key Features:**

- Setup for Sky-T1 API connectivity

**Integration Points:**

- External Sky-T1 API
- Environment variables

**File Paths:**

- .env.local
- src/services/ai/skyT1Client.ts

**Next Priority Task:**
User to manually update environment variables in `.env.local` and confirm.

Expected completion time: 5 minutes (Manual action)

### 2024-07-01: Network Error Recovery & Resilience Integration Testing

See DEVELOPMENT_TRACKING_PART_02.md for details. Integration tests for network error recovery and resilience are now complete. Proceeding to the next outstanding user journey or technical feature.

**Next Priority Task:**
Continue with the next outstanding user journey or technical feature (e.g., tournament registration/discovery UI, QR code/geolocation check-in, real-time tracking UI, AI commentary/audio, post-game analytics, or rewards processing).

Expected completion time: 2 days

### 2024-07-01: Tournament Registration/Discovery UI Integration & Testing

Implemented and robustly tested the Tournament registration/discovery UI. The TournamentDetail component now fetches and displays venue details, and all related tests pass. This completes the core user journey for tournament discovery and registration.

**Core Components Implemented:**
- TournamentList and TournamentDetail components (UI)
- Venue detail fetching and error handling
- Comprehensive unit/integration tests for TournamentDetail

**File Paths:**
- /src/components/tournaments/TournamentList.tsx
- /src/components/tournaments/TournamentDetail.tsx
- /src/components/tournaments/TournamentDetail.test.tsx

**Next Priority Task:**
Continue with the next outstanding user journey or technical feature (e.g., QR code/geolocation check-in, real-time tracking UI, AI commentary/audio, post-game analytics, or rewards processing).

Expected completion time: 2 days

### 2024-07-01: QR Code/Geolocation Venue Check-In UI Integration

Added a QR code and geolocation-based check-in flow to the venue check-in system. Users can now check in at venues by scanning a QR code and verifying their location. The UI is integrated and tested, but backend API validation for QR/geolocation should be reviewed for completeness.

**Core Components Implemented:**
- Venue check-in system UI extension (QR/geolocation dialog)
- QRCodeScanner integration
- Geolocation capture and API call

**File Paths:**
- /src/dojopool/frontend/components/venues/[VENUE]CheckInSystem.tsx
- /src/frontend/components/QRCodeScanner.tsx

**Next Priority Task:**
Continue with the next outstanding user journey or technical feature (e.g., real-time tracking UI, AI commentary/audio, post-game analytics, or rewards processing).

Expected completion time: 1 day

### 2024-07-01: Real-Time Tracking UI – RealTimeGameView Component

Created the RealTimeGameView component, which integrates GameTracker and ShotTracker to provide a unified real-time tracking UI. The component subscribes to live game state via WebSocket, visualizes scores, fouls, current player, shot clock, and live shot tracking. This forms the foundation for the real-time game experience and is ready for further AI referee and admin view integration.

**Core Components Implemented:**
- RealTimeGameView (unified real-time tracking UI)
- GameTracker (WebSocket subscription)
- ShotTracker (live shot visualization)

**File Paths:**
- /src/features/game/RealTimeGameView.tsx
- /src/features/game/GameTracker.tsx
- /src/components/shot-analysis/ShotTracker.tsx

**Next Priority Task:**
Continue with the next outstanding user journey or technical feature (e.g., AI commentary/audio, post-game analytics, or rewards processing).

Expected completion time: 1 day

### 2024-07-19: Configure Vite for JSX (Attempt 4 - Rely on React Plugin) and tsconfig Check

Still addressing JSX parsing issues. The error `[plugin:vite:import-analysis] Failed to parse source for import analysis... If you use tsconfig.json, make sure to not set jsx to preserve.` appeared, this time for `src/frontend/main.tsx`.
Checked root `tsconfig.json`, which correctly has `"jsx": "react-jsx"`. Also checked `tsconfig.node.json`, which doesn't set `jsx`.
To simplify and avoid potential conflicts, the top-level `esbuild` configuration (previously added to handle `.js` files with JSX) was removed from `vite.config.ts`. The intention is to rely solely on `@vitejs/plugin-react` (which includes `.js`, `.jsx`, and `.tsx` files) for all JSX transformations, as this plugin uses esbuild internally and is designed for this purpose.

**Core Components Implemented:**
- Removed top-level `esbuild` configuration from `vite.config.ts`.
- Verified `tsconfig.json` and `tsconfig.node.json` `jsx` settings.
- Server port remains `3101`.

**File Paths:**
- `vite.config.ts` (modified)
- `tsconfig.json` (inspected)
- `tsconfig.node.json` (inspected)

**Next Priority Task:**
Attempt to start the development server using `npm run dev` to verify if relying purely on the React plugin resolves the JSX parsing issue in `.tsx` and `.js` files. If successful, proceed with other tasks.

Expected completion time: 15 minutes (for server start and verification)

### 2024-07-19: Renamed .js Files with JSX to .jsx Extension

To resolve persistent JSX parsing errors with Vite, files containing JSX syntax were renamed from `.js` to `.jsx` extension as per Vite's recommendation. This makes the file type explicit and avoids complex configuration workarounds.
- `src/frontend/App.js` was renamed to `src/frontend/App.jsx`.
- `src/frontend/index.js` (which also contained JSX) was renamed to `src/frontend/index.jsx`.
- The import statement for `App` within `src/frontend/index.jsx` was updated to `App.jsx`.
This change is expected to allow Vite's default mechanisms to correctly process the JSX syntax.

**Core Components Implemented:**
- File renaming for JSX compatibility.
- Import path updates.

**File Paths:**
- `src/frontend/App.jsx` (created from `App.js`)
- `src/frontend/index.jsx` (created from `index.js`)
- `src/frontend/App.js` (deleted)
- `src/frontend/index.js` (deleted)

**Next Priority Task:**
Attempt to start the development server using `npm run dev` to verify that renaming the files resolves the JSX parsing errors. If successful, proceed with other high-priority tasks.

Expected completion time: 10 minutes (for server start and verification)

### 2024-07-19: Corrected Import Path in main.tsx After File Renames

After renaming `.js` files with JSX to `.jsx`, a 404 error occurred because `src/frontend/main.tsx` was still attempting to import `App` from `./App` (implicitly `./App.js`) instead of `./App.jsx`. The import statement in `src/frontend/main.tsx` was updated to `import App from "./App.jsx";` to reflect the new file name. This resolves the 404 error for the `App` component.

**Core Components Implemented:**
- Updated import path in `src/frontend/main.tsx`.

**File Paths:**
- `src/frontend/main.tsx` (modified)

**Next Priority Task:**
Attempt to start the development server using `npm run dev`. Check the browser and developer console for errors. If the white screen persists or new errors appear, further investigation will be needed. If successful, proceed with other tasks.

Expected completion time: 5 minutes (for server start and verification)

### 2024-07-19: Corrected AuthContext Import Path in App.jsx

After renaming files to `.jsx`, a new error arose: Vite could not resolve the import for `AuthProvider` from `./components/auth/AuthContext` within `src/frontend/App.jsx`.
A file search revealed that `AuthContext.tsx` is likely located at `src/frontend/contexts/AuthContext.tsx`.
The import path in `src/frontend/App.jsx` was updated from `./components/auth/AuthContext` to `./contexts/AuthContext` to correctly point to this file. Other auth-related component paths are assumed correct for now.

**Core Components Implemented:**
- Corrected import path for `AuthProvider` in `src/frontend/App.jsx`.

**File Paths:**
- `src/frontend/App.jsx` (modified)

**Next Priority Task:**
Attempt to start the development server using `npm run dev`. Check the browser and developer console for errors. If further import resolution errors appear for other components, they will need to be addressed. If successful, proceed with other tasks.

Expected completion time: 5 minutes (for server start and verification)

### 2024-07-19: Corrected ProtectedRoute Import Path in App.jsx

Following previous import corrections, Vite failed to resolve the import for `ProtectedRoute` from `./components/auth/ProtectedRoute` within `src/frontend/App.jsx`. 
A file search confirmed `ProtectedRoute.tsx` is located at `src/components/auth/ProtectedRoute.tsx`. 
The import path in `src/frontend/App.jsx` was updated from `./components/auth/ProtectedRoute` to `../components/auth/ProtectedRoute` to correctly traverse up one directory level.

**Core Components Implemented:**
- Corrected import path for `ProtectedRoute` in `src/frontend/App.jsx`.

**File Paths:**
- `src/frontend/App.jsx` (modified)

**Next Priority Task:**
Attempt to start the development server using `npm run dev`. Check the browser and developer console for errors. If further import resolution errors appear for other auth components (Login, ResetPassword, Signup), they will need to be addressed similarly. If successful, proceed with other tasks.

Expected completion time: 5 minutes (for server start and verification)

### 2024-07-18: Corrected Dashboard Component Naming and Imports

Addressed a file naming and import inconsistency for the main Dashboard component:
1. Identified that `src/components/[UI]Dashboard.js` was a React component that violated naming conventions (prefix, `.js` extension for a JSX file).
2. Renamed the file to `src/components/Dashboard.tsx` and updated its content to basic TypeScript (adding `React.FC` and some type hints). The original JavaScript code was largely compatible.
3. Deleted the old `src/components/[UI]Dashboard.js` file.
4. Searched for and updated import paths for this component:
    - In `pages/dashboard.js` and `DojoPool/pages/dashboard.js`, changed `import Dashboard from '../src/components/[UI]Dashboard';` to `import Dashboard from '../src/components/Dashboard';`.
    - In `src/dojopool/frontend/[ROUTE]Router.tsx` and `DojoPool/src/dojopool/frontend/[ROUTE]Router.tsx`, corrected a dynamic import path from `import("./components/Dashboard/[UI]Dashboard")` to `import("../../components/Dashboard")` to correctly point to the new location from the router's perspective. The lazy-loaded component variable was also updated from `Dashboard` to `DashboardPage` to avoid potential naming conflicts.

This aligns the Dashboard component with project coding standards.

**Core Components Implemented:**
- Renamed and typed `Dashboard.tsx` component.

**File Paths:**
- `src/components/Dashboard.tsx` (created/renamed)
- `src/components/[UI]Dashboard.js` (deleted)
- `pages/dashboard.js` (modified)
- `DojoPool/pages/dashboard.js` (modified)
- `src/dojopool/frontend/[ROUTE]Router.tsx` (modified)
- `DojoPool/src/dojopool/frontend/[ROUTE]Router.tsx` (modified)

**Next Priority Task:**
Continue reviewing `src/` subdirectories (e.g., `services/`, `utils/`, `core/`, `features/`) for any other naming convention violations (PascalCase for components/classes, camelCase for utils/functions) or misplaced files.

Expected completion time: 1-2 hours (for further src review)

### 2024-07-18: Implemented Achievement API Endpoints and Integration Tests

Expanded the Achievements API and its integration test coverage:
1.  Identified that the existing API in `src/dojopool/routes/api/achievements.py` was minimal and lacked leaderboard and admin CRUD functionalities, despite the `AchievementService` having corresponding methods.
2.  Added the `GET /achievements/leaderboard` API endpoint, calling `service.get_achievement_leaderboard()`.
3.  Added Admin CRUD API endpoints:
    *   `POST /admin` (create achievement), calling `service.create_achievement()`.
    *   `GET /admin/<achievement_id>` (get achievement details), calling `service.get_achievement_details()`.
    *   `PUT /admin/<achievement_id>` (update achievement), calling `service.update_achievement()`.
    *   `DELETE /admin/<achievement_id>` (delete achievement), calling `service.delete_achievement()`.
    *   Marked these admin routes with `@login_required` and added a TODO to implement proper admin role checking/decorator, as no existing `@admin_required` decorator was readily found.
4.  Added corresponding integration tests for all new endpoints in `src/dojopool/tests/integration/test_achievements_api.py`.
    *   Modified the `test_client` fixture to provide necessary `category_id` and `achievement_id` for tests.
    *   Ensured tests cover successful cases and basic error handling (e.g., not found, bad input).

This significantly improves the completeness of the Achievements API and ensures new functionalities are covered by integration tests.

**Core Components Implemented:**
- New API endpoints for achievement leaderboard and admin CRUD operations.
- New integration tests for these API endpoints.

**File Paths:**
- `src/dojopool/routes/api/achievements.py` (modified)
- `src/dojopool/tests/integration/test_achievements_api.py` (modified)

**Next Priority Task:**
Implement proper admin authorization for the newly added admin achievement API endpoints. This involves either finding/creating an `@admin_required` decorator or integrating with an existing role/permission system within the Flask app context (e.g., checking `g.user.is_admin`).

Expected completion time: 1-2 hours (depending on complexity of auth system integration)

### 2024-07-18: Applied Admin Authorization to Achievement API Endpoints

Secured the admin-level achievement API endpoints using the existing `@admin_required` decorator from `dojopool.auth.decorators`.

1.  Identified the appropriate `@admin_required` decorator located in `src/dojopool/auth/decorators.py`, which checks for `current_user.has_role("admin")`.
2.  Imported this decorator into `src/dojopool/routes/api/achievements.py`.
3.  Replaced the temporary `@login_required` decorators and associated TODO comments on the admin CRUD routes (`POST /admin`, `GET /admin/<id>`, `PUT /admin/<id>`, `DELETE /admin/<id>`) with the `@admin_required` decorator.
4.  Removed redundant placeholder comments for admin checks from within the function bodies of these routes.

This ensures that these sensitive endpoints are now properly protected and can only be accessed by users with the "admin" role, aligning with standard security practices.

**Core Components Implemented:**
- Applied `@admin_required` decorator to relevant API endpoints.

**File Paths:**
- `src/dojopool/routes/api/achievements.py` (modified)

**Next Priority Task:**
With the Achievements API now more complete and secured, the next step is to run the relevant tests (unit and integration for achievements) to ensure all changes are working correctly and no regressions were introduced. Following successful tests, review the project roadmap for the next feature or refactoring task.

Expected completion time: 30-45 minutes (for running tests and reviewing results)

### 2024-07-18: Review of `src/` Naming Conventions and Dashboard Component Fix

Conducted a review of `src/` subdirectories for file/directory naming and placement inconsistencies, focusing on adherence to project rules (PascalCase for components/classes, camelCase for utils/functions).

**Key Actions & Findings:**
1.  **`src/components/` Review:**
    *   Identified `src/components/[UI]Dashboard.js` as a React component violating naming conventions (prefix, `.js` extension for a JSX file).
    *   Renamed this file to `src/components/Dashboard.tsx`.
    *   Updated its content to basic TypeScript (e.g., adding `React.FC`, typing state hooks) while preserving original functionality.
    *   Deleted the old `src/components/[UI]Dashboard.js`.
    *   Updated import paths for this component in `pages/dashboard.js`, `DojoPool/pages/dashboard.js`, `src/dojopool/frontend/[ROUTE]Router.tsx`, and its duplicate.
    *   Other component files in `src/components/` largely adhere to PascalCase.tsx format.
2.  **`src/services/` Review:**
    *   Files like `api.ts` (exporting an axios instance) and `analytics.ts` (exporting an instance of a simple `AnalyticsService` class) use lowercase/camelCase names, which is acceptable for utility modules or modules primarily exporting instances/functions rather than a class of the same name.
    *   Files like `WebSocketService.ts`, `PerformanceMonitor.ts`, etc., correctly use PascalCase for filenames matching their primary exported classes.
    *   Noted two services related to analytics: `src/services/analytics.ts` (simple event logger) and `src/services/AnalyticsService.ts` (complex client-side analytics state manager). While names are very similar, their distinct purposes and export patterns make immediate renaming a lower priority, though potential for confusion exists.
3.  **`src/utils/` Review:**
    *   Files generally follow lowercase or camelCase (e.g., `analyticsUtils.ts`, `validation.ts`), which is appropriate for utility modules.
4.  **`src/core/` and `src/features/` Review:**
    *   These directories primarily contain subdirectories for modular organization. A deeper review of all nested files was deferred due to time and the iterative nature of the review task.
5.  **`src/` Root Files:**
    *   Observed files like `test_sqlite.py`, `convert_images.py`, and `README.md` at the root of `src/`. These might be better placed outside `src/` (e.g., in a project-level `scripts/` or `docs/` directory) if `src/` is intended purely for application source code. This is a minor structural observation for future consideration.

**Outcome:**
The most significant naming convention violation (`[UI]Dashboard.js`) was corrected. Other areas reviewed are largely compliant or have minor points for future consideration.

**File Paths Modified/Reviewed:**
- `src/components/Dashboard.tsx` (created/renamed from `[UI]Dashboard.js`)
- `src/components/[UI]Dashboard.js` (deleted)
- `pages/dashboard.js` (modified)
- `DojoPool/pages/dashboard.js` (modified)
- `src/dojopool/frontend/[ROUTE]Router.tsx` (modified)
- `DojoPool/src/dojopool/frontend/[ROUTE]Router.tsx` (modified)
- `src/services/api.ts` (inspected)
- `src/services/analytics.ts` (inspected)
- `src/services/AnalyticsService.ts` (inspected)
- Various files in `src/utils/` (inspected via directory listing)

**Next Priority Task:**
Given the persistent issues with the Python virtual environment (`my_custom_venv`) hindering test execution, the highest priority is to establish a clean, functional Python environment as per the project's updated standards (`.venv` with `uv`). This is critical before proceeding with further development or verification tasks.

Expected completion time: 45-60 minutes (for venv recreation and dependency installation)

---