import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../users/entities/user.entity.js';
import { PersonEntity } from '../../people/entities/person.entity.js';
import { UserRoleEntity } from '../../roles/entities/user-role.entity.js';
import { RegisterDto } from '../dtos/register.dto.js';

@Injectable()
export class AuthRegisterService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PersonEntity)
    private readonly personRepository: Repository<PersonEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 1. Crear usuario (Sin username)
    const newUser = this.userRepository.create({
      email: dto.email,
      password_hash: hashedPassword,
      role_id: dto.role_id || 3,
    });
    const savedUser = await this.userRepository.save(newUser);

    // 2. Crear persona asociada
    const newPerson = this.personRepository.create({
      user_id: savedUser.id,
      firstName: dto.firstName,
      firstLastName: dto.firstLastName,
      cellphone: dto.cellphone,
      address: dto.address,
      gender: dto.gender,
    });
    await this.personRepository.save(newPerson);

    // 3. Registrar en la tabla intermedia user_roles
    const newUserRole = this.userRoleRepository.create({
      user_id: savedUser.id,
      role_id: dto.role_id || 3,
    });
    await this.userRoleRepository.save(newUserRole);

    return { message: 'Usuario registrado exitosamente', userId: savedUser.id };
  }
}