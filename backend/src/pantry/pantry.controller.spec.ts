import { Test, TestingModule } from '@nestjs/testing';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

describe('PantryController', () => {
	let controller: PantryController;

	const mockPantryService = {
		findAll: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
	};

	const mockRequest = {
		user: {
			userId: 'user123',
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PantryController],
			providers: [
				{
					provide: PantryService,
					useValue: mockPantryService,
				},
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<PantryController>(PantryController);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('findAll', () => {
		it('should return all pantries in the system (ADMIN)', async () => {
			const mockPantries = [{ id: '1' }, { id: '2' }];
			mockPantryService.findAll.mockResolvedValue(mockPantries);

			const result = await controller.findAll();

			expect(result).toEqual(mockPantries);
			expect(mockPantryService.findAll).toHaveBeenCalled();
		});
	});

	describe('findOne', () => {
		it('should return a single pantry by id and houseId', async () => {
			const mockPantry = { id: 'pantry123', houseId: 'house456' };
			mockPantryService.findOne.mockResolvedValue(mockPantry);

			const result = await controller.findOne('pantry123', 'house456');

			expect(result).toEqual(mockPantry);
			expect(mockPantryService.findOne).toHaveBeenCalledWith(
				'pantry123',
				'house456',
			);
		});
	});

	describe('update', () => {
		const updateDto = {
			items: [
				{
					itemId: 'item789',
					quantity: 2,
				},
			],
		};

		it('should update pantry items', async () => {
			const updatedPantry = { id: 'pantry123', updated: true };
			mockPantryService.update.mockResolvedValue(updatedPantry);

			const result = await controller.update(
				'pantry123',
				'house456',
				updateDto,
				mockRequest,
			);

			expect(result).toEqual(updatedPantry);

			expect(mockPantryService.update).toHaveBeenCalledWith({
				id: 'pantry123',
				houseId: 'house456',
				updatePantryDto: updateDto,
				userId: 'user123',
			});
		});

		it('should still call service.update even with empty items array', async () => {
			const emptyDto = { items: [] };
			mockPantryService.update.mockResolvedValue({ id: 'pantry123' });

			const result = await controller.update(
				'pantry123',
				'house456',
				emptyDto,
				mockRequest,
			);

			expect(mockPantryService.update).toHaveBeenCalledWith({
				id: 'pantry123',
				houseId: 'house456',
				updatePantryDto: emptyDto,
				userId: 'user123',
			});

			expect(result).toEqual({ id: 'pantry123' });
		});
	});
});
