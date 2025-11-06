import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
	@ApiProperty({ example: 'currentPassword123' })
	currentPassword: string;

	@ApiProperty({ example: 'newSecurePassword456' })
	newPassword: string;
}
