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
});
