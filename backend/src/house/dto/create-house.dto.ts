import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHouseDto {
	@ApiProperty({ example: 'house 1', description: 'house name' })
	@IsString()
	@IsNotEmpty()
	name: string;
}
