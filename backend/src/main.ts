import { NestFactory } from '@nestjs/core';

import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SERVER_PORT } from './config/constants.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Atleta x Gym')
    .setDescription('La API para gestionar el sistema de Atleta x Gym')
    .setVersion('1.0')
    .addTag('users')
    .addTag('auth')
    .addTag('people')
    .addTag('roles')
    .addTag('memberships')
    .addTag('payments')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const configService = app.get(ConfigService);
  const port = +(configService.get<number>(SERVER_PORT) ?? 3000);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api`);
}
bootstrap();