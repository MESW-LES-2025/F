import { Test, TestingModule } from '@nestjs/testing';
import { PantryService } from './pantry.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PantryService', () => {
	let service: PantryService;

	const mockPrismaService = {
		pantry: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
		},
		pantryToItem: {
			findMany: jest.fn(),
			update: jest.fn(),
			createMany: jest.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PantryService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		service = module.get<PantryService>(PantryService);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
