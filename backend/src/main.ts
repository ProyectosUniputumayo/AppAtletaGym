import { NestFactory } from '@nestjs/core';

import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { SERVER_PORT } from './config/constants.js';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const configService = app.get(ConfigService);
  const port = +(configService.get<number>(SERVER_PORT) ?? 3000);

  await app.listen(port);
  //console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();