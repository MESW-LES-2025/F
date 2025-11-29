import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class UpdateChatMessageDto {
	@ApiProperty({
		example: 'Updated message',
		description: 'Updated message content',
		minLength: 1,
		maxLength: 500,
	})
	@IsString()
	@Length(1, 500)
	@Matches(/\S/, { message: 'Content cannot be empty or whitespace only' })
	content: string;
}
