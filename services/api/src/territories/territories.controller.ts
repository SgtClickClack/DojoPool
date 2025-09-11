import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CacheInvalidate,
  MapCache,
  TerritoryCache,
} from '../cache/edge-cache.decorator';
import { TerritoriesService } from './territories.service';

@Controller('api/v1/territories')
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  @Get()
  @TerritoryCache()
  findAll() {
    return this.territoriesService.findAllTerritories();
  }

  @Get('clan/:clanId')
  findByClan(@Param('clanId') clanId: string) {
    return this.territoriesService.getTerritoriesByClan(clanId);
  }

  @Get('venue/:venueId')
  findByVenue(@Param('venueId') venueId: string) {
    return this.territoriesService.getTerritoriesByVenue(venueId);
  }

  // Strategic map endpoints
  @Get('/map')
  @MapCache()
  getStrategicMap(@Query('bbox') bbox?: string) {
    // bbox optional for viewport filtering: "minLng,minLat,maxLng,maxLat"
    return this.territoriesService.getStrategicMap(bbox);
  }

  @Post('/:territoryId/scout')
  scoutTerritory(
    @Param('territoryId') territoryId: string,
    @Body() body: { playerId: string }
  ) {
    return this.territoriesService.scoutTerritory(territoryId, body.playerId);
  }

  @Post('/:territoryId/manage')
  @CacheInvalidate(['territories:*', 'territories:map', 'strategic-map:*'])
  manageTerritory(
    @Param('territoryId') territoryId: string,
    @Body()
    body: {
      action: 'upgrade_defense' | 'allocate_resources' | 'transfer_ownership';
      payload?: any;
    }
  ) {
    return this.territoriesService.manageTerritory(
      territoryId,
      body.action,
      body.payload
    );
  }

  @Post('/claim')
  @UseGuards(JwtAuthGuard)
  @CacheInvalidate(['territories:*', 'territories:map', 'strategic-map:*'])
  async claimTerritory(
    @Body() body: { territoryId: string; playerId: string }
  ) {
    return this.territoriesService.claimTerritory(
      body.territoryId,
      body.playerId
    );
  }

  @Post('/challenge')
  @UseGuards(JwtAuthGuard)
  @CacheInvalidate(['territories:*', 'territories:map', 'strategic-map:*'])
  async challengeTerritory(
    @Body() body: { territoryId: string; challengerId: string }
  ) {
    return this.territoriesService.challengeTerritory(
      body.territoryId,
      body.challengerId
    );
  }

  @Post('/process-decay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async processTerritoryDecay() {
    return this.territoriesService.processTerritoryDecay();
  }

  @Post('/resolve-expired-contests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MODERATOR')
  async resolveExpiredContests() {
    return this.territoriesService.resolveExpiredContests();
  }
}
