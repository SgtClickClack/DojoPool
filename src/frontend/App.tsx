import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
// AuthContext is likely provided in main.tsx now, so useAuth can be imported directly.
// If AuthProvider is NOT moved to main.tsx, you'd keep the import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAuth } from '../components/auth/AuthContext'; // Fixed import path to match main.tsx
import { SocketProvider } from './contexts/SocketContext';
// CssBaseline and ThemeProvider will be in main.tsx.
// import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './three-extensions';

// Import new services for SPRINT 9
import { registerServiceWorker } from '../utils/serviceWorker';
import { analytics, trackPageView } from '../services/AnalyticsService';
import { security } from '../services/SecurityService';
import { bundleOptimizer } from '../utils/bundleOptimizer';
import { deploymentManager } from '../config/deployment';
import { logger } from '../utils/logger';
import { OnboardingService } from '../services/OnboardingService';

// Lazy load components
const Login = React.lazy(() => import('../components/auth/Login'));
const Register = React.lazy(() => import('./components/Auth/Register'));
const AvatarCreation = React.lazy(() => import('./components/Avatar/AvatarCreation'));
const GameView = React.lazy(() => import('./components/Game/GameView'));
const Ledger = React.lazy(() => import('./components/wallet/Ledger'));
const Map = React.lazy(() => import('./components/MapView.tsx'));
// const SpectatorView = React.lazy(() => import('./components/Game/SpectatorView'));
// Consistent path convention (assuming components is a sibling of contexts, App.tsx is in src)
const TournamentDetail = React.lazy(() => import('../components/tournaments/TournamentDetail'));
const TournamentList = React.lazy(() => import('../components/tournaments/TournamentList'));
// const VenueDashboard = React.lazy(() => import('./components/Venue/VenueDashboard'));
const UserProfile = React.lazy(() => import('../components/social/UserProfile'));
const SocialFeed = React.lazy(() => import('../components/social/SocialFeed'));
// const TournamentDashboard = React.lazy(() => import('./components/Tournament/TournamentDashboard'));

// AI Feature Components
const MatchAnalysis = React.lazy(() => import('../pages/ai/match-analysis'));
const Coaching = React.lazy(() => import('../pages/ai/coaching'));
const AdvancedMatchAnalysis = React.lazy(() => import('../pages/ai/advanced-match-analysis'));

// Performance Components
const TournamentPerformance = React.lazy(() => import('../pages/performance/tournament-performance'));

// Tournament Components
const BracketVisualization = React.lazy(() => import('../pages/tournaments/bracket-visualization'));

// Social Components
const TournamentSocial = React.lazy(() => import('../pages/social/tournament-social'));

// Analytics Components
const TournamentAnalytics = React.lazy(() => import('../pages/analytics/tournament-analytics'));

// Mobile Components
const TournamentMobile = React.lazy(() => import('../pages/mobile/tournament-mobile'));

// Streaming Components
const TournamentStreaming = React.lazy(() => import('../pages/streaming/tournament-streaming'));

// Venue Components
const VenueManagement = React.lazy(() => import('../pages/venue/venue-management'));

// Theme definition should be moved to a separate file (e.g., theme.ts) and imported in main.tsx
// const theme = createTheme({
//   palette: {
//     mode: 'dark', // Or 'light'
//   },
// });

import TournamentMobilePage from '../pages/mobile/tournament-mobile';
import TournamentBlockchainPage from '../pages/blockchain/tournament-blockchain';
import TournamentSecurityPage from '../pages/security/tournament-security';
import TournamentCompliancePage from '../pages/compliance/tournament-compliance';
import VenueManagementPage from '../pages/venue/venue-management';
import DojoProfilePage from '../pages/venue/dojo-profile';
import AIRefereePage from '../pages/referee/ai-referee';
import AdvancedAnalyticsPage from '../pages/advanced-analytics';
import TournamentCommentaryPage from '../pages/tournaments/tournament-commentary';
import TournamentPredictionPage from '../pages/tournaments/tournament-prediction';
import VenueAnalyticsPage from '../pages/venue/venue-analytics';
import DojoCoinRewardsPage from '../pages/venue/dojo-coin-rewards';
import VenueSpecialsPage from '../pages/venue/venue-specials';
import DojoProfileCustomizationPage from '../pages/venue/dojo-profile-customization';
import SocialCommunityPage from '../pages/SocialCommunityPage';
import AdvancedAIRefereePage from '../pages/AdvancedAIRefereePage';
import AdvancedGameReplayPage from '../pages/AdvancedGameReplayPage';
import EquipmentManagementPage from '../pages/venue/equipment-management';
import NFTMarketplacePage from '../pages/nft-marketplace';
import AdvancedVenueAnalyticsPage from '../pages/advanced-venue-analytics';
import VoiceAssistantPage from '../pages/voice-assistant';

