import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DirectMessagePayload {
  id: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  senderId: string;
  receiverId: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(private readonly prisma: PrismaService) {}

  private async verifyFriendship(senderId: string, receiverId: string) {
    const f = await this.prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: senderId, addresseeId: receiverId },
          { requesterId: receiverId, addresseeId: senderId },
        ],
      },
    });
    if (!f) {
      throw new ForbiddenException(
        'Direct messages are restricted to friends only'
      );
    }
  }

  async sendDirectMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<DirectMessagePayload> {
    if (!senderId || !receiverId)
      throw new BadRequestException('senderId and receiverId are required');
    if (senderId === receiverId)
      throw new BadRequestException('Cannot send a message to yourself');
    if (!content || content.trim().length === 0)
      throw new BadRequestException('Message content cannot be empty');

    await this.verifyFriendship(senderId, receiverId);

    const dm = await this.prisma.directMessage.create({
      data: {
        content: content.trim(),
        senderId,
        receiverId,
      },
    });

    return dm as unknown as DirectMessagePayload;
  }

  async getHistory(
    userId: string,
    friendId: string,
    page = 1,
    limit = 20
  ): Promise<DirectMessagePayload[]> {
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    const skip = (page - 1) * limit;

    await this.verifyFriendship(userId, friendId);

    const items = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { timestamp: 'asc' },
      skip,
      take: limit,
    });
    return items as unknown as DirectMessagePayload[];
  }
}
