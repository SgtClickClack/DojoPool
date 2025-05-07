import axios from 'axios';
import { Profile } from '../../types/profile';

// Define the base URL for social related API calls
const SOCIAL_API_BASE_URL = process.env.REACT_APP_SOCIAL_API_BASE_URL || '/api/social';

export const SocialService = {
  // Placeholder for a function to get the social feed
  async getSocialFeed() {
    try {
      const response = await axios.get(`${SOCIAL_API_BASE_URL}/feed`);
      return response.data;
    } catch (error) {
      console.error('Error fetching social feed:', error);
      throw error;
    }
  },

  // Placeholder for a function to get a user profile
  async getUserProfile(userId: string): Promise<Profile> {
    try {
      const response = await axios.get(`${SOCIAL_API_BASE_URL}/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user profile for user ${userId}:`, error);
      throw error;
    }
  },

  // Add other necessary social related functions (e.g., post to feed, follow user, send message)
}; 