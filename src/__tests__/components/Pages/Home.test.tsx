import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../../../dojopool/frontend/src/components/Pages/Home';
import { renderWithProviders } from '../../utils/testUtils';

describe('Home Component', () => {
  it('renders the welcome message', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('Welcome to DojoPool')).toBeInTheDocument();
    expect(screen.getByText('Where Pool Meets Digital Innovation')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/Experience pool like never before/)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText('Find a Dojo')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('applies correct styling to buttons', () => {
    renderWithProviders(<Home />);
    const findDojoButton = screen.getByText('Find a Dojo');
    const learnMoreButton = screen.getByText('Learn More');

    expect(findDojoButton).toHaveStyle({
      background: expect.stringContaining('linear-gradient'),
      color: '#ffffff',
    });

    expect(learnMoreButton).toHaveStyle({
      color: '#00f2fe',
    });
  });

  it('renders with correct layout structure', () => {
    renderWithProviders(<Home />);
    const container = screen.getByRole('main');
    
    expect(container).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    });
  });

  it('applies gradient background to title', () => {
    renderWithProviders(<Home />);
    const title = screen.getByRole('heading', { level: 1 });
    
    expect(title).toHaveStyle({
      background: expect.stringContaining('linear-gradient'),
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    });
  });
}); 