import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { verifyIsString } from 'src/shared/function-verify-string';

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

		const item = await this.prisma.pantryItem.create({
			data: data as unknown as Prisma.PantryItemCreateInput,
		});

		return item;
	}

	async findAll() {
		return await this.prisma.pantryItem.findMany();
	}

	async findAllUser(userId: string) {
		// return pantry items that have at least one pantry entry modified by the user
		return await this.prisma.pantryItem.findMany({
			where: {
				pantries: { some: { modifiedByUser: userId } },
			},
		});
	}

	async findAllHouse(houseId: string) {
		// items that appear in the pantry belonging to the provided house
		return await this.prisma.pantryItem.findMany({
			where: { pantries: { some: { pantry: { houseId } } } },
		});
	}

	async findOne(id: string) {
		return await this.prisma.pantryItem.findUnique({ where: { id } });
	}

	async update(
		id: string,
		updatePantryItemDto: UpdatePantryItemDto,
		_userId: string,
	) {
		void _userId;
		const item = await this.prisma.pantryItem.findUnique({ where: { id } });

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
			where: { id },
			data: data as unknown as Prisma.PantryItemUpdateInput,
		});

		return updated;
	}

	async remove(id: string, _userId: string) {
		void _userId;
		const item = await this.prisma.pantryItem.findUnique({ where: { id } });

		if (!item) {
			throw new NotFoundException('The item was not found');
		}

		return await this.prisma.pantryItem.delete({ where: { id } });
	}
}
