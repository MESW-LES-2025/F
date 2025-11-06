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
		// Use findFirst to allow filtering by both id and houseId
		// Include item name/category and the user who modified/added the pantry entry so frontend can render full info
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
			// Use findFirst to ensure the pantry is matched by both id and houseId
			let pantry = await this.prisma.pantry.findFirst({
				where: { id, houseId },
				select: {
					id: true,
					items: true,
				},
			});
		if (!pantry) {
			// If a pantry record doesn't exist for this house, try to create one (helps dev setups)
			console.warn('[pantry.update] pantry not found for houseId', houseId, '— attempting to create');
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

		// Debug logging: inspect incoming DTO
		console.debug('[pantry.update] incoming updatePantryDto:', JSON.stringify(updatePantryDto));
		console.debug('[pantry.update] pantry found id:', pantry?.id);

		const existingItems = await this.prisma.pantryToItem.findMany({
			where: { pantryId: pantry.id },
			select: { itemId: true, id: true },
		});

		console.debug('[pantry.update] existingItems count:', existingItems.length, 'items:', JSON.stringify(existingItems));

		const existingItemIds = existingItems.map((i) => i.itemId);

		const itemsToUpdate = updatePantryDto.items.filter((i) =>
			existingItemIds.includes(i.itemId),
		);

		console.debug('[pantry.update] itemsToUpdate:', JSON.stringify(itemsToUpdate));

		if (itemsToUpdate) {
			await Promise.all(
				itemsToUpdate.map(
					async (i) => {
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

		console.debug('[pantry.update] itemsToCreate:', JSON.stringify(itemsToCreate));

		if (itemsToCreate.length > 0) {
			// Create items one-by-one to surface any DB errors and avoid silent skips
			const createdRows = [] as any[];
			for (const entry of itemsToCreate) {
				try {
					const created = await this.prisma.pantryToItem.create({ data: entry });
					createdRows.push(created);
				} catch (err) {
					// Log the error with context and rethrow so the client receives a clear failure
					console.error('[pantry.update] failed creating PantryToItem for', entry, 'error:', err);
					throw err;
				}
			}
			console.debug('[pantry.update] created PantryToItem rows count:', createdRows.length);
		}

		return this.findOne(pantry.id, houseId);
	}
}
