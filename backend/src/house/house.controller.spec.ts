import { Test, TestingModule } from '@nestjs/testing';
import { HouseController } from './house.controller';
import { HouseService } from './house.service';

describe('HouseController', () => {
	let controller: HouseController;

	const mockService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findAllUserHouses: jest.fn(),
		findOne: jest.fn(),
	};

	const mockReq = {
		user: {
			userId: 'user123',
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [HouseController],
			providers: [
				{
					provide: HouseService,
					useValue: mockService,
				},
			],
		}).compile();

		controller = module.get<HouseController>(HouseController);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should create a house', async () => {
			const dto = { name: 'My House' };
			mockService.create.mockResolvedValue('created');

			const result = await controller.create(dto);

			expect(result).toBe('created');
			expect(mockService.create).toHaveBeenCalledWith(dto);
		});
	});

	describe('findAll', () => {
		it('should return all houses', async () => {
			const houses = [{ id: 'h1' }];
			mockService.findAll.mockResolvedValue(houses);

			const result = await controller.findAll();

			expect(result).toEqual(houses);
			expect(mockService.findAll).toHaveBeenCalled();
		});
	});

	describe('findAllUserHouses', () => {
		it('should return houses belonging to user', async () => {
			const houses = [{ id: 'h1' }];
			mockService.findAllUserHouses.mockResolvedValue(houses);

			const result = await controller.findAllUserHouses(mockReq);

			expect(result).toEqual(houses);
			expect(mockService.findAllUserHouses).toHaveBeenCalledWith(
				'user123',
			);
		});
	});

	describe('findOne', () => {
		it('should return a single house', async () => {
			const house = { id: 'h1' };
			mockService.findOne.mockResolvedValue(house);

			const result = await controller.findOne('h1');

			expect(result).toEqual(house);
			expect(mockService.findOne).toHaveBeenCalledWith('h1');
		});
	});
});
