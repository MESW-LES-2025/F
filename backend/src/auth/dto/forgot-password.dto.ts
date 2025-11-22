import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
	@ApiProperty({
		example: 'user@example.com',
		description: 'The email of the user',
	})
	@IsEmail()
	@IsNotEmpty()
	email: string;
}
