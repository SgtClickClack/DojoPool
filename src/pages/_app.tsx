import theme from '@/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { AppProps } from 'next/app';
import { Toast } from '../components/Notifications/[NOTIFY]Toast';
import { ChallengeProvider } from '../contexts/ChallengeContext';
import { AuthProvider } from '../frontend/contexts/AuthContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ChallengeProvider userId="current-user">
          <Component {...pageProps} />
          <Toast />
        </ChallengeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
