import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS')?.split(',') || '*',
    credentials: true,
  });

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['/', 'health'],
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('NEXA Smart Home API')
    .setDescription('NEXA Smart Home Intelligence OS - Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('homes', 'Home management')
    .addTag('devices', 'Device management and control')
    .addTag('automations', 'Automation engine')
    .addTag('diagnostics', 'Device diagnostics and health')
    .addTag('energy', 'Energy monitoring and analytics')
    .addTag('alerts', 'Alert management')
    .addTag('insights', 'AI-generated insights')
    .addTag('telemetry', 'Device telemetry streams')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0');

  const baseUrl = configService.get('NODE_ENV') === 'production'
    ? 'https://nexa-backend-r7dp.onrender.com'
    : `http://localhost:${port}`;

  console.log(`
  🚀 NEXA Backend is running!
  
  📍 API: ${baseUrl}/${apiPrefix}
  📚 Swagger Docs: ${baseUrl}/api/docs
  🌍 Environment: ${configService.get('NODE_ENV')}
  `);
}

bootstrap();
