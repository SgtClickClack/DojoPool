import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../utils/testUtils';
import SocialFeed from '../../../components/social/SocialFeed';

// Mock WebSocket
const mockWebSocket = {
  onmessage: null as ((event: any) => void) | null,
  close: jest.fn(),
  send: jest.fn(),
};

// Mock fetch responses
const mockFeedData = [
  {
    id: '1',
    type: 'achievement',
    user: {
      id: 'user1',
      username: 'Player1',
      avatar: '/avatar1.jpg',
      rating: 2500,
    },
    content: 'Just unlocked a new achievement!',
    timestamp: '2024-02-14T12:00:00Z',
    likes: 5,
    comments: 2,
    liked_by_user: false,
    metadata: {
      achievement: {
        name: 'First Victory',
        rarity: 'Common',
        icon: '/icons/victory.png',
      },
    },
  },
];

const mockSuggestions = [
  {
    user: {
      id: 'user2',
      username: 'Player2',
      avatar: '/avatar2.jpg',
      rating: 2300,
    },
    mutual_friends: 3,
    mutual_achievements: 2,
    recent_games: 5,
  },
];

// Mock fetch
global.fetch = jest.fn((url) => {
  if (url === '/api/social/feed') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockFeedData),
    });
  }
  if (url === '/api/social/suggestions') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockSuggestions),
    });
  }
  return Promise.reject(new Error('not found'));
}) as jest.Mock;

// Mock WebSocket constructor
global.WebSocket = jest.fn(() => mockWebSocket) as any;

describe('SocialFeed Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    renderWithProviders(<SocialFeed />);
    expect(screen.getByTestId('feed-loading')).toBeInTheDocument();
  });

  it('fetches and displays feed items', async () => {
    renderWithProviders(<SocialFeed />);

    await waitFor(() => {
      expect(screen.getByText('Just unlocked a new achievement!')).toBeInTheDocument();
    });

    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('First Victory')).toBeInTheDocument();
  });

  it('fetches and displays friend suggestions', async () => {
    renderWithProviders(<SocialFeed />);

    await waitFor(() => {
      expect(screen.getByText('Player2')).toBeInTheDocument();
    });

    expect(screen.getByText('3 mutual friends')).toBeInTheDocument();
    expect(screen.getByText('5 recent games')).toBeInTheDocument();
  });

  it('handles post interactions', async () => {
    renderWithProviders(<SocialFeed />);

    await waitFor(() => {
      expect(screen.getByText('Just unlocked a new achievement!')).toBeInTheDocument();
    });

    // Like
    const likeButton = screen.getByTestId('like-button-1');
    fireEvent.click(likeButton);
    expect(fetch).toHaveBeenCalledWith('/api/social/posts/1/like', {
      method: 'POST',
    });

    // Comment
    const commentInput = screen.getByTestId('comment-input-1');
    const commentButton = screen.getByTestId('comment-button-1');
    await userEvent.type(commentInput, 'Great achievement!');
    fireEvent.click(commentButton);
    expect(fetch).toHaveBeenCalledWith('/api/social/posts/1/comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'Great achievement!' }),
    });

    // Share
    const shareButton = screen.getByTestId('share-button-1');
    fireEvent.click(shareButton);
    expect(fetch).toHaveBeenCalledWith('/api/social/posts/1/share', {
      method: 'POST',
    });
  });

  it('handles friend requests', async () => {
    renderWithProviders(<SocialFeed />);

    await waitFor(() => {
      expect(screen.getByText('Player2')).toBeInTheDocument();
    });

    const addFriendButton = screen.getByTestId('add-friend-user2');
    fireEvent.click(addFriendButton);
    expect(fetch).toHaveBeenCalledWith('/api/social/friends/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: 'user2' }),
    });
  });

  it('handles WebSocket updates', async () => {
    renderWithProviders(<SocialFeed />);

    await waitFor(() => {
      expect(screen.getByText('Just unlocked a new achievement!')).toBeInTheDocument();
    });

    // Simulate new post via WebSocket
    const newPost = {
      id: '2',
      type: 'social',
      user: {
        id: 'user3',
        username: 'Player3',
        avatar: '/avatar3.jpg',
        rating: 2400,
      },
      content: 'New post via WebSocket!',
      timestamp: '2024-02-14T12:30:00Z',
      likes: 0,
      comments: 0,
      liked_by_user: false,
    };

    mockWebSocket.onmessage?.({ data: JSON.stringify({ type: 'new_post', post: newPost }) });

    await waitFor(() => {
      expect(screen.getByText('New post via WebSocket!')).toBeInTheDocument();
    });
  });

  it('handles errors gracefully', async () => {
    // Mock fetch to simulate error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    renderWithProviders(<SocialFeed />);

    await waitFor(() => {
      expect(screen.getByText('Error loading feed')).toBeInTheDocument();
    });
  });
}); 