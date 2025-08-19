// Generated type definitions

// Type imports

// Theme constants
const THEME_KEY: any = 'app-theme';
const THEME_LIGHT: any = 'theme-light';
const THEME_DARK: any = 'theme-dark';

// Get system preference for dark mode
const prefersDarkMode: any = () =>
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

// Get stored theme preference
const getStoredTheme: any = () => localStorage.getItem(THEME_KEY);

// Set theme preference
const setStoredTheme: any = (theme) => localStorage.setItem(THEME_KEY, theme);

// Apply theme to document
const applyTheme: any = (theme) => {
  document.documentElement.classList.remove(THEME_LIGHT, THEME_DARK);
  document.documentElement.classList.add(theme);
  setStoredTheme(theme);
};

// Initialize theme
const initTheme: any = () => {
  const storedTheme: any = getStoredTheme();
  if (storedTheme) {
    applyTheme(storedTheme);
  } else {
    applyTheme(prefersDarkMode() ? THEME_DARK : THEME_LIGHT);
  }
};

// Toggle between light and dark themes
const toggleTheme: any = () => {
  const currentTheme: any =
    getStoredTheme() || (prefersDarkMode() ? THEME_DARK : THEME_LIGHT);
  const newTheme: any = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
  applyTheme(newTheme);
};

// Listen for system theme changes
const listenForThemeChanges: any = () => {
  if (!window.matchMedia) return;

  const mediaQuery: any = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addListener((e) => {
    if (!getStoredTheme()) {
      applyTheme(e.matches ? THEME_DARK : THEME_LIGHT);
    }
  });
};

// Export functions
export {
  initTheme,
  toggleTheme,
  getStoredTheme,
  prefersDarkMode,
  THEME_LIGHT,
  THEME_DARK,
};
