import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaudeService } from '../claude/claude.service';
import { Student } from './student.entity';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly students: Repository<Student>,
    private readonly claude: ClaudeService,
  ) {}

  list(): Promise<Student[]> {
    return this.students.find({
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async importFile(file: Express.Multer.File | undefined): Promise<Student> {
    if (!file) {
      throw new BadRequestException('Choose a PDF or image to upload.');
    }
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Upload a PDF or an image (JPEG, PNG, GIF, or WebP).',
      );
    }
    if (!file.buffer?.length) {
      throw new BadRequestException('That file is empty.');
    }

    const extracted = await this.claude.extractStudent(file);

    return this.students.save(
      this.students.create({
        ...extracted,
        sourceFileName: file.originalname.slice(0, 255),
      }),
    );
  }
}
