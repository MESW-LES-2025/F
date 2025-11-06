import { Test, TestingModule } from '@nestjs/testing';
import { PantryItemController } from './pantry-item.controller';
import { PantryItemService } from './pantry-item.service';

describe('PantryItemController', () => {
	let controller: PantryItemController;

	const mockService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PantryItemController],
			providers: [
				{
					provide: PantryItemService,
					useValue: mockService,
				},
			],
		}).compile();

		controller = module.get<PantryItemController>(PantryItemController);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
