import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class LocationUpdateDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Transform(({ value }) => parseFloat(value))
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  altitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  heading?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  speed?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPrecise?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isSharing?: boolean;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class NearbyPlayersDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Transform(({ value }) => parseFloat(value))
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Transform(({ value }) => parseFloat(value))
  longitude: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(10000)
  @Transform(({ value }) => (value ? parseInt(value) : 1000))
  radius?: number; // in meters, default 1000

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => (value ? parseInt(value) : 50))
  limit?: number; // max players to return, default 50
}

export class LocationResponseDto {
  playerId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  isPrecise: boolean;
  isSharing: boolean;
  lastUpdated: Date;
  expiresAt: Date;
}

export class NearbyPlayerDto {
  playerId: string;
  username: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  distance: number; // in meters
  heading?: number;
  speed?: number;
  lastUpdated: Date;
  avatarUrl?: string;
  clanTag?: string;
}

export class NearbyPlayersResponseDto {
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  players: NearbyPlayerDto[];
  totalCount: number;
  lastUpdated: Date;
}

export class LocationPrivacySettingsDto {
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  locationSharing: boolean;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  preciseLocation: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  @Transform(({ value }) => (value ? parseInt(value) : 24))
  dataRetentionHours?: number; // how long to keep location data

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  showToFriendsOnly?: boolean;
}

export class LocationStatsDto {
  totalActivePlayers: number;
  playersInRadius: number;
  averageAccuracy: number;
  lastCleanup: Date;
  privacyCompliant: boolean;
}
