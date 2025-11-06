import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePantryDto } from './dto/update-pantry.dto';
import { PrismaService } from 'src/prisma/prisma.service';

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
			console.log(e);
			return false;
		}

		return true;
	}

	async findAll() {
		return await this.prisma.pantry.findMany();
	}

	async findOne(id: string, houseId: string) {
		return await this.prisma.pantry.findFirst({
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
						expiryDate: true,
						item: {
							select: {
								id: true,
								name: true,
								measurementUnit: true,
								imageLink: true,
								category: true,
							},
						},
						user: {
							select: { id: true, name: true },
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
			let pantry = await this.prisma.pantry.findFirst({
				where: { id, houseId },
				select: {
					id: true,
					items: true,
				},
			});
		if (!pantry) {
			// If a pantry record doesn't exist for this house, try to create one (helps dev setups)
			const created = await this.create(houseId);
			if (created) {
				// re-fetch the pantry
				const newPantry = await this.prisma.pantry.findFirst({ where: { id, houseId }, select: { id: true, items: true } });
				if (newPantry) {
					pantry = newPantry as any;
				}
			}

			if (!pantry) {
				throw new NotFoundException('Pantry not found');
			}
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
					async (i) => {
						// If quantity is zero or less, remove the pantry association (delete PantryToItem)
						if (typeof i.quantity === 'number' && i.quantity <= 0) {
							try {
								return await this.prisma.pantryToItem.delete({
									where: {
										pantryId_itemId: {
											pantryId: pantry.id,
											itemId: i.itemId,
										},
									},
								})
							} catch (err) {
								console.error('[pantry.update] failed deleting PantryToItem for', i, 'error:', err);
								throw err;
							}
						}

						const updateData: any = {
							quantity: i.quantity,
							modifiedByUser: userId,
						}
						if (i.expiryDate) {
							updateData.expiryDate = new Date(i.expiryDate as any)
						}
						return await this.prisma.pantryToItem.update({
							where: {
								pantryId_itemId: {
									pantryId: pantry.id,
									itemId: i.itemId,
								},
							},
							data: updateData,
						})
					},
				),
			);
		}

		const itemsToCreate = updatePantryDto.items
			.filter((i) => !existingItemIds.includes(i.itemId))
			// ignore items with non-positive quantity
			.filter((i) => typeof i.quantity === 'number' ? i.quantity > 0 : true)
			.map((i) => {
				const base: any = {
					pantryId: pantry.id,
					itemId: i.itemId,
					quantity: i.quantity,
					modifiedByUser: userId,
				}
				if (i.expiryDate) {
					base.expiryDate = new Date(i.expiryDate as any)
				}
				return base
			})


		if (itemsToCreate.length > 0) {
			// Create items one-by-one to surface any DB errors and avoid silent skips
			const createdRows = [] as any[];
			for (const entry of itemsToCreate) {
				try {
					const created = await this.prisma.pantryToItem.create({ data: entry });
					createdRows.push(created);
				} catch (err) {
					console.error('[pantry.update] failed creating PantryToItem for', entry, 'error:', err);
					throw err;
				}
			}
		}

		return this.findOne(pantry.id, houseId);
	}
}
