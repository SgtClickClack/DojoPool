import { type ImageLoaderProps } from 'next/image';

interface CDNConfig {
  baseUrl: string;
  imageOptimizationParams: {
    quality: number;
    format: 'webp' | 'avif' | 'original';
    width: number;
  };
  assetTypes: {
    [key: string]: {
      maxAge: number;
      sMaxAge: number;
      staleWhileRevalidate: number;
    };
  };
}

// CDN configuration based on environment
export const cdnConfig: CDNConfig = {
  baseUrl: process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.dojopool.com',
  imageOptimizationParams: {
    quality: 80,
    format: 'webp',
    width: 1920,
  },
  assetTypes: {
    images: {
      maxAge: 86400, // 24 hours
      sMaxAge: 31536000, // 1 year
      staleWhileRevalidate: 604800, // 1 week
    },
    static: {
      maxAge: 31536000, // 1 year
      sMaxAge: 31536000, // 1 year
      staleWhileRevalidate: 86400, // 24 hours
    },
    fonts: {
      maxAge: 31536000, // 1 year
      sMaxAge: 31536000, // 1 year
      staleWhileRevalidate: 0,
    },
  },
};

// Custom image loader for Next.js Image component
export const cdnImageLoader = ({
  src,
  width,
  quality,
}: ImageLoaderProps): string => {
  const params = new URLSearchParams({
    w: width.toString(),
    q: (quality || cdnConfig.imageOptimizationParams.quality).toString(),
    f: cdnConfig.imageOptimizationParams.format,
  });

  return `${cdnConfig.baseUrl}/images${src}?${params.toString()}`;
};

// Generate CDN URL for any asset
export const getCdnUrl = (
  path: string,
  type: keyof typeof cdnConfig.assetTypes
): string => {
  return `${cdnConfig.baseUrl}/${type}${path}`;
};

// Generate cache control headers for different asset types
export const getCacheControlHeaders = (
  type: keyof typeof cdnConfig.assetTypes
): string => {
  const { maxAge, sMaxAge, staleWhileRevalidate } = cdnConfig.assetTypes[type];
  return `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
};

// Asset preload helper
export const generatePreloadTags = (
  assets: { path: string; type: string }[]
): string => {
  return assets
    .map(({ path, type }) => {
      const url = getCdnUrl(path, type as keyof typeof cdnConfig.assetTypes);
      switch (type) {
        case 'fonts':
          return `<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin>`;
        case 'images':
          return `<link rel="preload" href="${url}" as="image">`;
        default:
          return `<link rel="preload" href="${url}" as="fetch" crossorigin>`;
      }
    })
    .join('\n');
};

// Image optimization middleware
export const optimizeImage = async (
  src: string,
  options: Partial<typeof cdnConfig.imageOptimizationParams>
): Promise<string> => {
  const params = new URLSearchParams({
    url: src,
    ...cdnConfig.imageOptimizationParams,
    ...options,
  });

  const response = await fetch(
    `${cdnConfig.baseUrl}/optimize?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error('Image optimization failed');
  }

  return response.url;
};
