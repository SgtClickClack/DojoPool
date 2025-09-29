import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@/components/__tests__/test-utils';
import MobileGameControls from '../MobileGameControls';

vi.mock('framer-motion', () => {
  const componentFactory = (tag: keyof JSX.IntrinsicElements) => {
    const Component = React.forwardRef<HTMLElement, any>((props, ref) => {
      const {
        animate,
        initial,
        exit,
        transition,
        whileTap,
        whileHover,
        layout,
        layoutId,
        variants,
        ...rest
      } = props;

      return React.createElement(tag, { ref, ...rest });
    });

    Component.displayName = `MotionMock(${tag})`;
    return Component;
  };

  return {
    __esModule: true,
    motion: new Proxy(
      {},
      {
        get: (_, key: string) => componentFactory(key as keyof JSX.IntrinsicElements),
      }
    ),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const onPlayPause = vi.fn();
const onForfeit = vi.fn();
const onSettings = vi.fn();
const onChat = vi.fn();
const onSpectate = vi.fn();

const renderControls = (overrides: Partial<React.ComponentProps<typeof MobileGameControls>> = {}) =>
  render(
    <MobileGameControls
      isPlaying={false}
      isPaused={false}
      currentPlayer="player-one"
      gameState="playing"
      playerCount={2}
      timeRemaining={90}
      onPlayPause={onPlayPause}
      onForfeit={onForfeit}
      onSettings={onSettings}
      onChat={onChat}
      onSpectate={onSpectate}
      {...overrides}
    />
  );

describe('MobileGameControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders primary control buttons with accessible labels', () => {
    renderControls();

    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /game settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /spectate mode/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forfeit game/i })).toBeInTheDocument();
  });

  it('invokes callbacks when controls are activated', () => {
    renderControls();

    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlayPause).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /forfeit game/i }));
    expect(onForfeit).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /game settings/i }));
    expect(onSettings).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /open chat/i }));
    expect(onChat).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /spectate mode/i }));
    expect(onSpectate).toHaveBeenCalled();
  });

  it('shows pause label when already playing', () => {
    renderControls({ isPlaying: true, isPaused: false });

    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });
});
