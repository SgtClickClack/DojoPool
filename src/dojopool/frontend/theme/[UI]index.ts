import { createTheme } from "@mui/material/styles";

export const colors = {
  primary: {
    main: "#00ffff", // Cyan
    light: "#80ffff",
    dark: "#00cccc",
    contrastText: "#000000",
  },
  secondary: {
    main: "#ff00ff", // Magenta
    light: "#ff80ff",
    dark: "#cc00cc",
    contrastText: "#000000",
  },
  error: {
    main: "#d32f2f",
    light: "#ef5350",
    dark: "#c62828",
    contrastText: "#ffffff",
  },
  warning: {
    main: "#ed6c02",
    light: "#ff9800",
    dark: "#e65100",
    contrastText: "#ffffff",
  },
  info: {
    main: "#0288d1",
    light: "#03a9f4",
    dark: "#01579b",
    contrastText: "#ffffff",
  },
  success: {
    main: "#2e7d32",
    light: "#4caf50",
    dark: "#1b5e20",
    contrastText: "#ffffff",
  },
  grey: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#e0e0e0",
    400: "#bdbdbd",
    500: "#9e9e9e",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },
  background: {
    default: "#121212",
    paper: "#1e1e1e",
  },
  text: {
    primary: "#ffffff",
    secondary: "rgba(255, 255, 255, 0.7)",
  },
};

export const spacing = {
  unit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 14,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: {
    fontSize: "2.5rem",
    fontWeight: 300,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: "2rem",
    fontWeight: 300,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: "1.75rem",
    fontWeight: 400,
    lineHeight: 1.2,
  },
  h4: {
    fontSize: "1.5rem",
    fontWeight: 400,
    lineHeight: 1.2,
  },
  h5: {
    fontSize: "1.25rem",
    fontWeight: 400,
    lineHeight: 1.2,
  },
  h6: {
    fontSize: "1rem",
    fontWeight: 500,
    lineHeight: 1.2,
  },
  body1: {
    fontSize: "1rem",
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body2: {
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: 1.43,
  },
};

export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

export const transitions = {
  easing: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },
  duration: {
    shortest: 150,
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195,
  },
};

export const zIndex = {
  mobileStepper: 1000,
  fab: 1050,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500,
};

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: colors.text,
  },
  typography,
  spacing: (factor: number) => `${spacing.unit * factor}px`,
  transitions,
  zIndex,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          padding: "8px 24px",
          "&:hover": {
            boxShadow: "0 0 15px rgba(0, 255, 255, 0.5)",
          },
        },
        contained: {
          background: "linear-gradient(45deg, #00ffff 30%, #00ccff 90%)",
          "&:hover": {
            background: "linear-gradient(45deg, #00ccff 30%, #00ffff 90%)",
          },
        },
        outlined: {
          borderColor: "#00ffff",
          "&:hover": {
            borderColor: "#80ffff",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "rgba(30, 30, 30, 0.9)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
          },
        },
      },
    },
  },
});

export default theme;
