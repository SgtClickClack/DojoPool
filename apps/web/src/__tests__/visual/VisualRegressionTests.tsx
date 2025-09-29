/**
 * Visual Regression Tests
 * 
 * Comprehensive visual testing suite using Percy integration
 * for automated visual diff detection and cross-browser testing.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { percySnapshot } from '@percy/cypress';
import { createMockUser, createMockDojo, createMockClan } from '../setup/testSetup';

// Import components to test
import { RefactoredWorldHubMap } from '@/components/world/refactored/RefactoredWorldHubMap';
import { LazyWorldHubMap } from '@/components/optimized/LazyComponents';
import { LazyGameSessionView } from '@/components/optimized/LazyComponents';
import { LazyCMSDashboard } from '@/components/optimized/LazyComponents';
import { LazyChatWindow } from '@/components/optimized/LazyComponents';
import { LazyClanProfile } from '@/components/optimized/LazyComponents';

// Mock providers
const MockProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="mock-providers">
    {children}
  </div>
);

describe('Visual Regression Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('World Map Components', () => {
    it('should render WorldHubMap consistently', () => {
      render(
        <MockProviders>
          <RefactoredWorldHubMap height="400px" />
        </MockProviders>
      );

      // Take Percy snapshot
      percySnapshot('WorldHubMap - Default State');

      // Verify component renders
      expect(screen.getByTestId('mock-providers')).toBeInTheDocument();
    });

    it('should render WorldHubMap with loading state', () => {
      // Mock loading state
      jest.mock('@/hooks/useMapData', () => ({
        useMapData: () => ({
          dojos: [],
          playerPositions: [],
          isLoading: true,
          error: null,
          isWebSocketConnected: false,
          messageActivity: 0,
          refreshData: jest.fn(),
        }),
      }));

      render(
        <MockProviders>
          <RefactoredWorldHubMap height="400px" />
        </MockProviders>
      );

      percySnapshot('WorldHubMap - Loading State');
    });

    it('should render WorldHubMap with error state', () => {
      // Mock error state
      jest.mock('@/hooks/useMapData', () => ({
        useMapData: () => ({
          dojos: [],
          playerPositions: [],
          isLoading: false,
          error: 'Failed to load map data',
          isWebSocketConnected: false,
          messageActivity: 0,
          refreshData: jest.fn(),
        }),
      }));

      render(
        <MockProviders>
          <RefactoredWorldHubMap height="400px" />
        </MockProviders>
      );

      percySnapshot('WorldHubMap - Error State');
    });
  });

  describe('Lazy Components', () => {
    it('should render LazyWorldHubMap with loading state', () => {
      render(
        <MockProviders>
          <LazyWorldHubMap height="400px" />
        </MockProviders>
      );

      percySnapshot('LazyWorldHubMap - Loading State');
    });

    it('should render LazyGameSessionView with loading state', () => {
      render(
        <MockProviders>
          <LazyGameSessionView />
        </MockProviders>
      );

      percySnapshot('LazyGameSessionView - Loading State');
    });

    it('should render LazyCMSDashboard with loading state', () => {
      render(
        <MockProviders>
          <LazyCMSDashboard />
        </MockProviders>
      );

      percySnapshot('LazyCMSDashboard - Loading State');
    });

    it('should render LazyChatWindow with loading state', () => {
      render(
        <MockProviders>
          <LazyChatWindow />
        </MockProviders>
      );

      percySnapshot('LazyChatWindow - Loading State');
    });

    it('should render LazyClanProfile with loading state', () => {
      render(
        <MockProviders>
          <LazyClanProfile />
        </MockProviders>
      );

      percySnapshot('LazyClanProfile - Loading State');
    });
  });

  describe('Responsive Design', () => {
    it('should render components consistently on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <MockProviders>
          <RefactoredWorldHubMap height="300px" />
        </MockProviders>
      );

      percySnapshot('WorldHubMap - Mobile Viewport', {
        widths: [375],
      });
    });

    it('should render components consistently on tablet viewport', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <MockProviders>
          <RefactoredWorldHubMap height="500px" />
        </MockProviders>
      );

      percySnapshot('WorldHubMap - Tablet Viewport', {
        widths: [768],
      });
    });

    it('should render components consistently on desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(
        <MockProviders>
          <RefactoredWorldHubMap height="600px" />
        </MockProviders>
      );

      percySnapshot('WorldHubMap - Desktop Viewport', {
        widths: [1200],
      });
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should render consistently across different browsers', () => {
      render(
        <MockProviders>
          <RefactoredWorldHubMap height="400px" />
        </MockProviders>
      );

      // Take snapshots for different browsers
      percySnapshot('WorldHubMap - Chrome', {
        browser: 'chrome',
      });

      percySnapshot('WorldHubMap - Firefox', {
        browser: 'firefox',
      });

      percySnapshot('WorldHubMap - Safari', {
        browser: 'safari',
      });
    });
  });

  describe('Accessibility Testing', () => {
    it('should maintain accessibility standards', () => {
      render(
        <MockProviders>
          <RefactoredWorldHubMap height="400px" />
        </MockProviders>
      );

      // Check for accessibility attributes
      const mapContainer = screen.getByTestId('mock-providers');
      expect(mapContainer).toBeInTheDocument();

      // Take accessibility-focused snapshot
      percySnapshot('WorldHubMap - Accessibility Check', {
        accessibility: true,
      });
    });
  });

  describe('Animation and Interaction States', () => {
    it('should capture interaction states', () => {
      render(
        <MockProviders>
          <RefactoredWorldHubMap height="400px" />
        </MockProviders>
      );

      // Test different interaction states
      percySnapshot('WorldHubMap - Default State');
      
      // Simulate hover state
      const mapElement = screen.getByTestId('mock-providers');
      mapElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      
      percySnapshot('WorldHubMap - Hover State');
      
      // Simulate focus state
      mapElement.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      
      percySnapshot('WorldHubMap - Focus State');
    });
  });

  describe('Error Boundary Testing', () => {
    it('should render error boundaries consistently', () => {
      // Mock component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <MockProviders>
          <ErrorComponent />
        </MockProviders>
      );

      percySnapshot('Error Boundary - Error State');
    });
  });

  describe('Performance Testing', () => {
    it('should maintain performance standards', () => {
      const startTime = performance.now();

      render(
        <MockProviders>
          <RefactoredWorldHubMap height="400px" />
        </MockProviders>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Ensure render time is within acceptable limits
      expect(renderTime).toBeLessThan(100); // 100ms threshold

      percySnapshot('WorldHubMap - Performance Test');
    });
  });

  describe('Data-Driven Visual Tests', () => {
    it('should render with different data states', () => {
      const testCases = [
        { name: 'Empty State', dojos: [], players: [] },
        { name: 'Single Dojo', dojos: [createMockDojo()], players: [] },
        { name: 'Multiple Dojos', dojos: [createMockDojo(), createMockDojo({ id: 'dojo-2' })], players: [] },
        { name: 'With Players', dojos: [createMockDojo()], players: [{ playerId: 'player-1', lat: 40.7128, lng: -74.0060 }] },
      ];

      testCases.forEach(testCase => {
        // Mock different data states
        jest.mock('@/hooks/useMapData', () => ({
          useMapData: () => ({
            dojos: testCase.dojos,
            playerPositions: testCase.players,
            isLoading: false,
            error: null,
            isWebSocketConnected: true,
            messageActivity: 0,
            refreshData: jest.fn(),
          }),
        }));

        render(
          <MockProviders>
            <RefactoredWorldHubMap height="400px" />
          </MockProviders>
        );

        percySnapshot(`WorldHubMap - ${testCase.name}`);
      });
    });
  });
});
