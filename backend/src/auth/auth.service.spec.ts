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
		googleAuthCode: {
			create: jest.MockedFunction<(...args: any[]) => Promise<any>>;
			findUnique: jest.MockedFunction<(...args: any[]) => Promise<any>>;
			delete: jest.MockedFunction<(...args: any[]) => Promise<any>>;
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
		googleAuthCode: {
			create: jest.fn(),
			findUnique: jest.fn(),
			delete: jest.fn(),
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
		verificationToken: null as string | null,
		googleId: null as string | null,
		houses: [] as any[],
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

		it('should reactivate a deleted user', async () => {
			const deletedUser = { ...mockUser, deletedAt: new Date() };
			mockPrismaService.user.findUnique
				.mockResolvedValueOnce(deletedUser) // findByEmail
				.mockResolvedValueOnce(null); // findByUsername

			mockPrismaService.user.update.mockResolvedValue({
				...mockUser,
				deletedAt: null,
			});
			mockPrismaService.refreshToken.create.mockResolvedValue(
				mockRefreshToken,
			);

			const result = await service.register({
				email: 'test@example.com',
				username: 'newusername',
				password: 'password123',
				name: 'New Name',
			});

			expect(mockPrismaService.user.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: deletedUser.id },
					data: expect.objectContaining({
						deletedAt: null,
					}) as unknown,
				}),
			);
			expect(result).toHaveProperty('access_token');
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

			const result = (await service.login({
				email: 'test@example.com',
				password: 'password123',
			})) as {
				access_token: string;
				refresh_token: string;
				expires_in: number;
				user: any;
			};

			expect(result).toHaveProperty('access_token');
			expect(result).toHaveProperty('refresh_token');
			expect(result).toHaveProperty('expires_in', 900);
			expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
		});

		it('should throw UnauthorizedException if email not verified', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue({
				...mockUser,
				isEmailVerified: false,
				verificationToken: null,
			});
			mockPrismaService.user.update.mockResolvedValue({
				...mockUser,
				isEmailVerified: false,
				verificationToken: 'new-token',
			});

			await expect(
				service.login({
					email: 'test@example.com',
					password: 'password123',
				}),
			).rejects.toThrow('Please verify your email before logging in');

			expect(mockEmailService.sendEmail).toHaveBeenCalled();
			expect(mockPrismaService.user.update).toHaveBeenCalled();
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

	describe('storeGoogleTokens', () => {
		it('should store google tokens and return code', async () => {
			const tokens = {
				access_token: 'access',
				refresh_token: 'refresh',
			};
			mockPrismaService.googleAuthCode.create.mockResolvedValue({});

			const code = await service.storeGoogleTokens(tokens);

			expect(code).toBeDefined();
			expect(mockPrismaService.googleAuthCode.create).toHaveBeenCalled();
		});
	});

	describe('exchangeGoogleTokens', () => {
		it('should exchange code for tokens', async () => {
			const code = 'valid-code';
			const authCode = {
				code,
				accessToken: 'access',
				refreshToken: 'refresh',
				expiresAt: new Date(Date.now() + 60000),
			};
			mockPrismaService.googleAuthCode.findUnique.mockResolvedValue(
				authCode,
			);
			mockPrismaService.googleAuthCode.delete.mockResolvedValue({});

			const result = await service.exchangeGoogleTokens(code);

			expect(result).toEqual({
				access_token: 'access',
				refresh_token: 'refresh',
			});
		});

		it('should throw UnauthorizedException if code is expired', async () => {
			const code = 'expired-code';
			const authCode = {
				code,
				accessToken: 'access',
				refreshToken: 'refresh',
				expiresAt: new Date(Date.now() - 1000), // Expired
			};
			mockPrismaService.googleAuthCode.findUnique.mockResolvedValue(
				authCode,
			);
			mockPrismaService.googleAuthCode.delete.mockResolvedValue({});

			await expect(service.exchangeGoogleTokens(code)).rejects.toThrow(
				UnauthorizedException,
			);
			expect(
				mockPrismaService.googleAuthCode.delete,
			).toHaveBeenCalledWith({
				where: { code },
			});
		});

		it('should throw UnauthorizedException if code invalid', async () => {
			mockPrismaService.googleAuthCode.findUnique.mockResolvedValue(null);

			await expect(
				service.exchangeGoogleTokens('invalid'),
			).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('verifyEmail', () => {
		it('should verify email', async () => {
			const token = 'valid-token';
			const user = { ...mockUser, verificationToken: token };
			mockPrismaService.user.findFirst.mockResolvedValue(user);
			mockPrismaService.user.update.mockResolvedValue(user);
			mockPrismaService.refreshToken.create.mockResolvedValue(
				mockRefreshToken,
			);

			const result = (await service.verifyEmail(token)) as {
				access_token: string;
				refresh_token: string;
				expires_in: number;
				user: any;
			};

			expect(result).toHaveProperty('access_token');
			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: user.id },
				data: { isEmailVerified: true, verificationToken: null },
			});
		});

		it('should throw UnauthorizedException if token invalid', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(service.verifyEmail('invalid')).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});

	describe('validateGoogleUser', () => {
		const googleUser = {
			email: 'test@example.com',
			firstName: 'Test',
			lastName: 'User',
			picture: 'pic',
			googleId: 'google-id',
			accessToken: 'access',
		};

		it('should return existing user by googleId', async () => {
			const user = { ...mockUser, googleId: 'google-id' };
			mockPrismaService.user.findUnique.mockResolvedValue(user);
			mockPrismaService.refreshToken.create.mockResolvedValue(
				mockRefreshToken,
			);

			const result = await service.validateGoogleUser(googleUser);

			expect(result.user.id).toBe(user.id);
		});

		it('should link existing email user to google', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null); // Not found by googleId
			mockPrismaService.user.findFirst.mockResolvedValue({
				...mockUser,
				googleId: null,
			}); // Found by email
			mockPrismaService.user.update.mockResolvedValue({
				...mockUser,
				googleId: 'google-id',
			});
			mockPrismaService.refreshToken.create.mockResolvedValue(
				mockRefreshToken,
			);

			const result = await service.validateGoogleUser(googleUser);

			expect(result.user.googleId).toBe('google-id');
			expect(mockPrismaService.user.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: mockUser.id },
					data: expect.objectContaining({
						googleId: 'google-id',
					}) as unknown,
				}),
			);
		});

		it('should restore deleted user found by googleId', async () => {
			const deletedUser = {
				...mockUser,
				googleId: 'google-id',
				deletedAt: new Date(),
			};
			mockPrismaService.user.findUnique.mockResolvedValue(deletedUser);
			mockPrismaService.user.update.mockResolvedValue({
				...deletedUser,
				deletedAt: null,
			});
			mockPrismaService.refreshToken.create.mockResolvedValue(
				mockRefreshToken,
			);

			await service.validateGoogleUser(googleUser);

			expect(mockPrismaService.user.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: deletedUser.id },
					data: { deletedAt: null },
				}),
			);
		});

		it('should create new user if not found', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null);
			mockPrismaService.user.findFirst.mockResolvedValue(null);
			mockPrismaService.user.create.mockResolvedValue({
				...mockUser,
				googleId: 'google-id',
			});
			mockPrismaService.refreshToken.create.mockResolvedValue(
				mockRefreshToken,
			);

			const result = await service.validateGoogleUser(googleUser);

			expect(result.user.googleId).toBe('google-id');
			expect(mockPrismaService.user.create).toHaveBeenCalled();
		});
	});

	describe('forgotPassword', () => {
		it('should send reset email if user exists', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
			mockPrismaService.user.update.mockResolvedValue(mockUser);

			const result = await service.forgotPassword({
				email: 'test@example.com',
			});

			expect(result.message).toContain(
				'password reset link has been sent',
			);
			expect(mockEmailService.sendEmail).toHaveBeenCalled();
		});

		it('should not send email if user is google account', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue({
				...mockUser,
				googleId: 'google-id',
			});

			const result = await service.forgotPassword({
				email: 'test@example.com',
			});

			expect(result.message).toContain(
				'password reset link has been sent',
			);
			expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
		});

		it('should return message even if user does not exist', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			const result = await service.forgotPassword({
				email: 'nonexistent@example.com',
			});

			expect(result.message).toContain(
				'password reset link has been sent',
			);
			expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
		});
	});

	describe('resetPassword', () => {
		it('should reset password', async () => {
			const token = 'valid-token';
			const user = {
				...mockUser,
				resetToken: token,
				resetTokenExpiry: new Date(Date.now() + 10000),
			};
			mockPrismaService.user.findFirst.mockResolvedValue(user);
			mockPrismaService.user.update.mockResolvedValue(user);

			const result = await service.resetPassword({
				token,
				password: 'newPassword',
			});

			expect(result.message).toBe('Password successfully reset');
			expect(mockPrismaService.user.update).toHaveBeenCalled();
		});

		it('should throw UnauthorizedException if token invalid', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(
				service.resetPassword({ token: 'invalid', password: 'new' }),
			).rejects.toThrow(UnauthorizedException);
		});
	});
});
