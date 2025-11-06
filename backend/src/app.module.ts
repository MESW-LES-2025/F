import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HouseModule } from './house/house.module';
import { PantryModule } from './pantry/pantry.module';
import { PantryItemModule } from './pantry-item/pantry-item.module';
import { TasksModule } from './tasks/tasks.module';
import { UserModule } from './user/user.module';

@Module({
	controllers: [AppController],
	providers: [AppService],
	imports: [
		AuthModule,
		HouseModule,
		PantryModule,
		PantryItemModule,
		TasksModule,
		UserModule,
	],
})
export class AppModule {}
