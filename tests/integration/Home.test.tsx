import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../../apps/web/src/pages/index';

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />);

    const heading = screen.getByRole('heading', {
      name: /welcome to dojopool/i,
    });

    expect(heading).toBeInTheDocument();
  });
});
