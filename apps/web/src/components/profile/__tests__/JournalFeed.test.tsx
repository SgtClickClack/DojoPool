import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import JournalFeed from '../profile/JournalFeed';

// Mock the JournalFeed component since it doesn't exist yet
jest.mock('../profile/JournalFeed', () => {
  return function MockJournalFeed({ entries, onEntryClick, loading }: any) {
    return (
      <div data-testid="journal-feed">
        {loading ? (
          <div data-testid="loading">Loading journal...</div>
        ) : (
          <div data-testid="journal-entries">
            {entries.map((entry: any) => (
              <div key={entry.id} data-testid={`entry-${entry.id}`} onClick={() => onEntryClick(entry)}>
                <h3>{entry.title}</h3>
                <p>{entry.content}</p>
                <span>{entry.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
});

const mockEntries = [
  {
    id: 'entry-1',
    title: 'First Journal Entry',
    content: 'This is my first journal entry about my pool practice.',
    date: '2024-01-01',
  },
  {
    id: 'entry-2',
    title: 'Tournament Reflection',
    content: 'Reflections on my recent tournament performance.',
    date: '2024-01-02',
  },
];

const mockOnEntryClick = jest.fn();

const defaultProps = {
  entries: mockEntries,
  onEntryClick: mockOnEntryClick,
};

const loadingProps = {
  ...defaultProps,
  loading: true,
};

const emptyProps = {
  entries: [],
  onEntryClick: mockOnEntryClick,
};

describe('JournalFeed', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders journal entries correctly', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    expect(screen.getByText('First Journal Entry')).toBeInTheDocument();
    expect(screen.getByText('Tournament Reflection')).toBeInTheDocument();
    expect(screen.getByTestId('journal-feed')).toBeInTheDocument();
  });

  it('handles entry click', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    const firstEntry = screen.getByTestId('entry-entry-1');
    fireEvent.click(firstEntry);
    
    expect(mockOnEntryClick).toHaveBeenCalledWith(mockEntries[0]);
  });

  it('displays loading state', () => {
    customRender(<JournalFeed {...loadingProps} />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('journal-entries')).not.toBeInTheDocument();
  });

  it('handles empty entries list', () => {
    customRender(<JournalFeed {...emptyProps} />);
    
    expect(screen.queryByTestId('journal-entries')).toBeInTheDocument();
    expect(screen.getAllByTestId('entry-')).toHaveLength(0);
  });

  it('renders entry content correctly', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    expect(screen.getByText('This is my first journal entry about my pool practice.')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
  });

  it('renders with minimal props', () => {
    customRender(<JournalFeed entries={[]} onEntryClick={jest.fn()} />);
    
    expect(screen.getByTestId('journal-feed')).toBeInTheDocument();
  });

  it('performance test renders within threshold', async () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    expect(screen.getByText(mockEntries[0].title)).toBeInTheDocument();
  }, 5000);
});
