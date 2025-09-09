import { Body, Controller, Get, Param, Post, Request } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { RewardService } from './reward.service';

@Controller('achievements')
export class AchievementsController {
  constructor(
    private readonly achievementService: AchievementService,
    private readonly rewardService: RewardService
  ) {}

  /**
   * Get all achievements with user's progress
   * GET /api/v1/achievements
   */
  @Get()
  async getUserAchievements(@Request() req: any) {
    const userId = req.user?.id || 'current-user-id'; // Replace with actual auth
    return this.achievementService.getUserAchievements(userId);
  }

  /**
   * Get a specific achievement with user's progress
   * GET /api/v1/achievements/:id
   */
  @Get(':id')
  async getUserAchievement(
    @Param('id') achievementId: string,
    @Request() req: any
  ) {
    const userId = req.user?.id || 'current-user-id'; // Replace with actual auth
    return this.achievementService.getUserAchievement(userId, achievementId);
  }

  /**
   * Claim reward for an unlocked achievement
   * POST /api/v1/achievements/:id/claim-reward
   */
  @Post(':id/claim-reward')
  async claimReward(@Param('id') achievementId: string, @Request() req: any) {
    const userId = req.user?.id || 'current-user-id'; // Replace with actual auth
    return this.rewardService.claimReward(userId, achievementId);
  }

  /**
   * Get user's achievement statistics
   * GET /api/v1/achievements/stats
   */
  @Get('stats')
  async getUserStats(@Request() req: any) {
    const userId = req.user?.id || 'current-user-id'; // Replace with actual auth
    return this.achievementService.getUserStats(userId);
  }

  /**
   * Get achievements by category
   * GET /api/v1/achievements/category/:category
   */
  @Get('category/:category')
  async getAchievementsByCategory(@Param('category') category: string) {
    return this.achievementService.getAchievementsByCategory(category as any);
  }

  /**
   * Get user's claimed rewards
   * GET /api/v1/achievements/rewards/claimed
   */
  @Get('rewards/claimed')
  async getUserClaimedRewards(@Request() req: any) {
    const userId = req.user?.id || 'current-user-id'; // Replace with actual auth
    return this.rewardService.getUserClaimedRewards(userId);
  }

  /**
   * Admin endpoint to create achievement (for seeding/development)
   * POST /api/v1/achievements/create
   */
  @Post('create')
  async createAchievement(@Body() data: any) {
    // In production, this should be protected with admin guards
    return this.achievementService.createAchievement(data);
  }

  /**
   * Admin endpoint to create reward (for seeding/development)
   * POST /api/v1/achievements/rewards/create
   */
  @Post('rewards/create')
  async createReward(@Body() data: any) {
    // In production, this should be protected with admin guards
    return this.rewardService.createReward(data);
  }

  /**
   * Get reward statistics
   * GET /api/v1/achievements/rewards/stats
   */
  @Get('rewards/stats')
  async getRewardStats() {
    return this.rewardService.getRewardStats();
  }
}
