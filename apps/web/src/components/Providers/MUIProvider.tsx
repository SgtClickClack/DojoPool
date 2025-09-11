import createEmotionCache from '@/lib/emotion-cache';
import { theme } from '@/styles/theme';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ReactNode } from 'react';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

// Enhanced theme with component overrides
const enhancedTheme = createTheme(theme, {
  components: {
    ...theme.cyberpunk.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
        '*': {
          boxSizing: 'border-box',
        },
        '::-webkit-scrollbar': {
          width: '8px',
        },
        '::-webkit-scrollbar-track': {
          background: '#1a1a2e',
        },
        '::-webkit-scrollbar-thumb': {
          background: '#00d4ff',
          borderRadius: '4px',
          '&:hover': {
            background: '#33e0ff',
          },
        },
      },
    },
  },
});

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
      <ThemeProvider theme={enhancedTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
