import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { Toast } from './components/Notifications/Toast';
import { Router } from './Router';
import { theme } from './theme';
import { logError } from './utils/errorHandling';

const App: React.FC = () => {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
        logError(error, 'App');
        // You could also send the error to an error tracking service here
    };

    return (
        <ErrorBoundary onError={handleError}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router />
                <Toast />
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default App; 