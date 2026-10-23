import { Injectable } from '@nestjs/common';
import { AuthRegisterService } from './services/auth-register.service.js';
import { AuthLoginService } from './services/auth-login.service.js';
import { RegisterDto } from './dtos/register.dto.js';
import { LoginDto } from './dtos/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRegisterService: AuthRegisterService,
    private readonly authLoginService: AuthLoginService,
  ) {}

  async register(dto: RegisterDto) {
    return this.authRegisterService.register(dto);
  }

  async login(dto: LoginDto) {
    return this.authLoginService.login(dto);
  }
}