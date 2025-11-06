import { Test, TestingModule } from '@nestjs/testing';
import { HouseService } from './house.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PantryService } from 'src/pantry/pantry.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { verifyIsString } from 'src/shared/function-verify-string';

jest.mock('src/shared/function-verify-string', () => ({
	verifyIsString: jest.fn(),
}));

describe('HouseService', () => {
	let service: HouseService;

	const mockPrisma = {
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
					useValue: mockPrisma,
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

	describe('create', () => {
		const dto = { name: 'My House' };
		const mockHouse = {
			id: 'h1',
			name: 'My House',
			invitationCode: 'ABC123',
		};

		it('should create a house successfully', async () => {
			(verifyIsString as unknown as jest.Mock).mockReturnValue(true);

			mockPrisma.house.create.mockResolvedValue(mockHouse);
			mockPantryService.create.mockResolvedValue(true);

			const result = await service.create(dto);

			expect(result).toEqual(mockHouse);
			expect(mockPrisma.house.create).toHaveBeenCalled();
			expect(mockPantryService.create).toHaveBeenCalledWith('h1');
		});

		it('should throw UnauthorizedException when name is not a string', async () => {
			(verifyIsString as unknown as jest.Mock).mockReturnValue(false);

			await expect(service.create(dto)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('should throw NotFoundException if house creation fails', async () => {
			(verifyIsString as unknown as jest.Mock).mockReturnValue(true);

			mockPrisma.house.create.mockResolvedValue(null);

			await expect(service.create(dto)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw NotFoundException if pantry creation fails', async () => {
			(verifyIsString as unknown as jest.Mock).mockReturnValue(true);
			mockPrisma.house.create.mockResolvedValue(mockHouse);
			mockPantryService.create.mockResolvedValue(false);

			await expect(service.create(dto)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('findAll', () => {
		it('should return all houses', async () => {
			const houses = [{ id: 'h1' }];
			mockPrisma.house.findMany.mockResolvedValue(houses);

			const result = await service.findAll();

			expect(result).toEqual(houses);
			expect(mockPrisma.house.findMany).toHaveBeenCalled();
		});
	});

	describe('findAllUserHouses', () => {
		it('should return houses related to a user', async () => {
			const houses = [{ id: 'h1' }];
			mockPrisma.house.findMany.mockResolvedValue(houses);

			const result = await service.findAllUserHouses('user123');

			expect(result).toEqual(houses);
			expect(mockPrisma.house.findMany).toHaveBeenCalledWith({
				where: { users: { some: { userId: 'user123' } } },
			});
		});
	});

	describe('findOne', () => {
		it('should return a specific house', async () => {
			const house = { id: 'h1' };
			mockPrisma.house.findUnique.mockResolvedValue(house);

			const result = await service.findOne('h1');

			expect(result).toEqual(house);
			expect(mockPrisma.house.findUnique).toHaveBeenCalledWith({
				where: { id: 'h1' },
			});
		});
	});

	describe('generateSecureInviteCode', () => {
		it('should generate a code of correct length', () => {
			const code = service.generateSecureInviteCode(10);

			expect(code).toHaveLength(10);
		});

		it('should contain only allowed characters', () => {
			const code = service.generateSecureInviteCode(20);
			const allowed = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

			for (const char of code) {
				expect(allowed).toContain(char);
			}
		});
	});
});
