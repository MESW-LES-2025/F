import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkMessagesAsReadDto {
	@ApiProperty()
	@IsArray()
	@IsUUID('4', { each: true })
	messageIds: string[];
}
