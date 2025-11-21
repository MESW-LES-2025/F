import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HouseModule } from './house/house.module';
import { PantryModule } from './pantry/pantry.module';
import { PantryItemModule } from './pantry-item/pantry-item.module';
import { TasksModule } from './tasks/tasks.module';
import { UserModule } from './user/user.module';
import { ExpenseModule } from './expense/expense.module';
import { MulterModule } from '@nestjs/platform-express';
import { NotificationsModule } from './notifications/notifications.module';
import * as multer from 'multer';

@Module({
	controllers: [AppController],
	providers: [AppService],
	imports: [
		MulterModule.register({ storage: multer.memoryStorage() }),
		AuthModule,
		HouseModule,
		PantryModule,
		PantryItemModule,
		TasksModule,
		UserModule,
		ExpenseModule,
		NotificationsModule,
	],
})
export class AppModule {}
