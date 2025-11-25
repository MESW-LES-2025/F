import { Module } from '@nestjs/common';
import { PantryService } from './pantry.service';
import { PantryController } from './pantry.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PantryMonitorService } from './pantry-monitor.service';

@Module({
	imports: [NotificationsModule],
	controllers: [PantryController],
	providers: [PantryService, PantryMonitorService],
	exports: [PantryService],
})
export class PantryModule {}
