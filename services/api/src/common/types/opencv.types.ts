/**
 * TypeScript interfaces for OpenCV.js to replace 'any' type assertions
 */

export interface OpenCVMat {
  rows: number;
  cols: number;
  data32S: Int32Array;
  data32F: Float32Array;
  delete(): void;
}

export interface OpenCVMatVector {
  size(): number;
  get(index: number): OpenCVMat;
  delete(): void;
}

export interface OpenCVSize {
  width: number;
  height: number;
}

export interface OpenCVPoint {
  x: number;
  y: number;
}

export interface OpenCVModule {
  Mat: new () => OpenCVMat;
  MatVector: new () => OpenCVMatVector;
  Size: new (width: number, height: number) => OpenCVSize;
  Point: new (x: number, y: number) => OpenCVPoint;
  COLOR_RGBA2GRAY: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  HOUGH_GRADIENT: number;
  matFromImageData(imageData: ImageData): OpenCVMat;
  cvtColor(src: OpenCVMat, dst: OpenCVMat, code: number): void;
  GaussianBlur(
    src: OpenCVMat,
    dst: OpenCVMat,
    ksize: OpenCVSize,
    sigmaX: number
  ): void;
  Canny(
    image: OpenCVMat,
    edges: OpenCVMat,
    threshold1: number,
    threshold2: number
  ): void;
  findContours(
    image: OpenCVMat,
    contours: OpenCVMatVector,
    hierarchy: OpenCVMat,
    mode: number,
    method: number
  ): void;
  arcLength(contour: OpenCVMat, closed: boolean): number;
  approxPolyDP(
    contour: OpenCVMat,
    approxCurve: OpenCVMat,
    epsilon: number,
    closed: boolean
  ): void;
  contourArea(contour: OpenCVMat): number;
  HoughCircles(
    image: OpenCVMat,
    circles: OpenCVMat,
    method: number,
    dp: number,
    minDist: number,
    param1: number,
    param2: number,
    minRadius: number,
    maxRadius: number
  ): void;
  onRuntimeInitialized?: () => void;
}

export interface ImageData {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface DecodedImage {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface TableAnalysisResult {
  tableBounds: Array<{ x: number; y: number }>;
  balls: Array<{ position: { x: number; y: number }; radius: number }>;
  meta?: {
    warning?: string;
    error?: string;
  };
}

export interface BallDetection {
  position: { x: number; y: number };
  radius: number;
}

export interface TableBounds {
  points: Array<{ x: number; y: number }>;
  area: number;
}
