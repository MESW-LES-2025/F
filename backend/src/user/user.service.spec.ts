import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserService', () => {
	let service: UserService;

	const mockUser = {
		id: 'user-id-1',
		email: 'test@example.com',
		username: 'tester',
		name: 'Tester',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	type UserType = typeof mockUser;

	type MockPrisma = {
		user: {
			findFirst: jest.MockedFunction<
				(...args: any[]) => Promise<UserType | null>
			>;
			update: jest.MockedFunction<
				(...args: any[]) => Promise<UserType & Record<string, any>>
			>;
		};
		refreshToken: {
			updateMany: jest.MockedFunction<
				(...args: any[]) => Promise<{ count: number }>
			>;
		};
	};

	const mockPrismaService: MockPrisma = {
		user: {
			findFirst: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<UserType | null>
			>,
			update: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<UserType>
			>,
		},
		refreshToken: {
			updateMany: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<{ count: number }>
			>,
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{ provide: PrismaService, useValue: mockPrismaService },
			],
		}).compile();

		service = module.get<UserService>(UserService);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findOne', () => {
		it('returns the user when found and not deleted', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

			const result = await service.findOne(mockUser.id);

			expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
				where: { id: mockUser.id, deletedAt: null },
				select: expect.any(Object) as unknown as object,
			});
			expect(result).toEqual(mockUser);
		});

		it('throws NotFoundException when user not found', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(service.findOne('no-id')).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('update', () => {
		it('updates allowed fields and returns updated user', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
			const updated = { ...mockUser, name: 'Updated' };
			mockPrismaService.user.update.mockResolvedValue(updated);

			const dto: UpdateUserDto = { name: 'Updated' };
			const result = await service.update(mockUser.id, dto);

			expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
				where: { id: mockUser.id, deletedAt: null },
			});
			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: { name: 'Updated' },
				select: expect.any(Object) as unknown as object,
			});
			expect(result).toEqual(updated);
		});

		it('throws NotFoundException when user not found', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(
				service.update('no-id', { name: 'X' } as UpdateUserDto),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('soft-deletes user and revokes refresh tokens', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
			mockPrismaService.user.update.mockResolvedValue({
				...mockUser,
				deletedAt: new Date(),
			});
			mockPrismaService.refreshToken.updateMany.mockResolvedValue({
				count: 2,
			});

			const result = await service.remove(mockUser.id);

			expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
				where: { id: mockUser.id, deletedAt: null },
			});
			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: { deletedAt: expect.any(Date) as Date },
			});
			expect(
				mockPrismaService.refreshToken.updateMany,
			).toHaveBeenCalledWith({
				where: { userId: mockUser.id, isRevoked: false },
				data: { isRevoked: true, revokedAt: expect.any(Date) as Date },
			});
			expect(result).toEqual({ success: true });
		});

		it('throws NotFoundException when user not found', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(service.remove('no-id')).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
