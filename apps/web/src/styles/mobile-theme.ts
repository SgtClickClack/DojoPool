import { createTheme } from '@mui/material/styles';
import { theme } from './theme';

// Mobile-optimized theme configuration
export const mobileTheme = createTheme({
  ...theme,
  components: {
    ...theme.components,
    // Mobile-specific component overrides
    MuiButton: {
      ...theme.components?.MuiButton,
      styleOverrides: {
        ...theme.components?.MuiButton?.styleOverrides,
        root: {
          ...theme.components?.MuiButton?.styleOverrides?.root,
          minHeight: 44, // iOS Human Interface Guidelines
          fontSize: '0.9rem',
          padding: '8px 16px',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      ...theme.components?.MuiCard,
      styleOverrides: {
        ...theme.components?.MuiCard?.styleOverrides,
        root: {
          ...theme.components?.MuiCard?.styleOverrides?.root,
          borderRadius: 12,
          margin: '8px 0',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 16,
          '&:last-child': {
            paddingBottom: 16,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          margin: 16,
          borderRadius: 16,
          maxHeight: 'calc(100vh - 32px)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64, // Comfortable touch target
          paddingTop: 8,
          paddingBottom: 8,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 'auto',
          padding: '6px 8px',
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
            marginTop: 0.5,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          height: 56, // Standard mobile app bar height
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48, // Comfortable touch target
          fontSize: '0.8rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 32, // Comfortable touch target
          fontSize: '0.8rem',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          minHeight: 48, // Comfortable touch target
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 48, // Comfortable touch target
          borderRadius: 8,
          margin: '2px 8px',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: 12, // 48px touch target (12 * 2 + icon size)
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          width: 56,
          height: 56,
        },
      },
    },
  },
  // Mobile-specific breakpoints
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  // Mobile-optimized spacing
  spacing: (factor: number) => `${0.25 * factor}rem`, // 4px base instead of 8px
});

// Mobile-specific utility functions
export const mobileUtils = {
  // Safe area handling for notched devices
  safeAreaTop: 'env(safe-area-inset-top)',
  safeAreaBottom: 'env(safe-area-inset-bottom)',
  safeAreaLeft: 'env(safe-area-inset-left)',
  safeAreaRight: 'env(safe-area-inset-right)',

  // Touch target sizes (WCAG AA compliant)
  touchTarget: {
    min: 44, // Minimum touch target size
    comfortable: 48, // Comfortable touch target size
  },

  // Mobile breakpoints
  breakpoints: {
    mobile: 768,
    tablet: 1024,
  },

  // Mobile typography scale
  typography: {
    scale: {
      h1: { fontSize: '1.5rem', lineHeight: 1.2 },
      h2: { fontSize: '1.25rem', lineHeight: 1.3 },
      h3: { fontSize: '1.125rem', lineHeight: 1.4 },
      h4: { fontSize: '1rem', lineHeight: 1.5 },
      body1: { fontSize: '0.9rem', lineHeight: 1.6 },
      body2: { fontSize: '0.8rem', lineHeight: 1.6 },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
    },
  },
};
