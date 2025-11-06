import { Test, TestingModule } from '@nestjs/testing';
import { HouseService } from './house.service';
import { PrismaService } from '../prisma/prisma.service';
import { PantryService } from '../pantry/pantry.service';

describe('HouseService', () => {
	let service: HouseService;

	const mockPrismaService = {
		house: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
		},
	};

	const mockPantryService = {
		create: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				HouseService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
				{
					provide: PantryService,
					useValue: mockPantryService,
				},
			],
		}).compile();

		service = module.get<HouseService>(HouseService);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
