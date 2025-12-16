import { Test, TestingModule } from '@nestjs/testing';
import { PantryService } from './pantry.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';

describe('PantryService', () => {
	let service: PantryService;
	let module: TestingModule;

	const mockPrisma = {
		pantry: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
		},
		pantryToItem: {
			findMany: jest.fn(),
			update: jest.fn(),
			create: jest.fn(),
			delete: jest.fn(),
			createMany: jest.fn(),
		},
		houseToUser: {
			findMany: jest.fn(),
		},
		pantryItem: {
			findUnique: jest.fn(),
		},
	};

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [
				PantryService,
				{
					provide: PrismaService,
					useValue: mockPrisma,
				},
				{
					provide: NotificationsService,
					useValue: { create: jest.fn() },
				},
			],
		}).compile();

		service = module.get<PantryService>(PantryService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create a pantry and return true', async () => {
			mockPrisma.pantry.create.mockResolvedValue({ id: '1' });

			const result = await service.create('house123');

			expect(mockPrisma.pantry.create).toHaveBeenCalledWith({
				data: { houseId: 'house123' },
			});
			expect(result).toBe(true);
		});

		it('should return false on error', async () => {
			mockPrisma.pantry.create.mockRejectedValue(new Error('fail'));

			const result = await service.create('house123');

			expect(result).toBe(false);
		});
	});

	describe('findAll', () => {
		it('should return all pantries', async () => {
			const mockData = [{ id: '1' }];
			mockPrisma.pantry.findMany.mockResolvedValue(mockData);

			const result = await service.findAll();

			expect(result).toEqual(mockData);
			expect(mockPrisma.pantry.findMany).toHaveBeenCalled();
		});
	});

	describe('findOne', () => {
		it('should return a specific pantry', async () => {
			const mockPantry = { id: 'p1' };
			mockPrisma.pantry.findFirst.mockResolvedValue(mockPantry);

			const result = await service.findOne('p1', 'h1');

			expect(result).toEqual(mockPantry);
			expect(mockPrisma.pantry.findFirst).toHaveBeenCalledWith({
				where: { id: 'p1', houseId: 'h1' },
				select: {
					id: true,
					house: { select: { id: true, name: true } },
					items: {
						select: {
							quantity: true,
							modifiedByUser: true,
							expiryDate: true,
							item: {
								select: {
									id: true,
									name: true,
									measurementUnit: true,
									imageLink: true,
									category: true,
								},
							},
							user: {
								select: {
									id: true,
									name: true,
									imageUrl: true,
								},
							},
						},
					},
				},
			});
		});
	});

	describe('update', () => {
		const params = {
			id: 'p1',
			houseId: 'h1',
			userId: 'u1',
			updatePantryDto: {
				items: [
					{ itemId: 'i1', quantity: 5 },
					{ itemId: 'i2', quantity: 3 },
				],
			},
		};

		it('should throw if pantry does not exist and cannot be created', async () => {
			mockPrisma.pantry.findFirst.mockResolvedValue(null);
			mockPrisma.pantry.create.mockRejectedValue(new Error('fail'));

			await expect(service.update(params)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should auto-create pantry if not found', async () => {
			mockPrisma.pantry.findFirst
				.mockResolvedValueOnce(null) // First check fails
				.mockResolvedValueOnce({ id: 'p1', items: [] }); // Second check succeeds after create
			mockPrisma.pantry.create.mockResolvedValue({ id: 'p1' });
			mockPrisma.pantryToItem.findMany.mockResolvedValue([]);
			mockPrisma.pantryToItem.create.mockResolvedValue({});

			await service.update(params);

			expect(mockPrisma.pantry.create).toHaveBeenCalledWith({
				data: { houseId: 'h1' },
			});
		});

		it('should throw if updatePantryDto has no items', async () => {
			mockPrisma.pantry.findFirst.mockResolvedValue({
				id: 'p1',
				items: [],
			});

			await expect(
				service.update({
					...params,
					updatePantryDto: { items: [] },
				}),
			).rejects.toThrow(NotFoundException);
		});

		it('should update existing items and create new ones', async () => {
			mockPrisma.pantry.findFirst.mockResolvedValue({
				id: 'p1',
				items: [],
			});

			mockPrisma.pantryToItem.findMany.mockResolvedValue([
				{ itemId: 'i1', id: 'x1' },
			]);

			mockPrisma.pantryToItem.update.mockResolvedValue({});
			mockPrisma.pantryToItem.create.mockResolvedValue({});

			const mockReturn = { id: 'p1', house: {} };
			mockPrisma.pantry.findFirst.mockResolvedValueOnce({
				id: 'p1',
				items: [],
			});
			mockPrisma.pantry.findFirst.mockResolvedValueOnce(mockReturn);

			const result = await service.update(params);

			expect(mockPrisma.pantryToItem.update).toHaveBeenCalledTimes(1);
			expect(mockPrisma.pantryToItem.create).toHaveBeenCalledTimes(1);
			expect(result).toEqual(mockReturn);
		});

		it('should delete items with quantity <= 0', async () => {
			mockPrisma.pantry.findFirst.mockResolvedValue({
				id: 'p1',
				items: [],
			});
			mockPrisma.pantryToItem.findMany.mockResolvedValue([
				{ itemId: 'i1', id: 'x1' },
			]);
			mockPrisma.pantryToItem.delete.mockResolvedValue({});

			await service.update({
				...params,
				updatePantryDto: {
					items: [{ itemId: 'i1', quantity: 0 }],
				},
			});

			expect(mockPrisma.pantryToItem.delete).toHaveBeenCalledWith({
				where: {
					pantryId_itemId: {
						pantryId: 'p1',
						itemId: 'i1',
					},
				},
			});
		});

		it('should send notification for low stock', async () => {
			mockPrisma.pantry.findFirst.mockResolvedValue({
				id: 'p1',
				items: [],
			});
			mockPrisma.pantryToItem.findMany.mockResolvedValue([
				{ itemId: 'i1', id: 'x1' },
			]);
			mockPrisma.pantryToItem.update.mockResolvedValue({});
			mockPrisma.houseToUser.findMany.mockResolvedValue([
				{ userId: 'u1' },
				{ userId: 'u2' },
			]);
			mockPrisma.pantryItem.findUnique.mockResolvedValue({
				name: 'Milk',
				measurementUnit: 'L',
			});

			// Access the NotificationsService mock correctly
			const notificationsService = module.get(NotificationsService);

			await service.update({
				...params,
				updatePantryDto: {
					items: [{ itemId: 'i1', quantity: 1 }], // Low stock
				},
			});

			// eslint-disable-next-line @typescript-eslint/unbound-method
			expect(notificationsService.create as jest.Mock).toHaveBeenCalled();
		});

		it('should only update existing items when no new ones are provided', async () => {
			mockPrisma.pantry.findFirst.mockResolvedValue({
				id: 'pantry123',
				items: [],
			});

			mockPrisma.pantryToItem.findMany.mockResolvedValue([
				{ itemId: 'existing1', id: 'p2i1' },
			]);

			mockPrisma.pantryToItem.update.mockResolvedValue({});
			mockPrisma.pantryToItem.createMany.mockResolvedValue({ count: 0 });
			mockPrisma.pantry.findUnique.mockResolvedValueOnce({
				id: 'pantry123',
				house: { id: 'house1', name: 'Test' },
				items: [],
			});

			const dto = {
				items: [{ itemId: 'existing1', quantity: 10 }],
			};

			await service.update({
				id: 'pantry123',
				houseId: 'house1',
				updatePantryDto: dto,
				userId: 'user123',
			});

			expect(mockPrisma.pantryToItem.update).toHaveBeenCalledTimes(1);
			expect(mockPrisma.pantryToItem.update).toHaveBeenCalledWith({
				where: {
					pantryId_itemId: {
						pantryId: 'pantry123',
						itemId: 'existing1',
					},
				},
				data: { quantity: 10, modifiedByUser: 'user123' },
			});

			expect(mockPrisma.pantryToItem.create).not.toHaveBeenCalled();
		});

		it('should handle expiry date updates', async () => {
			mockPrisma.pantry.findFirst.mockResolvedValue({
				id: 'p1',
				items: [],
			});
			mockPrisma.pantryToItem.findMany.mockResolvedValue([
				{ itemId: 'i1', id: 'x1' },
			]);
			mockPrisma.pantryToItem.update.mockResolvedValue({});

			const expiryDate = new Date();
			await service.update({
				...params,
				updatePantryDto: {
					items: [
						{
							itemId: 'i1',
							quantity: 5,
							expiryDate: expiryDate.toISOString(),
						},
					],
				},
			});

			expect(mockPrisma.pantryToItem.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						expiryDate: expiryDate,
					}) as unknown,
				}),
			);
		});

		it('should filter out non-positive quantity for new items', async () => {
			mockPrisma.pantry.findFirst.mockResolvedValue({
				id: 'p1',
				items: [],
			});
			mockPrisma.pantryToItem.findMany.mockResolvedValue([]);

			await service.update({
				...params,
				updatePantryDto: {
					items: [{ itemId: 'new1', quantity: 0 }],
				},
			});

			expect(mockPrisma.pantryToItem.create).not.toHaveBeenCalled();
		});

		it('should handle errors during item deletion', async () => {
			const consoleSpy = jest
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			mockPrisma.pantry.findFirst.mockResolvedValue({
				id: 'p1',
				items: [],
			});
			mockPrisma.pantryToItem.findMany.mockResolvedValue([
				{ itemId: 'i1', id: 'x1' },
			]);
			mockPrisma.pantryToItem.delete.mockRejectedValue(
				new Error('delete fail'),
			);

			await expect(
				service.update({
					...params,
					updatePantryDto: {
						items: [{ itemId: 'i1', quantity: 0 }],
					},
				}),
			).rejects.toThrow('delete fail');

			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it('should handle errors during item creation', async () => {
			const consoleSpy = jest
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			mockPrisma.pantry.findFirst.mockResolvedValue({
				id: 'p1',
				items: [],
			});
			mockPrisma.pantryToItem.findMany.mockResolvedValue([]);
			mockPrisma.pantryToItem.create.mockRejectedValue(
				new Error('create fail'),
			);

			await expect(
				service.update({
					...params,
					updatePantryDto: {
						items: [{ itemId: 'new1', quantity: 1 }],
					},
				}),
			).rejects.toThrow('create fail');

			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});
