import axios from 'axios';

export class GooseAI {
  private static instance: GooseAI;
  private apiKey: string;
  private baseURL: string = 'https://api.goose.ai/v1';

  private constructor() {
    this.apiKey = process.env.GOOSE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GooseAI API key not found in environment variables');
    }
  }

  public static getInstance(): GooseAI {
    if (!GooseAI.instance) {
      GooseAI.instance = new GooseAI();
    }
    return GooseAI.instance;
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  public async generateCompletion(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      topP?: number;
      stop?: string[];
    } = {}
  ) {
    try {
      const response = await axios.post(
        `${this.baseURL}/completions`,
        {
          model: options.model || 'gpt-neo-20b',
          prompt,
          max_tokens: options.maxTokens || 100,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 1,
          stop: options.stop || null,
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error) {
      console.error('Error generating completion:', error);
      throw error;
    }
  }

  public async generateEmbeddings(text: string, model: string = 'gpt-neo-20b') {
    try {
      const response = await axios.post(
        `${this.baseURL}/embeddings`,
        {
          model,
          input: text,
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
