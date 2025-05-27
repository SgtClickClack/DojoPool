import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoHighlights from './VideoHighlights';

jest.mock('../hooks/useVideoHighlights', () => ({
  useVideoHighlights: () => ({
    highlights: {
      '1': {
        id: '1',
        title: 'Best Shot',
        description: 'Amazing shot highlight',
        videoUrl: 'http://localhost/video1.mp4',
        duration: 60,
        createdAt: '2024-07-31T00:00:00Z',
        videoRef: { current: null },
      },
    },
    generateHighlight: jest.fn(),
    shareHighlight: jest.fn(),
    downloadHighlight: jest.fn(),
    loading: false,
    error: null,
  }),
}));

describe('VideoHighlights', () => {
  it('renders highlight cards', () => {
    render(<VideoHighlights tournamentId="123" />);
    expect(screen.getByText('Tournament Highlights')).toBeInTheDocument();
    expect(screen.getByText('Best Shot')).toBeInTheDocument();
    expect(screen.getByText('Amazing shot highlight')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    jest.mock('../hooks/useVideoHighlights', () => ({
      useVideoHighlights: () => ({
        highlights: {},
        generateHighlight: jest.fn(),
        shareHighlight: jest.fn(),
        downloadHighlight: jest.fn(),
        loading: true,
        error: null,
      }),
    }));
    render(<VideoHighlights tournamentId="123" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', () => {
    jest.mock('../hooks/useVideoHighlights', () => ({
      useVideoHighlights: () => ({
        highlights: {},
        generateHighlight: jest.fn(),
        shareHighlight: jest.fn(),
        downloadHighlight: jest.fn(),
        loading: false,
        error: 'Failed to fetch',
      }),
    }));
    render(<VideoHighlights tournamentId="123" />);
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });
}); 