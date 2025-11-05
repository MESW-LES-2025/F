import { ApiProperty } from '@nestjs/swagger';

export class CreatePantryItemDto {
	@ApiProperty({ example: 'item1', description: 'item name' })
	name: string;

	@ApiProperty({
		example: 'www.api.com/image-item1',
		description: 'item image link',
	})
	imageLink: string;

	@ApiProperty({ example: 'kg', description: 'item measurement unit' })
	measurementUnit?: string;
}
