import { ApiProperty } from '@nestjs/swagger';

export class UpdatePantryDto {
	@ApiProperty({
		example: {
			itemId: 'uuid',
			quantity: 1,
		},
		description: 'pantry item id',
	})
	items: UpdateItemDto[];
}

export class UpdateItemDto {
	@ApiProperty({ example: 'uuid', description: 'pantry item id' })
	itemId: string;

	@ApiProperty({ example: 1, description: 'pantry item quantity' })
	quantity: number;
}
