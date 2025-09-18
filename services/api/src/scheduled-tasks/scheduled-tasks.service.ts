import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(private readonly authService: AuthService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens() {
    this.logger.log('Starting cleanup of expired refresh tokens...');
    try {
      const cleanedCount = await this.authService.cleanupExpiredTokens();
      this.logger.log(`Successfully cleaned up ${cleanedCount} expired refresh tokens`);
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async dailyMaintenance() {
    this.logger.log('Starting daily maintenance tasks...');
    try {
      // Clean up expired tokens
      const cleanedCount = await this.authService.cleanupExpiredTokens();
      this.logger.log(`Daily cleanup: removed ${cleanedCount} expired refresh tokens`);
      
      // Add other daily maintenance tasks here
      this.logger.log('Daily maintenance completed successfully');
    } catch (error) {
      this.logger.error('Daily maintenance failed:', error);
    }
  }
}
