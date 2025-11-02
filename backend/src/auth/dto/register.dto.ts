import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
	@ApiProperty({
		example: 'user@example.com',
		description: 'User email address',
	})
	email: string;

	@ApiProperty({ example: 'johndoe', description: 'Unique username' })
	username: string;

	@ApiProperty({
		example: 'password123',
		description: 'User password (min 6 characters)',
	})
	password: string;

	@ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
	name?: string;
}
