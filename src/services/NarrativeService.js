/**
 * NarrativeService module.
 *
 * This service integrates the MCP tool to automatically generate visual assets
 * for narrative events. When a narrative event occurs, it formats the prompt based on
 * event context, calls the MCP tool, and processes the generated image.
 *
 * How it fits into DojoPool:
 * - Enhances immersion by automatically updating visuals based on match events.
 * - Increases productivity by reducing manual asset creation.
 * - Aligns with our long-term objectives of automating dynamic visual content.
 */

const MCPTool = require('../mcp/MCPTool');

class NarrativeService {
    constructor(mcpConfig) {
        // Initialize the MCP tool using the provided configuration.
        this.mcpTool = MCPTool.initializeMCP(mcpConfig);
    }

    /**
     * Processes a narrative event by generating a visual asset.
     * @param {Object} eventData - Data describing the narrative event.
     * @param {string} eventData.baseDescription - Base description for the prompt.
     * @param {string} eventData.context - Additional context to define the mood/style.
     * @param {Object} [options={}] - Options for image generation.
     * @returns {Promise<Object>} - The generated asset data.
     */
    async processEvent(eventData, options = {}) {
        const { baseDescription, context } = eventData;
        // Dynamically create a prompt using the MCP tool's helper.
        const prompt = this.mcpTool.formatPrompt(baseDescription, context);

        try {
            // Automatically generate the image asset via MCP tool.
            const asset = await this.mcpTool.generateImage(prompt, options);
            
            // Check if the asset meets our quality criteria.
            if (this.mcpTool.validateImageAsset(asset)) {
                // Cache the asset for future retrieval.
                this.mcpTool.cacheImageAsset(asset, {
                    prompt,
                    timestamp: new Date().toISOString(),
                });
                console.log('Asset generated and cached:', asset);
                return asset;
            } else {
                console.warn('Asset did not pass validation, refreshing asset...');
                // Regenerate the asset if validation fails.
                const refreshedAsset = await this.mcpTool.refreshImageAsset(prompt, options);
                this.mcpTool.cacheImageAsset(refreshedAsset, {
                    prompt,
                    timestamp: new Date().toISOString(),
                });
                console.log('Refreshed asset generated and cached:', refreshedAsset);
                return refreshedAsset;
            }
        } catch (error) {
            console.error('Error processing narrative event:', error);
            throw error;
        }
    }
}

module.exports = NarrativeService; 