import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ImageModule } from 'src/shared/image/image.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
	imports: [ImageModule, NotificationsModule],
	controllers: [UserController],
	providers: [UserService],
})
export class UserModule {}
