import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum AssetBundleType {
  AVATAR_ITEMS = 'AVATAR_ITEMS',
  THEME = 'THEME',
  SOUNDS = 'SOUNDS',
  EFFECTS = 'EFFECTS',
}

export class CreateAssetBundleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(AssetBundleType)
  bundleType: string;

  @IsNotEmpty()
  @IsString()
  version: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;

  @IsOptional()
  @IsString()
  checksum?: string;

  @IsOptional()
  @IsString()
  minAppVersion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetPlatform?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependencies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
