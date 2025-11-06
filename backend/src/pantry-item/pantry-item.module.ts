import { Module } from '@nestjs/common';
import { PantryItemService } from './pantry-item.service';
import { PantryItemController } from './pantry-item.controller';

@Module({
	controllers: [PantryItemController],
	providers: [PantryItemService],
})
export class PantryItemModule {}
