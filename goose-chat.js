require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function askGoose(prompt) {
  const apiKey = process.env.GOOSE_API_KEY;
  const baseURL = 'https://api.goose.ai/v1';

  // Add context to the prompt based on the type of question
  let enhancedPrompt = prompt;
  if (prompt.toLowerCase().startsWith('code:')) {
    enhancedPrompt = `As a coding assistant, please help with the following: ${prompt.slice(5)}. Provide clear, well-commented code with explanations.`;
  } else if (prompt.toLowerCase().startsWith('explain:')) {
    enhancedPrompt = `Please provide a clear technical explanation for: ${prompt.slice(8)}. Include examples where appropriate.`;
  } else if (prompt.toLowerCase().startsWith('analyze:')) {
    enhancedPrompt = `Please analyze the following and provide detailed insights: ${prompt.slice(8)}. Include specific recommendations and potential improvements.`;
  }

  try {
    const response = await axios.post(
      `${baseURL}/engines/gpt-neo-20b/completions`,
      {
        prompt: enhancedPrompt,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 1,
        stop: ['\n\n\n', '###', '```end'], // Add stop sequences to prevent irrelevant content
        presence_penalty: 0.6, // Encourage more diverse responses
        frequency_penalty: 0.5, // Reduce repetition
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return null;
  }
}

async function chat() {
  console.log('Welcome to GooseChat! Type your question or "exit" to quit.');
  console.log('\nTips for better results:');
  console.log('- Start with "Code:" for programming help');
  console.log('- Start with "Explain:" for technical explanations');
  console.log('- Start with "Analyze:" for code analysis');
  console.log(
    'Example: "Code: Write a function to calculate fibonacci numbers"'
  );
  console.log('----------------------------------------\n');

  while (true) {
    const question = await new Promise((resolve) =>
      rl.question('You: ', resolve)
    );

    if (question.toLowerCase() === 'exit') {
      console.log('Goodbye!');
      rl.close();
      break;
    }

    console.log('\nThinking...');
    const response = await askGoose(question);

    if (response) {
      console.log('\nGoose:', response);
      console.log('----------------------------------------\n');
    }
  }
}

// Start the chat
chat();
