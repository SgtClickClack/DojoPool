import axios from 'axios';

export class OpenAI {
  private static instance: OpenAI;
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';

  private constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found in environment variables');
    }
  }

  public static getInstance(): OpenAI {
    if (!OpenAI.instance) {
      OpenAI.instance = new OpenAI();
    }
    return OpenAI.instance;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  public async generateCompletion(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string[];
  } = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens || 100,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
          stop: options.stop || null
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating completion:', error);
      throw error;
    }
  }

  public async generateEmbeddings(text: string, model: string = 'text-embedding-ada-002') {
    try {
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          model,
          input: text
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  }
} 