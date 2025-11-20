import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllNotificationsByUserDto } from './dto/find-all-by-user.dto';

@Injectable()
export class NotificationsService {
	constructor(private prisma: PrismaService) {}

	async create(dto: CreateNotificationDto) {
		const users = await this.prisma.user.findMany({
			where: {
				id: { in: dto.userIds },
			},
		});

		if (!users.length) {
			throw new NotFoundException('No users were found');
		}

		return await this.prisma.notification.create({
			data: {
				category: dto.category,
				level: dto.level,
				title: dto.title,
				body: dto.body,
				actionUrl: dto.actionUrl,
				deliveredTo: {
					createMany: {
						data: users.map((user) => {
							return {
								userId: user.id,
							};
						}),
					},
				},
			},
		});
	}

	async findAllByUser(
		userId: string,
		filters: FindAllNotificationsByUserDto,
	) {
		return await this.prisma.notificationToUser.findMany({
			where: {
				userId,
				...(filters.isRead !== undefined && { isRead: filters.isRead }),
				notification: {
					...(filters.category && { category: filters.category }),
					...(filters.level && { level: filters.level }),
				},
			},
			select: {
				userId: true,
				isRead: true,
				readAt: true,
				createdAt: true,
				notification: {
					select: {
						id: true,
						title: true,
						body: true,
						actionUrl: true,
						level: true,
						category: true,
					},
				},
			},
		});
	}

	async findOneByUser(userId: string, notificationId: string) {
		await this.prisma.notificationToUser.findFirst({
			where: { notificationId, userId },
			select: {
				userId: true,
				isRead: true,
				readAt: true,
				createdAt: true,
				notification: {
					select: {
						id: true,
						title: true,
						body: true,
						actionUrl: true,
						level: true,
						category: true,
					},
				},
			},
		});
	}

	async markOneAsReadByUser(userId: string, notificationId: string) {
		const existingNotification =
			await this.prisma.notificationToUser.findFirst({
				where: { notificationId, userId },
			});

		if (!existingNotification) {
			throw new NotFoundException(
				'No notification found with the id provided',
			);
		}

		return this.prisma.notificationToUser.update({
			where: { id: existingNotification.id, userId },
			data: {
				isRead: true,
			},
		});
	}

	async markAllAsReadByUser(userId: string) {
		const existingNotifications =
			await this.prisma.notificationToUser.findMany({
				where: { userId },
			});

		if (!existingNotifications.length) {
			throw new NotFoundException(
				'No notification found with the id provided',
			);
		}

		return this.prisma.notificationToUser.updateMany({
			where: { userId },
			data: {
				isRead: true,
			},
		});
	}
}
