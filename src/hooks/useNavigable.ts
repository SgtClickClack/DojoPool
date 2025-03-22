import { useEffect, useRef } from 'react';
import { useKeyboardNavigationContext } from '../contexts/KeyboardNavigationContext';

interface UseNavigableOptions {
  id: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const useNavigable = ({ id, onFocus, onBlur }: UseNavigableOptions) => {
  const ref = useRef<HTMLElement>(null);
  const { registerNavigable, unregisterNavigable } = useKeyboardNavigationContext();

  useEffect(() => {
    if (ref.current) {
      registerNavigable(id, ref as React.RefObject<HTMLElement>);

      const element = ref.current;
      const handleFocus = () => {
        onFocus?.();
      };

      const handleBlur = () => {
        onBlur?.();
      };

      element.addEventListener('focus', handleFocus);
      element.addEventListener('blur', handleBlur);

      return () => {
        unregisterNavigable(id);
        element.removeEventListener('focus', handleFocus);
        element.removeEventListener('blur', handleBlur);
      };
    }
  }, [id, registerNavigable, unregisterNavigable, onFocus, onBlur]);

  return ref;
}; 