// This is a stub for the CDN configuration.
// Replace the contents with your actual CDN settings if available.

// CDN configuration based on environment
const cdnConfig = {
  baseUrl: process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.dojopool.com",
  imageOptimizationParams: {
    quality: 80,
    format: "webp",
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
const cdnImageLoader = ({ src, width, quality }) => {
  const params = new URLSearchParams({
    w: width.toString(),
    q: (quality || cdnConfig.imageOptimizationParams.quality).toString(),
    f: cdnConfig.imageOptimizationParams.format,
  });

  return `${cdnConfig.baseUrl}/images${src}?${params.toString()}`;
};

// Generate CDN URL for any asset
const getCdnUrl = (path, type) => {
  return `${cdnConfig.baseUrl}/${type}${path}`;
};

// Generate cache control headers for different asset types
const getCacheControlHeaders = (type) => {
  const { maxAge, sMaxAge, staleWhileRevalidate } = cdnConfig.assetTypes[type];
  return `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
};

module.exports = {
  cdnConfig,
  cdnImageLoader,
  getCdnUrl,
  getCacheControlHeaders,
};
