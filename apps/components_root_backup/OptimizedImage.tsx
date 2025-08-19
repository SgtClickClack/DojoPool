import React from 'react';

interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  baseUrl: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  baseUrl,
  alt,
  ...props
}) => {
  return <img src={baseUrl} alt={alt} {...props} />;
};

interface ResponsiveImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  imageSizes: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  imageSizes,
  alt,
  ...props
}) => {
  // Compose srcSet for responsive images
  const srcSet = [
    imageSizes.sm ? `${imageSizes.sm} 480w` : null,
    imageSizes.md ? `${imageSizes.md} 768w` : null,
    imageSizes.lg ? `${imageSizes.lg} 1024w` : null,
    imageSizes.xl ? `${imageSizes.xl} 1280w` : null,
  ]
    .filter(Boolean)
    .join(', ');

  // Use largest as fallback src
  const fallbackSrc =
    imageSizes.xl || imageSizes.lg || imageSizes.md || imageSizes.sm || '';

  return <img src={fallbackSrc} srcSet={srcSet} alt={alt} {...props} />;
};
