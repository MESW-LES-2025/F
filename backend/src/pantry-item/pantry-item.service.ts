import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { verifyIsString } from '../shared/function-verify-string';

@Injectable()
export class PantryItemService {
	constructor(private prisma: PrismaService) {}

	async create(
		createPantryItemDto: CreatePantryItemDto,
		_userId: string,
		_houseId: string,
	) {
		// mark unused params as used to satisfy lint rules
		void _userId;
		void _houseId;
		if (!verifyIsString(createPantryItemDto.name)) {
			throw new UnauthorizedException(
				'The name is not in the right format',
			);
		}

		// imageLink and measurementUnit are optional now; validate only when provided
		if (
			createPantryItemDto.imageLink !== undefined &&
			!verifyIsString(createPantryItemDto.imageLink)
		) {
			throw new UnauthorizedException(
				'The image link is not in the right format',
			);
		}

		if (
			createPantryItemDto.measurementUnit !== undefined &&
			!verifyIsString(createPantryItemDto.measurementUnit)
		) {
			throw new UnauthorizedException(
				'The measurement unit is not in the right format',
			);
		}

		// only pass optional properties when provided; use unknown-backed object to satisfy lint
		const data: Record<string, unknown> = {
			name: createPantryItemDto.name,
		};
		if (createPantryItemDto.imageLink !== undefined) {
			data.imageLink = createPantryItemDto.imageLink;
		}
		if (createPantryItemDto.measurementUnit !== undefined) {
			data.measurementUnit = createPantryItemDto.measurementUnit;
		}
		if (createPantryItemDto.category !== undefined) {
			data.category = createPantryItemDto.category;
		}

		// Attach the creating user and house to satisfy DB constraints
		if (_userId) data.createdByUser = _userId
		if (_houseId) data.houseId = _houseId

		const item = await this.prisma.pantryItem.create({
			data: data as unknown as Prisma.PantryItemCreateInput,
		});

		return item;
	}

	async findAll() {
		return await this.prisma.pantryItem.findMany();
	}

	async findAllUser(userId: string) {
		// Return pantry items created by the given user (new schema adds createdByUser)
		return await this.prisma.pantryItem.findMany({
			where: { createdByUser: userId } as any,
		});
	}

	async findAllHouse(houseId: string) {
		// items that appear in the pantry belonging to the provided house
		return await this.prisma.pantryItem.findMany({
			where: { pantries: { some: { pantry: { houseId } } } },
		});
	}

	async findOne(id: string, _userId?: string) {
		if (_userId) {
			return await this.prisma.pantryItem.findUnique({
				where: { id, createdByUser: _userId } as any,
			});
		}
		return await this.prisma.pantryItem.findUnique({ where: { id } });
	}

	async update(
		id: string,
		updatePantryItemDto: UpdatePantryItemDto,
		_userId: string,
	) {
		const item = await this.prisma.pantryItem.findUnique({ where: { id, createdByUser: _userId } as any });

		if (!item) {
			throw new NotFoundException('The item was not found');
		}

		const data: Record<string, unknown> = {
			name: updatePantryItemDto.name,
		};
		if (updatePantryItemDto.imageLink !== undefined)
			data.imageLink = updatePantryItemDto.imageLink;
		if (updatePantryItemDto.measurementUnit !== undefined)
			data.measurementUnit = updatePantryItemDto.measurementUnit;

		const updated = await this.prisma.pantryItem.update({
			where: { id, createdByUser: _userId } as any,
			data: data as unknown as Prisma.PantryItemUpdateInput,
		});

		return updated;
	}

	async remove(id: string, _userId: string) {
		const item = await this.prisma.pantryItem.findUnique({ where: { id, createdByUser: _userId } as any });

		if (!item) {
			throw new NotFoundException('The item was not found');
		}

		return await this.prisma.pantryItem.delete({ where: { id, createdByUser: _userId } as any });
	}
}
