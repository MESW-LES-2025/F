import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
	let strategy: JwtStrategy;

	const mockPrismaService = {
		user: {
			findFirst: jest.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				JwtStrategy,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		strategy = module.get<JwtStrategy>(JwtStrategy);
		strategy = module.get<JwtStrategy>(JwtStrategy);
	});

	it('should be defined', () => {
		expect(strategy).toBeDefined();
	});

	describe('validate', () => {
		it('should validate and return user data', async () => {
			const payload = { sub: 'user-id', email: 'test@example.com' };
			const user = {
				id: 'user-id',
				email: 'test@example.com',
				username: 'testuser',
			};

			mockPrismaService.user.findFirst.mockResolvedValue(user);

			const result = await strategy.validate(payload);

			expect(result).toEqual({
				userId: user.id,
				email: user.email,
				username: user.username,
			});
			expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
				where: { id: payload.sub, deletedAt: null },
			});
		});

		it('should throw UnauthorizedException if user not found', async () => {
			const payload = { sub: 'user-id', email: 'test@example.com' };

			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(strategy.validate(payload)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});
});
