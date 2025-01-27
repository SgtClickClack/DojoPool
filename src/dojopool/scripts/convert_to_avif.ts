// Generated type definitions

function convertToAvif(inputPath: string, outputPath: string, quality: number = 80, speed: number = 4): Promise<void> {
    // Implementation
}

// Type imports


const sharp: any = require('sharp');
const path: any = require('path');
const fs: any = require('fs').promises;

async function convertToAvif(inputPath, outputPath, quality = 80, speed = 4) {
    try {
        await sharp(inputPath)
            .avif({
                quality: quality,
                speed: speed
            })
            .toFile(outputPath);

        console.log(`Successfully converted ${inputPath} to AVIF`);
    } catch (error) {
        console.error(`Error converting ${inputPath} to AVIF:`, error);
        process.exit(1);
    }
}

// Get command line arguments
const [, , inputPath, outputPath, quality = 80, speed = 4] = process.argv;

if (!inputPath || !outputPath) {
    console.error('Usage: node convert_to_avif.js <input_path> <output_path> [quality] [speed]');
    process.exit(1);
}

convertToAvif(inputPath, outputPath, parseInt(quality), parseInt(speed)); 