import { Body, Controller, Delete, Param, Patch, Post, Put, UseGuards, Request } from '@nestjs/common';
import { VenuesService } from './venues.service';
import { CreateTableDto, UpdateTableDto, UpdateTableInfoDto } from './dto/table.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckInDto } from './dto/check-in.dto';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  // POST /api/v1/venues/:venueId/tables
  @Post(':venueId/tables')
  async createTable(
    @Param('venueId') venueId: string,
    @Body() body: CreateTableDto
  ) {
    const payload = { name: body.name, status: body.status };
    return this.venuesService.createTable(venueId, payload);
  }

  // PUT /api/v1/venues/:venueId/tables/:tableId
  @Put(':venueId/tables/:tableId')
  async updateTableInfo(
    @Param('venueId') venueId: string,
    @Param('tableId') tableId: string,
    @Body() body: UpdateTableInfoDto
  ) {
    const payload = { name: body.name, status: body.status };
    return this.venuesService.updateTableInfo(venueId, tableId, payload);
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

  // POST /api/v1/venues/:venueId/check-in
  @UseGuards(JwtAuthGuard)
  @Post(':venueId/check-in')
  async checkIn(
    @Param('venueId') venueId: string,
    @Body() body: CheckInDto,
    @Request() req: any
  ) {
    const userId = req?.user?.userId ?? req?.user?.sub ?? req?.user?.id;
    return this.venuesService.checkIn({ venueId, userId, lat: body.lat, lng: body.lng });
  }
}
