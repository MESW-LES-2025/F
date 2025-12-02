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
import { UpdateHouseDto } from './dto/update-house.dto';

@Injectable()
export class HouseService {
	constructor(
		private prisma: PrismaService,
		private pantryService: PantryService,
	) {}

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
				role: 'ADMIN',
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
		});
	}

	async findOne(id: string) {
		return await this.prisma.house.findUnique({
			where: { id },
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

	async findHouseDetails(houseId: string, userId: string) {
		const house = await this.prisma.house.findFirst({
			where: {
				id: houseId,
				users: {
					some: { userId }, // make sure user only sees his houses
				},
			},
		});

		if (!house) {
			throw new NotFoundException('House not found!');
		}

		const users = await this.prisma.user.findMany({
			where: {
				houses: {
					some: {
						houseId: house.id,
					},
				},
			},
			select: {
				id: true,
				email: true,
				username: true,
				name: true,
				imagePublicId: true,
				houses: {
					where: {
						houseId: house.id,
					},
					select: {
						role: true,
					},
				},
			},
		});

		return {
			house,
			users,
		};
	}

	async update({
		houseId,
		dto,
		userId,
	}: {
		houseId: string;
		dto: UpdateHouseDto;
		userId: string;
	}) {
		const house = await this.prisma.house.findFirst({
			where: {
				id: houseId,
				users: {
					some: { userId, role: 'ADMIN' }, // only admins can edit a house!
				},
			},
		});

		if (!house) {
			throw new NotFoundException('House not found!');
		}

		if (dto.userToRemoveId) {
			const houseToUser = await this.prisma.houseToUser.findFirst({
				where: {
					houseId: houseId,
					userId: dto.userToRemoveId,
				},
			});

			if (!houseToUser) {
				throw new NotFoundException('User is not in house!');
			}

			await this.prisma.houseToUser.delete({
				where: {
					id: houseToUser.id,
					houseId: houseId,
					userId: dto.userToRemoveId,
				},
			});
		}

		if (dto.userToUpgradeId) {
			const houseToUser = await this.prisma.houseToUser.findFirst({
				where: {
					houseId: houseId,
					userId: dto.userToUpgradeId,
				},
			});

			if (!houseToUser) {
				throw new NotFoundException('User is not in house!');
			}

			await this.prisma.houseToUser.update({
				where: {
					id: houseToUser.id,
					houseId: houseId,
					userId: dto.userToUpgradeId,
				},
				data: {
					role: 'ADMIN',
				},
			});
		}

		return await this.prisma.house.update({
			where: {
				id: houseId,
			},
			data: {
				name: dto.name,
			},
		});
	}

	/*
  remove(id: number) {
    return `This action removes a #${id} house`;
  }  */
}
