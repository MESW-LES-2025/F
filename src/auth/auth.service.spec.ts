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

			const result = await service.login({
				email: 'test@example.com',
				password: 'password123',
			});

			expect(result).toHaveProperty('access_token');
			expect(result).toHaveProperty('refresh_token');
			expect(result).toHaveProperty('expires_in', 3600);
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
	});

	describe('refreshToken', () => {
		it('should successfully refresh tokens', async () => {
			const payload = {
				sub: mockUser.id,
				email: mockUser.email,
				type: 'refresh',
			};
			mockJwtService.verify.mockReturnValue(payload);
			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

			const result = await service.refreshToken('valid_refresh_token');

			expect(result).toHaveProperty('access_token');
			expect(result).toHaveProperty('refresh_token');
			expect(result).toHaveProperty('expires_in', 3600);
		});

		it('should throw UnauthorizedException if token is invalid', async () => {
			mockJwtService.verify.mockImplementation(() => {
				throw new Error('Invalid token');
			});

			await expect(service.refreshToken('invalid_token')).rejects.toThrow(
				UnauthorizedException,
			);
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
