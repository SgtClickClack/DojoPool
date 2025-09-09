import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SkillCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  MatchAnalysisContextDto,
  PlayerSkillProfileDto,
  SkillCategoryProgressDto,
  SkillPointAwardDto,
  SkillPointCalculationDto,
  SkillPointLogDto,
  SkillProfileDto,
  SkillProgressDto,
} from './dto/skill-profile.dto';

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  // Skill point multipliers based on match outcome and performance
  private readonly WIN_MULTIPLIER = 1.5;
  private readonly LOSS_MULTIPLIER = 0.75;
  private readonly PERFECT_MULTIPLIER = 2.0;

  // Base points for different skill categories
  private readonly SKILL_BASE_POINTS = {
    [SkillCategory.AIMING_ACCURACY]: 15,
    [SkillCategory.POSITIONING]: 12,
    [SkillCategory.DEFENSIVE_PLAY]: 14,
    [SkillCategory.OFFENSIVE_STRATEGY]: 16,
    [SkillCategory.BANKING_SHOTS]: 18,
    [SkillCategory.BREAK_SHOTS]: 20,
    [SkillCategory.SAFETY_PLAY]: 13,
    [SkillCategory.CONSISTENCY]: 11,
    [SkillCategory.MENTAL_GAME]: 10,
    [SkillCategory.PHYSICAL_STAMINA]: 9,
  };

  constructor(private readonly prisma: PrismaService) {}

  async getPlayerSkillProfile(
    playerId: string
  ): Promise<PlayerSkillProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: playerId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('Player not found');
    }

    const skillProfiles = await this.prisma.skillProfile.findMany({
      where: { userId: playerId },
      include: { skill: true },
      orderBy: { totalPoints: 'desc' },
    });

    const recentActivity = await this.prisma.skillPointLog.findMany({
      where: { skillProfile: { userId: playerId } },
      include: { skillProfile: { include: { skill: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const skillCategories = await this.getSkillCategoryProgress(playerId);

    const topSkills = skillProfiles.slice(0, 5).map(this.mapToSkillProgress);
    const totalPoints = skillProfiles.reduce(
      (sum, profile) => sum + profile.totalPoints,
      0
    );
    const averageLevel =
      skillProfiles.length > 0
        ? Math.round(
            skillProfiles.reduce(
              (sum, profile) => sum + profile.currentLevel,
              0
            ) / skillProfiles.length
          )
        : 0;

    return {
      playerId,
      username: user.username,
      totalSkills: skillProfiles.length,
      averageLevel,
      totalPoints,
      topSkills,
      recentActivity: recentActivity.map(this.mapToSkillPointLog),
      skillCategories,
    };
  }

  async getSkillProfile(skillProfileId: string): Promise<SkillProfileDto> {
    const profile = await this.prisma.skillProfile.findUnique({
      where: { id: skillProfileId },
      include: { skill: true },
    });

    if (!profile) {
      throw new NotFoundException('Skill profile not found');
    }

    return this.mapToSkillProfileDto(profile);
  }

  async getUserSkillProfiles(userId: string): Promise<SkillProfileDto[]> {
    const profiles = await this.prisma.skillProfile.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { skill: { category: 'asc' } },
    });

    return profiles.map(this.mapToSkillProfileDto);
  }

  async calculateSkillPointsForMatch(
    matchId: string,
    playerId: string
  ): Promise<SkillPointCalculationDto> {
    // Get match analysis
    const matchAnalysis = await this.prisma.matchAnalysis.findUnique({
      where: { matchId },
      include: {
        match: {
          include: {
            playerA: { select: { id: true, username: true } },
            playerB: { select: { id: true, username: true } },
            venue: { select: { name: true } },
          },
        },
      },
    });

    if (!matchAnalysis) {
      throw new NotFoundException('Match analysis not found');
    }

    // Determine if player won
    const isWinner = matchAnalysis.match.winnerId === playerId;

    // Create analysis context
    const context: MatchAnalysisContextDto = {
      matchId,
      playerId,
      isWinner,
      score:
        playerId === matchAnalysis.match.playerAId
          ? matchAnalysis.match.scoreA
          : matchAnalysis.match.scoreB,
      opponentScore:
        playerId === matchAnalysis.match.playerAId
          ? matchAnalysis.match.scoreB
          : matchAnalysis.match.scoreA,
      venueName: matchAnalysis.match.venue?.name,
      keyMoments: matchAnalysis.keyMoments,
      strategicInsights: matchAnalysis.strategicInsights,
      playerPerformance:
        playerId === matchAnalysis.match.playerAId
          ? matchAnalysis.playerPerformanceA || ''
          : matchAnalysis.playerPerformanceB || '',
      overallAssessment: matchAnalysis.overallAssessment || '',
      recommendations: matchAnalysis.recommendations,
    };

    // Calculate skill points based on analysis
    const skillPoints = await this.calculateSkillPoints(context);

    // Save skill points to database
    const savedPoints = await this.saveSkillPoints(skillPoints, context);

    return {
      playerId,
      matchId,
      skillPoints: savedPoints,
      totalPointsAwarded: savedPoints.reduce(
        (sum, point) => sum + point.points,
        0
      ),
      calculationTimestamp: new Date(),
    };
  }

  private async calculateSkillPoints(
    context: MatchAnalysisContextDto
  ): Promise<SkillPointAwardDto[]> {
    const skillAwards: SkillPointAwardDto[] = [];

    // Base multiplier based on win/loss
    const outcomeMultiplier = context.isWinner
      ? this.WIN_MULTIPLIER
      : this.LOSS_MULTIPLIER;

    // Analyze key moments and strategic insights for skill awards
    const allInsights = [
      ...context.keyMoments,
      ...context.strategicInsights,
      context.playerPerformance,
    ];

    for (const insight of allInsights) {
      const skills = this.extractSkillsFromInsight(insight.toLowerCase());

      for (const skillCategory of skills) {
        const basePoints = this.SKILL_BASE_POINTS[skillCategory];
        const adjustedPoints = Math.round(basePoints * outcomeMultiplier);

        // Check for perfect performance indicators
        const perfectMultiplier = this.detectPerfectPerformance(insight)
          ? this.PERFECT_MULTIPLIER
          : 1.0;
        const finalPoints = Math.round(adjustedPoints * perfectMultiplier);

        skillAwards.push({
          skillId: '', // Will be set when saving
          skillName: skillCategory.replace('_', ' ').toLowerCase(),
          category: skillCategory,
          points: finalPoints,
          reason: `Match performance: ${insight.substring(0, 100)}`,
          confidence: this.calculateConfidence(insight),
          metadata: {
            matchContext: `Match vs ${context.isWinner ? 'opponent (won)' : 'opponent (lost)'}`,
            playerPerformance: context.playerPerformance,
            analysisSource: 'AI Match Analysis',
          },
        });
      }
    }

    // Ensure we have at least one skill award
    if (skillAwards.length === 0) {
      skillAwards.push({
        skillId: '',
        skillName: 'consistency',
        category: SkillCategory.CONSISTENCY,
        points: Math.round(10 * outcomeMultiplier),
        reason: 'General match participation and consistency',
        confidence: 75,
        metadata: {
          matchContext: `Match vs ${context.isWinner ? 'opponent (won)' : 'opponent (lost)'}`,
          playerPerformance: context.playerPerformance,
          analysisSource: 'AI Match Analysis',
        },
      });
    }

    return skillAwards;
  }

  private extractSkillsFromInsight(insight: string): SkillCategory[] {
    const skills: SkillCategory[] = [];

    // Aiming accuracy indicators
    if (
      insight.includes('pot') ||
      insight.includes('potted') ||
      insight.includes('pocket')
    ) {
      skills.push(SkillCategory.AIMING_ACCURACY);
    }

    // Positioning indicators
    if (
      insight.includes('position') ||
      insight.includes('angle') ||
      insight.includes('cue ball')
    ) {
      skills.push(SkillCategory.POSITIONING);
    }

    // Defensive play indicators
    if (
      insight.includes('safety') ||
      insight.includes('defensive') ||
      insight.includes('blocking')
    ) {
      skills.push(SkillCategory.DEFENSIVE_PLAY);
    }

    // Offensive strategy indicators
    if (
      insight.includes('strategy') ||
      insight.includes('offensive') ||
      insight.includes('planning')
    ) {
      skills.push(SkillCategory.OFFENSIVE_STRATEGY);
    }

    // Banking shots indicators
    if (
      insight.includes('bank') ||
      insight.includes('cushion') ||
      insight.includes('rail')
    ) {
      skills.push(SkillCategory.BANKING_SHOTS);
    }

    // Break shots indicators
    if (
      insight.includes('break') ||
      insight.includes('opening') ||
      insight.includes('spread')
    ) {
      skills.push(SkillCategory.BREAK_SHOTS);
    }

    // Safety play indicators
    if (
      insight.includes('safety') ||
      insight.includes('sneaky') ||
      insight.includes('trap')
    ) {
      skills.push(SkillCategory.SAFETY_PLAY);
    }

    // Mental game indicators
    if (
      insight.includes('mental') ||
      insight.includes('pressure') ||
      insight.includes('focus')
    ) {
      skills.push(SkillCategory.MENTAL_GAME);
    }

    // Physical stamina indicators
    if (
      insight.includes('stamina') ||
      insight.includes('endurance') ||
      insight.includes('energy')
    ) {
      skills.push(SkillCategory.PHYSICAL_STAMINA);
    }

    // Default to consistency if no specific skills detected
    if (skills.length === 0) {
      skills.push(SkillCategory.CONSISTENCY);
    }

    return [...new Set(skills)]; // Remove duplicates
  }

  private detectPerfectPerformance(insight: string): boolean {
    const perfectIndicators = [
      'perfect',
      'flawless',
      'masterful',
      'exceptional',
      'brilliant',
      'phenomenal',
      'outstanding',
      'impressive',
      'remarkable',
      'extraordinary',
    ];

    return perfectIndicators.some((indicator) =>
      insight.toLowerCase().includes(indicator)
    );
  }

  private calculateConfidence(insight: string): number {
    // Simple confidence calculation based on insight specificity
    let confidence = 60; // Base confidence

    if (insight.length > 50) confidence += 10; // Longer insights are more detailed
    if (insight.includes('specific') || insight.includes('particular'))
      confidence += 10;
    if (insight.includes('consistently') || insight.includes('repeatedly'))
      confidence += 10;
    if (insight.includes('excellent') || insight.includes('poor'))
      confidence += 5;

    return Math.min(confidence, 95); // Cap at 95%
  }

  private async saveSkillPoints(
    skillPoints: SkillPointAwardDto[],
    context: MatchAnalysisContextDto
  ): Promise<SkillPointAwardDto[]> {
    const savedPoints: SkillPointAwardDto[] = [];

    for (const point of skillPoints) {
      // Find or create skill
      let skill = await this.prisma.skill.findUnique({
        where: { name: point.skillName },
      });

      if (!skill) {
        skill = await this.prisma.skill.create({
          data: {
            name: point.skillName,
            category: point.category,
            description: `Skill in ${point.skillName}`,
          },
        });
      }

      // Find or create skill profile
      let skillProfile = await this.prisma.skillProfile.findUnique({
        where: {
          userId_skillId: {
            userId: context.playerId,
            skillId: skill.id,
          },
        },
      });

      if (!skillProfile) {
        skillProfile = await this.prisma.skillProfile.create({
          data: {
            userId: context.playerId,
            skillId: skill.id,
            unlockedAt: new Date(),
          },
        });
      }

      // Update skill profile with new points
      const updatedProfile = await this.prisma.skillProfile.update({
        where: { id: skillProfile.id },
        data: {
          currentPoints: { increment: point.points },
          totalPoints: { increment: point.points },
          proficiencyScore: this.calculateProficiencyScore(
            skillProfile.totalPoints + point.points,
            skill
          ),
          currentLevel: this.calculateLevel(
            skillProfile.totalPoints + point.points,
            skill
          ),
        },
        include: { skill: true },
      });

      // Create skill point log
      await this.prisma.skillPointLog.create({
        data: {
          skillProfileId: skillProfile.id,
          points: point.points,
          reason: point.reason,
          matchId: context.matchId,
          metadata: point.metadata,
        },
      });

      savedPoints.push({
        ...point,
        skillId: skill.id,
      });
    }

    return savedPoints;
  }

  private calculateProficiencyScore(totalPoints: number, skill: any): number {
    const maxPointsForMaxLevel = skill.maxLevel * skill.pointsPerLevel;
    return Math.min((totalPoints / maxPointsForMaxLevel) * 100, 100);
  }

  private calculateLevel(totalPoints: number, skill: any): number {
    return Math.min(
      Math.floor(totalPoints / skill.pointsPerLevel) + 1,
      skill.maxLevel
    );
  }

  private async getSkillCategoryProgress(
    playerId: string
  ): Promise<SkillCategoryProgressDto[]> {
    const categories = Object.values(SkillCategory);
    const categoryProgress: SkillCategoryProgressDto[] = [];

    for (const category of categories) {
      const skillProfiles = await this.prisma.skillProfile.findMany({
        where: {
          userId: playerId,
          skill: { category },
        },
        include: { skill: true },
        orderBy: { totalPoints: 'desc' },
      });

      if (skillProfiles.length > 0) {
        const totalPoints = skillProfiles.reduce(
          (sum, profile) => sum + profile.totalPoints,
          0
        );
        const averageLevel =
          skillProfiles.reduce(
            (sum, profile) => sum + profile.currentLevel,
            0
          ) / skillProfiles.length;

        categoryProgress.push({
          category,
          totalSkills: skillProfiles.length,
          averageLevel: Math.round(averageLevel),
          totalPoints,
          highestSkill:
            skillProfiles.length > 0
              ? this.mapToSkillProgress(skillProfiles[0])
              : undefined,
        });
      }
    }

    return categoryProgress;
  }

  private mapToSkillProfileDto(profile: any): SkillProfileDto {
    const pointsToNextLevel = this.calculatePointsToNextLevel(profile);

    return {
      id: profile.id,
      skillId: profile.skillId,
      skillName: profile.skill.name,
      skillDescription: profile.skill.description,
      category: profile.skill.category,
      iconUrl: profile.skill.iconUrl,
      currentLevel: profile.currentLevel,
      currentPoints: profile.currentPoints,
      totalPoints: profile.totalPoints,
      proficiencyScore: Number(profile.proficiencyScore),
      maxLevel: profile.skill.maxLevel,
      pointsToNextLevel,
      unlockedAt: profile.unlockedAt,
      lastUpdated: profile.lastUpdated,
    };
  }

  private mapToSkillProgress(profile: any): SkillProgressDto {
    return {
      skillId: profile.skillId,
      skillName: profile.skill.name,
      category: profile.skill.category,
      currentLevel: profile.currentLevel,
      currentPoints: profile.currentPoints,
      proficiencyScore: Number(profile.proficiencyScore),
      recentPoints: profile.currentPoints, // This could be calculated differently
      lastActivity: profile.lastUpdated,
    };
  }

  private mapToSkillPointLog(log: any): SkillPointLogDto {
    return {
      id: log.id,
      skillId: log.skillProfile.skillId,
      skillName: log.skillProfile.skill.name,
      points: log.points,
      reason: log.reason,
      matchId: log.matchId,
      createdAt: log.createdAt,
      metadata: log.metadata,
    };
  }

  private calculatePointsToNextLevel(profile: any): number {
    const currentLevelPoints =
      (profile.currentLevel - 1) * profile.skill.pointsPerLevel;
    const nextLevelPoints = profile.currentLevel * profile.skill.pointsPerLevel;
    return Math.max(0, nextLevelPoints - profile.totalPoints);
  }
}
