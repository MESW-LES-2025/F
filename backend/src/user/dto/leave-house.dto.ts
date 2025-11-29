import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LeaveHouseDto {
	@ApiPropertyOptional({ example: '12345678' })
	@IsUUID()
	houseId: string;
}
