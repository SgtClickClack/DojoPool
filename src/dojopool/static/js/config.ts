/**
 * Frontend configuration module.
 * Contains global settings and constants for the frontend application.
 */

export const Config = {
  // API endpoints
  API: {
    BASE_URL: "/api/v1",
    AUTH: {
      LOGIN: "/auth/login",
      REGISTER: "/auth/register",
      LOGOUT: "/auth/logout",
      VERIFY_EMAIL: "/auth/verify-email",
      RESET_PASSWORD: "/auth/reset-password",
      CHANGE_PASSWORD: "/auth/change-password",
      CHANGE_EMAIL: "/auth/change-email",
    },
    USERS: {
      PROFILE: "/users/profile",
      AVATAR: "/users/avatar",
      SETTINGS: "/users/settings",
    },
    GAMES: {
      LIST: "/games",
      CREATE: "/games/create",
      DETAIL: (id: number) => `/games/${id}`,
      UPDATE: (id: number) => `/games/${id}`,
      DELETE: (id: number) => `/games/${id}`,
    },
    TOURNAMENTS: {
      LIST: "/tournaments",
      CREATE: "/tournaments/create",
      DETAIL: (id: number) => `/tournaments/${id}`,
      JOIN: (id: number) => `/tournaments/${id}/join`,
      LEAVE: (id: number) => `/tournaments/${id}/leave`,
    },
  },

  // WebSocket events
  SOCKET: {
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    ERROR: "error",
    GAME_UPDATE: "game_update",
    CHAT_MESSAGE: "chat_message",
    NOTIFICATION: "notification",
  },

  // Local storage keys
  STORAGE: {
    AUTH_TOKEN: "auth_token",
    USER_SETTINGS: "user_settings",
    THEME: "theme",
    LANGUAGE: "language",
  },

  // UI settings
  UI: {
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300,
    INFINITE_SCROLL_THRESHOLD: 200,
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
  },

  // Theme settings
  THEME: {
    LIGHT: "light",
    DARK: "dark",
    SYSTEM: "system",
  },

  // Validation settings
  VALIDATION: {
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 64,
      PATTERN: /^[A-Za-z][A-Za-z0-9_.]*$/,
    },
    PASSWORD: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 128,
      PATTERN: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$/,
    },
    EMAIL: {
      MAX_LENGTH: 120,
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  },

  // Error messages
  ERRORS: {
    NETWORK: "Network error. Please check your connection.",
    SERVER: "Server error. Please try again later.",
    VALIDATION: "Please check your input and try again.",
    UNAUTHORIZED: "Please log in to continue.",
    FORBIDDEN: "You do not have permission to perform this action.",
    NOT_FOUND: "The requested resource was not found.",
  },
} as const;
