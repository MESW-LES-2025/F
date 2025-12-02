import { ApiProperty } from '@nestjs/swagger';

export class CreateHouseDto {
	@ApiProperty({ example: 'house 1', description: 'house name' })
	name: string;
}
