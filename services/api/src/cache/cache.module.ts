import { Module } from '@nestjs/common';
import { CacheHelper } from './cache.helper';
import { CacheService } from './cache.service';

@Module({
  providers: [CacheService, CacheHelper],
  exports: [CacheService, CacheHelper],
})
export class CacheModule {}
