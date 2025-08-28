import { Module } from '@nestjs/common';
import { ArAnalysisController } from './ar-analysis.controller';
import { ArAnalysisService } from './ar-analysis.service';

@Module({
  controllers: [ArAnalysisController],
  providers: [ArAnalysisService],
})
export class ArAnalysisModule {}
