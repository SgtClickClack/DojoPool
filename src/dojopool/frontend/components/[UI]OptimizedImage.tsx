import React, { useEffect, useState } from "react";
import { getBestSupportedFormat } from "../utils/[UTIL]format_detection";

interface OptimizedImageProps {
  baseUrl: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  loading?: "lazy" | "eager";
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface ResponsiveImageProps extends OptimizedImageProps {
  imageSizes: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

/**
 * Component for displaying images with optimal format based on browser support.
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  baseUrl,
  alt,
  width,
  height,
  className,
  loading = "lazy",
  onLoad,
  onError,
}) => {
  const [bestFormat, setBestFormat] = useState<"avif" | "webp" | "jpg">("jpg");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getBestSupportedFormat().then(setBestFormat);
  }, []);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const error = new Error(`Failed to load image: ${baseUrl}`);
    setError(error);
    onError?.(error);
  };

  if (error) {
    return (
      <div className={`image-error ${className || ""}`}>
        <span>Failed to load image</span>
      </div>
    );
  }

  return (
    <picture>
      {bestFormat === "avif" && (
        <source srcSet={`${baseUrl}.avif`} type="image/avif" />
      )}
      {(bestFormat === "avif" || bestFormat === "webp") && (
        <source srcSet={`${baseUrl}.webp`} type="image/webp" />
      )}
      <img
        src={`${baseUrl}.jpg`}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        onLoad={onLoad}
        onError={handleError}
      />
    </picture>
  );
};

/**
 * Component for displaying responsive images with optimal format based on browser support.
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  imageSizes,
  alt,
  className,
  sizes,
  loading = "lazy",
  onLoad,
  onError,
}) => {
  const [bestFormat, setBestFormat] = useState<"avif" | "webp" | "jpg">("jpg");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getBestSupportedFormat().then(setBestFormat);
  }, []);

  const createSrcSet = (ext: string) => {
    return Object.entries(imageSizes)
      .map(([size, url]) => {
        const width = {
          sm: "640w",
          md: "768w",
          lg: "1024w",
          xl: "1280w",
        }[size];
        return `${url}.${ext} ${width}`;
      })
      .join(", ");
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const error = new Error(`Failed to load responsive image`);
    setError(error);
    onError?.(error);
  };

  if (error) {
    return (
      <div className={`image-error ${className || ""}`}>
        <span>Failed to load image</span>
      </div>
    );
  }

  const fallbackSrc = `${imageSizes.md || imageSizes.lg || Object.values(imageSizes)[0]}.jpg`;

  return (
    <picture>
      {bestFormat === "avif" && (
        <source srcSet={createSrcSet("avif")} type="image/avif" sizes={sizes} />
      )}
      {(bestFormat === "avif" || bestFormat === "webp") && (
        <source srcSet={createSrcSet("webp")} type="image/webp" sizes={sizes} />
      )}
      <img
        srcSet={createSrcSet("jpg")}
        src={fallbackSrc}
        alt={alt}
        sizes={sizes}
        className={className}
        loading={loading}
        onLoad={onLoad}
        onError={handleError}
      />
    </picture>
  );
};

export default OptimizedImage;
