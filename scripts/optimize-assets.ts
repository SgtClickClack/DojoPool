import { promises as fs } from 'fs';
import { join, extname } from 'path';
import sharp from 'sharp';
import glob from 'glob-promise';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { cdnConfig } from '../src/config/cdn';

// Initialize S3 client (assuming AWS S3 as CDN storage)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

interface AssetOptimizationOptions {
  quality?: number;
  width?: number;
  format?: 'webp' | 'avif' | 'original';
}

async function optimizeImage(
  inputPath: string,
  options: AssetOptimizationOptions = {}
): Promise<Buffer> {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Resize if width is specified and image is larger
  if (options.width && metadata.width && metadata.width > options.width) {
    image.resize(options.width);
  }

  // Convert to specified format
  switch (options.format) {
    case 'webp':
      return image.webp({ quality: options.quality || 80 }).toBuffer();
    case 'avif':
      return image.avif({ quality: options.quality || 80 }).toBuffer();
    default:
      return image.toBuffer();
  }
}

async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET || 'dojopool-cdn',
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: cdnConfig.assetTypes.images.maxAge.toString(),
  });

  await s3Client.send(command);
  return `${cdnConfig.baseUrl}/${key}`;
}

async function processAssets() {
  try {
    console.log('Starting asset optimization and upload...');

    // Process images
    const imageFiles = await glob('public/**/*.{jpg,jpeg,png,gif}');
    console.log(`Found ${imageFiles.length} images to process`);

    for (const file of imageFiles) {
      const relativePath = file.replace('public/', '');
      console.log(`Processing ${relativePath}...`);

      // Create WebP version
      const webpBuffer = await optimizeImage(file, {
        format: 'webp',
        quality: cdnConfig.imageOptimizationParams.quality,
        width: cdnConfig.imageOptimizationParams.width,
      });
      await uploadToS3(
        webpBuffer,
        `images/${relativePath}.webp`,
        'image/webp'
      );

      // Create AVIF version
      const avifBuffer = await optimizeImage(file, {
        format: 'avif',
        quality: cdnConfig.imageOptimizationParams.quality,
        width: cdnConfig.imageOptimizationParams.width,
      });
      await uploadToS3(
        avifBuffer,
        `images/${relativePath}.avif`,
        'image/avif'
      );

      // Upload original (optimized)
      const originalBuffer = await optimizeImage(file);
      await uploadToS3(
        originalBuffer,
        `images/${relativePath}`,
        `image/${extname(file).substring(1)}`
      );
    }

    // Process static assets (fonts, etc.)
    const staticFiles = await glob('public/static/**/*.*');
    console.log(`Found ${staticFiles.length} static files to process`);

    for (const file of staticFiles) {
      const relativePath = file.replace('public/', '');
      console.log(`Processing ${relativePath}...`);

      const buffer = await fs.readFile(file);
      await uploadToS3(
        buffer,
        relativePath,
        getContentType(file)
      );
    }

    console.log('Asset optimization and upload completed successfully!');
  } catch (error) {
    console.error('Error processing assets:', error);
    process.exit(1);
  }
}

function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.json': 'application/json',
  };

  return contentTypes[ext] || 'application/octet-stream';
}

// Generate asset manifest
async function generateManifest() {
  const manifest = {
    images: {},
    static: {},
    timestamp: new Date().toISOString(),
  };

  const allFiles = await glob('public/**/*.*');
  for (const file of allFiles) {
    const relativePath = file.replace('public/', '');
    const stats = await fs.stat(file);
    const hash = require('crypto')
      .createHash('md5')
      .update(await fs.readFile(file))
      .digest('hex');

    if (file.match(/\.(jpg|jpeg|png|gif)$/i)) {
      manifest.images[relativePath] = {
        original: `${cdnConfig.baseUrl}/images/${relativePath}`,
        webp: `${cdnConfig.baseUrl}/images/${relativePath}.webp`,
        avif: `${cdnConfig.baseUrl}/images/${relativePath}.avif`,
        size: stats.size,
        hash,
      };
    } else {
      manifest.static[relativePath] = {
        url: `${cdnConfig.baseUrl}/${relativePath}`,
        size: stats.size,
        hash,
      };
    }
  }

  await fs.writeFile(
    'public/asset-manifest.json',
    JSON.stringify(manifest, null, 2)
  );
  console.log('Asset manifest generated successfully!');
}

// Run optimization if executed directly
if (require.main === module) {
  processAssets()
    .then(generateManifest)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Asset processing failed:', error);
      process.exit(1);
    });
} 