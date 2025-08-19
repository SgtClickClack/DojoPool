import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchUtils } from '../common';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async getMatchById(matchId: string): Promise<any> {
    return MatchUtils.getMatchById(this.prisma, matchId);
  }
}
