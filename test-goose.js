require('dotenv').config();
const axios = require('axios');

async function testGooseAI() {
  const apiKey = process.env.GOOSE_API_KEY;
  const baseURL = 'https://api.goose.ai/v1';

  try {
    const response = await axios.post(
      `${baseURL}/engines/gpt-neo-20b/completions`,
      {
        prompt: 'Test message',
        max_tokens: 50,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('GooseAI test successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('GooseAI test failed:', error.response?.data || error.message);
  }
}

testGooseAI(); 