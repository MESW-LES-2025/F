import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

describe('AuthController', () => {
	let controller: AuthController;

	const mockAuthService = {
		register: jest.fn(),
		login: jest.fn(),
		refreshToken: jest.fn(),
		logout: jest.fn(),
		logoutAll: jest.fn(),
		verifyEmail: jest.fn(),
		storeGoogleTokens: jest.fn(),
		exchangeGoogleTokens: jest.fn(),
		changePassword: jest.fn(),
		forgotPassword: jest.fn(),
		resetPassword: jest.fn(),
	};

	const mockUser = {
		id: 'user-id-123',
		email: 'test@example.com',
		username: 'testuser',
		name: 'Test User',
	};

	const mockAuthResponse = {
		access_token: 'mock_access_token',
		refresh_token: 'mock_refresh_token',
		expires_in: 900,
		user: mockUser,
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<AuthController>(AuthController);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('register', () => {
		const registerDto = {
			email: 'newuser@example.com',
			username: 'newuser',
			password: 'password123',
			name: 'New User',
		};

		it('should register a new user', async () => {
			mockAuthService.register.mockResolvedValue(mockAuthResponse);

			const result = await controller.register(registerDto);

			expect(result).toEqual(mockAuthResponse);
			expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
		});
	});

	describe('login', () => {
		const loginDto = {
			email: 'test@example.com',
			password: 'password123',
		};

		it('should login user with valid credentials', async () => {
			mockAuthService.login.mockResolvedValue(mockAuthResponse);

			const result = await controller.login(loginDto);

			expect(result).toEqual(mockAuthResponse);
			expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
		});
	});

	describe('refresh', () => {
		const refreshTokenDto = {
			refresh_token: 'valid_refresh_token',
		};

		it('should refresh tokens', async () => {
			const refreshResponse = {
				access_token: 'new_access_token',
				refresh_token: 'new_refresh_token',
				expires_in: 900,
			};
			mockAuthService.refreshToken.mockResolvedValue(refreshResponse);

			const result = await controller.refresh(refreshTokenDto);

			expect(result).toEqual(refreshResponse);
			expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
				refreshTokenDto.refresh_token,
			);
		});
	});

	describe('logout', () => {
		const refreshTokenDto = {
			refresh_token: 'valid_refresh_token',
		};

		it('should logout user and revoke refresh token', async () => {
			const logoutResponse = { message: 'Successfully logged out' };
			mockAuthService.logout.mockResolvedValue(logoutResponse);

			const result = await controller.logout(refreshTokenDto);

			expect(result).toEqual(logoutResponse);
			expect(mockAuthService.logout).toHaveBeenCalledWith(
				refreshTokenDto.refresh_token,
			);
		});

		it('should handle logout with invalid token', async () => {
			const logoutResponse = { message: 'Successfully logged out' };
			mockAuthService.logout.mockResolvedValue(logoutResponse);

			const result = await controller.logout({
				refresh_token: 'invalid_token',
			});

			expect(result).toEqual(logoutResponse);
		});
	});

	describe('logoutAll', () => {
		const mockRequest = {
			user: {
				userId: 'user-id-123',
				email: 'test@example.com',
			},
		};

		it('should logout from all devices', async () => {
			const logoutAllResponse = {
				message: 'Successfully logged out from all devices',
			};
			mockAuthService.logoutAll.mockResolvedValue(logoutAllResponse);

			const result = await controller.logoutAll(mockRequest);

			expect(result).toEqual(logoutAllResponse);
			expect(mockAuthService.logoutAll).toHaveBeenCalledWith(
				mockRequest.user.userId,
			);
		});
	});

	describe('verifyEmail', () => {
		const verifyEmailDto = {
			token: 'valid_verification_token',
		};

		it('should verify email', async () => {
			const verifyResponse = {
				message: 'Email verified successfully',
				user: mockUser,
			};
			mockAuthService.verifyEmail.mockResolvedValue(verifyResponse);

			const result = await controller.verifyEmail(verifyEmailDto);

			expect(result).toEqual(verifyResponse);
			expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(
				verifyEmailDto.token,
			);
		});
	});
	describe('changePassword', () => {
		const changePasswordDto = {
			currentPassword: 'oldPassword',
			newPassword: 'newPassword',
		};
		const req = { user: { userId: 'user-id-123' } };

		it('should change password', async () => {
			const response = { message: 'Password changed successfully' };
			mockAuthService.changePassword = jest
				.fn()
				.mockResolvedValue(response);

			const result = await controller.changePassword(
				req,
				changePasswordDto,
			);

			expect(result).toEqual(response);
			expect(mockAuthService.changePassword).toHaveBeenCalledWith(
				req.user.userId,
				changePasswordDto,
			);
		});
	});

	describe('forgotPassword', () => {
		const forgotPasswordDto = { email: 'test@example.com' };

		it('should request password reset', async () => {
			const response = { message: 'Reset link sent' };
			mockAuthService.forgotPassword = jest
				.fn()
				.mockResolvedValue(response);

			const result = await controller.forgotPassword(forgotPasswordDto);

			expect(result).toEqual(response);
			expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
				forgotPasswordDto,
			);
		});
	});

	describe('resetPassword', () => {
		const resetPasswordDto = {
			token: 'token',
			password: 'newPassword',
		};

		it('should reset password', async () => {
			const response = { message: 'Password successfully reset' };
			mockAuthService.resetPassword = jest
				.fn()
				.mockResolvedValue(response);

			const result = await controller.resetPassword(resetPasswordDto);

			expect(result).toEqual(response);
			expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
				resetPasswordDto,
			);
		});
	});

	describe('googleAuth', () => {
		it('should be defined and executable', () => {
			expect(controller.googleAuth.bind(controller)).toBeDefined();
			expect(() => controller.googleAuth()).not.toThrow();
		});
	});

	describe('googleAuthRedirect', () => {
		const originalEnv = process.env;

		// interface GoogleAuthRequest extends Request {
		// 	user: {
		// 		access_token: string;
		// 		refresh_token: string;
		// 	};
		// }

		beforeEach(() => {
			jest.resetModules();
			process.env = { ...originalEnv };
		});

		afterAll(() => {
			process.env = originalEnv;
		});

		it('should handle google auth callback with default origin', async () => {
			delete process.env.CORS_ORIGIN;
			const req = {
				user: {
					access_token: 'access',
					refresh_token: 'refresh',
				},
			};
			const res = {
				redirect: jest.fn(),
			};
			const code = 'auth-code';

			mockAuthService.storeGoogleTokens = jest
				.fn()
				.mockResolvedValue(code);

			await controller.googleAuthRedirect(
				req as unknown as Request & {
					user: { access_token: string; refresh_token: string };
				},
				res as unknown as Response,
			);

			expect(mockAuthService.storeGoogleTokens).toHaveBeenCalledWith({
				access_token: 'access',
				refresh_token: 'refresh',
			});
			expect(res.redirect).toHaveBeenCalledWith(
				`http://localhost:8080/auth/callback?code=${code}`,
			);
		});

		it('should handle google auth callback with custom origin', async () => {
			process.env.CORS_ORIGIN = 'https://myapp.com';
			const req = {
				user: {
					access_token: 'access',
					refresh_token: 'refresh',
				},
			};
			const res = {
				redirect: jest.fn(),
			};
			const code = 'auth-code';

			mockAuthService.storeGoogleTokens = jest
				.fn()
				.mockResolvedValue(code);

			await controller.googleAuthRedirect(
				req as unknown as Request & {
					user: { access_token: string; refresh_token: string };
				},
				res as unknown as Response,
			);

			expect(res.redirect).toHaveBeenCalledWith(
				`https://myapp.com/auth/callback?code=${code}`,
			);
		});

		it('should strip trailing slash from custom origin', async () => {
			process.env.CORS_ORIGIN = 'https://myapp.com/';
			const req = {
				user: {
					access_token: 'access',
					refresh_token: 'refresh',
				},
			};
			const res = {
				redirect: jest.fn(),
			};
			const code = 'auth-code';

			mockAuthService.storeGoogleTokens = jest
				.fn()
				.mockResolvedValue(code);

			await controller.googleAuthRedirect(
				req as unknown as Request & {
					user: { access_token: string; refresh_token: string };
				},
				res as unknown as Response,
			);

			expect(res.redirect).toHaveBeenCalledWith(
				`https://myapp.com/auth/callback?code=${code}`,
			);
		});
	});

	describe('exchangeGoogleCode', () => {
		it('should exchange code for tokens', async () => {
			const code = 'auth-code';
			const tokens = {
				access_token: 'access',
				refresh_token: 'refresh',
			};

			mockAuthService.exchangeGoogleTokens = jest
				.fn()
				.mockResolvedValue(tokens);

			const result = await controller.exchangeGoogleCode(code);

			expect(result).toEqual(tokens);
			expect(mockAuthService.exchangeGoogleTokens).toHaveBeenCalledWith(
				code,
			);
		});
	});
});
