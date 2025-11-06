import { ApiProperty } from '@nestjs/swagger';
import { PANTRY_CATEGORIES, UNITS } from 'src/shared/pantry-constants';

export class CreatePantryItemDto {
	@ApiProperty({ example: 'item1', description: 'item name' })
	name: string;

	@ApiProperty({
		example: 'www.api.com/image-item1',
		description: 'item image link',
	})
	imageLink?: string;

	@ApiProperty({
		example: 'GRAINS',
		description: 'item category (enum)',
		enum: PANTRY_CATEGORIES,
	})
	category?: string;

	@ApiProperty({
		example: 'KG',
		description: 'item measurement unit (enum)',
		enum: UNITS,
	})
	measurementUnit?: string;
}
