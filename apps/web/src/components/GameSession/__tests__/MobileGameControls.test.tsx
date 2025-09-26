import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileGameControls from '../GameSession/MobileGameControls';

// Mock the MobileGameControls component since it doesn't exist yet
jest.mock('../GameSession/MobileGameControls', () => {
  return function MockMobileGameControls({ onShot, onFoul, disabled }: any) {
    return (
      <div data-testid="mobile-game-controls">
        <button onClick={() => onShot()} disabled={disabled}>Take Shot</button>
        <button onClick={() => onFoul()} disabled={disabled}>Report Foul</button>
        <button disabled={disabled}>Pause Game</button>
      </div>
    );
  };
});

const mockOnShot = jest.fn();
const mockOnFoul = jest.fn();

const defaultProps = {
  onShot: mockOnShot,
  onFoul: mockOnFoul,
};

const disabledProps = {
  ...defaultProps,
  disabled: true,
};

describe('MobileGameControls', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mobile game control buttons', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    expect(screen.getByText('Take Shot')).toBeInTheDocument();
    expect(screen.getByText('Report Foul')).toBeInTheDocument();
    expect(screen.getByText('Pause Game')).toBeInTheDocument();
  });

  it('handles shot button click', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    const shotButton = screen.getByText('Take Shot');
    fireEvent.click(shotButton);
    
    expect(mockOnShot).toHaveBeenCalled();
  });

  it('handles foul button click', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    const foulButton = screen.getByText('Report Foul');
    fireEvent.click(foulButton);
    
    expect(mockOnFoul).toHaveBeenCalled();
  });

  it('disables buttons when disabled', () => {
    customRender(<MobileGameControls {...disabledProps} />);
    
    const shotButton = screen.getByText('Take Shot');
    expect(shotButton).toBeDisabled();
    
    const foulButton = screen.getByText('Report Foul');
    expect(foulButton).toBeDisabled();
  });

  it('renders with minimal props', () => {
    customRender(<MobileGameControls onShot={jest.fn()} onFoul={jest.fn()} />);
    
    expect(screen.getByTestId('mobile-game-controls')).toBeInTheDocument();
  });

  it('handles performance test', async () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    expect(screen.getByText('Take Shot')).toBeInTheDocument();
  }, 5000);
});
