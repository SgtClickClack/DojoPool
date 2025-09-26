import React from 'react';
import type { AppProps, NextPage } from 'next/app';
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
import { SessionProvider } from 'next-auth/react';

// Dynamic import for GlobalErrorBoundary to avoid SSR issues with framer-motion
const GlobalErrorBoundary = dynamic(
  () => import('@/components/ErrorBoundary/GlobalErrorBoundary'),
  { ssr: false }
);

type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

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

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  // Support NextAuth session propagation to pages
  const { session, ...restPageProps } = pageProps as any;

  // Allow pages to define their own layout or use default
  const getLayout =
    Component.getLayout ||
    ((page: React.ReactElement) => <Layout>{page}</Layout>);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalErrorBoundary onError={handleGlobalError}>
        <SessionProvider session={session}>
          <AuthProvider>
            <ChatProvider>
              <NotificationProvider>
                {getLayout(<Component {...restPageProps} />)}
              </NotificationProvider>
            </ChatProvider>
          </AuthProvider>
        </SessionProvider>
      </GlobalErrorBoundary>
    </ThemeProvider>
  );
}
