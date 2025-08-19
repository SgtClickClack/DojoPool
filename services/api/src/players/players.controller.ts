import { Controller, Get, Param } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('v1/players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.getPlayerById(id);
  }
}
