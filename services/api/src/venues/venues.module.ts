import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VenueOwnerGuard } from './venue-owner.guard';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';

@Module({
  imports: [PrismaModule, MatchesModule],
  controllers: [VenuesController],
  providers: [VenuesService, VenueOwnerGuard],
})
export class VenuesModule {}
