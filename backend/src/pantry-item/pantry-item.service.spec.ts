import { Test, TestingModule } from '@nestjs/testing';
import { PantryItemService } from './pantry-item.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PantryItemService', () => {
	let service: PantryItemService;

	const mockPrismaService = {
		pantryItem: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
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
});
