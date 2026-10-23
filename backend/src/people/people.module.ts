import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeopleService } from './people.service.js';
import { PeopleController } from './people.controller.js';
import { PersonEntity } from './entities/person.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PersonEntity])],
  controllers: [PeopleController],
  providers: [PeopleService],
  exports: [PeopleService],
})
export class PeopleModule {}