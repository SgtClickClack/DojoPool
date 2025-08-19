import { Controller, Get } from '@nestjs/common';
import { TerritoriesService } from './territories.service';

@Controller('v1/territories')
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  @Get()
  findAll() {
    return this.territoriesService.findAllTerritories();
  }
}
