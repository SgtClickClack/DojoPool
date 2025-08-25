import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VenueOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req?.user?.sub;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const specialId: string | undefined = req?.params?.specialId;

    if (specialId) {
      const special = await (this.prisma as any).venueSpecial.findUnique({
        where: { id: specialId },
        include: { venue: { select: { id: true, ownerId: true } } },
      });
      if (!special) {
        throw new NotFoundException('Special not found');
      }
      if (!special.venue || special.venue.ownerId !== userId) {
        throw new ForbiddenException('You are not allowed to manage this special');
      }
      // Attach the venue for downstream usage
      req.myVenue = special.venue;
      return true;
    }

    // Default: authorize based on owning a venue
    const venue = await this.prisma.venue.findFirst({ where: { ownerId: userId } });
    if (!venue) {
      throw new ForbiddenException('You do not own a venue');
    }
    req.myVenue = venue;
    return true;
  }
}
