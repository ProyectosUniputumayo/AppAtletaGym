import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePeopleDto {
  @ApiPropertyOptional({ example: 'Marlon' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Moncayo' })
  @IsOptional()
  @IsString()
  firstLastName?: string;

  @ApiPropertyOptional({ example: '3101234567' })
  @IsOptional()
  @IsString()
  cellphone?: string;

  @ApiPropertyOptional({ example: 'Calle Principal #123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Masculino' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}