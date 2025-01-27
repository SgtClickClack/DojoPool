import { ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from '@/components/auth/AuthContext';
import theme from '@/theme';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
    return (
        <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <SnackbarProvider maxSnack={3}>
                    <AuthProvider>
                        <Component {...pageProps} />
                    </AuthProvider>
                </SnackbarProvider>
            </LocalizationProvider>
        </ThemeProvider>
    );
} 