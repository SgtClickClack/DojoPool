import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Import the component from apps/web. Tests live under src/** per vitest config.
import WorldHub, { WorldMapHub } from '../../../../apps/web/src/components/world/WorldHub';

describe('WorldHub Component', () => {
  it('renders placeholder content', () => {
    render(<WorldHub />);
    expect(screen.getByRole('heading', { name: /World Hub/i })).toBeInTheDocument();
    expect(
      screen.getByText(/This is a placeholder WorldHub component under apps\/web\/src\./i)
    ).toBeInTheDocument();
  });

  it('named export WorldMapHub renders equivalently', () => {
    render(<WorldMapHub />);
    expect(screen.getByRole('heading', { name: /World Hub/i })).toBeInTheDocument();
  });
});
