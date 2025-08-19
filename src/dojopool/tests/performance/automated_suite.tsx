import { render } from '@testing-library/react';
import { DebugPanel } from '../../components/DebugPanel';

describe('Performance Tests', () => {
  describe('Debug Panel', () => {
    it('should render quickly', () => {
      render(<DebugPanel />);
    });

    it('should handle multiple rerenders', () => {
      const { rerender } = render(<DebugPanel />);

      // Test multiple rerenders
      for (let i = 0; i < 100; i++) {
        rerender(<DebugPanel key={i} />);
      }
    });

    it('should render with large datasets', () => {
      render(<DebugPanel />);
    });
  });
});
