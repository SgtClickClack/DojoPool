import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
