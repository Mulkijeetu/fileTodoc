import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaudeModule } from '../claude/claude.module';
import { Student } from './student.entity';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [TypeOrmModule.forFeature([Student]), ClaudeModule],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
