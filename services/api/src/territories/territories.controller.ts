import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TerritoriesService } from './territories.service';

@Controller('api/v1/territories')
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  @Get()
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
}
