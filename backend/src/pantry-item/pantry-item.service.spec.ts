import { Test, TestingModule } from '@nestjs/testing';
import { PantryItemService } from './pantry-item.service';

describe('PantryItemService', () => {
	let service: PantryItemService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [PantryItemService],
		}).compile();

		service = module.get<PantryItemService>(PantryItemService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
