import type { AppProps } from 'next/app';
import '../../index.css';
import ErrorBoundary from '../components/Common/ErrorBoundary';
import Layout from '../components/Layout/Layout';
import { ChatProvider } from '../contexts/ChatContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { AuthProvider } from '../hooks/useAuth';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ChatProvider>
          <NotificationProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </NotificationProvider>
        </ChatProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
