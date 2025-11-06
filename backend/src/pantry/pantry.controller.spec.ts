import { Test, TestingModule } from '@nestjs/testing';
import { PantryController } from './pantry.controller';
import { PantryService } from './pantry.service';

describe('PantryController', () => {
	let controller: PantryController;

	const mockService = {
		findAll: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PantryController],
			providers: [
				{
					provide: PantryService,
					useValue: mockService,
				},
			],
		}).compile();

		controller = module.get<PantryController>(PantryController);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
