import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class ReadChatMessagesDto {
	@ApiPropertyOptional({
		description: 'Maximum number of messages to return',
		example: 20,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number;

	@ApiPropertyOptional({
		description: 'Cursor (message ID) to start after',
		example: 'uuid-of-message',
	})
	@IsOptional()
	@IsUUID()
	cursor?: string;
}
