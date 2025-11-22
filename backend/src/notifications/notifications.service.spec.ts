import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FindAllNotificationsByUserDto } from './dto/find-all-by-user.dto';

describe('NotificationsService', () => {
	let service: NotificationsService;

	const mockPrismaService = {
		user: {
			findMany: jest.fn(),
		},
		notification: {
			create: jest.fn(),
		},
		notificationToUser: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
			updateMany: jest.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				NotificationsService,
				{ provide: PrismaService, useValue: mockPrismaService },
			],
		}).compile();

		service = module.get<NotificationsService>(NotificationsService);
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('throws NotFoundException if no users are found', async () => {
			mockPrismaService.user.findMany.mockResolvedValue([]);

			await expect(
				service.create({
					title: 'Test',
					body: 'Body',
					level: 'MEDIUM',
					category: 'HOUSE',
					userIds: ['u1'],
				}),
			).rejects.toThrow(NotFoundException);
		});

		it('creates notification and deliveredTo entries', async () => {
			mockPrismaService.user.findMany.mockResolvedValue([
				{ id: 'u1' },
				{ id: 'u2' },
			]);

			const createdNotification = { id: 'notif-id-1' };
			mockPrismaService.notification.create.mockResolvedValue(
				createdNotification,
			);

			const dto: CreateNotificationDto = {
				title: 'Test',
				body: 'Body',
				level: 'MEDIUM',
				category: 'HOUSE',
				userIds: ['u1', 'u2'],
			};

			const result = await service.create(dto);

			expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
				where: { id: { in: dto.userIds } },
			});

			expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
				data: {
					category: dto.category,
					level: dto.level,
					title: dto.title,
					body: dto.body,
					actionUrl: undefined,
					deliveredTo: {
						createMany: {
							data: [{ userId: 'u1' }, { userId: 'u2' }],
						},
					},
				},
			});

			expect(result).toEqual(createdNotification);
		});
	});

	describe('findAllByUser', () => {
		it('returns notifications for a user with filters applied', async () => {
			const mockNotifications = [
				{
					userId: 'u1',
					isRead: false,
					notification: { id: 'n1' },
				},
			];

			mockPrismaService.notificationToUser.findMany.mockResolvedValue(
				mockNotifications,
			);

			const filters: FindAllNotificationsByUserDto = {
				isRead: false,
				category: 'HOUSE',
				level: 'HIGH',
			};

			const result = await service.findAllByUser('u1', filters);

				expect(
					mockPrismaService.notificationToUser.findMany,
				).toHaveBeenCalledWith({
					where: {
						userId: 'u1',
						deletedAt: null,
						isRead: false,
						notification: {
							category: 'HOUSE',
							level: 'HIGH',
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

			expect(result).toEqual(mockNotifications);
		});
	});

	describe('findOneByUser', () => {
		it('calls prisma correctly (even though service does not return)', async () => {
			mockPrismaService.notificationToUser.findFirst.mockResolvedValue({
				id: 'ntu1',
			});

			await service.findOneByUser('u1', 'notif1');

				expect(
					mockPrismaService.notificationToUser.findFirst,
				).toHaveBeenCalledWith({
					where: { id: 'notif1', userId: 'u1', deletedAt: null },
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
		});
	});

	describe('markOneAsReadByUser', () => {
		it('throws NotFoundException if notification not found', async () => {
			mockPrismaService.notificationToUser.findFirst.mockResolvedValue(
				null,
			);

			await expect(
				service.markOneAsReadByUser('u1', 'notif1'),
			).rejects.toThrow(NotFoundException);
		});

		it('updates notification as read', async () => {
			mockPrismaService.notificationToUser.findFirst.mockResolvedValue({
				id: 'ntu1',
				userId: 'u1',
			});

			mockPrismaService.notificationToUser.update.mockResolvedValue({
				success: true,
			});

			const result = await service.markOneAsReadByUser('u1', 'notif1');

				expect(
					mockPrismaService.notificationToUser.update,
				).toHaveBeenCalledWith({
					where: { id: 'ntu1' },
					data: expect.objectContaining({ isRead: true, readAt: expect.any(Date) }),
				});

			expect(result).toEqual({ success: true });
		});
	});

	describe('markAllAsReadByUser', () => {
		it('throws NotFoundException if no notifications exist', async () => {
			mockPrismaService.notificationToUser.findMany.mockResolvedValue([]);

			await expect(service.markAllAsReadByUser('u1')).rejects.toThrow(
				NotFoundException,
			);
		});

		it('updates all user notifications as read', async () => {
			mockPrismaService.notificationToUser.findMany.mockResolvedValue([
				{ id: 'ntu1' },
			]);

			mockPrismaService.notificationToUser.updateMany.mockResolvedValue({
				count: 1,
			});

			const result = await service.markAllAsReadByUser('u1');

				expect(
					mockPrismaService.notificationToUser.updateMany,
				).toHaveBeenCalledWith({
					where: { userId: 'u1', deletedAt: null },
					data: expect.objectContaining({ isRead: true, readAt: expect.any(Date) }),
				});

			expect(result).toEqual({ count: 1 });
		});
	});
});
