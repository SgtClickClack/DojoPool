import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JournalService } from './journal.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, JournalService],
})
export class UsersModule {}
