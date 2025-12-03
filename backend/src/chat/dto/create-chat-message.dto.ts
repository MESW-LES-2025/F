import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, IsOptional, IsUUID } from 'class-validator';

export class CreateChatMessageDto {
	@ApiProperty({
		example: 'Hello everyone!',
		description: 'Message content',
		minLength: 1,
		maxLength: 500,
	})
	@IsString()
	@Length(1, 500)
	@Matches(/\S/, { message: 'Content cannot be empty or whitespace only' })
	content: string;

	@IsOptional()
	@IsUUID()
	parentId?: string;
}
