// Static TypeScript JS utilities consolidated and cleaned
// Removed unused imports and commented code

// Type definitions
type AlertType = "success" | "error" | "warning" | "info";
type DebouncedFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void;
type ThrottledFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void;

interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// DOM Utilities
const $ = <T extends Element = Element>(selector: string): T | null =>
  document.querySelector<T>(selector);
const $$ = <T extends Element = Element>(selector: string): NodeListOf<T> =>
  document.querySelectorAll<T>(selector);

// Form Utilities
const serializeForm = (form: HTMLFormElement): Record<string, string> => {
  const formData = new FormData(form);
  const data: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value.toString();
  }
  return data;
};

// API Utilities
const api = {
  async get<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("API Get Error:", error);
      throw error;
    }
  },

  async post<T>(url: string, data: unknown): Promise<T> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("API Post Error:", error);
      throw error;
    }
  },
};

// UI Utilities
const ui = {
  showAlert(message: string, type: AlertType = "success"): void {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    const container = $(".container");
    if (container) {
      container.insertBefore(alert, container.firstChild);
      setTimeout(() => alert.remove(), 3000);
    }
  },

  toggleLoader(show = true): void {
    const loader = $(".loader");
    if (loader instanceof HTMLElement) {
      loader.style.display = show ? "block" : "none";
    }
  },

  formatDate(date: string | number | Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },
};

// Validation Utilities
const validate = {
  email(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  required(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim() !== "";
  },

  minLength(value: string, min: number): boolean {
    return value.length >= min;
  },
};

// Event Utilities
const eventUtil = {
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): DebouncedFunction<T> {
    let timeout: ReturnType<typeof setTimeout>;
    return function executedFunction(...args: Parameters<T>): void {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
  ): ThrottledFunction<T> {
    let inThrottle = false;
    return function executedFunction(...args: Parameters<T>): void {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};

// Local Storage Utilities
const storage = {
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error saving to localStorage:", e);
    }
  },

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error("Error reading from localStorage:", e);
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Error removing from localStorage:", e);
    }
  },
};

// Export utilities
export { $, $$, api, eventUtil, serializeForm, storage, ui, validate };
