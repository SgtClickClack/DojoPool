import React from "react";
import { OptimizedImage, ResponsiveImage } from "./OptimizedImage";

interface ImageGalleryProps {
  images: Array<{
    id: string;
    title: string;
    baseUrl: string;
    sizes: {
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
    };
  }>;
}

/**
 * Example gallery component demonstrating the usage of OptimizedImage and ResponsiveImage
 */
export const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  return (
    <div className="image-gallery">
      <h2>Simple Images</h2>
      <div className="image-grid">
        {images.map((image) => (
          <OptimizedImage
            key={`simple-${image.id}`}
            baseUrl={image.baseUrl}
            alt={image.title}
            width={300}
            height={200}
            className="gallery-image"
            loading="lazy"
            onError={(error) =>
              console.error(`Failed to load image: ${image.title}`, error)
            }
          />
        ))}
      </div>

      <h2>Responsive Images</h2>
      <div className="responsive-grid">
        {images.map((image) => (
          <ResponsiveImage
            key={`responsive-${image.id}`}
            imageSizes={image.sizes}
            alt={image.title}
            className="responsive-image"
            sizes="(min-width: 1280px) 1280px, (min-width: 1024px) 1024px, (min-width: 768px) 768px, 100vw"
            loading="lazy"
            onError={(error) =>
              console.error(`Failed to load image: ${image.title}`, error)
            }
          />
        ))}
      </div>

      <style jsx>{`
        .image-gallery {
          padding: 2rem;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }

        .gallery-image {
          width: 100%;
          height: auto;
          object-fit: cover;
          border-radius: 8px;
          transition: transform 0.2s ease-in-out;
        }

        .gallery-image:hover {
          transform: scale(1.05);
        }

        .responsive-grid {
          display: grid;
          gap: 2rem;
          margin: 1rem 0;
        }

        .responsive-image {
          width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        @media (min-width: 768px) {
          .responsive-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .responsive-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default ImageGallery;
