import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Assuming you will use Redux
// import { Provider as ReduxProvider } from 'react-redux';
// import store from './store'; // Your Redux store configuration

// Assuming you will use Material UI
// import { ThemeProvider } from '@mui/material/styles';
// import theme from './theme'; // Your custom MUI theme

// Assuming you have a custom AuthProvider
import { AuthProvider } from './contexts/AuthContext';

import App from './App';
import './index.css'; // Or your global stylesheet

// A more visually appealing or functional loading component is recommended
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem' }}>
    <p>Loading, please wait...</p>
    {/* You could add a spinner animation here */}
  </div>
);

const rootElement = document.getElementById('root');

// Ensure the root element exists before trying to render
if (!rootElement) {
  throw new Error("Failed to find the root element. Please ensure an element with id 'root' exists in your HTML.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);