// New Narrative Features
const AvatarProgression = React.lazy(() => import("../pages/avatar-progression"));
const ClanWars = React.lazy(() => import("../pages/clan-wars"));
const Tournaments = React.lazy(() => import("../pages/tournament-management"));
const AICommentary = React.lazy(() => import("../pages/ai-commentary"));
const AdvancedMatchCommentary = React.lazy(() => import("../pages/ai-commentary"));
const GameMechanics = React.lazy(() => import("../pages/game-mechanics"));

// Core Game Features
// const BattlePage = React.lazy(() => import("../../pages/game/battle"));
// const AvatarEvolutionPage = React.lazy(() => import("../pages/avatar/evolution"));
// const ClanWarsPage = React.lazy(() => import("../pages/clan/wars"));

// Onboarding Components
const ChooseDojoScreen = React.lazy(() => import("../../pages/onboarding/choose-dojo"));

// Diception AI Integration
const DiceptionTest = React.lazy(() => import("../pages/diception-test"));

interface ProtectedRouteProps {
  // children?: React.ReactNode; // Outlet will handle children for layout routes
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Use the same LoadingFallback or a specific one for auth checking
    return <LoadingFallback message="Authenticating..." />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// A more specific or shared loading fallback
const LoadingFallback = ({ message = "Loading content..." }: { message?: string }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.2rem', // Adjusted size
    }}
  >
    {message}
  </div>
);

// const VenueDashboardWrapper = () => {
//   const { venueId } = useParams();
//   return <VenueDashboard venueId={venueId as string} />;
// };

// const SpectatorViewWrapper = () => {
//   const { gameId } = useParams();
//   return <SpectatorView gameId={gameId as string} />;
// };

const UserProfileSelfWrapper = () => <UserProfile />;
const UserProfileOtherWrapper = () => {
  const { username } = useParams();
  return <UserProfile username={username} />;
};

const SocialFeedWrapper = () => <SocialFeed />;

// Main route component that handles onboarding flow
const MainRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) {
      const isComplete = OnboardingService.isOnboardingComplete();
      setOnboardingComplete(isComplete);
    }
  }, [loading]);

  if (loading || onboardingComplete === null) {
    return <LoadingFallback message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!onboardingComplete) {
    return <ChooseDojoScreen />;
  }

  return <Map />;
};

