import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@/components/__tests__/test-utils';

afterEach(() => {
  vi.resetModules();
});

describe('WorldHub (wrapper)', () => {
  it('renders placeholder copy and map wrapper', async () => {
    vi.doMock('next/dynamic', () => ({
      __esModule: true,
      default: vi.fn(() => {
        const MockMap = () => <div data-testid="worldhub-map-wrapper" />;
        MockMap.displayName = 'MockWorldHubMap';
        return MockMap;
      }),
    }));

    const WorldHub = (await import('../WorldHub')).default;

    render(<WorldHub />);

    expect(screen.getByText(/DojoPool World Hub/i)).toBeInTheDocument();
    expect(screen.getByText(/Interactive world map/i)).toBeInTheDocument();
    expect(screen.getByTestId('worldhub-map-wrapper')).toBeInTheDocument();
  });
});
