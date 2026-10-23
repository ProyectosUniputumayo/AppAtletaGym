import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonEntity } from './entities/person.entity.js';
import { UpdatePeopleDto } from './dtos/update-people.dto.js';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(PersonEntity)
    private readonly personRepository: Repository<PersonEntity>,
  ) {}

  async create(dto: { 
    user_id?: number; 
    documentNumber?: string; // <--- Añadido aquí
    firstName: string; 
    firstLastName: string; 
    cellphone?: string; 
    address?: string; 
    gender?: string; 
    avatarUrl?: string 
  }) {
    const newPerson = this.personRepository.create(dto);
    return await this.personRepository.save(newPerson);
  }

  async obtenerPersonas(): Promise<PersonEntity[]> {
    const personas = await this.personRepository.find({ relations: { user: true } });
    if (personas.length === 0) {
      throw new NotFoundException('No hay personas registradas');
    }
    return personas;
  }

  async obtenerPersonaPorUserId(userId: number): Promise<PersonEntity> {
    const persona = await this.personRepository.findOne({
      where: { user_id: userId },
      relations: { user: true },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada para este usuario');
    }
    return persona;
  }

  // NUEVO: Método útil para buscar clientes presenciales o digitales por su cédula en recepción
  async obtenerPersonaPorDocumento(documentNumber: string): Promise<PersonEntity> {
    const persona = await this.personRepository.findOne({
      where: { documentNumber },
      relations: { user: true },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada con este número de documento');
    }
    return persona;
  }

  async obtenerPersonaPorId(id: number): Promise<PersonEntity> {
    const persona = await this.personRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }
    return persona;
  }

  async actualizarPersona(idFromParam: number, dto: UpdatePeopleDto & { documentNumber?: string }, currentUser: any) {
    const isOwner = Number(idFromParam) === Number(currentUser.user_id);
    const isAdmin = currentUser.rolIds?.includes(1) || currentUser.roles?.includes('Admin');

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tienes permisos para actualizar esta persona');
    }

    const persona = await this.personRepository.findOne({ where: { user_id: idFromParam } });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }

    if (dto.documentNumber) persona.documentNumber = dto.documentNumber; // <--- Permitir actualizar cédula si es admin
    if (dto.firstName) persona.firstName = dto.firstName;
    if (dto.firstLastName) persona.firstLastName = dto.firstLastName;
    if (dto.cellphone) persona.cellphone = dto.cellphone;
    if (dto.address) persona.address = dto.address;
    if (dto.gender) persona.gender = dto.gender;
    if (dto.avatarUrl !== undefined) persona.avatarUrl = dto.avatarUrl;

    await this.personRepository.save(persona);
    return { message: 'Información de la persona actualizada correctamente' };
  }
}