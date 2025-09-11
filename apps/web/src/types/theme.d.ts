import '@mui/material/styles';

// Extend the MUI Theme interface to include cyberpunk properties
declare module '@mui/material/styles' {
  interface Theme {
    cyberpunk: {
      gradients: {
        primary: string;
        secondary: string;
        background: string;
        card: string;
      };
      glows: {
        primary: string;
        secondary: string;
        text: string;
      };
      borders: {
        primary: string;
        secondary: string;
        subtle: string;
      };
      shadows: {
        card: string;
        elevated: string;
        button: string;
        glow: string;
      };
      animations: {
        hover: {
          transform: string;
          transition: string;
        };
        pulse: string;
      };
      battlePass: {
        free: {
          primary: string;
          secondary: string;
          background: string;
          border: string;
          glow: string;
        };
        premium: {
          primary: string;
          secondary: string;
          background: string;
          border: string;
          glow: string;
          sparkle: string;
        };
        progress: {
          background: string;
          fill: string;
          incomplete: string;
        };
        tier: {
          unlocked: string;
          current: string;
          locked: string;
          premium: string;
        };
      };
      components: {
        MuiButton: any;
        MuiAppBar: any;
        MuiCard: any;
      };
    };
  }

  // Allow configuration of the custom theme parts
  interface ThemeOptions {
    cyberpunk?: {
      gradients?: {
        primary?: string;
        secondary?: string;
        background?: string;
        card?: string;
      };
      glows?: {
        primary?: string;
        secondary?: string;
        text?: string;
      };
      borders?: {
        primary?: string;
        secondary?: string;
        subtle?: string;
      };
      shadows?: {
        card?: string;
        elevated?: string;
        button?: string;
        glow?: string;
      };
      animations?: {
        hover?: {
          transform?: string;
          transition?: string;
        };
        pulse?: string;
      };
      battlePass?: {
        free?: {
          primary?: string;
          secondary?: string;
          background?: string;
          border?: string;
          glow?: string;
        };
        premium?: {
          primary?: string;
          secondary?: string;
          background?: string;
          border?: string;
          glow?: string;
          sparkle?: string;
        };
        progress?: {
          background?: string;
          fill?: string;
          incomplete?: string;
        };
        tier?: {
          unlocked?: string;
          current?: string;
          locked?: string;
          premium?: string;
        };
      };
      components?: {
        MuiButton?: any;
        MuiAppBar?: any;
        MuiCard?: any;
      };
    };
  }
}
