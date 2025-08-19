import { Body, Controller, Delete, Param, Patch, Post, Put } from '@nestjs/common';
import { VenuesService } from './venues.service';

class UpdateTableDto {
  status!: string;
  matchId?: string;
}

class CreateTableDto {
  name!: string;
  status?: string;
}

class UpdateTableInfoDto {
  name?: string;
  status?: string;
}

@Controller('v1/venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  // POST /api/v1/venues/:venueId/tables
  @Post(':venueId/tables')
  async createTable(
    @Param('venueId') venueId: string,
    @Body() body: CreateTableDto
  ) {
    return this.venuesService.createTable(venueId, body);
  }

  // PUT /api/v1/venues/:venueId/tables/:tableId
  @Put(':venueId/tables/:tableId')
  async updateTableInfo(
    @Param('venueId') venueId: string,
    @Param('tableId') tableId: string,
    @Body() body: UpdateTableInfoDto
  ) {
    return this.venuesService.updateTableInfo(venueId, tableId, body);
  }

  // DELETE /api/v1/venues/:venueId/tables/:tableId
  @Delete(':venueId/tables/:tableId')
  async deleteTable(
    @Param('venueId') venueId: string,
    @Param('tableId') tableId: string
  ) {
    return this.venuesService.deleteTable(venueId, tableId);
  }

  // PATCH /api/v1/venues/:venueId/tables/:tableId
  @Patch(':venueId/tables/:tableId')
  async updateTable(
    @Param('venueId') venueId: string,
    @Param('tableId') tableId: string,
    @Body() body: UpdateTableDto
  ) {
    const { status, matchId } = body;
    return this.venuesService.updateTableStatus({ venueId, tableId, status, matchId });
  }
}
