import React, { ComponentType } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameSessionView from '../GameSessionView';
import type { GameSessionViewProps } from '../GameSessionView';
import { mockUser } from '../../__tests__/test-utils';

// Mock match data with all required properties
const mockMatch = {
  id: 'match-1',
  player1Id: 'player1',
  player2Id: 'player2',
  status: 'ACTIVE' as const,
  score1: 0,
  score2: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock user data with complete structure
const mockCurrentUser = {
  id: 'user1',
  email: 'test@example.com',
  username: 'testuser',
  profile: {
    displayName: 'Test User',
    avatarUrl: '/avatar.jpg',
  },
};

// Fixed mock props with all required properties
const defaultProps: GameSessionViewProps = {
  sessionId: 'session-1',
  match: mockMatch,
  currentUser: mockCurrentUser,
  onShot: jest.fn(),
  onEndGame: jest.fn(),
  onLeave: jest.fn(),
};

const propsWithNoMatch: GameSessionViewProps = {
  sessionId: 'session-1',
  match: null,
  currentUser: mockCurrentUser,
  onShot: jest.fn(),
  onEndGame: jest.fn(),
  onLeave: jest.fn(),
};

const propsWithScores: GameSessionViewProps = {
  sessionId: 'session-1',
  match: {
    ...mockMatch,
    score1: 5,
    score2: 3,
  },
  currentUser: mockCurrentUser,
  onShot: jest.fn(),
  onEndGame: jest.fn(),
  onLeave: jest.fn(),
};

const completedProps: GameSessionViewProps = {
  sessionId: 'session-1',
  match: {
    ...mockMatch,
    status: 'COMPLETED' as const,
    winnerId: mockCurrentUser.id,
  },
  currentUser: mockCurrentUser,
  onShot: jest.fn(),
  onEndGame: jest.fn(),
  onLeave: jest.fn(),
};

const minimalProps: GameSessionViewProps = {
  sessionId: 'session-1',
  match: {
    id: 'match-1',
    player1Id: 'player1',
    player2Id: 'player2',
    status: 'ACTIVE' as const,
    score1: 0,
    score2: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  currentUser: {
    id: 'user1',
    email: 'test@example.com',
    username: 'testuser',
    profile: {
      displayName: 'Minimal User',
      avatarUrl: '/minimal-avatar.jpg',
    },
  },
  onShot: jest.fn(),
  onEndGame: jest.fn(),
  onLeave: jest.fn(),
};

const disabledProps: GameSessionViewProps = {
  sessionId: 'session-1',
  match: mockMatch,
  currentUser: mockCurrentUser,
  onShot: jest.fn(),
  onEndGame: jest.fn(),
  onLeave: jest.fn(),
  disabled: true,
};

const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, {
    wrapper: ({ children }) => <div>{children}</div>,
    ...options,
  });

describe('GameSessionView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders match information correctly', () => {
    customRender(<GameSessionView {...defaultProps} />);

    expect(screen.getByText('Match in Progress')).toBeInTheDocument();
    expect(screen.getByText(mockMatch.player1Id)).toBeInTheDocument();
    expect(screen.getByText(mockMatch.player2Id)).toBeInTheDocument();
  });

  it('handles no match state', () => {
    customRender(<GameSessionView {...propsWithNoMatch} />);

    expect(screen.getByText('No active match')).toBeInTheDocument();
  });

  it('displays scores when available', () => {
    customRender(<GameSessionView {...propsWithScores} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows completed match state', () => {
    customRender(<GameSessionView {...completedProps} />);

    expect(screen.getByText('Match Completed')).toBeInTheDocument();
  });

  it('handles minimal props without errors', () => {
    expect(() => customRender(<GameSessionView {...minimalProps} />)).not.toThrow();
  });

  it('renders with default props', () => {
    customRender(<GameSessionView {...defaultProps} />);

    expect(screen.getByText('Match in Progress')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    customRender(<GameSessionView {...disabledProps} />);

    const shotButton = screen.getByRole('button', { name: /shot/i });
    expect(shotButton).toBeDisabled();
  });

  it('calls onShot handler', () => {
    customRender(<GameSessionView {...defaultProps} />);

    const shotButton = screen.getByRole('button', { name: /shot/i });
    fireEvent.click(shotButton);

    expect(defaultProps.onShot).toHaveBeenCalled();
  });

  it('calls onEndGame handler', () => {
    customRender(<GameSessionView {...defaultProps} />);

    const endButton = screen.getByRole('button', { name: /end game/i });
    fireEvent.click(endButton);

    expect(defaultProps.onEndGame).toHaveBeenCalled();
  });

  it('calls onLeave handler', () => {
    customRender(<GameSessionView {...defaultProps} />);

    const leaveButton = screen.getByRole('button', { name: /leave/i });
    fireEvent.click(leaveButton);

    expect(defaultProps.onLeave).toHaveBeenCalled();
  });

  it('performance test renders within threshold', async () => {
    const startTime = performance.now();
    customRender(<GameSessionView {...defaultProps} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100);
  }, 10000);
});
