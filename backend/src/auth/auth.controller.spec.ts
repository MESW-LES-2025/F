/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request, Response } from 'express';
import { UserRequest } from 'src/shared/types/user_request';

describe('AuthController', () => {
	let controller: AuthController;

	const mockAuthService = {
		register: jest.fn(),
		login: jest.fn(),
		refreshToken: jest.fn(),
		logout: jest.fn(),
		logoutAll: jest.fn(),
		verifyEmail: jest.fn(),
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

			const mockResponse = {
				cookie: jest.fn(),
			} as unknown as Response;

			const result = await controller.register(registerDto, mockResponse);

			expect(result).toEqual(mockAuthResponse);
			expect(mockResponse.cookie).toHaveBeenCalledTimes(2); // access_token and refresh_token
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

			const mockResponse = {
				cookie: jest.fn(),
			} as unknown as Response;

			const result = await controller.login(loginDto, mockResponse);

			expect(result).toEqual(mockAuthResponse);
			expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
			expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
		});
	});

	describe('refresh', () => {
		it('should refresh tokens', async () => {
			const mockRequest = {
				cookies: { refresh_token: 'valid_refresh_token' },
			} as unknown as Request;
			const mockResponse = {
				cookie: jest.fn(),
			} as unknown as Response;

			mockAuthService.refreshToken.mockResolvedValue({
				access_token: 'new_access_token',
				refresh_token: 'new_refresh_token',
			});

			const result = await controller.refresh(mockRequest, mockResponse);

			expect(result).toEqual({ message: 'Token refreshed successfully' });
			expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
				'valid_refresh_token',
			);
			expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
		});
	});

	describe('logout', () => {
		it('should logout user and revoke refresh token', () => {
			const mockResponse = {
				clearCookie: jest.fn(),
			} as unknown as Response;

			const result = controller.logout(mockResponse);

			expect(result).toEqual({ message: 'Successfully logged out' });
			expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
		});
	});

	describe('logoutAll', () => {
		const mockRequest = {
			user: {
				userId: 'user-id-123',
				email: 'test@example.com',
			},
		} as unknown as UserRequest;

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
});
