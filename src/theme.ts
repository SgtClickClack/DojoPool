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
            paper: 'rgba(30, 30, 30, 0.95)',
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.87)',
        },
        error: {
            main: '#ff5252',
            light: '#ff867f',
            dark: '#c50e29',
        },
        success: {
            main: '#69f0ae',
            light: '#9fffe0',
            dark: '#2bbd7e',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            textShadow: '0 0 10px rgba(0, 255, 159, 0.5)',
            lineHeight: 1.3,
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            lineHeight: 1.35,
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            lineHeight: 1.4,
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
            lineHeight: 1.4,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            lineHeight: 1.45,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.5,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
            letterSpacing: '0.00938em',
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
            letterSpacing: '0.01071em',
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
                    '&:focus-visible': {
                        outline: '2px solid #00ff9f',
                        outlineOffset: '2px',
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
                    backgroundColor: 'rgba(30, 30, 30, 0.95)',
                    borderRadius: 8,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    '&:focus-visible': {
                        outline: '2px solid #00ff9f',
                        outlineOffset: '2px',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    '&:focus-visible': {
                        outline: '2px solid #00ff9f',
                        outlineOffset: '2px',
                    },
                },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    '&:focus-visible': {
                        outline: '2px solid #00ff9f',
                        outlineOffset: '2px',
                    },
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '&:focus-visible': {
                            outline: '2px solid #00ff9f',
                            outlineOffset: '2px',
                        },
                    },
                },
            },
        },
    },
    spacing: 8,
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
    },
});

export default theme; 