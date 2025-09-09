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
    },
  },
};
