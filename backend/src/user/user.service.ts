import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async findOne(id: string) {
		const user = await this.prisma.user.findFirst({
			where: { id, deletedAt: null },
			select: {
				id: true,
				email: true,
				username: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return user;
	}

	// Update user fields (only the allowed fields passed in DTO)
	async update(id: string, updateUserDto: UpdateUserDto) {
		const user = await this.prisma.user.findFirst({
			where: { id, deletedAt: null },
		});
		if (!user) {
			throw new NotFoundException('User not found');
		}

		const { email, username, name } = updateUserDto;

		const updated = await this.prisma.user.update({
			where: { id },
			data: {
				...(email ? { email } : {}),
				...(username ? { username } : {}),
				...(name !== undefined ? { name } : {}),
			},
			select: {
				id: true,
				email: true,
				username: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return updated;
	}

	// Remove a user by id
	async remove(id: string) {
		const user = await this.prisma.user.findFirst({
			where: { id, deletedAt: null },
		});
		if (!user) {
			throw new NotFoundException('User not found');
		}

		// Soft delete: set deletedAt and revoke refresh tokens
		await this.prisma.user.update({
			where: { id },
			data: { deletedAt: new Date() },
		});

		await this.prisma.refreshToken.updateMany({
			where: { userId: id, isRevoked: false },
			data: { isRevoked: true, revokedAt: new Date() },
		});

		return { success: true };
	}
}
