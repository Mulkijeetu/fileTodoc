import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  studentName!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  course!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  section!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  grade!: string | null;

  @Column({ type: 'varchar', length: 255 })
  sourceFileName!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
