import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  // Raw health check - bypasses all middleware
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/api/v1/health', (req: any, res: any) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

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

  const port = process.env.PORT || configService.get('PORT') || 3000;
  const server = await app.listen(port, '0.0.0.0');

  // Fix Render timeouts
  server.setTimeout(120000); // 120 seconds
  if (server.keepAliveTimeout !== undefined) {
    server.keepAliveTimeout = 120000;
  }
  if (server.headersTimeout !== undefined) {
    server.headersTimeout = 120000;
  }

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
