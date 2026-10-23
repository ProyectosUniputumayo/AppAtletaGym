import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<string> {
    const existingUser = await this.userRepository.findOne({ 
      where: { email: createUserDto.email } 
    });
    
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    const newUser = this.userRepository.create({
      ...createUserDto,
      password_hash: await bcrypt.hash(createUserDto.password_hash, 10),
    });
    await this.userRepository.save(newUser);
    
    return 'Usuario creado correctamente';
  }

  async findAll() {
    const users = await this.userRepository.find();
    return users.map(user => ({
      id: user.id,
      role_id: user.role_id,
      email: user.email,
      is_active: user.is_active,
      created_at: user.created_at,
    }));
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return {
      id: user.id,
      role_id: user.role_id,
      email: user.email,
      is_active: user.is_active,
      created_at: user.created_at,
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    return 'Usuario actualizado correctamente';
  }

  async remove(id: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`El usuario con ID ${id} que intentas eliminar no existe`);
    }

    await this.userRepository.remove(user);
    
    return 'Usuario eliminado correctamente';
  }
}