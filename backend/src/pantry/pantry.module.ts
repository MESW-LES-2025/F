import { Module } from '@nestjs/common';
import { PantryService } from './pantry.service';
import { PantryController } from './pantry.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
	imports: [NotificationsModule],
	controllers: [PantryController],
	providers: [PantryService],
	exports: [PantryService],
})
export class PantryModule {}
