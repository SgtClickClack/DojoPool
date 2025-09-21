import sharp from 'sharp';

interface AppIconSizes {
  [key: string]: number;
}

const APP_ICON_SIZES: AppIconSizes = {
  '20x20': 20,
  '29x29': 29,
  '40x40': 40,
  '58x58': 58,
  '60x60': 60,
  '76x76': 76,
  '80x80': 80,
  '87x87': 87,
  '120x120': 120,
  '152x152': 152,
  '167x167': 167,
  '180x180': 180,
  '1024x1024': 1024,
};

export async function generateAppIcons(
  sourceImagePath: string,
  outputDir: string
): Promise<void> {
  try {
    const sourceImage = sharp(sourceImagePath);

    // Generate icons for each size
    for (const [sizeName, size] of Object.entries(APP_ICON_SIZES)) {
      await sourceImage
        .resize(size, size)
        .toFile(`${outputDir}/AppIcon-${sizeName}.png`);
    }

    console.log('App icons generated successfully');
  } catch (error) {
    console.error('Error generating app icons:', error);
    throw error;
  }
}

export async function generateScreenshot(
  sourceImagePath: string,
  outputPath: string,
  deviceType: 'iphone' | 'ipad'
): Promise<void> {
  try {
    const dimensions =
      deviceType === 'iphone'
        ? { width: 1242, height: 2688 }
        : { width: 2048, height: 2732 };

    await sharp(sourceImagePath)
      .resize(dimensions.width, dimensions.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toFile(outputPath);

    console.log(`Screenshot generated successfully for ${deviceType}`);
  } catch (error) {
    console.error('Error generating screenshot:', error);
    throw error;
  }
}

export async function generateAppPreviewVideo(
  sourceVideoPath: string,
  outputPath: string,
  _duration: number = 30
): Promise<void> {
  try {
    // This would use ffmpeg in a real implementation
    console.log('App preview video generation would be implemented here');
    // Placeholder for actual video processing logic
  } catch (error) {
    console.error('Error generating app preview video:', error);
    throw error;
  }
}
