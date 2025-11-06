import { Test, TestingModule } from '@nestjs/testing';
import { PantryItemController } from './pantry-item.controller';
import { PantryItemService } from './pantry-item.service';

describe('PantryItemController', () => {
	let controller: PantryItemController;

	const mockPantryItemService = {
		create: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
		findAllUser: jest.fn(),
		findAllHouse: jest.fn(),
		findOne: jest.fn(),
		findAll: jest.fn(),
	};

	const mockRequest = {
		user: {
			userId: 'user123',
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PantryItemController],
			providers: [
				{
					provide: PantryItemService,
					useValue: mockPantryItemService,
				},
			],
		}).compile();

		controller = module.get<PantryItemController>(PantryItemController);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		const createDto = {
			name: 'Rice',
			imageLink: 'link/to/image',
			measurementUnit: 'kg',
		};

		it('should create a pantry item', async () => {
			mockPantryItemService.create.mockResolvedValue('created-item');

			const result = await controller.create(
				createDto,
				mockRequest,
				'house456',
			);

			expect(result).toBe('created-item');
			expect(mockPantryItemService.create).toHaveBeenCalledWith(
				createDto,
				'user123',
				'house456',
			);
		});
	});

	describe('update', () => {
		const updateDto = { name: 'Updated Name' };

		it('should update a pantry item', async () => {
			mockPantryItemService.update.mockResolvedValue('updated-item');

			const result = await controller.update(
				'item123',
				updateDto,
				mockRequest,
			);

			expect(result).toBe('updated-item');
			expect(mockPantryItemService.update).toHaveBeenCalledWith(
				'item123',
				updateDto,
				'user123',
			);
		});
	});

	describe('remove', () => {
		it('should delete a pantry item', async () => {
			mockPantryItemService.remove.mockResolvedValue('deleted');

			const result = await controller.remove('item123', mockRequest);

			expect(result).toBe('deleted');
			expect(mockPantryItemService.remove).toHaveBeenCalledWith(
				'item123',
				'user123',
			);
		});
	});

	describe('findAllUser', () => {
		it('should return items created by the user', async () => {
			mockPantryItemService.findAllUser.mockResolvedValue(['item1']);

			const result = await controller.findAllUser(mockRequest);

			expect(result).toEqual(['item1']);
			expect(mockPantryItemService.findAllUser).toHaveBeenCalledWith(
				'user123',
			);
		});
	});

	describe('findAllHouse', () => {
		it('should return items for a house', async () => {
			mockPantryItemService.findAllHouse.mockResolvedValue([
				'house-item',
			]);

			const result = await controller.findAllHouse('house123');

			expect(result).toEqual(['house-item']);
			expect(mockPantryItemService.findAllHouse).toHaveBeenCalledWith(
				'house123',
			);
		});
	});

	describe('findOne', () => {
		it('should return one pantry item', async () => {
			mockPantryItemService.findOne.mockResolvedValue('one-item');

			const result = await controller.findOne('item789');

			expect(result).toBe('one-item');
			expect(mockPantryItemService.findOne).toHaveBeenCalledWith(
				'item789',
			);
		});
	});

	describe('findAll', () => {
		it('should return all pantry items (admin)', async () => {
			mockPantryItemService.findAll.mockResolvedValue(['admin-item']);

			const result = await controller.findAll();

			expect(result).toEqual(['admin-item']);
			expect(mockPantryItemService.findAll).toHaveBeenCalled();
		});
	});
});
