import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
// Assuming you will use Redux
// import { Provider as ReduxProvider } from 'react-redux';
// import store from './store'; // Your Redux store configuration

// AuthProvider removed - using PlayerProvider from Living World prototype

import App from './App';
import './index.css'; // Or your global stylesheet

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

// A more visually appealing or functional loading component is recommended
const LoadingFallback = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '1.5rem',
      color: theme.palette.text.primary,
    }}
  >
    <p>Loading, please wait...</p>
    {/* You could add a spinner animation here */}
  </div>
);

const rootElement = document.getElementById('root');

// Ensure the root element exists before trying to render
if (!rootElement) {
  throw new Error(
    "Failed to find the root element. Please ensure an element with id 'root' exists in your HTML."
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
