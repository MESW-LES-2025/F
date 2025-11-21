import { IsBoolean, IsOptional, IsString } from 'class-validator';
import {
	NotificationCategory,
	NotificationLevel,
} from 'src/shared/notification-constants';

export class FindAllNotificationsByUserDto {
	@IsOptional()
	@IsString()
	category?: NotificationCategory;

	@IsOptional()
	@IsString()
	level?: NotificationLevel;

	@IsOptional()
	@IsBoolean()
	isRead?: boolean;
}
