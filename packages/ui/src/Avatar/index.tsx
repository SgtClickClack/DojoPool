import clsx from 'clsx';
import React from 'react';

/**
 * Avatar component
 *
 * Circular image with subtle border. Size is specified in pixels.
 */
export interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
  src: string;
}

export const Avatar: React.FC<AvatarProps> = ({ size = 40, className, src, alt = '', ...props }) => {
  const dimension = { width: size, height: size } as const;
  return (
    <img
      src={src}
      alt={alt}
      style={dimension}
      className={clsx(
        'inline-block rounded-full border border-slate-700 object-cover bg-slate-800',
        'shadow-sm shadow-black/20',
        className
      )}
      {...props}
    />
  );
};

Avatar.displayName = 'Avatar';


