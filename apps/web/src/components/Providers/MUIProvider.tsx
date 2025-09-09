import createEmotionCache from '@/lib/emotion-cache';
import { theme } from '@/styles/theme';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { ReactNode } from 'react';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MUIProviderProps {
  children: ReactNode;
  emotionCache?: any;
}

export default function MUIProvider({
  children,
  emotionCache = clientSideEmotionCache,
}: MUIProviderProps) {
  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
