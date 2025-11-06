import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PantryItemService } from './pantry-item.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('src/shared/function-verify-string', () => ({
	verifyIsString: (value: any) =>
		typeof value === 'string' && value.trim().length > 0,
}));

describe('PantryItemService', () => {
	let service: PantryItemService;

	const mockPrismaService = {
		pantryItem: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
	};

	const mockItem = {
		id: 'item1',
		name: 'Rice',
		imageLink: 'img.png',
		measurementUnit: 'kg',
		createdByUser: 'user123',
		houseId: 'house999',
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PantryItemService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		service = module.get<PantryItemService>(PantryItemService);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create a new pantry item', async () => {
			mockPrismaService.pantryItem.create.mockResolvedValue(mockItem);

			const result = await service.create(
				{
					name: 'Rice',
					imageLink: 'img.png',
					measurementUnit: 'kg',
				},
				'user123',
				'house999',
			);

			expect(mockPrismaService.pantryItem.create).toHaveBeenCalledWith({
				data: {
					name: 'Rice',
					imageLink: 'img.png',
					measurementUnit: 'kg',
					createdByUser: 'user123',
					houseId: 'house999',
				},
			});
			expect(result).toEqual(mockItem);
		});

		it('should throw UnauthorizedException if name is invalid', async () => {
			await expect(
				service.create(
					{ name: '', imageLink: 'x', measurementUnit: 'kg' },
					'user123',
					'house999',
				),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException if imageLink is invalid', async () => {
			await expect(
				service.create(
					{ name: 'Rice', imageLink: '', measurementUnit: 'kg' },
					'user123',
					'house999',
				),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException if measurementUnit is invalid', async () => {
			await expect(
				service.create(
					{ name: 'Rice', imageLink: 'x', measurementUnit: '' },
					'user123',
					'house999',
				),
			).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('findAll', () => {
		it('should return all pantry items', async () => {
			mockPrismaService.pantryItem.findMany.mockResolvedValue([mockItem]);

			const result = await service.findAll();

			expect(mockPrismaService.pantryItem.findMany).toHaveBeenCalled();
			expect(result).toEqual([mockItem]);
		});
	});

	describe('findAllUser', () => {
		it('should return all items created by a specific user', async () => {
			mockPrismaService.pantryItem.findMany.mockResolvedValue([mockItem]);

			const result = await service.findAllUser('user123');

			expect(mockPrismaService.pantryItem.findMany).toHaveBeenCalledWith({
				where: { createdByUser: 'user123' },
			});
			expect(result).toEqual([mockItem]);
		});
	});

	describe('findAllHouse', () => {
		it('should return all items for a house', async () => {
			mockPrismaService.pantryItem.findMany.mockResolvedValue([mockItem]);

			const result = await service.findAllHouse('house999');

			expect(mockPrismaService.pantryItem.findMany).toHaveBeenCalledWith({
				where: {
					pantries: { some: { pantry: { houseId: 'house999' } } },
				},
			});
			expect(result).toEqual([mockItem]);
		});
	});

	describe('findOne', () => {
		it('should return a pantry item', async () => {
			mockPrismaService.pantryItem.findUnique.mockResolvedValue(mockItem);

			const result = await service.findOne('item1');

			expect(
				mockPrismaService.pantryItem.findUnique,
			).toHaveBeenCalledWith({
				where: { id: 'item1' },
			});
			expect(result).toEqual(mockItem);
		});
	});

	describe('update', () => {
		it('should update a pantry item', async () => {
			mockPrismaService.pantryItem.findFirst.mockResolvedValue(mockItem);
			mockPrismaService.pantryItem.update.mockResolvedValue({
				...mockItem,
				name: 'Updated',
			});

			const result = await service.update(
				'item1',
				{
					name: 'Updated',
					imageLink: 'img.png',
					measurementUnit: 'kg',
				},
				'user123',
			);

			expect(mockPrismaService.pantryItem.update).toHaveBeenCalledWith({
				where: { id: 'item1' },
				data: {
					name: 'Updated',
					imageLink: 'img.png',
					measurementUnit: 'kg',
				},
			});
			expect(result.name).toBe('Updated');
		});

		it('should throw NotFoundException if the item does not exist', async () => {
			mockPrismaService.pantryItem.findFirst.mockResolvedValue(null);

			await expect(
				service.update(
					'bad-id',
					{ name: 'New', imageLink: 'x', measurementUnit: 'kg' },
					'user123',
				),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('should delete a pantry item', async () => {
			mockPrismaService.pantryItem.findFirst.mockResolvedValue(mockItem);
			mockPrismaService.pantryItem.delete.mockResolvedValue(mockItem);

			const result = await service.remove('item1', 'user123');

			expect(mockPrismaService.pantryItem.delete).toHaveBeenCalledWith({
				where: { id: 'item1' },
			});
			expect(result).toEqual(mockItem);
		});

		it('should throw NotFoundException if the item does not exist', async () => {
			mockPrismaService.pantryItem.findFirst.mockResolvedValue(null);

			await expect(service.remove('bad-id', 'user123')).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
