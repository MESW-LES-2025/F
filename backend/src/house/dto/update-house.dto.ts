import { PartialType } from '@nestjs/swagger';
import { CreateHouseDto } from './create-house.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateHouseDto extends PartialType(CreateHouseDto) {
	@IsOptional()
	@IsUUID()
	userToRemoveId?: string;

	@IsOptional()
	@IsUUID()
	userToUpgradeId?: string;
}
