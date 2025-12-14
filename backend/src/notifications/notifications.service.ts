import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllNotificationsByUserDto } from './dto/find-all-by-user.dto';

@Injectable()
export class NotificationsService {
	constructor(private readonly prisma: PrismaService) {}

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
				houseId: dto.houseId,
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
		let isReadFilter: boolean | undefined;
		const rawIsRead: unknown = (filters as Record<string, unknown>)?.isRead;
		if (typeof rawIsRead === 'string') {
			const v = rawIsRead.toLowerCase();
			if (v === 'true') isReadFilter = true;
			else if (v === 'false') isReadFilter = false;
		} else if (typeof rawIsRead === 'boolean') {
			isReadFilter = rawIsRead;
		}

		return await this.prisma.notificationToUser.findMany({
			where: {
				userId,
				deletedAt: null,
				...(isReadFilter !== undefined && { isRead: isReadFilter }),
				notification: {
					...(filters.category && { category: filters.category }),
					...(filters.level && { level: filters.level }),
				},
			},
			select: {
				id: true,
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
						houseId: true,
					},
				},
			},
		});
	}

	async findOneByUser(userId: string, notificationId: string) {
		// Robust: allow param to be either NotificationToUser.id OR Notification.id
		let notification = await this.prisma.notificationToUser.findFirst({
			where: { id: notificationId, userId, deletedAt: null },
			select: {
				id: true,
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

		if (!notification) {
			notification ??= await this.prisma.notificationToUser.findFirst({
				where: { notificationId, userId, deletedAt: null },
				select: {
					id: true,
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

		if (!notification) {
			throw new NotFoundException(
				'No notification found with the id provided',
			);
		}

		return notification;
	}

	async markOneAsReadByUser(userId: string, paramId: string) {
		// Try treating param as row id first; fallback to notificationId
		let existingNotification =
			await this.prisma.notificationToUser.findFirst({
				where: { id: paramId, userId, deletedAt: null },
			});

		existingNotification ??= await this.prisma.notificationToUser.findFirst(
			{
				where: { notificationId: paramId, userId, deletedAt: null },
			},
		);

		if (!existingNotification) {
			throw new NotFoundException(
				'No notification found with the id provided',
			);
		}

		return this.prisma.notificationToUser.update({
			where: { id: existingNotification.id },
			data: {
				isRead: true,
				readAt: new Date(),
			},
		});
	}

	async markAllAsReadByUser(userId: string) {
		const existingNotifications =
			await this.prisma.notificationToUser.findMany({
				where: { userId, deletedAt: null },
			});

		if (!existingNotifications.length) {
			throw new NotFoundException(
				'No notification found with the id provided',
			);
		}

		return this.prisma.notificationToUser.updateMany({
			where: { userId, deletedAt: null },
			data: {
				isRead: true,
				readAt: new Date(),
			},
		});
	}

	async dismissOneByUser(userId: string, paramId: string) {
		let existingNotification =
			await this.prisma.notificationToUser.findFirst({
				where: { id: paramId, userId, deletedAt: null },
			});

		existingNotification ??= await this.prisma.notificationToUser.findFirst(
			{
				where: { notificationId: paramId, userId, deletedAt: null },
			},
		);

		if (!existingNotification) {
			throw new NotFoundException(
				'No notification found with the id provided',
			);
		}

		return this.prisma.notificationToUser.update({
			where: { id: existingNotification.id },
			data: {
				deletedAt: new Date(),
			},
		});
	}
}
