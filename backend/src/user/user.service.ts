import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageService } from 'src/shared/image/image.service';
import { MulterFile } from 'src/shared/types/multer_file';
import { JoinHouseDto } from './dto/join-house.dto';

@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		private imageService: ImageService,
	) {}

	async findOne(id: string) {
		const user = await this.prisma.user.findFirst({
			where: { id, deletedAt: null },
			select: {
				id: true,
				email: true,
				username: true,
				name: true,
				imageUrl: true,
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

	// Upload or replace user image
	async uploadImage(userId: string, file: MulterFile) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});
		if (!user || user.deletedAt)
			throw new NotFoundException('User not found');

		// Upload new image to Cloudinary
		const { url, publicId } = await this.imageService.uploadImage(
			file,
			'users',
		);

		const oldPublicId = user.imagePublicId;

		// Save URL and publicId in DB
		const updatedUser = await this.prisma.user.update({
			where: { id: userId },
			data: { imageUrl: url, imagePublicId: publicId },
			select: {
				id: true,
				email: true,
				username: true,
				name: true,
				imageUrl: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (oldPublicId) {
			await this.imageService.deleteImage(oldPublicId);
		}

		return updatedUser;
	}

	async joinHouseWithCode(userId: string, dto: JoinHouseDto) {
		const house = await this.prisma.house.findFirst({
			where: { invitationCode: dto.inviteCode },
		});

		if (!house) {
			throw new NotFoundException('House with code not found');
		}

		return await this.prisma.houseToUser.create({
			data: {
				houseId: house.id,
				userId,
			},
		});
	}
}
