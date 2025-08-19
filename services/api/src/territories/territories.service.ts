import { Injectable, Logger } from '@nestjs/common';
import { ErrorUtils } from '../common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TerritoriesService {
  private readonly logger = new Logger(TerritoriesService.name);

  constructor(private prisma: PrismaService) {}

  async findAllTerritories(): Promise<any[]> {
    try {
      return await this.prisma.territory.findMany({
        select: {
          id: true,
          name: true,
        },
      });
    } catch (err) {
      this.logger.error(
        ErrorUtils.formatErrorMessage('fetch territories', undefined, err)
      );
      throw err;
    }
  }
}
