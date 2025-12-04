import {
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { CreateHouseDto } from './dto/create-house.dto';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { PantryService } from '../pantry/pantry.service';
import { verifyIsString } from '../shared/function-verify-string';

@Injectable()
export class HouseService {
	constructor(
		private prisma: PrismaService,
		private pantryService: PantryService,
	) { }

	async create(createHouseDto: CreateHouseDto, createdByUserId: string) {
		const { name } = createHouseDto;

		if (!verifyIsString(name)) {
			throw new UnauthorizedException('The name is not a string');
		}

		const house = await this.prisma.house.create({
			data: {
				name,
				invitationCode: this.generateSecureInviteCode(),
			},
		});

		if (!house) {
			throw new NotFoundException('The house could not be created');
		}

		const pantry = await this.pantryService.create(house.id);

		if (!pantry) {
			throw new NotFoundException('The pantry could not be created');
		}

		// add the relation between house and the user that created it
		await this.prisma.houseToUser.create({
			data: {
				userId: createdByUserId,
				houseId: house.id,
			},
		});

		return house;
	}

	async findAll() {
		return await this.prisma.house.findMany();
	}

	async findAllUserHouses(userId: string) {
		return await this.prisma.house.findMany({
			where: {
				users: {
					some: { userId },
				},
			},
			include: {
				users: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
								imageUrl: true,
							},
						},
					},
				},
			},
		});
	}

	async findOne(id: string) {
		return await this.prisma.house.findUnique({
			where: { id },
			include: {
				users: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								username: true,
								imageUrl: true,
							},
						},
					},
				},
			},
		});
	}

	generateSecureInviteCode(length = 8): string {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		const bytes = randomBytes(length);
		let code = '';
		for (let i = 0; i < length; i++) {
			code += chars[bytes[i] % chars.length];
		}

		return code;
	}

	/*
  update(id: number, updateHouseDto: UpdateHouseDto) {
	return `This action updates a #${id} house`;
  }

  remove(id: number) {
	return `This action removes a #${id} house`;
  } */
}
