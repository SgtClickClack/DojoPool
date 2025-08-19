import React, { Suspense, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
// AuthContext is likely provided in main.tsx now, so useAuth can be imported directly.
// If AuthProvider is NOT moved to main.tsx, you'd keep the import { AuthProvider, useAuth } from './contexts/AuthContext';
// Removed non-existent AuthContext import
import { SocketProvider } from './contexts/SocketContext';
// CssBaseline and ThemeProvider will be in main.tsx.
// import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './three-extensions';

// Removed non-existent service imports

// Lazy load components
// Removed non-existent Login component import
const Register = React.lazy(() => import('./components/Auth/Register'));
const AvatarCreation = React.lazy(
  () => import('./components/Avatar/AvatarCreation')
);
const GameView = React.lazy(() => import('./components/Game/GameView'));
const Ledger = React.lazy(() => import('./components/wallet/Ledger'));
// Removed non-existent component imports

// Removed non-existent AI component imports

// Removed non-existent component imports

// Theme definition should be moved to a separate file (e.g., theme.ts) and imported in main.tsx
// const theme = createTheme({
//   palette: {
//     mode: 'dark', // Or 'light'
//   },
// });

// Removed non-existent page imports

// New Narrative Features
// Removed non-existent page imports

// Core Game Features
// const BattlePage = React.lazy(() => import("../../pages/game/battle"));
// const AvatarEvolutionPage = React.lazy(() => import("../pages/avatar/evolution"));
// const ClanWarsPage = React.lazy(() => import("../pages/clan/wars"));

// Removed non-existent component imports

interface ProtectedRouteProps {
  // children?: React.ReactNode; // Outlet will handle children for layout routes
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  // Mock auth implementation
  const user = true;
  const loading = false;

  if (loading) {
    // Use the same LoadingFallback or a specific one for auth checking
    return <LoadingFallback message="Authenticating..." />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// A more specific or shared loading fallback
const LoadingFallback = ({
  message = 'Loading content...',
}: {
  message?: string;
}) => (
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

// Removed non-existent wrapper functions

// Removed non-existent wrapper function

// Main route component that handles onboarding flow
const MainRoute: React.FC = () => {
  // Mock auth implementation
  const user = true;
  const loading = false;
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    if (!loading) {
      // Removed OnboardingService reference
      setOnboardingComplete(true);
    }
  }, [loading]);

  if (loading || onboardingComplete === null) {
    return <LoadingFallback message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!onboardingComplete) {
    return <div>Onboarding Screen Removed</div>;
  }

  return <div>Map Component Removed</div>;
};

// This App component assumes ThemeProvider, CssBaseline, AuthProvider, and BrowserRouter
// are wrapping it from main.tsx (or your root index file)
const App: React.FC = () => {
  // Removed logger reference

  // Initialize SPRINT 9 services
  useEffect(() => {
    // Removed service initialization code
  }, []);

  return (
    <SocketProvider>
      <Suspense fallback={<LoadingFallback message="Loading page..." />}>
        <Routes>
          {/* Main entry route */}
          <Route path="/" element={<MainRoute />} />
          {/* Public routes */}
          {/* Removed non-existent Login route */}
          <Route path="/register" element={<Register />} />
          {/* Removed non-existent routes */}

          {/* Protected routes using an element for layout/protection */}
          <Route element={<ProtectedRoute />}>
            <Route path="/avatar-creation" element={<AvatarCreation />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/game/:gameId" element={<GameView />} />
            {/* Removed non-existent routes */}
            {/* Removed non-existent AI routes */}
            {/* Removed non-existent routes */}
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
  // Mock auth implementation
  const user = true;
  const loading = false;

  if (loading) {
    return <LoadingFallback message="Loading..." />;
  }
  // Redirect all unknown routes to the Living World prototype
  return <Navigate to="/" replace />;
  // For a true 404 page experience, you'd render a NotFoundPage component:
  // return <NotFoundPage />;
};

export default App;
