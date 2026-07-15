import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('v1');
  // Payload validation is handled per-route by ZodValidationPipe (@kaza/shared schemas).
  app.enableCors({ origin: process.env.ADMIN_ORIGIN?.split(',') ?? true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kaza API')
    .setDescription('REST API consumed by the Kaza mobile app and the admin back-office')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`Kaza API listening on port ${port} — OpenAPI docs at /docs`, 'Bootstrap');
}

void bootstrap();
