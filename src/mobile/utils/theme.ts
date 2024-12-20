import { createTheme } from '@rneui/themed';

export const theme = createTheme({
  lightColors: {
    primary: '#E63946',     // Vibrant red for primary actions
    secondary: '#457B9D',   // Blue for secondary elements
    background: '#F1FAEE',  // Light background
    surface: '#FFFFFF',     // White surface
    text: '#1D3557',       // Dark blue text
    error: '#D62828',      // Error red
    success: '#2A9D8F',    // Success green
    warning: '#E9C46A',    // Warning yellow
    info: '#A8DADC',       // Info blue
  },
  darkColors: {
    primary: '#FF4D5E',     // Brighter red for dark mode
    secondary: '#5C9DC4',   // Lighter blue for dark mode
    background: '#1D3557',  // Dark blue background
    surface: '#2B4970',     // Lighter surface
    text: '#F1FAEE',       // Light text
    error: '#FF3B3B',      // Bright error red
    success: '#34C5B5',    // Bright success green
    warning: '#FFD97D',    // Bright warning yellow
    info: '#BCE4E6',       // Bright info blue
  },
  mode: 'light',
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  components: {
    Button: {
      raised: true,
      borderRadius: 8,
    },
    Card: {
      borderRadius: 12,
      elevation: 2,
    },
    Text: {
      h1Style: {
        fontSize: 28,
        fontWeight: 'bold',
      },
      h2Style: {
        fontSize: 24,
        fontWeight: 'bold',
      },
      h3Style: {
        fontSize: 20,
        fontWeight: 'bold',
      },
      h4Style: {
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
  },
}); 