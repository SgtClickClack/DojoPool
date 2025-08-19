import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'ap-southeast-2' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const VENUES_TABLE = process.env.VENUES_TABLE!;
const USERS_TABLE = process.env.USERS_TABLE!;
const GAME_SESSIONS_TABLE = process.env.GAME_SESSIONS_TABLE!;
const TOURNAMENTS_TABLE = process.env.TOURNAMENTS_TABLE!;
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, path, pathParameters, body } = event;

    console.log(`Processing ${httpMethod} request to ${path}`);

    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };

    // Handle OPTIONS requests for CORS
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // Route handling
    if (path === '/venues' && httpMethod === 'GET') {
      return await listVenues();
    } else if (path === '/venues' && httpMethod === 'POST') {
      return await createVenue(body);
    } else if (pathParameters?.venueId && httpMethod === 'GET') {
      return await getVenue(pathParameters.venueId);
    } else if (pathParameters?.venueId && httpMethod === 'PUT') {
      return await updateVenue(pathParameters.venueId, body);
    } else if (pathParameters?.venueId && httpMethod === 'DELETE') {
      return await deleteVenue(pathParameters.venueId);
    } else if (path.includes('/analytics') && httpMethod === 'GET') {
      const venueId = pathParameters?.venueId;
      return await getVenueAnalytics(venueId!);
    } else if (path.includes('/tournaments') && httpMethod === 'GET') {
      const venueId = pathParameters?.venueId;
      return await listVenueTournaments(venueId!);
    } else if (path.includes('/tournaments') && httpMethod === 'POST') {
      const venueId = pathParameters?.venueId;
      return await createTournament(venueId!, body);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not Found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

async function listVenues(): Promise<APIGatewayProxyResult> {
  const command = new QueryCommand({
    TableName: VENUES_TABLE,
    IndexName: 'LocationIndex',
    KeyConditionExpression: 'city = :city',
    ExpressionAttributeValues: {
      ':city': 'Sydney', // Default to Sydney for now
    },
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      venues: result.Items || [],
    }),
  };
}

async function createVenue(
  body: string | null
): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  const venueData = JSON.parse(body);
  const venueId = `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const venue = {
    venueId,
    venueName: venueData.venueName,
    address: venueData.address,
    city: venueData.city || 'Sydney',
    state: venueData.state || 'NSW',
    country: venueData.country || 'Australia',
    phone: venueData.phone,
    email: venueData.email,
    website: venueData.website,
    description: venueData.description,
    capacity: venueData.capacity,
    poolTables: venueData.poolTables || 1,
    amenities: venueData.amenities || [],
    operatingHours: venueData.operatingHours,
    ownerId: venueData.ownerId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
  };

  const command = new PutCommand({
    TableName: VENUES_TABLE,
    Item: venue,
  });

  await docClient.send(command);

  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ venue }),
  };
}

async function getVenue(venueId: string): Promise<APIGatewayProxyResult> {
  const command = new GetCommand({
    TableName: VENUES_TABLE,
    Key: { venueId },
  });

  const result = await docClient.send(command);

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Venue not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ venue: result.Item }),
  };
}

async function updateVenue(
  venueId: string,
  body: string | null
): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  const updateData = JSON.parse(body);
  let updateExpression = 'SET updatedAt = :updatedAt';
  const expressionAttributeValues: any = {
    ':updatedAt': new Date().toISOString(),
  };

  // Build dynamic update expression
  Object.keys(updateData).forEach((key) => {
    if (key !== 'venueId' && key !== 'createdAt') {
      expressionAttributeValues[`:${key}`] = updateData[key];
      updateExpression += `, ${key} = :${key}`;
    }
  });

  const command = new UpdateCommand({
    TableName: VENUES_TABLE,
    Key: { venueId },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ venue: result.Attributes }),
  };
}

async function deleteVenue(venueId: string): Promise<APIGatewayProxyResult> {
  const command = new DeleteCommand({
    TableName: VENUES_TABLE,
    Key: { venueId },
  });

  await docClient.send(command);

  return {
    statusCode: 204,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: '',
  };
}

async function getVenueAnalytics(
  venueId: string
): Promise<APIGatewayProxyResult> {
  const command = new QueryCommand({
    TableName: ANALYTICS_TABLE,
    KeyConditionExpression: 'venueId = :venueId',
    ExpressionAttributeValues: {
      ':venueId': venueId,
    },
    ScanIndexForward: false, // Most recent first
    Limit: 30, // Last 30 days
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      analytics: result.Items || [],
    }),
  };
}

async function listVenueTournaments(
  venueId: string
): Promise<APIGatewayProxyResult> {
  const command = new QueryCommand({
    TableName: TOURNAMENTS_TABLE,
    IndexName: 'VenueTournamentsIndex',
    KeyConditionExpression: 'venueId = :venueId',
    ExpressionAttributeValues: {
      ':venueId': venueId,
    },
    ScanIndexForward: false, // Most recent first
  });

  const result = await docClient.send(command);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      tournaments: result.Items || [],
    }),
  };
}

async function createTournament(
  venueId: string,
  body: string | null
): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  const tournamentData = JSON.parse(body);
  const tournamentId = `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const tournament = {
    tournamentId,
    venueId,
    tournamentName: tournamentData.tournamentName,
    description: tournamentData.description,
    startDate: tournamentData.startDate,
    endDate: tournamentData.endDate,
    entryFee: tournamentData.entryFee,
    prizePool: tournamentData.prizePool,
    maxParticipants: tournamentData.maxParticipants,
    currentParticipants: 0,
    status: 'upcoming',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const command = new PutCommand({
    TableName: TOURNAMENTS_TABLE,
    Item: tournament,
  });

  await docClient.send(command);

  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ tournament }),
  };
}
