import type { NextApiRequest, NextApiResponse } from 'next';
import { enhancedVenueManagementService } from '../../../../services/venue/EnhancedVenueManagementService';

// POST /api/v1/venues/register
// Minimal MVP endpoint to register a venue using the in-memory/localStorage-backed service
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const { name, address, city, state, capacity, tables, amenities } = (req.body || {}) as {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      capacity?: number | string;
      tables?: number | string;
      amenities?: string[] | string;
    };

    // Basic validation
    if (!name || !address || !city || !state) {
      return res.status(400).json({ message: 'Missing required fields: name, address, city, state' });
    }

    const parsedCapacity = typeof capacity === 'string' ? parseInt(capacity, 10) : capacity;
    const parsedTables = typeof tables === 'string' ? parseInt(tables, 10) : tables;

    if (!parsedCapacity || parsedCapacity < 1) {
      return res.status(400).json({ message: 'capacity must be a positive number' });
    }
    if (!parsedTables || parsedTables < 1) {
      return res.status(400).json({ message: 'tables must be a positive number' });
    }

    let amenitiesArr: string[] = [];
    if (Array.isArray(amenities)) {
      amenitiesArr = amenities.map((a) => String(a).trim()).filter(Boolean);
    } else if (typeof amenities === 'string') {
      amenitiesArr = amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
    }

    const venue = await enhancedVenueManagementService.createVenue({
      name,
      location: { address, city, state },
      capacity: parsedCapacity,
      tables: parsedTables,
      amenities: amenitiesArr,
    });

    return res.status(201).json(venue);
  } catch (error) {
    console.error('Venue registration failed:', error);
    return res.status(500).json({ message: 'Failed to register venue' });
  }
}
