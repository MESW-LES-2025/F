import { ApiPropertyOptional } from '@nestjs/swagger';

export class JoinHouseDto {
	@ApiPropertyOptional({ example: '12345678' })
	inviteCode: string;
}
