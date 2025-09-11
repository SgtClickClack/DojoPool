/**
 * DojoPool Physics Module
 *
 * NestJS module that provides physics simulation capabilities
 * through the native C++ addon integration.
 */

import { Module } from '@nestjs/common';
import { PhysicsController } from './physics.controller';
import { PhysicsService } from './physics.service';

@Module({
  controllers: [PhysicsController],
  providers: [PhysicsService],
  exports: [PhysicsService],
})
export class PhysicsModule {}
