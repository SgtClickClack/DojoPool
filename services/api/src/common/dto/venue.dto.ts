import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsUUID, IsArray, IsObject, MinLength, MaxLength, Min, Max } from 'class-validator';

/**
 * Venue status enumeration
 */
export enum VenueStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed',
}

/**
 * Venue type enumeration
 */
export enum VenueType {
  POOL_HALL = 'pool_hall',
  SPORTS_BAR = 'sports_bar',
  RECREATION_CENTER = 'recreation_center',
  PRIVATE_CLUB = 'private_club',
  CASINO = 'casino',
  OTHER = 'other',
}

/**
 * Standard venue response DTO
 */
export class VenueResponseDto {
  @ApiProperty({ description: 'Venue ID', format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Venue name' })
  name!: string;

  @ApiProperty({ description: 'Venue description', required: false })
  description?: string;

  @ApiProperty({ description: 'Venue type', enum: VenueType })
  type!: VenueType;

  @ApiProperty({ description: 'Venue status', enum: VenueStatus })
  status!: VenueStatus;

  @ApiProperty({ description: 'Street address' })
  street!: string;

  @ApiProperty({ description: 'City' })
  city!: string;

  @ApiProperty({ description: 'State/Province' })
  state!: string;

  @ApiProperty({ description: 'Country' })
  country!: string;

  @ApiProperty({ description: 'Postal code' })
  postalCode!: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  latitude!: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  longitude!: number;

  @ApiProperty({ description: 'Phone number', required: false })
  phone?: string;

  @ApiProperty({ description: 'Email address', required: false })
  email?: string;

  @ApiProperty({ description: 'Website URL', required: false })
  website?: string;

  @ApiProperty({ description: 'Venue image URL', required: false })
  imageUrl?: string;

  @ApiProperty({ description: 'Owner ID', format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ description: 'Is venue verified' })
  isVerified!: boolean;

  @ApiProperty({ description: 'Venue rating', minimum: 0, maximum: 5 })
  rating!: number;

  @ApiProperty({ description: 'Number of reviews' })
  reviewCount!: number;

  @ApiProperty({ description: 'Operating hours', required: false })
  operatingHours?: Record<string, string>;

  @ApiProperty({ description: 'Amenities', type: [String], required: false })
  amenities?: string[];

  @ApiProperty({ description: 'Creation date', format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ description: 'Last update date', format: 'date-time' })
  updatedAt!: string;
}

/**
 * Venue creation DTO
 */
export class CreateVenueDto {
  @ApiProperty({ description: 'Venue name', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'Venue description', required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Venue type', enum: VenueType })
  @IsEnum(VenueType)
  type!: VenueType;

  @ApiProperty({ description: 'Street address', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  street!: string;

  @ApiProperty({ description: 'City', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ description: 'State/Province', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  state!: string;

  @ApiProperty({ description: 'Country', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  country!: string;

  @ApiProperty({ description: 'Postal code', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  postalCode!: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @IsNumber()
  longitude!: number;

  @ApiProperty({ description: 'Phone number', required: false, maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Website URL', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Venue image URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'Operating hours', required: false })
  @IsOptional()
  @IsObject()
  operatingHours?: Record<string, string>;

  @ApiProperty({ description: 'Amenities', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}

/**
 * Venue update DTO
 */
export class UpdateVenueDto {
  @ApiProperty({ description: 'Venue name', required: false, minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ description: 'Venue description', required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Venue type', enum: VenueType, required: false })
  @IsOptional()
  @IsEnum(VenueType)
  type?: VenueType;

  @ApiProperty({ description: 'Venue status', enum: VenueStatus, required: false })
  @IsOptional()
  @IsEnum(VenueStatus)
  status?: VenueStatus;

  @ApiProperty({ description: 'Street address', required: false, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiProperty({ description: 'City', required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({ description: 'State/Province', required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty({ description: 'Country', required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({ description: 'Postal code', required: false, maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({ description: 'Latitude coordinate', required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate', required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Phone number', required: false, maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'Website URL', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Venue image URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'Operating hours', required: false })
  @IsOptional()
  @IsObject()
  operatingHours?: Record<string, string>;

  @ApiProperty({ description: 'Amenities', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}

/**
 * Venue search query DTO
 */
export class VenueSearchQueryDto {
  @ApiProperty({ description: 'Page number', minimum: 1, default: 1, required: false })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', minimum: 1, maximum: 100, default: 20, required: false })
  @IsOptional()
  pageSize?: number = 20;

  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by type', enum: VenueType, required: false })
  @IsOptional()
  @IsEnum(VenueType)
  type?: VenueType;

  @ApiProperty({ description: 'Filter by status', enum: VenueStatus, required: false })
  @IsOptional()
  @IsEnum(VenueStatus)
  status?: VenueStatus;

  @ApiProperty({ description: 'Filter by city', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'Filter by state', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Filter by country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Minimum rating', minimum: 0, maximum: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiProperty({ description: 'Filter by verified venues only', required: false })
  @IsOptional()
  @IsBoolean()
  verifiedOnly?: boolean;

  @ApiProperty({ description: 'Sort field', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'], required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

/**
 * Venue statistics DTO
 */
export class VenueStatsDto {
  @ApiProperty({ description: 'Total venues' })
  totalVenues!: number;

  @ApiProperty({ description: 'Active venues' })
  activeVenues!: number;

  @ApiProperty({ description: 'Verified venues' })
  verifiedVenues!: number;

  @ApiProperty({ description: 'Venues by type' })
  venuesByType!: Record<VenueType, number>;

  @ApiProperty({ description: 'Venues by status' })
  venuesByStatus!: Record<VenueStatus, number>;

  @ApiProperty({ description: 'Average rating' })
  averageRating!: number;

  @ApiProperty({ description: 'Total reviews' })
  totalReviews!: number;
}
