import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class InviteToHouseDto {
	@IsString()
	@ApiProperty({ example: 'house123', description: 'house id' })
	houseId: string;

	@IsOptional()
	@ApiProperty({
		example: 'user@example.com',
		description: 'other user email',
	})
	email?: string;

	@IsOptional()
	@ApiProperty({ example: 'username', description: 'other user username' })
	username?: string;
}
