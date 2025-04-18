/**
 * UI utilities module.
 * Provides common UI helper functions and utilities.
 */
import { Config } from "../config";

/**
 * Debounce function execution.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = Config.UI.DEBOUNCE_DELAY,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>): ReturnType<T> {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func(...args);
      setTimeout(() => (inThrottle = false), limit);
    }
    return lastResult;
  };
}

/**
 * Format file size.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if file size is within limit.
 */
export function isFileSizeValid(file: File): boolean {
  return file.size <= Config.UI.MAX_UPLOAD_SIZE;
}

/**
 * Format date for display.
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", options).format(d);
}

/**
 * Format relative time.
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(d);
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return "Just now";
  }
}

/**
 * Create element with classes.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  classes: string[] = [],
  attributes: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.classList.add(...classes);

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
}

/**
 * Show toast notification.
 */
export function showToast(
  message: string,
  type: "success" | "error" | "info" = "info",
  duration: number = Config.UI.TOAST_DURATION,
): void {
  const toast = createElement("div", ["toast", `toast-${type}`]);
  toast.textContent = message;

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300); // Match animation duration
  }, duration);
}

/**
 * Handle infinite scroll.
 */
export function handleInfiniteScroll(
  callback: () => void,
  threshold: number = Config.UI.INFINITE_SCROLL_THRESHOLD,
): () => void {
  const handler = throttle(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      callback();
    }
  }, 100);

  window.addEventListener("scroll", handler);
  return () => window.removeEventListener("scroll", handler);
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  } catch (error) {
    showToast("Failed to copy to clipboard", "error");
  }
}

/**
 * Download file.
 */
export function downloadFile(url: string, filename: string): void {
  const link = createElement("a", [], {
    href: url,
    download: filename,
    style: "display: none",
  });

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get file extension.
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Check if device is mobile.
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

/**
 * Get browser language.
 */
export function getBrowserLanguage(): string {
  return navigator.language.split("-")[0];
}

/**
 * Set page title.
 */
export function setPageTitle(title: string): void {
  document.title = `${title} | DojoPool`;
}
