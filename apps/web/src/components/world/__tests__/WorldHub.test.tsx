import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUseAuth, mockUseWebSocket, measureRenderTime } from './test-utils';
import WorldHub from '../world/WorldHub';

// Mock the dynamic import
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<any>) => {
    const Component = () => <div data-testid="world-hub-map-wrapper">World Hub Map Wrapper</div>;
    Component.displayName = 'DynamicComponent';
    return Component;
  },
}));

// Mock CSS modules
vi.mock('../world/WorldHub.module.css', () => ({
  container: 'container',
  mainContent: 'mainContent',
  title: 'title',
  description: 'description',
  placeholder: 'placeholder',
  mapContainer: 'mapContainer',
}));

describe('WorldHub Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main title and description', () => {
    customRender(<WorldHub />);
    
    expect(screen.getByText('🌍 DojoPool World Hub')).toBeInTheDocument();
    expect(screen.getByText(/Interactive world map of DojoPool dojos/)).toBeInTheDocument();
  });

  it('renders the placeholder text for testing', () => {
    customRender(<WorldHub />);
    
    expect(screen.getByText(/This is a placeholder WorldHub component/)).toBeInTheDocument();
  });

  it('renders the map container with WorldHubMapWrapper', () => {
    customRender(<WorldHub />);
    
    expect(screen.getByTestId('world-hub-map-wrapper')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    customRender(<WorldHub />);
    
    const container = screen.getByText('🌍 DojoPool World Hub').closest('.container');
    expect(container).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    expect(() => customRender(<WorldHub />)).not.toThrow();
  });

  it('has proper accessibility structure', () => {
    customRender(<WorldHub />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('🌍 DojoPool World Hub');
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<WorldHub />);
    });
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('maintains consistent structure across renders', () => {
    const { rerender } = customRender(<WorldHub />);
    
    const initialStructure = screen.getByTestId('world-hub-map-wrapper');
    
    rerender(<WorldHub />);
    
    const rerenderedStructure = screen.getByTestId('world-hub-map-wrapper');
    expect(rerenderedStructure).toBeInTheDocument();
  });
});
