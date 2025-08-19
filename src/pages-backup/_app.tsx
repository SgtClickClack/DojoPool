import React from 'react';
import { type AppProps } from 'next/app';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Main App component
function MyApp({ Component, pageProps }: AppProps) {
  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* By removing the <Navigation />, the page component will render full-screen */}
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
