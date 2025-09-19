import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import {
  ChallengeStatus,
  UpdateChallengeDto,
} from './dto/update-challenge.dto';
import { Challenge } from './entities/challenge.entity';

@Controller('challenges')
export class ChallengesController {
  private challenges = new Map<string, Challenge>();

  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  @Post()
  createChallenge(@Body() createChallengeDto: CreateChallengeDto): Challenge {
    const { challengerId, defenderId, stakeCoins = 0 } = createChallengeDto;

    if (!challengerId || !defenderId) {
      throw new BadRequestException('Missing required fields');
    }

    const challengeId = `challenge-${Date.now()}`;
    const challenge: Challenge = {
      id: challengeId,
      challengerId,
      defenderId,
      status: ChallengeStatus.PENDING,
      stakeCoins,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.challenges.set(challengeId, challenge);

    // Emit real-time challenge notification to defender
    try {
      this.notificationsGateway.emitToUser(defenderId, 'new_challenge', {
        challengeId,
        challengerId,
        defenderId,
        stakeCoins,
        createdAt: challenge.createdAt,
        message: `You have been challenged by ${challengerId}`,
      });
    } catch (error) {
      console.warn('Failed to send challenge notification:', error);
      // Don't fail the challenge creation if notification fails
    }

    return challenge;
  }

  @Patch(':challengeId')
  updateChallenge(
    @Param('challengeId') challengeId: string,
    @Body() updateChallengeDto: UpdateChallengeDto
  ): Challenge {
    const { status } = updateChallengeDto;

    if (
      ![ChallengeStatus.ACCEPTED, ChallengeStatus.DECLINED].includes(status)
    ) {
      throw new BadRequestException('Invalid status');
    }

    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    challenge.status = status;
    challenge.updatedAt = new Date().toISOString();

    // Emit real-time challenge response to challenger
    try {
      this.notificationsGateway.emitToUser(
        challenge.challengerId,
        'challenge_response',
        {
          challengeId,
          status,
          updatedAt: challenge.updatedAt,
          message: `Your challenge has been ${status.toLowerCase()}`,
        }
      );
    } catch (error) {
      console.warn('Failed to send challenge response notification:', error);
      // Don't fail the challenge update if notification fails
    }

    return challenge;
  }

  @Get()
  getChallenges(@Query('userId') userId: string): Challenge[] {
    if (!userId) {
      throw new BadRequestException('Missing userId parameter');
    }

    return Array.from(this.challenges.values()).filter(
      (challenge) =>
        challenge.challengerId === userId || challenge.defenderId === userId
    );
  }

  @Get(':challengeId')
  getChallenge(@Param('challengeId') challengeId: string): Challenge {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }
    return challenge;
  }
}
