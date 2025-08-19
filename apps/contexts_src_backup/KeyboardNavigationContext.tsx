import React, { createContext, useContext, useRef, useCallback } from 'react';
import { type KeyboardNavigationContextValue } from '../hooks/useKeyboardNavigation';

const KeyboardNavigationContext =
  createContext<KeyboardNavigationContextValue | null>(null);

interface NavigableElement {
  ref: React.RefObject<HTMLElement>;
}

interface KeyboardNavigationProviderProps {
  children: React.ReactNode;
}

export const KeyboardNavigationProvider: React.FC<
  KeyboardNavigationProviderProps
> = ({ children }) => {
  const navigableElements = useRef<Map<string, NavigableElement>>(new Map());
  const currentFocus = useRef<string | null>(null);

  const registerNavigable = useCallback(
    (id: string, ref: React.RefObject<HTMLElement>) => {
      navigableElements.current.set(id, { ref });
    },
    []
  );

  const unregisterNavigable = useCallback((id: string) => {
    navigableElements.current.delete(id);
    if (currentFocus.current === id) {
      currentFocus.current = null;
    }
  }, []);

  const setFocus = useCallback((id: string) => {
    const element = navigableElements.current.get(id);
    if (element?.ref.current) {
      element.ref.current.focus();
      currentFocus.current = id;
    }
  }, []);

  const getCurrentFocus = useCallback(() => {
    return currentFocus.current;
  }, []);

  const value: KeyboardNavigationContextValue = {
    registerNavigable,
    unregisterNavigable,
    setFocus,
    getCurrentFocus,
  };

  return (
    <KeyboardNavigationContext.Provider value={value}>
      {children}
    </KeyboardNavigationContext.Provider>
  );
};

export const useKeyboardNavigationContext = () => {
  const context = useContext(KeyboardNavigationContext);
  if (!context) {
    throw new Error(
      'useKeyboardNavigationContext must be used within a KeyboardNavigationProvider'
    );
  }
  return context;
};

export default KeyboardNavigationContext;
