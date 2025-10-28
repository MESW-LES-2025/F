import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
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
		validateUser: jest.fn(),
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
		expires_in: 3600,
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
				expires_in: 3600,
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

	describe('getProfile', () => {
		const mockRequest = {
			user: {
				userId: 'user-id-123',
				email: 'test@example.com',
				username: 'testuser',
			},
		};

		const mockUserProfile = {
			id: 'user-id-123',
			email: 'test@example.com',
			username: 'testuser',
			name: 'Test User',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('should return user profile', async () => {
			mockAuthService.validateUser.mockResolvedValue(mockUserProfile);

			const result = await controller.getProfile(mockRequest);

			expect(result).toEqual(mockUserProfile);
			expect(mockAuthService.validateUser).toHaveBeenCalledWith(
				mockRequest.user.userId,
			);
		});
	});
});
