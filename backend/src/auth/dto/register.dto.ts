import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength,
} from 'class-validator';

export class RegisterDto {
	@ApiProperty({
		example: 'user@example.com',
		description: 'User email address',
	})
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ example: 'johndoe', description: 'Unique username' })
	@IsString()
	@IsNotEmpty()
	username: string;

	@ApiProperty({
		example: 'password123',
		description: 'User password (min 6 characters)',
	})
	@IsString()
	@IsNotEmpty()
	@MinLength(6)
	password: string;

	@ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
	@IsOptional()
	@IsString()
	name?: string;
}
