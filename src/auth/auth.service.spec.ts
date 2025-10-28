import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
	hash: jest.fn().mockResolvedValue('hashedpassword'),
	compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
	let service: AuthService;

	const mockPrismaService = {
		user: {
			findFirst: jest.fn(),
			findUnique: jest.fn(),
			create: jest.fn(),
		},
		refreshToken: {
			findUnique: jest.fn(),
			create: jest.fn(),
			deleteMany: jest.fn(),
			update: jest.fn(),
			updateMany: jest.fn(),
		},
	};

	const mockJwtService = {
		sign: jest.fn().mockReturnValue('mock_token'),
		verify: jest.fn(),
	};

	const mockUser = {
		id: 'user-id-123',
		email: 'test@example.com',
		username: 'testuser',
		password: 'hashedpassword',
		name: 'Test User',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockRefreshToken = {
		id: 'token-id-123',
		token: 'mock_refresh_token',
		userId: 'user-id-123',
		expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		isRevoked: false,
		createdAt: new Date(),
		revokedAt: null,
		user: mockUser,
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
				{
					provide: JwtService,
					useValue: mockJwtService,
				},
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('register', () => {
		it('should successfully register a new user', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);
			mockPrismaService.user.create.mockResolvedValue(mockUser);
			mockPrismaService.refreshToken.deleteMany.mockResolvedValue({
				count: 0,
			});
			mockPrismaService.refreshToken.create.mockResolvedValue(
				mockRefreshToken,
			);

			const result = await service.register({
				email: 'newuser@example.com',
				username: 'newuser',
				password: 'password123',
				name: 'New User',
			});

			expect(result).toHaveProperty('access_token');
			expect(result).toHaveProperty('refresh_token');
			expect(result).toHaveProperty('expires_in', 3600);
			expect(result.user.email).toBe(mockUser.email);
			expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
		});

		it('should throw ConflictException if user already exists', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

			await expect(
				service.register({
					email: 'test@example.com',
					username: 'testuser',
					password: 'password123',
				}),
			).rejects.toThrow(ConflictException);
		});
	});

	describe('login', () => {
		it('should successfully login with valid credentials', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
			mockPrismaService.refreshToken.deleteMany.mockResolvedValue({
				count: 0,
			});
			mockPrismaService.refreshToken.create.mockResolvedValue(
				mockRefreshToken,
			);

			const result = await service.login({
				email: 'test@example.com',
				password: 'password123',
			});

			expect(result).toHaveProperty('access_token');
			expect(result).toHaveProperty('refresh_token');
			expect(result).toHaveProperty('expires_in', 3600);
			expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
		});

		it('should throw UnauthorizedException if user not found', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			await expect(
				service.login({
					email: 'nonexistent@example.com',
					password: 'password123',
				}),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException if password is invalid', async () => {
			const bcrypt = require('bcrypt');
			bcrypt.compare.mockResolvedValueOnce(false);
			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

			await expect(
				service.login({
					email: 'test@example.com',
					password: 'wrongpassword',
				}),
			).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('refreshToken', () => {
		it('should successfully refresh tokens with token rotation', async () => {
			const payload = {
				sub: mockUser.id,
				email: mockUser.email,
				type: 'refresh',
			};
			mockJwtService.verify.mockReturnValue(payload);
			mockPrismaService.refreshToken.findUnique.mockResolvedValue(
				mockRefreshToken,
			);
			mockPrismaService.refreshToken.update.mockResolvedValue({
				...mockRefreshToken,
				isRevoked: true,
			});
			mockPrismaService.refreshToken.deleteMany.mockResolvedValue({
				count: 0,
			});
			mockPrismaService.refreshToken.create.mockResolvedValue({
				...mockRefreshToken,
				token: 'new_mock_refresh_token',
			});

			const result = await service.refreshToken('valid_refresh_token');

			expect(result).toHaveProperty('access_token');
			expect(result).toHaveProperty('refresh_token');
			expect(result).toHaveProperty('expires_in', 3600);
			expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
				where: { id: mockRefreshToken.id },
				data: {
					isRevoked: true,
					revokedAt: expect.any(Date),
				},
			});
		});

		it('should throw UnauthorizedException if token is invalid', async () => {
			mockJwtService.verify.mockImplementation(() => {
				throw new Error('Invalid token');
			});

			await expect(service.refreshToken('invalid_token')).rejects.toThrow(
				UnauthorizedException,
			);
		});

		it('should throw UnauthorizedException if token type is not refresh', async () => {
			const payload = {
				sub: mockUser.id,
				email: mockUser.email,
				type: 'access',
			};
			mockJwtService.verify.mockReturnValue(payload);

			await expect(
				service.refreshToken('access_token_used_as_refresh'),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException if token is revoked', async () => {
			const payload = {
				sub: mockUser.id,
				email: mockUser.email,
				type: 'refresh',
			};
			mockJwtService.verify.mockReturnValue(payload);
			mockPrismaService.refreshToken.findUnique.mockResolvedValue({
				...mockRefreshToken,
				isRevoked: true,
			});

			await expect(
				service.refreshToken('revoked_refresh_token'),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException if token is expired in DB', async () => {
			const payload = {
				sub: mockUser.id,
				email: mockUser.email,
				type: 'refresh',
			};
			mockJwtService.verify.mockReturnValue(payload);
			mockPrismaService.refreshToken.findUnique.mockResolvedValue({
				...mockRefreshToken,
				expiresAt: new Date(Date.now() - 1000), // Expired
			});

			await expect(
				service.refreshToken('expired_refresh_token'),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException if token not found in DB', async () => {
			const payload = {
				sub: mockUser.id,
				email: mockUser.email,
				type: 'refresh',
			};
			mockJwtService.verify.mockReturnValue(payload);
			mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

			await expect(
				service.refreshToken('nonexistent_token'),
			).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('logout', () => {
		it('should successfully logout and revoke refresh token', async () => {
			mockPrismaService.refreshToken.findUnique.mockResolvedValue(
				mockRefreshToken,
			);
			mockPrismaService.refreshToken.update.mockResolvedValue({
				...mockRefreshToken,
				isRevoked: true,
			});

			const result = await service.logout('valid_refresh_token');

			expect(result).toEqual({ message: 'Successfully logged out' });
			expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
				where: { id: mockRefreshToken.id },
				data: {
					isRevoked: true,
					revokedAt: expect.any(Date),
				},
			});
		});

		it('should return success message even if token is invalid', async () => {
			mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

			const result = await service.logout('invalid_token');

			expect(result).toEqual({ message: 'Successfully logged out' });
		});

		it('should return success message if token is already revoked', async () => {
			mockPrismaService.refreshToken.findUnique.mockResolvedValue({
				...mockRefreshToken,
				isRevoked: true,
			});

			const result = await service.logout('already_revoked_token');

			expect(result).toEqual({ message: 'Successfully logged out' });
			expect(mockPrismaService.refreshToken.update).not.toHaveBeenCalled();
		});

		it('should handle database errors gracefully', async () => {
			mockPrismaService.refreshToken.findUnique.mockRejectedValue(
				new Error('Database error'),
			);

			const result = await service.logout('some_token');

			expect(result).toEqual({ message: 'Successfully logged out' });
		});
	});

	describe('logoutAll', () => {
		it('should revoke all refresh tokens for a user', async () => {
			mockPrismaService.refreshToken.updateMany.mockResolvedValue({
				count: 3,
			});

			const result = await service.logoutAll(mockUser.id);

			expect(result).toEqual({
				message: 'Successfully logged out from all devices',
			});
			expect(
				mockPrismaService.refreshToken.updateMany,
			).toHaveBeenCalledWith({
				where: {
					userId: mockUser.id,
					isRevoked: false,
				},
				data: {
					isRevoked: true,
					revokedAt: expect.any(Date),
				},
			});
		});

		it('should handle case with no active tokens', async () => {
			mockPrismaService.refreshToken.updateMany.mockResolvedValue({
				count: 0,
			});

			const result = await service.logoutAll(mockUser.id);

			expect(result).toEqual({
				message: 'Successfully logged out from all devices',
			});
		});
	});

	describe('validateUser', () => {
		it('should return user data', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue({
				id: mockUser.id,
				email: mockUser.email,
				username: mockUser.username,
				name: mockUser.name,
				createdAt: mockUser.createdAt,
				updatedAt: mockUser.updatedAt,
			});

			const result = await service.validateUser(mockUser.id);

			expect(result).toHaveProperty('email', mockUser.email);
			expect(result).not.toHaveProperty('password');
		});
	});
});
