import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
	@ApiProperty({
		example: 'user@example.com',
		description: 'User email address',
	})
	email: string;

	@ApiProperty({ example: 'password123', description: 'User password' })
	password: string;
}
