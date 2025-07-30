import React from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Button } from '@mui/material';
import Link from 'next/link';

// Navigation component
const Navigation = () => (
  <AppBar position="static">
    <Toolbar>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        DojoPool
      </Typography>
      <Link href="/" passHref>
        <Button color="inherit">Home</Button>
      </Link>
      <Link href="/game-mechanics" passHref>
        <Button color="inherit">Game Mechanics</Button>
      </Link>
      <Link href="/tournaments" passHref>
        <Button color="inherit">Tournaments</Button>
      </Link>
      <Link href="/clan-wars" passHref>
        <Button color="inherit">Clan Wars</Button>
      </Link>
      <Link href="/ai-commentary" passHref>
        <Button color="inherit">AI Commentary</Button>
      </Link>
    </Toolbar>
  </AppBar>
);

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
      <Navigation />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;