import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
// AuthContext is likely provided in main.tsx now, so useAuth can be imported directly.
// If AuthProvider is NOT moved to main.tsx, you'd keep the import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext'; // Assuming AuthProvider is in main.tsx
import { UserProvider } from './contexts/UserContext';
import { SocketProvider } from './contexts/SocketContext';
// CssBaseline and ThemeProvider will be in main.tsx.
// import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Lazy load components
const Login = React.lazy(() => import('./components/Auth/Login'));
const Register = React.lazy(() => import('./components/Auth/Register'));
const Dashboard = React.lazy(() => import('./components/Dashboard/Dashboard'));
const GameView = React.lazy(() => import('./components/Game/GameView'));
const SpectatorView = React.lazy(() => import('../dojopool/frontend/components/Game/SpectatorView'));
// Consistent path convention (assuming components is a sibling of contexts, App.tsx is in src)
const TournamentDetail = React.lazy(() => import('../components/tournaments/TournamentDetail'));
const TournamentList = React.lazy(() => import('../components/tournaments/TournamentList'));
const VenueDashboard = React.lazy(() => import('../dojopool/frontend/components/Venue/VenueDashboard'));
const UserProfile = React.lazy(() => import('../components/social/UserProfile'));
const SocialFeed = React.lazy(() => import('../components/social/SocialFeed'));
const TournamentDashboard = React.lazy(() => import('../dojopool/frontend/components/Tournament/TournamentDashboard'));

// Theme definition should be moved to a separate file (e.g., theme.ts) and imported in main.tsx
// const theme = createTheme({
//   palette: {
//     mode: 'dark', // Or 'light'
//   },
// });

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

const VenueDashboardWrapper = () => {
  const { venueId } = useParams();
  return <VenueDashboard venueId={venueId as string} />;
};

const SpectatorViewWrapper = () => {
  const { gameId } = useParams();
  return <SpectatorView gameId={gameId as string} />;
};

const UserProfileSelfWrapper = () => <UserProfile />;
const UserProfileOtherWrapper = () => {
  const { username } = useParams();
  return <UserProfile username={username} />;
};

const SocialFeedWrapper = () => <SocialFeed />;

// This App component assumes ThemeProvider, CssBaseline, AuthProvider, and BrowserRouter
// are wrapping it from main.tsx (or your root index file)
const App: React.FC = () => {
  return (
    // UserProvider and SocketProvider are more specific and can stay here,
    // especially if they depend on the user being authenticated.
    <UserProvider>
      <SocketProvider>
        <Suspense fallback={<LoadingFallback message="Loading page..." />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Initial redirector: handles where to go from "/" */}
            <Route path="/" element={<InitialRedirect />} />

            {/* Protected routes using an element for layout/protection */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/game/:gameId" element={<GameView />} />
              <Route path="/spectate/:gameId" element={<SpectatorViewWrapper />} />
              <Route path="/tournaments" element={<TournamentDashboard />} />
              <Route path="/tournaments/:id" element={<TournamentDetail />} />
              <Route path="/venues/:venueId" element={<VenueDashboardWrapper />} />
              <Route path="/profile" element={<UserProfileSelfWrapper />} />
              <Route path="/profile/:username" element={<UserProfileOtherWrapper />} />
              <Route path="/feed" element={<SocialFeedWrapper />} />
              <Route path="/venue-dashboard" element={<VenueDashboard />} />
              {/* Add other protected routes here */}
            </Route>

            {/* Catch all route - should be last */}
            <Route path="*" element={<NotFoundRedirect />} />
          </Routes>
        </Suspense>
      </SocketProvider>
    </UserProvider>
  );
};

// Helper component to handle initial redirect from "/" based on auth state
const InitialRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback message="Checking session..." />;
  }

  return user ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  );
};

// Helper component for the catch-all route to provide a better UX
const NotFoundRedirect: React.FC = () => {
    const { user, loading } = useAuth();

    if (loading) {
      return <LoadingFallback message="Loading..." />;
    }
    // Optionally, you can navigate to a dedicated 404 component
    // return <Navigate to="/404" replace />;
    // Or, redirect to dashboard if logged in, else to login
    return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
    // For a true 404 page experience, you'd render a NotFoundPage component:
    // return <NotFoundPage />;
};


export default App;