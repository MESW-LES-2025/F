import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageService } from 'src/shared/image/image.service';
import { MulterFile } from 'src/shared/types/multer_file';
import { JoinHouseDto } from './dto/join-house.dto';
import { InviteToHouseDto } from './dto/invite-to-house.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationCategory, NotificationLevel } from '@prisma/client';

@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		private imageService: ImageService,
		private notificationService: NotificationsService,
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
				googleId: true,
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

		const { username, name } = updateUserDto;

		const updated = await this.prisma.user.update({
			where: { id },
			data: {
				...(username ? { username } : {}),
				...(name !== undefined ? { name } : {}),
			},
			select: {
				id: true,
				email: true,
				username: true,
				name: true,
				imageUrl: true,
				googleId: true,
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
		if (!dto.inviteCode) {
			throw new BadRequestException('Code not sent');
		}

		const house = await this.prisma.house.findFirst({
			where: { invitationCode: dto.inviteCode },
		});

		if (!house) {
			throw new NotFoundException('House with code not found');
		}

		const existingUser = await this.prisma.houseToUser.findFirst({
			where: {
				houseId: house.id,
				userId,
			},
		});

		if (existingUser) {
			throw new BadRequestException('The user is already in the house');
		}

		const houseToUser = await this.prisma.houseToUser.create({
			data: {
				houseId: house.id,
				userId,
			},
		});

		return houseToUser
			? {
					houseId: houseToUser.houseId,
				}
			: {
					houseId: null,
				};
	}

	async inviteToHouse(dto: InviteToHouseDto, userInvitingId: string) {
		if (!dto.email && !dto.username) {
			throw new BadRequestException(
				'To invite a user you need their email or username',
			);
		}

		const house = await this.prisma.house.findUnique({
			where: { id: dto.houseId },
		});

		if (!house) {
			throw new NotFoundException('House with id not found');
		}

		const existingUser = await this.prisma.user.findFirst({
			where: {
				...(dto.email !== undefined && { email: dto.email }),
				...(dto.username !== undefined && { username: dto.username }),
			},
		});

		if (!existingUser) {
			throw new BadRequestException('The user does not exist');
		}

		const existingUserToHouse = await this.prisma.houseToUser.findFirst({
			where: {
				houseId: house.id,
				userId: existingUser.id,
			},
		});

		if (existingUserToHouse) {
			throw new BadRequestException('The user is already in the house');
		}

		const existingUserInviting = await this.prisma.user.findUnique({
			where: { id: userInvitingId },
		});

		if (!existingUserInviting) {
			throw new BadRequestException('The inviting user does not exist');
		}

		const invitingUserMembership = await this.prisma.houseToUser.findFirst({
			where: {
				houseId: house.id,
				userId: userInvitingId,
			},
		});

		if (!invitingUserMembership) {
			throw new BadRequestException(
				'The inviting user must belong to the house',
			);
		}

		const existingHouse = await this.prisma.house.findUnique({
			where: { id: dto.houseId },
		});

		if (!existingHouse) {
			throw new BadRequestException('The house does not exist');
		}

		const existingPendingInvite =
			await this.prisma.notificationToUser.findFirst({
				where: {
					userId: existingUser.id,
					isRead: false,
					notification: {
						category: NotificationCategory.HOUSE,
						actionUrl: house.id,
					},
				},
			});

		if (existingPendingInvite) {
			throw new BadRequestException(
				'The user already has a pending invite to this house',
			);
		}

		return await this.notificationService.create({
			title: `${existingUserInviting.name} invited you to join a house!`,
			body: `${existingUserInviting.name} invited you to join the house ${existingHouse.name}, use the following code to join: ${house.invitationCode}`,
			userIds: [existingUser.id],
			level: NotificationLevel.MEDIUM,
			category: NotificationCategory.HOUSE,
			actionUrl: house.id,
		});
	}
}
