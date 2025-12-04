import { Test, TestingModule } from '@nestjs/testing';
import { PantryMonitorService } from './pantry-monitor.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('PantryMonitorService', () => {
	let service: PantryMonitorService;

	const mockPrismaService = {
		pantryToItem: {
			findMany: jest.fn(),
			update: jest.fn(),
		},
		houseToUser: {
			findMany: jest.fn(),
		},
	};

	const mockNotificationsService = {
		create: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PantryMonitorService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{
					provide: NotificationsService,
					useValue: mockNotificationsService,
				},
			],
		}).compile();

		service = module.get<PantryMonitorService>(PantryMonitorService);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('handlePantryCheck', () => {
		const now = new Date();
		const houseId = 'house-1';
		const userId = 'user-1';

		const mockPantryItemBase = {
			id: 'pi-1',
			pantryId: 'pantry-1',
			itemId: 'item-1',
			quantity: 5,
			expiryDate: null,
			lastExpiryNotificationAt: null,
			pantry: { houseId },
			item: { name: 'Test Item', measurementUnit: 'kg' },
		};

		const mockHouseUsers = [{ userId }];

		beforeEach(() => {
			mockPrismaService.houseToUser.findMany.mockResolvedValue(
				mockHouseUsers,
			);
		});

		it('should notify low stock', async () => {
			mockPrismaService.pantryToItem.findMany.mockResolvedValue([
				{ ...mockPantryItemBase, quantity: 1 },
			]);

			await service.handlePantryCheck();

			expect(mockNotificationsService.create).toHaveBeenCalledWith(
				expect.objectContaining({
					title: expect.stringContaining('is near expiry') as unknown, // Note: title seems generic in code
					body: expect.stringContaining('low on stock') as unknown,
					userIds: [userId],
				}),
			);
		});

		it('should notify near expiry if cooldown allows', async () => {
			const expiryDate = new Date(
				now.getTime() + 1 * 24 * 60 * 60 * 1000,
			); // 1 day from now
			mockPrismaService.pantryToItem.findMany.mockResolvedValue([
				{ ...mockPantryItemBase, expiryDate },
			]);

			await service.handlePantryCheck();

			expect(mockNotificationsService.create).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining('expiring soon') as unknown,
					userIds: [userId],
				}),
			);
			expect(mockPrismaService.pantryToItem.update).toHaveBeenCalled();
		});

		it('should NOT notify near expiry if cooldown active', async () => {
			const expiryDate = new Date(
				now.getTime() + 1 * 24 * 60 * 60 * 1000,
			); // 1 day from now
			const lastNotified = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
			mockPrismaService.pantryToItem.findMany.mockResolvedValue([
				{
					...mockPantryItemBase,
					expiryDate,
					lastExpiryNotificationAt: lastNotified,
				},
			]);

			await service.handlePantryCheck();

			expect(mockNotificationsService.create).not.toHaveBeenCalled();
		});

		it('should do nothing if stock is high and not expiring', async () => {
			mockPrismaService.pantryToItem.findMany.mockResolvedValue([
				{ ...mockPantryItemBase, quantity: 10 },
			]);

			await service.handlePantryCheck();

			expect(mockNotificationsService.create).not.toHaveBeenCalled();
		});

		it('should skip if no users in house', async () => {
			mockPrismaService.pantryToItem.findMany.mockResolvedValue([
				{ ...mockPantryItemBase, quantity: 1 },
			]);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([]);

			await service.handlePantryCheck();

			expect(mockNotificationsService.create).not.toHaveBeenCalled();
		});
	});
});
