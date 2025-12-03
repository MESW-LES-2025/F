import { Test, TestingModule } from '@nestjs/testing';
import { HouseService } from './house.service';
import { PrismaService } from '../prisma/prisma.service';
import { PantryService } from '../pantry/pantry.service';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { verifyIsString } from 'src/shared/function-verify-string';

jest.mock('src/shared/function-verify-string', () => ({
	verifyIsString: jest.fn(),
}));

describe('HouseService', () => {
	let service: HouseService;

	const mockUser = {
		id: 'user-id-1',
		email: 'test@example.com',
		username: 'tester',
		name: 'Tester',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockPrismaService = {
		house: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		houseToUser: {
			create: jest.fn(),
			findFirst: jest.fn(),
			delete: jest.fn(),
			update: jest.fn(),
			findMany: jest.fn(),
		},
		user: {
			findMany: jest.fn(),
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

	describe('create', () => {
		const dto = { name: 'My House' };
		const mockHouse = {
			id: 'h1',
			name: 'My House',
			invitationCode: 'ABC123',
		};

		it('should create a house successfully', async () => {
			(verifyIsString as unknown as jest.Mock).mockReturnValue(true);

			mockPrismaService.house.create.mockResolvedValue(mockHouse);
			mockPantryService.create.mockResolvedValue(true);

			const result = await service.create(dto, mockUser.id);

			expect(result).toEqual(mockHouse);
			expect(mockPrismaService.house.create).toHaveBeenCalled();
			expect(mockPantryService.create).toHaveBeenCalledWith('h1');
		});

		it('should throw UnauthorizedException when name is not a string', async () => {
			(verifyIsString as unknown as jest.Mock).mockReturnValue(false);

			await expect(service.create(dto, mockUser.id)).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('should throw NotFoundException if house creation fails', async () => {
			(verifyIsString as unknown as jest.Mock).mockReturnValue(true);

			mockPrismaService.house.create.mockResolvedValue(null);

			await expect(service.create(dto, mockUser.id)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw NotFoundException if pantry creation fails', async () => {
			(verifyIsString as unknown as jest.Mock).mockReturnValue(true);
			mockPrismaService.house.create.mockResolvedValue(mockHouse);
			mockPantryService.create.mockResolvedValue(false);

			await expect(service.create(dto, mockUser.id)).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('findAll', () => {
		it('should return all houses', async () => {
			const houses = [{ id: 'h1' }];
			mockPrismaService.house.findMany.mockResolvedValue(houses);

			const result = await service.findAll();

			expect(result).toEqual(houses);
			expect(mockPrismaService.house.findMany).toHaveBeenCalled();
		});
	});

	describe('findAllUserHouses', () => {
		it('should return houses related to a user', async () => {
			const houses = [{ id: 'h1' }];
			mockPrismaService.house.findMany.mockResolvedValue(houses);

			const result = await service.findAllUserHouses('user123');

			expect(result).toEqual(houses);
			expect(mockPrismaService.house.findMany).toHaveBeenCalledWith({
				where: { users: { some: { userId: 'user123' } } },
			});
		});
	});

	describe('findOne', () => {
		it('should return a specific house', async () => {
			const house = { id: 'h1' };
			mockPrismaService.house.findUnique.mockResolvedValue(house);

			const result = await service.findOne('h1');

			expect(result).toEqual(house);
			expect(mockPrismaService.house.findUnique).toHaveBeenCalledWith({
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

	describe('findHouseDetails', () => {
		const mockHouse = {
			id: 'house1',
			name: 'Casa 1',
			invitationCode: 'INV123',
			createdAt: new Date(),
		};

		const mockUsers = [
			{
				email: 'test@example.com',
				username: 'tester',
				name: 'Tester',
				imagePublicId: null,
				houses: [{ role: 'OWNER' }],
			},
		];

		it('should return house details and users successfully', async () => {
			mockPrismaService.house.findFirst.mockResolvedValue(mockHouse);
			mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

			const result = await service.findHouseDetails('house1', 'user123');

			expect(result).toEqual({
				house: {
					id: mockHouse.id,
					name: mockHouse.name,
					invitationCode: mockHouse.invitationCode,
					createdAt: mockHouse.createdAt,
				},
				users: mockUsers,
			});

			expect(mockPrismaService.house.findFirst).toHaveBeenCalledWith({
				where: {
					id: 'house1',
					users: {
						some: { userId: 'user123' },
					},
				},
			});

			expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
				where: {
					houses: {
						some: { houseId: mockHouse.id },
					},
				},
				select: {
					id: true,
					email: true,
					username: true,
					name: true,
					imagePublicId: true,
					houses: {
						where: { houseId: mockHouse.id },
						select: { role: true },
					},
				},
			});
		});

		it('should throw NotFoundException if house is not found', async () => {
			mockPrismaService.house.findFirst.mockResolvedValue(null);

			await expect(
				service.findHouseDetails('house1', 'user123'),
			).rejects.toThrow(NotFoundException);

			expect(mockPrismaService.user.findMany).not.toHaveBeenCalled();
		});
	});

	describe('update', () => {
		const mockHouse = { id: 'house1', name: 'Old Name' };
		const mockHouseToUser = { id: 'htu1', role: 'MEMBER' };

		beforeEach(() => {
			jest.clearAllMocks();
		});

		it('should update house name successfully', async () => {
			const dto = { name: 'New House Name' };

			mockPrismaService.house.findFirst.mockResolvedValue(mockHouse);
			mockPrismaService.house.update.mockResolvedValue({
				...mockHouse,
				name: dto.name,
			});

			const result = await service.update({
				houseId: 'house1',
				dto,
				userId: 'user123',
			});

			expect(result).toEqual({ ...mockHouse, name: dto.name });
			expect(mockPrismaService.house.findFirst).toHaveBeenCalledWith({
				where: {
					id: 'house1',
					users: { some: { userId: 'user123', role: 'ADMIN' } },
				},
			});
			expect(mockPrismaService.house.update).toHaveBeenCalledWith({
				where: { id: 'house1' },
				data: { name: dto.name },
			});
		});

		it('should remove a user from the house', async () => {
			const dto = { name: 'New Name', userToRemoveId: 'userToRemove' };

			mockPrismaService.house.findFirst.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockHouseToUser,
			);
			mockPrismaService.houseToUser.delete.mockResolvedValue(
				mockHouseToUser,
			);
			mockPrismaService.house.update.mockResolvedValue({
				...mockHouse,
				name: dto.name,
			});

			const result = await service.update({
				houseId: 'house1',
				dto,
				userId: 'user123',
			});

			expect(mockPrismaService.houseToUser.delete).toHaveBeenCalledWith({
				where: {
					id: mockHouseToUser.id,
					houseId: 'house1',
					userId: dto.userToRemoveId,
				},
			});
			expect(result).toEqual({ ...mockHouse, name: dto.name });
		});

		it('should upgrade a user to admin', async () => {
			const dto = { name: 'New Name', userToUpgradeId: 'userToUpgrade' };

			mockPrismaService.house.findFirst.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockHouseToUser,
			);
			mockPrismaService.houseToUser.update.mockResolvedValue({
				...mockHouseToUser,
				role: 'ADMIN',
			});
			mockPrismaService.house.update.mockResolvedValue({
				...mockHouse,
				name: dto.name,
			});

			const result = await service.update({
				houseId: 'house1',
				dto,
				userId: 'user123',
			});

			expect(mockPrismaService.houseToUser.update).toHaveBeenCalledWith({
				where: {
					id: mockHouseToUser.id,
					houseId: 'house1',
					userId: dto.userToUpgradeId,
				},
				data: { role: 'ADMIN' },
			});
			expect(result).toEqual({ ...mockHouse, name: dto.name });
		});

		it('should throw NotFoundException if house not found', async () => {
			mockPrismaService.house.findFirst.mockResolvedValue(null);

			await expect(
				service.update({
					houseId: 'house1',
					dto: { name: 'x' },
					userId: 'user123',
				}),
			).rejects.toThrow(NotFoundException);
		});

		it('should throw NotFoundException if user to remove not found', async () => {
			const dto = { name: 'x', userToRemoveId: 'missingUser' };

			mockPrismaService.house.findFirst.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(null);

			await expect(
				service.update({ houseId: 'house1', dto, userId: 'user123' }),
			).rejects.toThrow(NotFoundException);
		});

		it('should throw NotFoundException if user to upgrade not found', async () => {
			const dto = { name: 'x', userToUpgradeId: 'missingUser' };

			mockPrismaService.house.findFirst.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(null);

			await expect(
				service.update({ houseId: 'house1', dto, userId: 'user123' }),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		const houseId = 'house1';
		const userId = 'user123';

		it('should throw NotFoundException if house does not exist or user is not admin', async () => {
			mockPrismaService.house.findFirst.mockResolvedValue(null);

			await expect(service.remove({ houseId, userId })).rejects.toThrow(
				NotFoundException,
			);

			expect(mockPrismaService.house.findFirst).toHaveBeenCalledWith({
				where: {
					id: houseId,
					users: {
						some: { userId, role: 'ADMIN' },
					},
				},
			});
		});

		it('should throw BadRequestException if there are multiple users in the house', async () => {
			mockPrismaService.house.findFirst.mockResolvedValue({
				id: houseId,
				name: 'Test House',
			});

			mockPrismaService.houseToUser.findMany.mockResolvedValue([
				{ id: 1 },
				{ id: 2 },
			]);

			await expect(service.remove({ houseId, userId })).rejects.toThrow(
				'The house cannot be deleted because there are other users still there',
			);
		});

		it('should delete the house successfully when user is admin and only one relation exists', async () => {
			const mockHouse = { id: houseId, name: 'Test House' };

			mockPrismaService.house.findFirst.mockResolvedValue(mockHouse);

			mockPrismaService.houseToUser.findMany.mockResolvedValue([
				{ id: 1 },
			]);

			mockPrismaService.house.delete = jest
				.fn()
				.mockResolvedValue(mockHouse);

			const result = await service.remove({ houseId, userId });

			expect(result).toEqual(mockHouse);

			expect(mockPrismaService.house.delete).toHaveBeenCalledWith({
				where: {
					id: houseId,
					users: {
						some: { userId, role: 'ADMIN' },
					},
				},
			});
		});
	});
});
