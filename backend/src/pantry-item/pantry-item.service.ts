import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { PrismaService } from '../prisma/prisma.service';
import { verifyIsString } from '../shared/function-verify-string';

@Injectable()
export class PantryItemService {
	constructor(private prisma: PrismaService) {}

	async create(createPantryItemDto: CreatePantryItemDto) {
		if (!verifyIsString(createPantryItemDto.name)) {
			throw new UnauthorizedException(
				'The name is not in the right format',
			);
		}

		if (!verifyIsString(createPantryItemDto.imageLink)) {
			throw new UnauthorizedException(
				'The image link is not in the right format',
			);
		}

		if (!verifyIsString(createPantryItemDto.measurementUnit)) {
			throw new UnauthorizedException(
				'The measurement unit is not in the right format',
			);
		}

		const item = await this.prisma.pantryItem.create({
			data: {
				name: createPantryItemDto.name,
				imageLink: createPantryItemDto.imageLink,
				measurementUnit: createPantryItemDto.measurementUnit,
			},
		});

		return item;
	}

	async findAll() {
		return await this.prisma.pantryItem.findMany();
	}

	async findOne(id: string) {
		return await this.prisma.pantryItem.findUnique({
			where: { id },
		});
	}

	async update(id: string, updatePantryItemDto: UpdatePantryItemDto) {
		const item = await this.prisma.pantryItem.findUnique({
			where: { id },
		});

		if (!item) {
			throw new NotFoundException('The item was not found');
		}

		return await this.prisma.pantryItem.update({
			where: { id },
			data: {
				name: updatePantryItemDto.name,
				imageLink: updatePantryItemDto.imageLink,
				measurementUnit: updatePantryItemDto.measurementUnit,
			},
		});
	}

	async remove(id: string) {
		const item = await this.prisma.pantryItem.findUnique({
			where: { id },
		});

		if (!item) {
			throw new NotFoundException('The item was not found');
		}

		return await this.prisma.pantryItem.delete({
			where: { id },
		});
	}
}
