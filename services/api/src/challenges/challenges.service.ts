import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { NotificationTemplatesService } from '../notifications/notification-templates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateChallengeDto {
  challengerId: string;
  defenderId: string;
  venueId: string;
}

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly notificationTemplates: NotificationTemplatesService
  ) {}

  async create(dto: CreateChallengeDto) {
    const { challengerId, defenderId, venueId } = dto;

    // Verify friendship (friend-only challenges)
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: challengerId, addresseeId: defenderId },
          { requesterId: defenderId, addresseeId: challengerId },
        ],
      },
    });

    if (!friendship) {
      throw new ForbiddenException(
        'Challenges are restricted to friends only.'
      );
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    const challenge = await this.prisma.challenge.create({
      data: {
        challengerId,
        defenderId,
        venueId,
        status: 'PENDING',
        expiresAt,
      },
    });

    // Notify defender of the received challenge
    try {
      // Get challenger and venue details for the notification
      const [challenger, venue] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: challengerId },
          select: { username: true },
        }),
        this.prisma.venue.findUnique({
          where: { id: venueId },
          select: { name: true },
        }),
      ]);

      const template = this.notificationTemplates.getChallengeReceivedTemplate(
        challenger?.username || 'Unknown User',
        venue?.name || 'Unknown Venue'
      );

      await this.notifications.createNotification(
        defenderId,
        template.type,
        template.message,
        { challengerId, challengeId: challenge.id, venueId }
      );
    } catch (err: any) {
      this.logger.warn(
        `Failed to create challenge notification: ${
          err?.message ?? String(err)
        }`
      );
      // best-effort; do not block challenge creation
    }

    return challenge;
  }
}
