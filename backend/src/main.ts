import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UploadExceptionFilter } from './upload-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  });
  app.useGlobalFilters(new UploadExceptionFilter());
  await app.listen(Number(process.env.PORT ?? 3000));
}

bootstrap();
