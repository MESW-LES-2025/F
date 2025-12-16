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

	@IsOptional()
	@IsString()
	@ApiProperty({
		example: '123e4567-e89b-12d3-a456-426614174000',
		description: 'house id related to the notification',
	})
	houseId?: string;

	@IsArray()
	@IsString({ each: true })
	@Transform(({ value }) => {
		if (Array.isArray(value)) {
			return value.map(String);
		}
		return [String(value)];
	})
	@ApiProperty({
		example: '[1, 2, 3]',
		description: 'array of user ids to send notifications to',
	})
	userIds: string[];
}
