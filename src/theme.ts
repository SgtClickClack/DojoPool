import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#00ff9f',
            light: '#33ffb5',
            dark: '#00b36f',
            contrastText: '#000000',
        },
        secondary: {
            main: '#ff00ff',
            light: '#ff33ff',
            dark: '#b300b3',
            contrastText: '#000000',
        },
        background: {
            default: '#0a0a0a',
            paper: 'rgba(30, 30, 30, 0.8)',
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textShadow: '0 0 10px rgba(0, 255, 159, 0.5)',
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    textTransform: 'none',
                    padding: '8px 24px',
                    '&:hover': {
                        boxShadow: '0 0 15px rgba(0, 255, 159, 0.5)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(45deg, #00ff9f 30%, #00b36f 90%)',
                    '&:hover': {
                        background: 'linear-gradient(45deg, #33ffb5 30%, #00ff9f 90%)',
                    },
                },
                containedSecondary: {
                    background: 'linear-gradient(45deg, #ff00ff 30%, #b300b3 90%)',
                    '&:hover': {
                        background: 'linear-gradient(45deg, #ff33ff 30%, #ff00ff 90%)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(30, 30, 30, 0.8)',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
    },
});

export default theme; 