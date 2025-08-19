import { useEffect, useCallback, useRef } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  onArrowUp?: (event: KeyboardEvent) => void;
  onArrowDown?: (event: KeyboardEvent) => void;
  onArrowLeft?: (event: KeyboardEvent) => void;
  onArrowRight?: (event: KeyboardEvent) => void;
  onEnter?: (event: KeyboardEvent) => void;
  onEscape?: (event: KeyboardEvent) => void;
  onTab?: (event: KeyboardEvent) => void;
  onSpace?: (event: KeyboardEvent) => void;
  onHome?: (event: KeyboardEvent) => void;
  onEnd?: (event: KeyboardEvent) => void;
  onPageUp?: (event: KeyboardEvent) => void;
  onPageDown?: (event: KeyboardEvent) => void;
  onDelete?: (event: KeyboardEvent) => void;
  onBackspace?: (event: KeyboardEvent) => void;
}

export const useKeyboardNavigation = ({
  enabled = true,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onEnter,
  onEscape,
  onTab,
  onSpace,
  onHome,
  onEnd,
  onPageUp,
  onPageDown,
  onDelete,
  onBackspace,
}: KeyboardNavigationOptions) => {
  const handlerRef = useRef<(event: KeyboardEvent) => void>();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't handle keyboard events when user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp(event);
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown(event);
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft(event);
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight(event);
          }
          break;
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter(event);
          }
          break;
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape(event);
          }
          break;
        case 'Tab':
          if (onTab) {
            // Don't prevent default for Tab to maintain natural tab navigation
            onTab(event);
          }
          break;
        case ' ':
          if (onSpace) {
            event.preventDefault();
            onSpace(event);
          }
          break;
        case 'Home':
          if (onHome) {
            event.preventDefault();
            onHome(event);
          }
          break;
        case 'End':
          if (onEnd) {
            event.preventDefault();
            onEnd(event);
          }
          break;
        case 'PageUp':
          if (onPageUp) {
            event.preventDefault();
            onPageUp(event);
          }
          break;
        case 'PageDown':
          if (onPageDown) {
            event.preventDefault();
            onPageDown(event);
          }
          break;
        case 'Delete':
          if (onDelete) {
            event.preventDefault();
            onDelete(event);
          }
          break;
        case 'Backspace':
          if (onBackspace) {
            event.preventDefault();
            onBackspace(event);
          }
          break;
      }
    },
    [
      enabled,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onEnter,
      onEscape,
      onTab,
      onSpace,
      onHome,
      onEnd,
      onPageUp,
      onPageDown,
      onDelete,
      onBackspace,
    ]
  );

  useEffect(() => {
    handlerRef.current = handleKeyDown;
  }, [handleKeyDown]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      handlerRef.current?.(event);
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [enabled]);

  return {
    isEnabled: enabled,
  };
};

// Focus management hook
interface FocusManagerOptions {
  containerRef: React.RefObject<HTMLElement>;
  focusableSelector?: string;
  initialFocusIndex?: number;
  loop?: boolean;
  enabled?: boolean;
}

export const useFocusManager = ({
  containerRef,
  focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  initialFocusIndex = 0,
  loop = true,
  enabled = true,
}: FocusManagerOptions) => {
  const currentFocusIndex = useRef(initialFocusIndex);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll(focusableSelector));
  }, [containerRef, focusableSelector]);

  const focusElement = useCallback(
    (index: number) => {
      const elements = getFocusableElements();
      if (elements.length === 0) return;

      if (loop) {
        // Normalize index to stay within bounds
        index = ((index % elements.length) + elements.length) % elements.length;
      } else {
        // Clamp index to stay within bounds
        index = Math.max(0, Math.min(index, elements.length - 1));
      }

      currentFocusIndex.current = index;
      (elements[index] as HTMLElement).focus();
    },
    [getFocusableElements, loop]
  );

  const focusNext = useCallback(() => {
    focusElement(currentFocusIndex.current + 1);
  }, [focusElement]);

  const focusPrevious = useCallback(() => {
    focusElement(currentFocusIndex.current - 1);
  }, [focusElement]);

  const focusFirst = useCallback(() => {
    focusElement(0);
  }, [focusElement]);

  const focusLast = useCallback(() => {
    const elements = getFocusableElements();
    focusElement(elements.length - 1);
  }, [focusElement, getFocusableElements]);

  useEffect(() => {
    if (!enabled) return;

    const elements = getFocusableElements();
    if (elements.length > 0 && initialFocusIndex >= 0) {
      focusElement(initialFocusIndex);
    }
  }, [enabled, focusElement, getFocusableElements, initialFocusIndex]);

  return {
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    focusElement,
    getFocusableElements,
  };
};

// Keyboard navigation context types
export interface KeyboardNavigationContextValue {
  registerNavigable: (id: string, ref: React.RefObject<HTMLElement>) => void;
  unregisterNavigable: (id: string) => void;
  setFocus: (id: string) => void;
  getCurrentFocus: () => string | null;
}

// Export types
export type { KeyboardNavigationOptions, FocusManagerOptions };
