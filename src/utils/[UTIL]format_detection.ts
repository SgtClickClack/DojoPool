/**
 * Utility functions for detecting browser support for different image formats.
 */

/**
 * Check if the browser supports a specific image format.
 * @param format The image format to check (e.g. 'avif', 'webp')
 * @param data The base64-encoded image data for the format
 * @returns Promise that resolves to true if the format is supported, false otherwise
 */
async function supportsFormat(format: string, data: string): Promise<boolean> {
  try {
    const response = await fetch(`data:image/${format};base64,${data}`);
    const blob = await response.blob();
    return createImageBitmap(blob).then(
      () => true,
      () => false
    );
  } catch {
    return false;
  }
}

/**
 * Get the best supported image format for the current browser.
 * @returns Promise that resolves to the best supported format ('avif', 'webp', or 'jpg')
 */
export async function getBestSupportedFormat(): Promise<
  'avif' | 'webp' | 'jpg'
> {
  const formats = [
    {
      format: 'avif',
      data: 'AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=',
    },
    {
      format: 'webp',
      data: 'UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=',
    },
  ];

  for (const { format, data } of formats) {
    if (await supportsFormat(format, data)) {
      return format as 'avif' | 'webp' | 'jpg';
    }
  }
  return 'jpg';
}

/**
 * Get the appropriate source URL for an image based on browser support.
 * @param baseUrl Base URL of the image without extension
 * @returns Promise that resolves to the URL with the appropriate extension
 */
export async function getOptimalImageUrl(baseUrl: string): Promise<string> {
  const format = await getBestSupportedFormat();
  return `${baseUrl}.${format}`;
}

/**
 * Create a picture element with appropriate sources based on format support.
 * @param baseUrl Base URL of the image without extension
 * @param alt Alt text for the image
 * @param className Optional CSS class name
 * @returns HTML string for the picture element
 */
export function createPictureElement(
  baseUrl: string,
  alt: string,
  className?: string
): string {
  return `
        <picture>
            <source
                srcset="${baseUrl}.avif"
                type="image/avif"
            />
            <source
                srcset="${baseUrl}.webp"
                type="image/webp"
            />
            <img
                src="${baseUrl}.jpg"
                alt="${alt}"
                ${className ? `class="${className}"` : ''}
                loading="lazy"
            />
        </picture>
    `;
}

/**
 * Create a responsive picture element with multiple sizes.
 * @param imageSizes Object containing different image sizes and their URLs
 * @param alt Alt text for the image
 * @param sizes Sizes attribute value
 * @param className Optional CSS class name
 * @returns HTML string for the responsive picture element
 */
export function createResponsivePictureElement(
  imageSizes: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  },
  alt: string,
  sizes: string,
  className?: string
): string {
  const createSrcSet = (ext: string) => {
    return Object.entries(imageSizes)
      .map(([size, url]) => {
        const width = {
          sm: '640w',
          md: '768w',
          lg: '1024w',
          xl: '1280w',
        }[size];
        return `${url}.${ext} ${width}`;
      })
      .join(', ');
  };

  return `
        <picture>
            <source
                srcset="${createSrcSet('avif')}"
                type="image/avif"
                sizes="${sizes}"
            />
            <source
                srcset="${createSrcSet('webp')}"
                type="image/webp"
                sizes="${sizes}"
            />
            <img
                srcset="${createSrcSet('jpg')}"
                src="${imageSizes.md || imageSizes.lg || Object.values(imageSizes)[0]}.jpg"
                alt="${alt}"
                sizes="${sizes}"
                ${className ? `class="${className}"` : ''}
                loading="lazy"
            />
        </picture>
    `;
}

/**
 * Detect the format of an image URL.
 * @param url The image URL to detect the format for
 * @returns The detected format ('avif', 'webp', or 'jpg') or undefined if unknown
 */
export function detectFormat(url: string): 'avif' | 'webp' | 'jpg' | undefined {
  const ext = url.split('.').pop();
  // Fix type assignment for format detection
  const detectedFormat = (['avif', 'webp', 'jpg'] as const).find(
    (format): format is 'avif' | 'webp' | 'jpg' => format === ext
  );
  if (detectedFormat) {
    return detectedFormat;
  }
  return undefined;
}
