import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Standard pagination query parameters
 */
export class PaginationQueryDto {
  @ApiProperty({ description: 'Page number', minimum: 1, default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

/**
 * Standard ID parameter validation
 */
export class IdParamDto {
  @ApiProperty({ description: 'Resource ID', format: 'uuid' })
  @IsString()
  @IsUUID()
  id!: string;
}

/**
 * Standard user ID parameter validation
 */
export class UserIdParamDto {
  @ApiProperty({ description: 'User ID', format: 'uuid' })
  @IsString()
  @IsUUID()
  userId!: string;
}

/**
 * Standard search query parameters
 */
export class SearchQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Search term', required: false })
  @IsOptional()
  @IsString()
  search?: string;

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
 * Standard date range query parameters
 */
export class DateRangeQueryDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Start date', format: 'date-time', required: false })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ description: 'End date', format: 'date-time', required: false })
  @IsOptional()
  @IsString()
  endDate?: string;
}

/**
 * Standard bulk operation DTO
 */
export class BulkOperationDto {
  @ApiProperty({ description: 'Array of IDs to operate on', type: [String] })
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  ids!: string[];
}

/**
 * Standard status update DTO
 */
export class StatusUpdateDto {
  @ApiProperty({ description: 'New status' })
  @IsString()
  status!: string;
}

/**
 * Standard boolean toggle DTO
 */
export class ToggleDto {
  @ApiProperty({ description: 'Toggle value' })
  enabled!: boolean;
}
