import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import theme from './theme';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import TournamentDetailPage from './pages/TournamentDetailPage';
import TournamentResultsPage from './pages/TournamentResultsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { useWallet } from './hooks/useWallet';
import WalletErrorDialog from './components/wallet/WalletErrorDialog';

// Wrapper component to handle global wallet error dialog
const AppWithWalletErrorHandling: React.FC = () => {
  const { 
    walletError, 
    showErrorDialog, 
    handleCloseErrorDialog, 
    handleRetryOperation,
    connectWallet
  } = useWallet();

  const handleGoToWallet = () => {
    // Open wallet in a new tab based on the wallet type
    if (walletError?.walletType === 'ethereum') {
      window.open('https://metamask.io/download/', '_blank');
    } else if (walletError?.walletType === 'solana') {
      window.open('https://phantom.app/download', '_blank');
    }
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tournaments/:tournamentId" 
            element={
              <ProtectedRoute>
                <TournamentDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tournaments/:tournamentId/results" 
            element={
              <ProtectedRoute>
                <TournamentResultsPage />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>

      {/* Wallet Error Dialog */}
      <WalletErrorDialog
        error={walletError}
        open={showErrorDialog}
        onClose={handleCloseErrorDialog}
        onRetry={handleRetryOperation}
        onGoToWallet={handleGoToWallet}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <UserProvider>
          <Router>
            <AppWithWalletErrorHandling />
          </Router>
        </UserProvider>
      </AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeProvider>
  );
};

export default App; 