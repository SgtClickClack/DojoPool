import React, { type ComponentType } from 'react';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout/Layout';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
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

type AppPropsWithLayout = AppProps & {
  Component: ComponentType;
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
  const getLayout = (page: React.ReactElement) => <Layout>{page}</Layout>;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SessionProvider session={session}>
        <GlobalErrorBoundary onError={handleGlobalError}>
          <ChatProvider>
            <NotificationProvider>
              {getLayout(<Component {...restPageProps} />)}
            </NotificationProvider>
          </ChatProvider>
        </GlobalErrorBoundary>
      </SessionProvider>
    </ThemeProvider>
  );
}
