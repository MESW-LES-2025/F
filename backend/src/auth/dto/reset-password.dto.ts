import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
	@ApiProperty({ example: 'token123', description: 'The reset token' })
	@IsString()
	@IsNotEmpty()
	token: string;

	@ApiProperty({ example: 'newPassword123', description: 'The new password' })
	@IsString()
	@IsNotEmpty()
	@MinLength(6)
	password: string;
}
