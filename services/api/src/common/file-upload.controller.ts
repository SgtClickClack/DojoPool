import {
  BadRequestException,
  Controller,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileUploadService } from './file-upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('feedback-attachments')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 files
  async uploadFeedbackAttachments(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    try {
      const uploadedFiles = await this.fileUploadService.uploadFiles(files);

      return {
        message: 'Files uploaded successfully',
        files: uploadedFiles.map((file) => ({
          filename: file.filename,
          url: file.url,
          size: file.size,
          mimetype: file.mimetype,
        })),
        uploadedBy: req.user.userId,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
