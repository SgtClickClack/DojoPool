import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Friendship, FriendshipStatus, User } from '@prisma/client';
import { randomUUID } from 'node:crypto';

interface FallbackFriendship extends Omit<Friendship, 'id'> {
  id: string;
}

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);
  private fallback: FallbackFriendship[] = [];

  constructor(private prisma: PrismaService) {}

  private validateNotSelf(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }
  }

  async sendRequest(currentUserId: string, addresseeId: string): Promise<Friendship> {
    this.validateNotSelf(currentUserId, addresseeId);
    try {
      // Prevent duplicates in either direction
      const existing = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: currentUserId, addresseeId },
            { requesterId: addresseeId, addresseeId: currentUserId },
          ],
        },
      });
      if (existing) {
        throw new BadRequestException('Friendship already exists');
      }
      return await this.prisma.friendship.create({
        data: { requesterId: currentUserId, addresseeId, status: 'PENDING' as FriendshipStatus },
      });
    } catch (err: any) {
      this.logger.warn(`DB sendRequest failed, using in-memory fallback: ${err?.message ?? String(err)}`);
      const exists = this.fallback.find(
        (f) =>
          (f.requesterId === currentUserId && f.addresseeId === addresseeId) ||
          (f.requesterId === addresseeId && f.addresseeId === currentUserId)
      );
      if (exists) throw new BadRequestException('Friendship already exists');
      const item: FallbackFriendship = {
        id: randomUUID(),
        requesterId: currentUserId,
        addresseeId,
        status: 'PENDING' as FriendshipStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      this.fallback.push(item);
      return item as unknown as Friendship;
    }
  }

  async listIncomingRequests(currentUserId: string): Promise<Friendship[]> {
    try {
      return await this.prisma.friendship.findMany({ where: { addresseeId: currentUserId, status: 'PENDING' } });
    } catch (err: any) {
      this.logger.warn(`DB listIncomingRequests failed, returning fallback: ${err?.message ?? String(err)}`);
      return this.fallback.filter((f) => f.addresseeId === currentUserId && f.status === ('PENDING' as FriendshipStatus)) as any;
    }
  }

  async respondToRequest(currentUserId: string, id: string, action: 'accept' | 'decline'): Promise<Friendship> {
    try {
      const request = await this.prisma.friendship.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Request not found');
      if (request.addresseeId !== currentUserId) throw new ForbiddenException('Not authorized to respond to this request');
      const status: FriendshipStatus = action === 'accept' ? ('ACCEPTED' as FriendshipStatus) : ('DECLINED' as FriendshipStatus);
      return await this.prisma.friendship.update({ where: { id }, data: { status } });
    } catch (err: any) {
      this.logger.warn(`DB respondToRequest failed, using fallback: ${err?.message ?? String(err)}`);
      const idx = this.fallback.findIndex((f) => f.id === id);
      if (idx === -1) throw new NotFoundException('Request not found');
      const req = this.fallback[idx];
      if (req.addresseeId !== currentUserId) throw new ForbiddenException('Not authorized to respond to this request');
      this.fallback[idx] = { ...req, status: action === 'accept' ? ('ACCEPTED' as FriendshipStatus) : ('DECLINED' as FriendshipStatus), updatedAt: new Date() } as any;
      return this.fallback[idx] as any;
    }
  }

  async listFriends(currentUserId: string): Promise<User[]> {
    try {
      const accepted = await this.prisma.friendship.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
        },
      });
      const friendIds = accepted.map((f) => (f.requesterId === currentUserId ? f.addresseeId : f.requesterId));
      if (friendIds.length === 0) return [] as any;
      return await this.prisma.user.findMany({ where: { id: { in: friendIds } }, select: { id: true, username: true, email: true } });
    } catch (err: any) {
      this.logger.warn(`DB listFriends failed, using fallback: ${err?.message ?? String(err)}`);
      const accepted = this.fallback.filter(
        (f) => f.status === ('ACCEPTED' as FriendshipStatus) && (f.requesterId === currentUserId || f.addresseeId === currentUserId)
      );
      const friendIds = accepted.map((f) => (f.requesterId === currentUserId ? f.addresseeId : f.requesterId));
      // we don't have fallback users store here; return as minimal user stubs
      const unique = Array.from(new Set(friendIds));
      return unique.map((id) => ({ id, username: `user_${id.slice(0, 6)}`, email: '' })) as any;
    }
  }
}
