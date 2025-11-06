import { Module } from '@nestjs/common';
import { HouseService } from './house.service';
import { HouseController } from './house.controller';
import { PantryModule } from 'src/pantry/pantry.module';

@Module({
	controllers: [HouseController],
	providers: [HouseService],
	imports: [PantryModule],
})
export class HouseModule {}
