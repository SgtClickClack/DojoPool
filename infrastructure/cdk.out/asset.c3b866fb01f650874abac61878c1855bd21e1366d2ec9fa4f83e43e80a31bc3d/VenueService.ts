import axios from 'axios';

// Define the base URL for venue related API calls
const VENUE_API_BASE_URL =
  process.env.REACT_APP_VENUE_API_BASE_URL || '/api/venues';

export const VenueService = {
  // Placeholder for a function to get venue data
  async getVenue(venueId: string) {
    try {
      const response = await axios.get(`${VENUE_API_BASE_URL}/${venueId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching venue data:', error);
      throw error;
    }
  },

  // Placeholder for a function to get list of venues
  async getVenues() {
    try {
      const response = await axios.get(VENUE_API_BASE_URL);
      return response.data;
    } catch (error) {
      console.error('Error fetching venues:', error);
      throw error;
    }
  },

  // Add other necessary venue related functions (e.g., manage tables, view analytics)
};
