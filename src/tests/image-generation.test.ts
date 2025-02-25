import { OpenAI } from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fetch } from 'cross-fetch';

describe('Image Generation', () => {
    let openai: OpenAI;

    beforeAll(() => {
        // Initialize OpenAI client
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    });

    it('should generate a logo for DojoPool', async () => {
        const prompt = `Create a modern, minimalist logo for a gaming platform called "DojoPool" 
            that combines elements of pool/billiards with martial arts aesthetics. 
            The logo should feature clean lines and a balanced composition, 
            possibly incorporating a stylized pool cue or ball with Asian-inspired design elements. 
            Use a sophisticated color palette with deep blues and metallic accents.`;

        expect(openai).toBeDefined();
        
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "natural"
        });

        expect(response.data).toBeDefined();
        expect(response.data[0].url).toBeDefined();

        // Download the generated image
        const imageUrl = response.data[0].url;
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Create output directory if it doesn't exist
        const outputDir = path.join(__dirname, '..', 'generated');
        await fs.mkdir(outputDir, { recursive: true });

        // Save the image
        const outputPath = path.join(outputDir, 'dojopool-logo.png');
        await fs.writeFile(outputPath, imageBuffer);

        // Verify the file was created
        const stats = await fs.stat(outputPath);
        expect(stats.size).toBeGreaterThan(0);
    }, 30000); // Increase timeout to 30 seconds

    it('should handle API errors gracefully', async () => {
        // Test with invalid API key
        const invalidClient = new OpenAI({
            apiKey: 'invalid-key'
        });

        await expect(invalidClient.images.generate({
            model: "dall-e-3",
            prompt: "Test prompt",
            n: 1,
            size: "1024x1024"
        })).rejects.toThrow();
    });
}); 