declare module 'react-image-crop' {
  import * as React from 'react';

  export type PercentCrop = {
    unit?: '%';
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };

  export type PixelCrop = {
    x: number;
    y: number;
    width: number;
    height: number;
    unit?: 'px';
  };

  export type Crop = PercentCrop | PixelCrop;

  export interface ReactCropProps {
    crop: Crop;
    onChange?: (_crop: Crop) => void;
    onComplete?: (_crop: PixelCrop) => void;
    children?: React.ReactNode;
    circularCrop?: boolean;
    aspect?: number;
    className?: string;
    style?: React.CSSProperties;
  }

  export default class ReactCrop extends React.Component<ReactCropProps> {}
}
