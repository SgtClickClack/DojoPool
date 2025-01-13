// Theme constants
const THEME_KEY = 'app-theme';
const THEME_LIGHT = 'theme-light';
const THEME_DARK = 'theme-dark';

// Get system preference for dark mode
const prefersDarkMode = () =>
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

// Get stored theme preference
const getStoredTheme = () => localStorage.getItem(THEME_KEY);

// Set theme preference
const setStoredTheme = (theme) => localStorage.setItem(THEME_KEY, theme);

// Apply theme to document
const applyTheme = (theme) => {
  document.documentElement.classList.remove(THEME_LIGHT, THEME_DARK);
  document.documentElement.classList.add(theme);
  setStoredTheme(theme);
};

// Initialize theme
const initTheme = () => {
  const storedTheme = getStoredTheme();
  if (storedTheme) {
    applyTheme(storedTheme);
  } else {
    applyTheme(prefersDarkMode() ? THEME_DARK : THEME_LIGHT);
  }
};

// Toggle between light and dark themes
const toggleTheme = () => {
  const currentTheme =
    getStoredTheme() || (prefersDarkMode() ? THEME_DARK : THEME_LIGHT);
  const newTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
  applyTheme(newTheme);
};

// Listen for system theme changes
const listenForThemeChanges = () => {
  if (!window.matchMedia) return;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
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
