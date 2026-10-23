import { Injectable } from '@nestjs/common';
import { AuthRegisterService } from './services/auth-register.service.js';
import { AuthLoginService } from './services/auth-login.service.js';
import { AuthPasswordService } from './services/auth-password.service.js';
import { RegisterDto } from './dtos/register.dto.js';
import { LoginDto } from './dtos/login.dto.js';
import { ForgotPasswordDto } from './dtos/forgot-password.dto.js';
import { ResetPasswordDto } from './dtos/reset-password.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRegisterService: AuthRegisterService,
    private readonly authLoginService: AuthLoginService,
    private readonly authPasswordService: AuthPasswordService,
  ) {}

  async register(dto: RegisterDto) {
    return this.authRegisterService.register(dto);
  }

  async login(dto: LoginDto) {
    return this.authLoginService.login(dto);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return this.authPasswordService.forgotPassword(dto);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.authPasswordService.resetPassword(dto);
  }
}