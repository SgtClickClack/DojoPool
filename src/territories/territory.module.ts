import { Module } from '@nestjs/common';
import { TerritoryController } from './territory.controller';
import { TerritoryService } from './territory.service';

@Module({
  providers: [TerritoryService],
  controllers: [TerritoryController],
})
export class TerritoryModule {}
