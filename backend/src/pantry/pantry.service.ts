import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePantryDto } from './dto/update-pantry.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PantryService {
	constructor(private prisma: PrismaService) {}

	// The pantry create will only be called when a new house is created
	async create(houseId: string) {
		try {
			await this.prisma.pantry.create({
				data: {
					houseId,
				},
			});
		} catch (e) {

			return false;
		}

		return true;
	}

	async findAll() {
		return await this.prisma.pantry.findMany();
	}

	async findOne(id: string, houseId: string) {
		return await this.prisma.pantry.findUnique({
			where: { id, houseId },
			select: {
				id: true,
				house: {
					select: { id: true, name: true },
				},
				items: {
					select: {
						quantity: true,
						modifiedByUser: true,
						item: {
							select: {
								id: true,
								measurementUnit: true,
								imageLink: true,
							},
						},
					},
				},
			},
		});
	}

	async update({
		id,
		houseId,
		updatePantryDto,
		userId,
	}: {
		id: string;
		houseId: string;
		updatePantryDto: UpdatePantryDto;
		userId: string;
	}) {
		const pantry = await this.prisma.pantry.findUnique({
			where: { id, houseId },
			select: {
				id: true,
				items: true,
			},
		});

		if (!pantry) {
			throw new NotFoundException('Pantry not found');
		}

		if (!updatePantryDto.items.length) {
			throw new NotFoundException('No items found');
		}

		const existingItems = await this.prisma.pantryToItem.findMany({
			where: { pantryId: pantry.id },
			select: { itemId: true, id: true },
		});

		const existingItemIds = existingItems.map((i) => i.itemId);

		const itemsToUpdate = updatePantryDto.items.filter((i) =>
			existingItemIds.includes(i.itemId),
		);

		if (itemsToUpdate) {
			await Promise.all(
				itemsToUpdate.map(
					async (i) =>
						await this.prisma.pantryToItem.update({
							where: {
								pantryId_itemId: {
									pantryId: pantry.id,
									itemId: i.itemId,
								},
							},
							data: {
								quantity: i.quantity,
								modifiedByUser: userId,
							},
						}),
				),
			);
		}

		const itemsToCreate = updatePantryDto.items
			.filter((i) => !existingItemIds.includes(i.itemId))
			.map((i) => ({
				pantryId: pantry.id,
				itemId: i.itemId,
				quantity: i.quantity,
				modifiedByUser: userId,
			}));

		if (itemsToCreate.length > 0) {
			await this.prisma.pantryToItem.createMany({
				data: itemsToCreate,
				skipDuplicates: true,
			});
		}

		return this.findOne(pantry.id, houseId);
	}
}
