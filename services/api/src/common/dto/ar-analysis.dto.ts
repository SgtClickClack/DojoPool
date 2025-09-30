import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsArray,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

/**
 * AR Analysis types
 */
export enum ARAnalysisType {
  FACE_DETECTION = 'face_detection',
  OBJECT_DETECTION = 'object_detection',
  POSE_ESTIMATION = 'pose_estimation',
  HAND_TRACKING = 'hand_tracking',
  ENVIRONMENT_MAPPING = 'environment_mapping',
  TEXT_RECOGNITION = 'text_recognition',
  IMAGE_CLASSIFICATION = 'image_classification',
}

/**
 * AR Analysis status
 */
export enum ARAnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * AR Analysis result DTO
 */
export class ARAnalysisResultDto {
  @ApiProperty({ description: 'Analysis ID' })
  id!: string;

  @ApiProperty({ description: 'Analysis type', enum: ARAnalysisType })
  type!: ARAnalysisType;

  @ApiProperty({ description: 'Analysis status', enum: ARAnalysisStatus })
  status!: ARAnalysisStatus;

  @ApiProperty({
    description: 'Analysis confidence score',
    minimum: 0,
    maximum: 1,
  })
  confidence!: number;

  @ApiProperty({ description: 'Analysis results' })
  results!: Record<string, any>;

  @ApiProperty({ description: 'Analysis metadata', required: false })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Analysis processing time in milliseconds' })
  processingTimeMs!: number;

  @ApiProperty({ description: 'Analysis created date' })
  createdAt!: string;

  @ApiProperty({ description: 'Analysis updated date' })
  updatedAt!: string;
}

/**
 * Face detection result DTO
 */
export class FaceDetectionResultDto {
  @ApiProperty({ description: 'Number of faces detected' })
  faceCount!: number;

  @ApiProperty({ description: 'Face detection results', type: [Object] })
  faces!: Array<{
    id: string;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    landmarks?: Array<{
      x: number;
      y: number;
      type: string;
    }>;
    confidence: number;
    age?: number;
    gender?: string;
    emotions?: Record<string, number>;
  }>;
}

/**
 * Object detection result DTO
 */
export class ObjectDetectionResultDto {
  @ApiProperty({ description: 'Number of objects detected' })
  objectCount!: number;

  @ApiProperty({ description: 'Object detection results', type: [Object] })
  objects!: Array<{
    id: string;
    label: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    category?: string;
    attributes?: Record<string, any>;
  }>;
}

/**
 * Pose estimation result DTO
 */
export class PoseEstimationResultDto {
  @ApiProperty({ description: 'Number of poses detected' })
  poseCount!: number;

  @ApiProperty({ description: 'Pose estimation results', type: [Object] })
  poses!: Array<{
    id: string;
    keypoints: Array<{
      x: number;
      y: number;
      confidence: number;
      name: string;
    }>;
    confidence: number;
    skeleton?: Array<{
      from: string;
      to: string;
      confidence: number;
    }>;
  }>;
}

/**
 * Hand tracking result DTO
 */
export class HandTrackingResultDto {
  @ApiProperty({ description: 'Number of hands detected' })
  handCount!: number;

  @ApiProperty({ description: 'Hand tracking results', type: [Object] })
  hands!: Array<{
    id: string;
    landmarks: Array<{
      x: number;
      y: number;
      z?: number;
      confidence: number;
    }>;
    confidence: number;
    handedness?: 'left' | 'right';
    gestures?: Array<{
      name: string;
      confidence: number;
    }>;
  }>;
}

/**
 * Environment mapping result DTO
 */
export class EnvironmentMappingResultDto {
  @ApiProperty({ description: 'Environment mapping results' })
  mapping!: {
    planes?: Array<{
      id: string;
      type: string;
      vertices: Array<{
        x: number;
        y: number;
        z: number;
      }>;
      confidence: number;
    }>;
    anchors?: Array<{
      id: string;
      position: {
        x: number;
        y: number;
        z: number;
      };
      rotation: {
        x: number;
        y: number;
        z: number;
        w: number;
      };
      confidence: number;
    }>;
    lighting?: {
      intensity: number;
      color: {
        r: number;
        g: number;
        b: number;
      };
    };
  };
}

/**
 * Text recognition result DTO
 */
export class TextRecognitionResultDto {
  @ApiProperty({ description: 'Number of text blocks detected' })
  textBlockCount!: number;

  @ApiProperty({ description: 'Text recognition results', type: [Object] })
  textBlocks!: Array<{
    id: string;
    text: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    language?: string;
    orientation?: number;
  }>;
}

/**
 * Image classification result DTO
 */
export class ImageClassificationResultDto {
  @ApiProperty({ description: 'Number of classifications' })
  classificationCount!: number;

  @ApiProperty({ description: 'Image classification results', type: [Object] })
  classifications!: Array<{
    id: string;
    label: string;
    confidence: number;
    category?: string;
    attributes?: Record<string, any>;
  }>;
}

/**
 * AR Analysis request DTO
 */
export class ARAnalysisRequestDto {
  @ApiProperty({ description: 'Analysis type', enum: ARAnalysisType })
  @IsEnum(ARAnalysisType)
  type!: ARAnalysisType;

  @ApiProperty({ description: 'Analysis parameters', required: false })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiProperty({ description: 'Analysis metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Analysis priority',
    required: false,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiProperty({
    description: 'Analysis timeout in seconds',
    required: false,
    minimum: 1,
    maximum: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  timeoutSeconds?: number;
}

/**
 * AR Analysis batch request DTO
 */
export class ARAnalysisBatchRequestDto {
  @ApiProperty({
    description: 'Analysis requests',
    type: [ARAnalysisRequestDto],
  })
  @IsArray()
  requests!: ARAnalysisRequestDto[];

  @ApiProperty({ description: 'Batch processing options', required: false })
  @IsOptional()
  @IsObject()
  options?: {
    parallel?: boolean;
    maxConcurrent?: number;
    timeoutSeconds?: number;
  };

  @ApiProperty({ description: 'Batch metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * AR Analysis filter DTO
 */
export class ARAnalysisFilterDto {
  @ApiProperty({
    description: 'Analysis type filter',
    required: false,
    enum: ARAnalysisType,
  })
  @IsOptional()
  @IsEnum(ARAnalysisType)
  type?: ARAnalysisType;

  @ApiProperty({
    description: 'Analysis status filter',
    required: false,
    enum: ARAnalysisStatus,
  })
  @IsOptional()
  @IsEnum(ARAnalysisStatus)
  status?: ARAnalysisStatus;

  @ApiProperty({ description: 'User ID filter', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Date from filter', required: false })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({ description: 'Date to filter', required: false })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({
    description: 'Page number',
    required: false,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    required: false,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