// This App component assumes ThemeProvider, CssBaseline, AuthProvider, and BrowserRouter
// are wrapping it from main.tsx (or your root index file)
const App: React.FC = () => {
  logger.debug('App component rendering');

  // Initialize SPRINT 9 services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Register service worker
        if (deploymentManager.isFeatureEnabled('serviceWorkerEnabled')) {
          await registerServiceWorker({
            onSuccess: (registration) => {
              logger.info('Service Worker registered successfully');
            },
            onUpdate: (registration) => {
              logger.info('Service Worker update available');
            },
            onError: (error) => {
              logger.error('Service Worker registration failed', { error: error.message });
            }
          });
        }

        // Initialize analytics
        if (deploymentManager.isFeatureEnabled('analyticsEnabled')) {
          logger.info('Analytics service initialized');
          trackPageView('app_loaded');
        }

        // Initialize security
        if (deploymentManager.isFeatureEnabled('securityEnabled')) {
          logger.info('Security service initialized');
        }

        // Initialize bundle optimization
        if (deploymentManager.isFeatureEnabled('monitoringEnabled')) {
          await bundleOptimizer.trackBundleSize();
          logger.info('Bundle optimization monitoring initialized');
        }

        logger.info('All SPRINT 9 services initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize services', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };

    initializeServices();
  }, []);

  return (
    <SocketProvider>
      <Suspense fallback={<LoadingFallback message="Loading page..." />}>
        <Routes>
          {/* Main entry route */}
          <Route path="/" element={<MainRoute />} />
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/diception-test" element={<DiceptionTest />} />
          <Route path="/avatar-progression" element={<AvatarProgression />} />
          <Route path="/clan-wars" element={<ClanWars />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/ai-commentary" element={<AICommentary />} />
          <Route path="/game-mechanics" element={<GameMechanics />} />
          <Route path="/onboarding/choose-dojo" element={<ChooseDojoScreen />} />

          {/* Protected routes using an element for layout/protection */}
          <Route element={<ProtectedRoute />}>
            <Route path="/avatar-creation" element={<AvatarCreation />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/game/:gameId" element={<GameView />} />
            <Route path="/map" element={<Map />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/profile" element={<UserProfileSelfWrapper />} />
            <Route path="/profile/:username" element={<UserProfileOtherWrapper />} />
            <Route path="/feed" element={<SocialFeedWrapper />} />
            <Route path="/ai/match-analysis" element={<MatchAnalysis />} />
            <Route path="/ai/coaching" element={<Coaching />} />
            <Route path="/ai/advanced-match-analysis" element={<AdvancedMatchAnalysis />} />
            <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
            <Route path="/ai-commentary" element={<AdvancedMatchCommentary />} />
            <Route path="/performance/tournament-performance" element={<TournamentPerformance />} />
            <Route path="/tournaments/bracket-visualization" element={<BracketVisualization />} />
            <Route path="/tournaments/commentary" element={<TournamentCommentaryPage />} />
            <Route path="/tournaments/prediction" element={<TournamentPredictionPage />} />
            <Route path="/social/tournament-social" element={<TournamentSocial />} />
            <Route path="/analytics/tournament-analytics" element={<TournamentAnalytics />} />
            <Route path="/mobile" element={<TournamentMobilePage />} />
            <Route path="/blockchain" element={<TournamentBlockchainPage />} />
            <Route path="/security" element={<TournamentSecurityPage />} />
            <Route path="/compliance/tournament-compliance" element={<TournamentCompliancePage />} />
            <Route path="/streaming/tournament-streaming" element={<TournamentStreaming />} />
            <Route path="/streaming" element={<TournamentStreaming />} />
            <Route path="/venues/venue-management" element={<VenueManagementPage />} />
            <Route path="/venues" element={<VenueManagement />} />
            <Route path="/venue/equipment-management" element={<EquipmentManagementPage />} />
            <Route path="/referee/ai-referee" element={<AIRefereePage />} />
            <Route path="/advanced-analytics" element={<AdvancedAnalyticsPage />} />
            <Route path="/venue/dojo-profile" element={<DojoProfilePage />} />
            <Route path="/venue/analytics" element={<VenueAnalyticsPage />} />
            <Route path="/venue/dojo-coin-rewards" element={<DojoCoinRewardsPage />} />
            <Route path="/venue/venue-specials" element={<VenueSpecialsPage />} />
            <Route path="/venue/dojo-profile-customization" element={<DojoProfileCustomizationPage />} />
            <Route path="/social/community" element={<SocialCommunityPage />} />
            <Route path="/referee/advanced-ai-referee" element={<AdvancedAIRefereePage />} />
            <Route path="/game-replay" element={<AdvancedGameReplayPage />} />
            <Route path="/nft-marketplace" element={<NFTMarketplacePage />} />
            <Route path="/advanced-venue-analytics" element={<AdvancedVenueAnalyticsPage />} />
          </Route>

          {/* Catch all route - should be last */}
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </Suspense>
    </SocketProvider>
  );
};

// Helper component for the catch-all route to provide a better UX
const NotFoundRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback message="Loading..." />;
  }
  // Redirect all unknown routes to the Living World prototype
  return <Navigate to="/" replace />;
  // For a true 404 page experience, you'd render a NotFoundPage component:
  // return <NotFoundPage />;
};

export default App;