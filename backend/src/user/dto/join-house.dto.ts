import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinHouseDto {
	@ApiPropertyOptional({ example: '12345678' })
	@IsString()
	@IsNotEmpty()
	inviteCode: string;
}
