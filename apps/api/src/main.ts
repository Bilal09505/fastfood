// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global API prefix
  app.setGlobalPrefix('api');

  // CORS - allow Angular dev server and configured frontend URL
  app.enableCors({
    origin: [
      'http://localhost:4200',
      configService.get<string>('frontendUrl'),
      /https:\/\/.*\.vercel\.app$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe - strips unknown fields, transforms types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: true, // throw on unknown properties
      transform: true,           // auto-transform payloads to DTO classes
      transformOptions: {
        enableImplicitConversion: true, // convert query strings to correct types
      },
    }),
  );

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);

  logger.log(`🚀 API running on: http://localhost:${port}/api`);
  logger.log(`📊 Environment: ${configService.get('nodeEnv')}`);
}

bootstrap();
