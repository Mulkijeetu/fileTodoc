import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT') ?? 3306),
        username: config.get<string>('DB_USER', 'filetodoc'),
        password: config.get<string>('DB_PASSWORD', 'filetodoc'),
        database: config.get<string>('DB_NAME', 'filetodoc'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNC', 'true') !== 'false',
        charset: 'utf8mb4',
      }),
    }),
    StudentsModule,
  ],
})
export class AppModule {}
