import sharp from "sharp";
import { execSync } from "child_process";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

interface AssetConfig {
  name: string;
  width: number;
  height: number;
  format: "png" | "jpg";
  quality?: number;
}

const ASSETS_DIR = join(process.cwd(), "public", "app-store-assets");
const SOURCE_IMAGE = join(process.cwd(), "public", "logo.png");

const ASSET_CONFIGS: AssetConfig[] = [
  // App Store
  { name: "app-store-1024x1024", width: 1024, height: 1024, format: "png" },
  { name: "app-store-2048x2048", width: 2048, height: 2048, format: "png" },

  // App Store Screenshots
  { name: "screenshot-iphone-6.5", width: 1242, height: 2688, format: "png" },
  { name: "screenshot-iphone-5.5", width: 1242, height: 2208, format: "png" },
  { name: "screenshot-ipad-12.9", width: 2048, height: 2732, format: "png" },

  // App Store Preview
  { name: "preview-iphone-6.5", width: 886, height: 1920, format: "png" },
  { name: "preview-iphone-5.5", width: 886, height: 1920, format: "png" },
  { name: "preview-ipad-12.9", width: 2048, height: 2732, format: "png" },
];

async function generateAssets() {
  try {
    // Create assets directory if it doesn't exist
    if (!existsSync(ASSETS_DIR)) {
      mkdirSync(ASSETS_DIR, { recursive: true });
    }

    // Check if source image exists
    if (!existsSync(SOURCE_IMAGE)) {
      throw new Error(`Source image not found at ${SOURCE_IMAGE}`);
    }

    // Generate each asset
    for (const config of ASSET_CONFIGS) {
      const outputPath = join(ASSETS_DIR, `${config.name}.${config.format}`);

      await sharp(SOURCE_IMAGE)
        .resize(config.width, config.height, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .toFormat(config.format, { quality: config.quality || 100 })
        .toFile(outputPath);

      console.log(`Generated ${outputPath}`);
    }

    console.log("All app store assets generated successfully!");
  } catch (error) {
    console.error("Error generating app store assets:", error);
    process.exit(1);
  }
}

// Run the script
generateAssets();
