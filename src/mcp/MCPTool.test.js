/**
 * Unit tests for MCPTool integration module.
 * These tests validate that the module functions as expected.
 */

const MCPTool = require('./MCPTool');

describe('MCPTool', () => {
    let mcpTool;
    const config = {
        apiKey: 'dummy-api-key',
        endpoint: 'https://dummy.endpoint.com/api'
    };

    beforeEach(() => {
        mcpTool = new MCPTool(config);
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('generateImage calls fetch with correct parameters and returns image asset', async () => {
        const prompt = 'test prompt';
        const options = { style: 'kung fu', width: 800, height: 600 };
        const mockResponseData = { url: 'https://dummy.image.com/testimage.png', width: 800, height: 600 };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponseData
        });

        const asset = await mcpTool.generateImage(prompt, options);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/generate'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    options,
                    apiKey: config.apiKey,
                })
            })
        );
        expect(asset).toEqual(mockResponseData);
    });

    test('generateImage throws an error when response is not ok', async () => {
        fetch.mockResolvedValueOnce({
            ok: false
        });

        await expect(mcpTool.generateImage('prompt')).rejects.toThrow('Failed to generate image asset');
    });

    // Additional tests for bulkGenerateImages, checkGenerationStatus, retrieveImageAsset, etc.
}); 