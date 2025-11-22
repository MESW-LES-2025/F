import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../shared/email/email.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
	hash: jest.fn().mockResolvedValue('hashedpassword'),
	compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
	let service: AuthService;

	type UserType = typeof mockUser;
	type RefreshTokenType = typeof mockRefreshToken;

	type MockPrisma = {
		user: {
			findFirst: jest.MockedFunction<
				(...args: any[]) => Promise<UserType | null>
			>;
			findUnique: jest.MockedFunction<
				(...args: any[]) => Promise<UserType | null>
			>;
			create: jest.MockedFunction<(...args: any[]) => Promise<UserType>>;
			update: jest.MockedFunction<
				(...args: any[]) => Promise<UserType & Record<string, any>>
			>;
		};
		refreshToken: {
			findUnique: jest.MockedFunction<
				(...args: any[]) => Promise<RefreshTokenType | null>
			>;
			create: jest.MockedFunction<
				(...args: any[]) => Promise<RefreshTokenType>
			>;
			deleteMany: jest.MockedFunction<
				(...args: any[]) => Promise<{ count: number }>
			>;
			update: jest.MockedFunction<
				(
					...args: any[]
				) => Promise<RefreshTokenType & Record<string, any>>
			>;
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
			findUnique: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<UserType | null>
			>,
			create: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<UserType>
			>,
			update: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<UserType & Record<string, any>>
			>,
		},
		refreshToken: {
			findUnique: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<RefreshTokenType | null>
			>,
			create: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<RefreshTokenType>
			>,
			deleteMany: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<{ count: number }>
			>,
			update: jest.fn() as jest.MockedFunction<
				(
					...args: any[]
				) => Promise<RefreshTokenType & Record<string, any>>
			>,
			updateMany: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<{ count: number }>
			>,
		},
	};

	const mockJwtService = {
		sign: jest.fn().mockReturnValue('mock_token'),
		verify: jest.fn(),
	};

	const mockEmailService = {
		sendEmail: jest.fn().mockResolvedValue(undefined),
	};

	const mockUser = {
		id: 'user-id-123',
		email: 'test@example.com',
		username: 'testuser',
		password: 'hashedpassword',
		name: 'Test User',
		createdAt: new Date(),
		updatedAt: new Date(),
		isEmailVerified: true,
		verificationToken: null,
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
				{
					provide: EmailService,
					useValue: mockEmailService,
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
			mockPrismaService.user.findUnique.mockResolvedValue(null);
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
			expect(result).toHaveProperty('expires_in', 900);
			expect(result.user.email).toBe(mockUser.email);
			expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
		});

		it('should throw ConflictException if user already exists', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

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
			mockPrismaService.user.findFirst.mockResolvedValue({
				...mockUser,
				houses: [],
			});
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
			expect(result).toHaveProperty('expires_in', 900);
			expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
		});

		it('should throw UnauthorizedException if user not found', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(
				service.login({
					email: 'nonexistent@example.com',
					password: 'password123',
				}),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException if password is invalid', async () => {
			const compareMock =
				bcrypt.compare as unknown as jest.MockedFunction<
					(...args: any[]) => Promise<boolean>
				>;
			compareMock.mockResolvedValueOnce(false);
			mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

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
			const payload: { sub: string; email: string; type: string } = {
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
			expect(result).toHaveProperty('expires_in', 900);
			expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
				where: { id: mockRefreshToken.id },
				data: {
					isRevoked: true,
					revokedAt: expect.any(Date) as Date,
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
			const payload: { sub: string; email: string; type: string } = {
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
			const payload: { sub: string; email: string; type: string } = {
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
			const payload: { sub: string; email: string; type: string } = {
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
			const payload: { sub: string; email: string; type: string } = {
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
					revokedAt: expect.any(Date) as Date,
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
			expect(
				mockPrismaService.refreshToken.update,
			).not.toHaveBeenCalled();
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
					revokedAt: expect.any(Date) as Date,
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

	describe('changePassword', () => {
		it('should change password when current password is correct', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
			mockPrismaService.user.update.mockResolvedValue({
				...mockUser,
				password: 'newhashed',
			});
			mockPrismaService.refreshToken.updateMany.mockResolvedValue({
				count: 2,
			});

			const result = await service.changePassword(mockUser.id, {
				currentPassword: 'currentPassword123',
				newPassword: 'newPassword456',
			});

			expect(result).toEqual({
				message: 'Password changed successfully',
			});
			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: { password: expect.any(String) as string },
			});
			expect(
				mockPrismaService.refreshToken.updateMany,
			).toHaveBeenCalled();
		});

		it('should throw UnauthorizedException when current password is incorrect', async () => {
			const compareMock =
				bcrypt.compare as unknown as jest.MockedFunction<
					(...args: any[]) => Promise<boolean>
				>;
			compareMock.mockResolvedValueOnce(false);
			mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

			await expect(
				service.changePassword(mockUser.id, {
					currentPassword: 'wrong',
					newPassword: 'new',
				}),
			).rejects.toThrow(UnauthorizedException);
		});

		it('should throw UnauthorizedException when user not found', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(
				service.changePassword('nonexistent-id', {
					currentPassword: 'any',
					newPassword: 'any',
				}),
			).rejects.toThrow(UnauthorizedException);
		});
	});
});
