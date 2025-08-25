import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VenuesService } from './venues.service';
import { VenueOwnerGuard } from './venue-owner.guard';

@UseGuards(JwtAuthGuard)
@Controller('venues')
export class VenuesController {
  constructor(private service: VenuesService) {}

  // Profile management
  @UseGuards(VenueOwnerGuard)
  @Get('me')
  async getMyVenue(@Request() req: any) {
    return this.service.getMyVenue(req.user.sub);
  }

  @UseGuards(VenueOwnerGuard)
  @Patch('me')
  async updateMyVenue(@Request() req: any, @Body() data: any) {
    return this.service.updateMyVenue(req.user.sub, data);
  }

  // Specials management
  @UseGuards(VenueOwnerGuard)
  @Get('me/specials')
  async listMySpecials(@Request() req: any) {
    return this.service.listMySpecials(req.user.sub);
  }

  @UseGuards(VenueOwnerGuard)
  @Post('me/specials')
  async createMySpecial(@Request() req: any, @Body() data: any) {
    return this.service.createMySpecial(req.user.sub, data);
  }

  @UseGuards(VenueOwnerGuard)
  @Delete('me/specials/:specialId')
  async deleteMySpecial(@Request() req: any, @Param('specialId') specialId: string) {
    return this.service.deleteMySpecial(req.user.sub, specialId);
  }

  // Legacy/other endpoints
  @Patch(':id')
  async update(@Param('id') id: string, @Request() req: any, @Body() data: any) {
    return this.service.updateVenue(id, req.user.sub, data);
  }
}
