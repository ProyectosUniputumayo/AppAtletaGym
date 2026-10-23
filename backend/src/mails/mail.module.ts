import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './mail.service.js';


@Module({
  imports: [ConfigModule],
  providers: [EmailService],
  exports: [EmailService], // <--- Clave para poder inyectarlo en AuthModule
})
export class EmailModule {}