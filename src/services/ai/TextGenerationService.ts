import { OpenAI } from 'openai';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class TextGenerationService {
  private openai: OpenAI;
  private readonly model = 'gpt-4-turbo-preview';
  private readonly maxTokens = 1000;
  private readonly temperature = 0.7;

  constructor() {
    if (!config.openai?.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  /**
   * Generate text response using OpenAI
   */
  async generateResponse(prompt: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in creating content for DojoPool venues. Generate responses in the requested format, typically JSON for structured data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      if (!response.choices || response.choices.length === 0) {
        logger.warn('TextGenerationService: No response from OpenAI');
        return '';
      }

      const content = response.choices[0].message.content || '';
      logger.info('TextGenerationService: Generated response', { 
        promptLength: prompt.length,
        responseLength: content.length
      });
      
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in TextGenerationService', { 
        error: errorMessage,
        prompt: prompt.substring(0, 100)
      });
      throw new Error('Failed to generate text response');
    }
  }

  /**
   * Generate JSON response and parse it
   */
  async generateJSONResponse(prompt: string): Promise<any> {
    const response = await this.generateResponse(prompt);
    try {
      return JSON.parse(response);
    } catch (error) {
      logger.warn('Failed to parse JSON response, returning raw text');
      return { error: 'Failed to parse response', raw: response };
    }
  }
}

export default TextGenerationService; 