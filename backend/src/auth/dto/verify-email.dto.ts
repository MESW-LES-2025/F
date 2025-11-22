import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
	@ApiProperty({ example: 'token123', description: 'The verification token' })
	@IsString()
	@IsNotEmpty()
	token: string;
}
