import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
	@ApiPropertyOptional({ example: 'johndoe' })
	username?: string;

	@ApiPropertyOptional({ example: 'John Doe' })
	name?: string;
}
