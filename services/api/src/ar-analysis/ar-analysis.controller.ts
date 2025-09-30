import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ArAnalysisService } from './ar-analysis.service';

@Controller('ar')
export class ArAnalysisController {
  constructor(private readonly arService: ArAnalysisService) {}

  /**
   * Analyze a pool table image and return detected table bounds and balls.
   * Route: POST /api/v1/ar/analyze-table
   * Form field: file (multipart/form-data, JPEG or PNG)
   */
  @Post('analyze-table')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok =
          file.mimetype === 'image/jpeg' || file.mimetype === 'image/png';
        if (!ok)
          return cb(
            new BadRequestException('Only JPEG/PNG images are allowed'),
            false
          );
        cb(null, true);
      },
    })
  )
  async analyze(@UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file uploaded or file is empty');
    }
    return this.arService.analyzeTableImage(file.buffer, file.mimetype);
  }
}
