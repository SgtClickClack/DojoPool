// Cyberpunk Dojo Pool Theme Configuration
export const theme = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff', // Cyber cyan
      light: '#33e0ff',
      dark: '#0099cc',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ff6b6b', // Cyber red
      light: '#ff9999',
      dark: '#cc5555',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0f0f23', // Deep space black
      paper: '#1a1a2e', // Dark blue-gray
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    error: {
      main: '#ff4444', // Bright cyber red
    },
    warning: {
      main: '#ffa500', // Cyber orange
    },
    info: {
      main: '#00d4ff', // Cyber cyan
    },
    success: {
      main: '#00ff88', // Cyber green
    },
  },
  typography: {
    fontFamily: '"Roboto", "Orbitron", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
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
  // Cyberpunk-specific styling
  cyberpunk: {
    gradients: {
      primary: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
      secondary: 'linear-gradient(135deg, #ff6b6b 0%, #cc5555 100%)',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
      card: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    },
    glows: {
      primary: '0 0 10px rgba(0, 212, 255, 0.5)',
      secondary: '0 0 10px rgba(255, 107, 107, 0.5)',
      text: '0 0 5px rgba(0, 212, 255, 0.8)',
    },
    borders: {
      primary: '1px solid #00d4ff',
      secondary: '1px solid #ff6b6b',
      subtle: '1px solid rgba(0, 212, 255, 0.3)',
    },
    shadows: {
      card: '0 4px 20px rgba(0, 212, 255, 0.1)',
      elevated: '0 8px 30px rgba(0, 212, 255, 0.2)',
      button: '0 2px 10px rgba(0, 212, 255, 0.3)',
      glow: '0 0 20px rgba(0, 212, 255, 0.4)',
    },
    animations: {
      hover: {
        transform: 'translateY(-2px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      pulse: 'pulse 2s infinite',
    },
    // Seasonal Battle Pass specific styling
    battlePass: {
      free: {
        primary: '#00d4ff',
        secondary: '#0099cc',
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
        border: '1px solid #00d4ff',
        glow: '0 0 15px rgba(0, 212, 255, 0.3)',
      },
      premium: {
        primary: '#ffd700',
        secondary: '#ffed4e',
        background: 'linear-gradient(135deg, #1a1a0f 0%, #2e2e1a 100%)',
        border: '2px solid #ffd700',
        glow: '0 0 20px rgba(255, 215, 0, 0.4)',
        sparkle: '0 0 25px rgba(255, 215, 0, 0.6)',
      },
      progress: {
        background: '#1a1a2e',
        fill: 'linear-gradient(90deg, #00d4ff 0%, #ffd700 100%)',
        incomplete: '#333344',
      },
      tier: {
        unlocked: '#00ff88',
        current: '#ffd700',
        locked: '#666666',
        premium: '#ffed4e',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
              transition: 'all 0.3s ease',
            },
          },
          contained: {
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #33e0ff 0%, #00d4ff 100%)',
            },
          },
          outlined: {
            border: '1px solid #00d4ff',
            '&:hover': {
              border: '1px solid #33e0ff',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
            boxShadow: '0 2px 20px rgba(0, 212, 255, 0.2)',
            backdropFilter: 'blur(10px)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 212, 255, 0.1)',
            '&:hover': {
              border: '1px solid rgba(0, 212, 255, 0.4)',
              boxShadow: '0 8px 30px rgba(0, 212, 255, 0.2)',
              transform: 'translateY(-2px)',
              transition: 'all 0.3s ease',
            },
          },
        },
      },
    },
  },
};
