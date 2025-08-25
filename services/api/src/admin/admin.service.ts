import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalUsers, totalMatches, totalClans] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.match.count(),
      this.prisma.clan.count(),
    ]);
    return { totalUsers, totalMatches, totalClans };
  }

  async listUsers(page = 1, pageSize = 20) {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = Math.max(page - 1, 0) * take;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isBanned: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);
    return {
      items,
      page,
      pageSize: take,
      total,
      totalPages: Math.ceil(total / take),
    };
  }

  async toggleBan(userId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isBanned: !existing.isBanned },
      select: { id: true, username: true, isBanned: true },
    });
    return { message: updated.isBanned ? 'User banned' : 'User unbanned', user: updated };
  }

  async deleteUser(userId: string) {
    // Consider cascading effects; schema defines many relations with onDelete cascade in some places
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('User not found');
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'User deleted' };
  }
}
