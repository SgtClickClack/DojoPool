import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkillPointCalculationDto } from './dto/skill-calculation.dto';
import {
  PlayerSkillProfileDto,
  SkillProfileDto,
} from './dto/skill-profile.dto';
import { SkillsService } from './skills.service';

@Controller('api/v1/skills')
@UseGuards(JwtAuthGuard)
export class SkillsController {
  private readonly logger = new Logger(SkillsController.name);

  constructor(private readonly skillsService: SkillsService) {}

  @Get('player/:playerId')
  async getPlayerSkillProfile(
    @Param('playerId') playerId: string,
    @Request() req: any
  ): Promise<PlayerSkillProfileDto> {
    // Allow users to view their own profile or public profiles
    if (req.user.id !== playerId) {
      // In a real implementation, you'd check privacy settings here
      this.logger.log(`User ${req.user.id} accessing profile for ${playerId}`);
    }

    try {
      return await this.skillsService.getPlayerSkillProfile(playerId);
    } catch (error) {
      this.logger.error(
        `Failed to get skill profile for player ${playerId}`,
        error
      );
      throw new HttpException(
        'Failed to retrieve skill profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('profile/:profileId')
  async getSkillProfile(
    @Param('profileId') profileId: string,
    @Request() req: any
  ): Promise<SkillProfileDto> {
    try {
      const profile = await this.skillsService.getSkillProfile(profileId);

      // Check if user owns this profile or has permission to view it
      if (profile.id !== req.user.id) {
        // In a real implementation, you'd check ownership here
        this.logger.log(
          `User ${req.user.id} accessing skill profile ${profileId}`
        );
      }

      return profile;
    } catch (error) {
      this.logger.error(`Failed to get skill profile ${profileId}`, error);
      throw new HttpException(
        'Failed to retrieve skill profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('me')
  async getMySkillProfiles(@Request() req: any): Promise<SkillProfileDto[]> {
    try {
      return await this.skillsService.getUserSkillProfiles(req.user.id);
    } catch (error) {
      this.logger.error(
        `Failed to get skill profiles for user ${req.user.id}`,
        error
      );
      throw new HttpException(
        'Failed to retrieve skill profiles',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('calculate/:matchId')
  async calculateSkillPoints(
    @Param('matchId') matchId: string,
    @Request() req: any
  ): Promise<SkillPointCalculationDto> {
    try {
      // Verify the user participated in this match
      const match = await this.skillsService['prisma'].match.findUnique({
        where: { id: matchId },
        select: { playerAId: true, playerBId: true },
      });

      if (!match) {
        throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
      }

      if (match.playerAId !== req.user.id && match.playerBId !== req.user.id) {
        throw new HttpException(
          'Unauthorized to calculate skills for this match',
          HttpStatus.FORBIDDEN
        );
      }

      const playerId =
        match.playerAId === req.user.id ? match.playerAId : match.playerBId;

      return await this.skillsService.calculateSkillPointsForMatch(
        matchId,
        playerId
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to calculate skill points for match ${matchId}`,
        error
      );
      throw new HttpException(
        'Failed to calculate skill points',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('achievements')
  async getSkillsWithAchievements(@Request() req: any) {
    try {
      // This endpoint links skills to achievements for unified progression experience
      const skillProfiles = await this.skillsService.getUserSkillProfiles(
        req.user.id
      );

      // In a real implementation, you'd fetch related achievements here
      // For now, return skills with placeholder achievement data
      return {
        skills: skillProfiles,
        linkedAchievements: [], // TODO: Implement achievement linking
        unifiedProgress: {
          totalSkillPoints: skillProfiles.reduce(
            (sum, skill) => sum + skill.totalPoints,
            0
          ),
          averageProficiency:
            skillProfiles.length > 0
              ? skillProfiles.reduce(
                  (sum, skill) => sum + skill.proficiencyScore,
                  0
                ) / skillProfiles.length
              : 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get skills with achievements for user ${req.user.id}`,
        error
      );
      throw new HttpException(
        'Failed to retrieve skills and achievements',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
