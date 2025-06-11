import React from 'react';
import { render, screen } from '@testing-library/react';
import VenueDashboard from '../../../components/venue/VenueDashboard';

describe('VenueDashboard', () => {
  it('renders the venue dashboard heading', () => {
    render(<VenueDashboard />);
    const headingElement = screen.getByText(/Venue Dashboard/i);
    expect(headingElement).toBeInTheDocument();
  });

  it('renders the welcome text', () => {
    render(<VenueDashboard />);
    const welcomeTextElement = screen.getByText(/Welcome to the Venue Management Dashboard. More features coming soon!/i);
    expect(welcomeTextElement).toBeInTheDocument();
  });
}); 