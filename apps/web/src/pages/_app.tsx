import GlobalErrorBoundary from '@/components/ErrorBoundary/GlobalErrorBoundary';
import Layout from '@/components/Layout/Layout';
import { ChatProvider } from '@/contexts/ChatContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { AuthProvider } from '@/hooks/useAuth';
import errorReportingService from '@/services/errorReportingService';
import '@/styles/index.css';
import '@/styles/mobile-responsive.css';
import '@/styles/mobile.css';
import { NextIntlClientProvider } from 'next-intl';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';

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
  const router = useRouter();

  return (
    <GlobalErrorBoundary onError={handleGlobalError}>
      <NextIntlClientProvider
        locale={router.locale}
        timeZone="Etc/UTC"
        messages={pageProps.messages}
      >
        <AuthProvider>
          <WebSocketProvider>
            <ChatProvider>
              <NotificationProvider>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </NotificationProvider>
            </ChatProvider>
          </WebSocketProvider>
        </AuthProvider>
      </NextIntlClientProvider>
    </GlobalErrorBoundary>
  );
}
