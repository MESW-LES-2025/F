import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UserRequest } from 'src/shared/types/user_request';
import { NotificationCategory, NotificationLevel } from '@prisma/client';

describe('NotificationsController', () => {
	let controller: NotificationsController;

	const mockUserId = 'user-id-1';

	const mockNotificationsService = {
		create: jest.fn().mockResolvedValue({ id: 'notif-id-1' }),
		findAllByUser: jest.fn().mockResolvedValue([{ id: 'notif-id-1' }]),
		findOneByUser: jest.fn().mockResolvedValue({ id: 'notif-id-1' }),
		markOneAsReadByUser: jest.fn().mockResolvedValue({ success: true }),
		markAllAsReadByUser: jest.fn().mockResolvedValue({ success: true }),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [NotificationsController],
			providers: [
				{
					provide: NotificationsService,
					useValue: mockNotificationsService,
				},
			],
		}).compile();

		controller = module.get<NotificationsController>(NotificationsController);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('create should call service.create and return result', async () => {
		const dto = {
			title: 'Test',
			body: 'Testing notification',
			userIds: [mockUserId],
			level: NotificationLevel.MEDIUM,
			category: NotificationCategory.OTHER,
		};

		const result = await controller.create(dto);

		expect(mockNotificationsService.create).toHaveBeenCalledWith(dto);
		expect(result).toEqual({ id: 'notif-id-1' });
	});

	it('findAllByUser should call service.findAllByUser and return result', async () => {
		const filters = { unreadOnly: true } as any;
		const req = { user: { userId: mockUserId } } as UserRequest;

		const result = await controller.findAllByUser(req, filters);

		expect(mockNotificationsService.findAllByUser).toHaveBeenCalledWith(
			mockUserId,
			filters,
		);
		expect(result).toEqual([{ id: 'notif-id-1' }]);
	});

	it('findOneByUser should call service.findOneByUser and return result', async () => {
		const req = { user: { userId: mockUserId } } as UserRequest;
		const id = 'notif-id-1';

		const result = await controller.findOneByUser(id, req);

		expect(mockNotificationsService.findOneByUser).toHaveBeenCalledWith(
			mockUserId,
			id,
		);
		expect(result).toEqual({ id: 'notif-id-1' });
	});

	it('markOneAsReadByUser should call service.markOneAsReadByUser', async () => {
		const req = { user: { userId: mockUserId } } as UserRequest;
		const id = 'notif-id-1';

		const result = await controller.markOneAsReadByUser(id, req);

		expect(mockNotificationsService.markOneAsReadByUser).toHaveBeenCalledWith(
			mockUserId,
			id,
		);
		expect(result).toEqual({ success: true });
	});

	it('markAllAsReadByUser should call service.markAllAsReadByUser', async () => {
		const req = { user: { userId: mockUserId } } as UserRequest;

		const result = await controller.markAllAsReadByUser(req);

		expect(
			mockNotificationsService.markAllAsReadByUser,
		).toHaveBeenCalledWith(mockUserId);

		expect(result).toEqual({ success: true });
	});
});
