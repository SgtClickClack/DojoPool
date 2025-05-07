import React from 'react';
import { render, screen } from '@testing-library/react';
import UserProfile from '../../../src/components/social/UserProfile';
import { User } from '../../../src/types/user';
import { Profile } from '../../../src/types/profile';

// Mock the useAuth hook as it's likely used in UserProfile
jest.mock('../../../src/frontend/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user123' } as User, // Mock authenticated user
    loading: false,
  }),
}));

// Mock any potential service calls the component might make
// jest.mock('../../../src/services/social/SocialService', () => ({
//   SocialService: {
//     getUserProfile: jest.fn(),
//     // Add other mocked service methods here
//   },
// }));

describe('UserProfile', () => {
  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    password: 'hashedpassword', // Sensitive data, keep minimal for test
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProfile: Profile = {
    id: 'profile123',
    userId: 'user123',
    displayName: 'Test User',
    bio: 'This is a test bio.',
    avatarUrl: 'http://example.com/avatar.jpg',
    location: 'Test City',
    skillLevel: 1500,
    preferredGame: '8-ball',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Before each test, mock the service call to return the mock profile
  // beforeEach(() => {
  //   require('../../../src/services/social/SocialService').SocialService.getUserProfile.mockResolvedValue(mockProfile);
  // });

  it('renders the user profile with basic information', async () => {
    // Mock the specific hook used by the component if not using the service mock above
    // Example: If using a useProfile hook
     jest.mock('../../../src/frontend/hooks/useProfile', () => ({
       useProfile: () => ({ profile: mockProfile, loading: false, error: null }),
     }));

    render(<UserProfile userId={'user123'} />);

    // Check for key elements
    await screen.findByText('Test User');
    await screen.findByText('This is a test bio.');
    await screen.findByText('Test City');
    await screen.findByText('Skill Level: 1500'); // Assuming this format
    // Check for avatar image if rendered with alt text or src
    const avatar = screen.getByRole('img', { name: /user avatar/i });
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'http://example.com/avatar.jpg');
  });

  // Add more tests for loading states, error states, editing profile, etc.
}); 