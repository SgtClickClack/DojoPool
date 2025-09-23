import React from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout/Layout';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthProvider } from '@/hooks/useAuth';
import errorReportingService from '@/services/errorReportingService';
import '@/styles/index.css';
import '@/styles/mobile-responsive.css';
import '@/styles/mobile.css';
import '@/styles/components.css';
import { theme } from '@/styles/theme';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import type { AppProps } from 'next/app';

// Dynamic import for GlobalErrorBoundary to avoid SSR issues with framer-motion
const GlobalErrorBoundary = dynamic(
  () => import('@/components/ErrorBoundary/GlobalErrorBoundary'),
  { ssr: false }
);

// Error handler for GlobalErrorBoundary
const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
  errorReportingService.reportReactError(error, errorInfo, {
    component: 'App',
    userAgent: navigator.userAgent,
    url: window.location.href,
  });
};

// Setup global error handlers when component mounts
if (typeof window !== 'undefined') {
  errorReportingService.setupGlobalHandlers();
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalErrorBoundary onError={handleGlobalError}>
        <AuthProvider>
          <ChatProvider>
            <NotificationProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </NotificationProvider>
          </ChatProvider>
        </AuthProvider>
      </GlobalErrorBoundary>
    </ThemeProvider>
  );
}
