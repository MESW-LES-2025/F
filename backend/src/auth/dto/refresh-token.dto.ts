import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
	@ApiProperty({ description: 'Refresh token to get new access token' })
	refresh_token: string;
}
