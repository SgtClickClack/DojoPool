import { Controller, Get, Param } from '@nestjs/common';
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
}
