import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';
import {
	NotificationCategory,
	NotificationLevel,
} from 'src/shared/notification-constants';

export class CreateNotificationDto {
	@IsOptional()
	@IsString()
	@ApiProperty({ example: 'OTHER', description: 'notification category' })
	category?: NotificationCategory;

	@IsOptional()
	@IsString()
	@ApiProperty({ example: 'LOW', description: 'notification level' })
	level?: NotificationLevel;

	@IsString()
	@ApiProperty({
		example: 'New notification',
		description: 'notification title',
	})
	title: string;

	@IsOptional()
	@IsString()
	@ApiProperty({
		example: 'You have a new notification',
		description: 'notification text',
	})
	body?: string;

	@IsOptional()
	@IsString()
	@ApiProperty({
		example: 'www.google.com',
		description: 'url that will lead to a action',
	})
	actionUrl?: string;

	@IsArray()
	@IsString({ each: true })
	@Transform(({ value }) => {
		if (Array.isArray(value)) {
			return value.map((v) => String(v));
		}
		return [String(value)];
	})
	@ApiProperty({
		example: '[1, 2, 3]',
		description: 'array of user ids to send notifications to',
	})
	userIds: string[];
}
