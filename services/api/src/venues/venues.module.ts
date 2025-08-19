import { Module, forwardRef } from '@nestjs/common';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [PrismaModule, forwardRef(() => MatchesModule)],
  controllers: [VenuesController],
  providers: [VenuesService],
})
export class VenuesModule {}
