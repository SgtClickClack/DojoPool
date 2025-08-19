import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import type { Prisma } from '@prisma/client';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async findAllAchievements() {
    return this.achievementsService.findAllAchievements();
  }

  @Get('user/:userId')
  async findUserAchievements(@Param('userId') userId: string) {
    return this.achievementsService.findUserAchievements(userId);
  }

  @Post('check/:playerId')
  async checkAndAward(@Param('playerId') playerId: string) {
    return this.achievementsService.checkAndAwardAchievements(playerId);
  }

  @Post()
  async createAchievement(@Body() data: Prisma.AchievementCreateInput) {
    return this.achievementsService.createAchievement(data);
  }

  @Put(':id')
  async updateAchievement(
    @Param('id') id: string,
    @Body() data: Prisma.AchievementUpdateInput
  ) {
    return this.achievementsService.updateAchievement(id, data);
  }

  @Delete(':id')
  async deleteAchievement(@Param('id') id: string) {
    return this.achievementsService.deleteAchievement(id);
  }
}
