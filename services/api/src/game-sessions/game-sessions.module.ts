import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GameSessionsController } from './game-sessions.controller';
import { GameSessionsService } from './game-sessions.service';

@Module({
  imports: [PrismaModule],
  controllers: [GameSessionsController],
  providers: [GameSessionsService],
  exports: [GameSessionsService],
})
export class GameSessionsModule {}
