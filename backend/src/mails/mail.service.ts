import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  template: string; // nombre del archivo hbs (ej. 'reset-password')
  context: Record<string, any>; // variables para la plantilla
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com',
      port: this.configService.get<number>('MAIL_PORT') || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendEmail(options: EmailOptions) {
    try {
      // Ruta donde se encuentran las plantillas .hbs
      const templatePath = path.resolve(process.cwd(), 'src/mails/templates', `${options.template}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const compiledTemplate = handlebars.compile(templateSource);
      const html = compiledTemplate(options.context);

      const mailOptions = {
        from: `"Atleta x Gym" <${this.configService.get<string>('MAIL_USER')}>`,
        to: options.to,
        subject: options.subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true, message: 'Correo enviado exitosamente' };
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw new Error('No se pudo enviar el correo electrónico');
    }
  }
}