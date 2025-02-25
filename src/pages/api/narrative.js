import NarrativeService from '../../services/NarrativeService';

// Configure MCP with API credentials and endpoint from environment variables.
const mcpConfig = {
  apiKey: process.env.MCP_API_KEY,
  endpoint: process.env.MCP_API_ENDPOINT,
};

// Instantiate NarrativeService with the configuration.
const narrativeService = new NarrativeService(mcpConfig);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract narrative event data from the request body.
    const { baseDescription, context } = req.body;
    if (!baseDescription || !context) {
      return res.status(400).json({ error: 'Missing required fields: baseDescription, context' });
    }

    // Process the event to automatically generate a visual asset.
    const asset = await narrativeService.processEvent({ baseDescription, context });
    return res.status(200).json({ asset });
  } catch (error) {
    console.error('Error processing narrative event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 