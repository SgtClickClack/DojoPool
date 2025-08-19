import analyticsService from '@/services/analytics';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
}

interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

interface ThemeBreakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

interface ThemeAnimation {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

interface Theme {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  breakpoints: ThemeBreakpoints;
  animation: ThemeAnimation;
  isDark: boolean;
}

interface ThemeState {
  currentTheme: Theme;
  themes: Map<string, Theme>;
  systemPreference: 'light' | 'dark';
  autoDetectSystemTheme: boolean;
}

class ThemeService {
  private state: ThemeState;
  private readonly STORAGE_KEY = 'app:theme';
  private mediaQuery: MediaQueryList;
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.state = {
      currentTheme: this.getDefaultTheme(),
      themes: new Map(),
      systemPreference: this.mediaQuery.matches ? 'dark' : 'light',
      autoDetectSystemTheme: true,
    };

    this.initialize();
  }

  private initialize(): void {
    // Register default themes
    this.registerDefaultThemes();

    // Load saved preferences
    this.loadPreferences();

    // Setup system theme detection
    this.setupSystemThemeDetection();

    // Apply initial theme
    this.applyTheme(this.state.currentTheme);

    // Track initialization
    analyticsService.trackUserEvent({
      type: 'theme_service_initialized',
      userId: 'system',
      details: {
        currentTheme: this.state.currentTheme.id,
        autoDetect: this.state.autoDetectSystemTheme,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private getDefaultTheme(): Theme {
    return {
      id: 'light',
      name: 'Light Theme',
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        accent: '#FF2D55',
        background: '#FFFFFF',
        surface: '#F2F2F7',
        text: '#000000',
        textSecondary: '#8E8E93',
        error: '#FF3B30',
        warning: '#FF9500',
        success: '#34C759',
        info: '#5856D6',
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeight: {
          none: 1,
          tight: 1.25,
          snug: 1.375,
          normal: 1.5,
          relaxed: 1.625,
          loose: 2,
        },
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '2.5rem',
        '3xl': '3rem',
        '4xl': '4rem',
      },
      breakpoints: {
        xs: '320px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      animation: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms',
        },
        easing: {
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
      isDark: false,
    };
  }

  private registerDefaultThemes(): void {
    const lightTheme = this.getDefaultTheme();
    const darkTheme: Theme = {
      ...lightTheme,
      id: 'dark',
      name: 'Dark Theme',
      colors: {
        primary: '#0A84FF',
        secondary: '#5E5CE6',
        accent: '#FF375F',
        background: '#000000',
        surface: '#1C1C1E',
        text: '#FFFFFF',
        textSecondary: '#8E8E93',
        error: '#FF453A',
        warning: '#FF9F0A',
        success: '#32D74B',
        info: '#5E5CE6',
      },
      isDark: true,
    };

    this.registerTheme(lightTheme);
    this.registerTheme(darkTheme);
  }

  private setupSystemThemeDetection(): void {
    this.mediaQuery.addEventListener('change', (e) => {
      this.state.systemPreference = e.matches ? 'dark' : 'light';
      if (this.state.autoDetectSystemTheme) {
        this.setTheme(this.state.systemPreference);
      }
    });
  }

  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const { themeId, autoDetect } = JSON.parse(saved);
        this.state.autoDetectSystemTheme = autoDetect;
        if (!autoDetect && themeId) {
          const theme = this.state.themes.get(themeId);
          if (theme) {
            this.state.currentTheme = theme;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          themeId: this.state.currentTheme.id,
          autoDetect: this.state.autoDetectSystemTheme,
        })
      );
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }

  private applyTheme(theme: Theme): void {
    // Apply CSS variables
    const root = document.documentElement;

    // Colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Typography
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value.toString());
    });
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value.toString());
    });

    // Spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Breakpoints
    Object.entries(theme.breakpoints).forEach(([key, value]) => {
      root.style.setProperty(`--breakpoint-${key}`, value);
    });

    // Animation
    Object.entries(theme.animation.duration).forEach(([key, value]) => {
      root.style.setProperty(`--animation-duration-${key}`, value);
    });
    Object.entries(theme.animation.easing).forEach(([key, value]) => {
      root.style.setProperty(`--animation-easing-${key}`, value);
    });

    // Set theme mode
    root.classList.toggle('dark-theme', theme.isDark);
    root.classList.toggle('light-theme', !theme.isDark);

    // Notify listeners
    this.notifyListeners();

    // Track theme change
    analyticsService.trackUserEvent({
      type: 'theme_changed',
      userId: 'system',
      details: {
        themeId: theme.id,
        isDark: theme.isDark,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public registerTheme(theme: Theme): void {
    this.state.themes.set(theme.id, theme);

    // Track theme registration
    analyticsService.trackUserEvent({
      type: 'theme_registered',
      userId: 'system',
      details: {
        themeId: theme.id,
        themeName: theme.name,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public setTheme(themeId: string): void {
    const theme = this.state.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }

    this.state.currentTheme = theme;
    this.state.autoDetectSystemTheme = false;
    this.applyTheme(theme);
    this.savePreferences();
  }

  public getCurrentTheme(): Theme {
    return this.state.currentTheme;
  }

  public getTheme(themeId: string): Theme | undefined {
    return this.state.themes.get(themeId);
  }

  public getThemes(): Theme[] {
    return Array.from(this.state.themes.values());
  }

  public setAutoDetectSystemTheme(enabled: boolean): void {
    this.state.autoDetectSystemTheme = enabled;
    if (enabled) {
      this.setTheme(this.state.systemPreference);
    }
    this.savePreferences();

    // Track auto-detect setting change
    analyticsService.trackUserEvent({
      type: 'theme_auto_detect_changed',
      userId: 'system',
      details: {
        enabled,
        timestamp: new Date().toISOString(),
      },
    });
  }

  public isAutoDetectSystemTheme(): boolean {
    return this.state.autoDetectSystemTheme;
  }

  public getSystemPreference(): 'light' | 'dark' {
    return this.state.systemPreference;
  }

  public addListener(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);
    listener(this.state.currentTheme);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state.currentTheme));
  }
}

// Create a singleton instance
const themeService = new ThemeService();

export default themeService;
