import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PeopleService } from './people.service.js';
import { UpdatePeopleDto } from './dtos/update-people.dto.js';

@ApiTags('people')
@Controller('people')
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  async findAll() {
    return this.peopleService.obtenerPersonas();
  }

  
  @Post()
  async create(@Body() dto: { user_id: number; firstName: string; firstLastName: string; cellphone?: string; address?: string; gender?: string }) {
    return this.peopleService.create(dto);
  }

  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return this.peopleService.obtenerPersonaPorUserId(+userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.peopleService.obtenerPersonaPorId(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePeopleDto,
    @Req() req: any,
  ) {
    const currentUser = req.user || { user_id: +id, rolIds: [1] }; 
    return this.peopleService.actualizarPersona(+id, dto, currentUser);
  }
}