require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askGPT(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await axios.post(
      baseURL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

async function chat() {
  console.log('Welcome to ChatGPT! Type your question or "exit" to quit.');
  console.log('\nTips:');
  console.log('- Be specific with your questions');
  console.log('- Use clear and concise language');
  console.log('- Provide context when needed');
  console.log('----------------------------------------\n');

  while (true) {
    const question = await new Promise(resolve => rl.question('You: ', resolve));
    
    if (question.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      break;
    }

    console.log('\nThinking...');
    const response = await askGPT(question);
    
    if (response) {
      console.log('\nAssistant:', response);
      console.log('----------------------------------------\n');
    }
  }
}

// Start the chat
chat(); 