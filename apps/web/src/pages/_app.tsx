import type { AppProps } from 'next/app';
import ErrorBoundary from '../components/Common/ErrorBoundary';
import SimpleLayout from '../components/Layout/SimpleLayout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <SimpleLayout>
        <Component {...pageProps} />
      </SimpleLayout>
    </ErrorBoundary>
  );
}
