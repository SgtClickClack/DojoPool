import { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';
import { validateVenueName, validateLatLong } from '../../../lib/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const venueAction = req.query.venue?.[0];

  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (venueAction) {
      case 'register':
        if (method === 'POST') {
          return handleRegisterVenue(req, res, user.userId);
        }
        break;

      case 'update':
        if (method === 'PUT') {
          return handleUpdateVenue(req, res, user.userId);
        }
        break;

      case 'tables':
        if (method === 'GET') {
          return handleGetTables(req, res);
        }
        if (method === 'POST') {
          return handleAddTable(req, res, user.userId);
        }
        if (method === 'PUT') {
          return handleUpdateTable(req, res, user.userId);
        }
        break;

      case 'bookings':
        if (method === 'GET') {
          return handleGetBookings(req, res);
        }
        if (method === 'POST') {
          return handleCreateBooking(req, res, user.userId);
        }
        break;

      case 'list':
        if (method === 'GET') {
          return handleListVenues(req, res);
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Venue API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleRegisterVenue(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { name, address, latitude, longitude, contactInfo, operatingHours } = req.body;

  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!validateVenueName(name)) {
    return res.status(400).json({ error: 'Invalid venue name' });
  }

  if (!validateLatLong(latitude) || !validateLatLong(longitude)) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create venue
    const venueResult = await client.query(
      `INSERT INTO venues 
       (name, address, latitude, longitude, contact_info, operating_hours, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [name, address, latitude, longitude, contactInfo, operatingHours, userId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      venueId: venueResult.rows[0].id,
      message: 'Venue registered successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleUpdateVenue(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { venueId } = req.query;
  const { name, address, contactInfo, operatingHours, isActive } = req.body;

  if (!venueId) {
    return res.status(400).json({ error: 'Venue ID is required' });
  }

  // Verify ownership
  const ownerResult = await pool.query(
    'SELECT id FROM venues WHERE id = $1 AND user_id = $2',
    [venueId, userId]
  );

  if (ownerResult.rows.length === 0) {
    return res.status(403).json({ error: 'Not authorized to update this venue' });
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (name) {
    if (!validateVenueName(name)) {
      return res.status(400).json({ error: 'Invalid venue name' });
    }
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }

  if (address) {
    updates.push(`address = $${paramCount}`);
    values.push(address);
    paramCount++;
  }

  if (contactInfo) {
    updates.push(`contact_info = $${paramCount}`);
    values.push(contactInfo);
    paramCount++;
  }

  if (operatingHours) {
    updates.push(`operating_hours = $${paramCount}`);
    values.push(operatingHours);
    paramCount++;
  }

  if (typeof isActive === 'boolean') {
    updates.push(`is_active = $${paramCount}`);
    values.push(isActive);
    paramCount++;
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  values.push(venueId);
  const query = `
    UPDATE venues 
    SET ${updates.join(', ')},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount}
  `;

  await pool.query(query, values);

  res.status(200).json({ message: 'Venue updated successfully' });
}

async function handleGetTables(req: NextApiRequest, res: NextApiResponse) {
  const { venueId } = req.query;

  if (!venueId) {
    return res.status(400).json({ error: 'Venue ID is required' });
  }

  const result = await pool.query(
    `SELECT t.*, 
            COALESCE(b.user_id, NULL) as booked_by,
            COALESCE(u.username, NULL) as booked_by_username,
            b.start_time as booking_start,
            b.end_time as booking_end
     FROM pool_tables t
     LEFT JOIN venue_bookings b ON t.id = b.table_id 
       AND b.start_time <= CURRENT_TIMESTAMP 
       AND b.end_time > CURRENT_TIMESTAMP
     LEFT JOIN users u ON b.user_id = u.id
     WHERE t.venue_id = $1
     ORDER BY t.table_number`,
    [venueId]
  );

  res.status(200).json(result.rows);
}

async function handleAddTable(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { venueId } = req.query;
  const { tableNumber } = req.body;

  if (!venueId || !tableNumber) {
    return res.status(400).json({ error: 'Venue ID and table number are required' });
  }

  // Verify ownership
  const ownerResult = await pool.query(
    'SELECT id FROM venues WHERE id = $1 AND user_id = $2',
    [venueId, userId]
  );

  if (ownerResult.rows.length === 0) {
    return res.status(403).json({ error: 'Not authorized to add tables to this venue' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if table number already exists
    const tableCheck = await client.query(
      'SELECT id FROM pool_tables WHERE venue_id = $1 AND table_number = $2',
      [venueId, tableNumber]
    );

    if (tableCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Table number already exists' });
    }

    // Generate QR code (implementation depends on your QR code generation strategy)
    const qrCode = `${venueId}-${tableNumber}-${Date.now()}`;

    // Add table
    const result = await client.query(
      `INSERT INTO pool_tables 
       (venue_id, table_number, qr_code)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [venueId, tableNumber, qrCode]
    );

    await client.query('COMMIT');

    res.status(201).json({
      tableId: result.rows[0].id,
      qrCode,
      message: 'Table added successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleUpdateTable(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { tableId } = req.query;
  const { status } = req.body;

  if (!tableId || !status) {
    return res.status(400).json({ error: 'Table ID and status are required' });
  }

  // Verify ownership
  const ownerResult = await pool.query(
    `SELECT v.id 
     FROM venues v
     JOIN pool_tables t ON v.id = t.venue_id
     WHERE t.id = $1 AND v.user_id = $2`,
    [tableId, userId]
  );

  if (ownerResult.rows.length === 0) {
    return res.status(403).json({ error: 'Not authorized to update this table' });
  }

  await pool.query(
    `UPDATE pool_tables 
     SET status = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [status, tableId]
  );

  res.status(200).json({ message: 'Table status updated successfully' });
}

async function handleGetBookings(req: NextApiRequest, res: NextApiResponse) {
  const { venueId, date } = req.query;

  if (!venueId) {
    return res.status(400).json({ error: 'Venue ID is required' });
  }

  let query = `
    SELECT b.*, 
           t.table_number,
           u.username as booked_by_username
    FROM venue_bookings b
    JOIN pool_tables t ON b.table_id = t.id
    JOIN users u ON b.user_id = u.id
    WHERE t.venue_id = $1
  `;

  const queryParams: any[] = [venueId];

  if (date) {
    query += ` AND DATE(b.start_time) = DATE($2)`;
    queryParams.push(date);
  }

  query += ' ORDER BY b.start_time';

  const result = await pool.query(query, queryParams);

  res.status(200).json(result.rows);
}

async function handleCreateBooking(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { tableId, startTime, endTime } = req.body;

  if (!tableId || !startTime || !endTime) {
    return res.status(400).json({ error: 'Table ID, start time, and end time are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if table exists and is available
    const tableResult = await client.query(
      'SELECT id, status FROM pool_tables WHERE id = $1',
      [tableId]
    );

    if (tableResult.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }

    if (tableResult.rows[0].status !== 'available') {
      return res.status(400).json({ error: 'Table is not available' });
    }

    // Check for conflicting bookings
    const conflictResult = await client.query(
      `SELECT id 
       FROM venue_bookings 
       WHERE table_id = $1 
         AND status = 'confirmed'
         AND (
           (start_time <= $2 AND end_time > $2)
           OR (start_time < $3 AND end_time >= $3)
           OR (start_time >= $2 AND end_time <= $3)
         )`,
      [tableId, startTime, endTime]
    );

    if (conflictResult.rows.length > 0) {
      return res.status(400).json({ error: 'Time slot is not available' });
    }

    // Create booking
    await client.query(
      `INSERT INTO venue_bookings 
       (table_id, user_id, start_time, end_time)
       VALUES ($1, $2, $3, $4)`,
      [tableId, userId, startTime, endTime]
    );

    await client.query('COMMIT');

    res.status(201).json({ message: 'Booking created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function handleListVenues(req: NextApiRequest, res: NextApiResponse) {
  const { latitude, longitude, radius, limit = 10, offset = 0 } = req.query;

  let query = `
    SELECT v.*, 
           COUNT(t.id) as table_count,
           COUNT(CASE WHEN t.status = 'available' THEN 1 END) as available_tables
    FROM venues v
    LEFT JOIN pool_tables t ON v.id = t.venue_id
  `;

  const queryParams: any[] = [];
  const conditions: string[] = ['v.is_active = true'];

  if (latitude && longitude && radius) {
    // Calculate distance using Haversine formula
    query += `, 
      (6371 * acos(cos(radians($1)) * cos(radians(latitude)) 
      * cos(radians(longitude) - radians($2)) 
      + sin(radians($1)) * sin(radians(latitude)))) AS distance
    `;
    conditions.push(`(6371 * acos(cos(radians($1)) * cos(radians(latitude)) 
      * cos(radians(longitude) - radians($2)) 
      + sin(radians($1)) * sin(radians(latitude)))) <= $3`);
    queryParams.push(latitude, longitude, radius);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' GROUP BY v.id';

  if (latitude && longitude) {
    query += ' ORDER BY distance';
  } else {
    query += ' ORDER BY v.name';
  }

  queryParams.push(limit, offset);
  query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

  const result = await pool.query(query, queryParams);

  res.status(200).json({
    venues: result.rows,
    count: result.rowCount
  });
} 