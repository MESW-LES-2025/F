import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ImageModule } from 'src/shared/image/image.module';

@Module({
	imports: [ImageModule],
	controllers: [UserController],
	providers: [UserService],
})
export class UserModule {}
