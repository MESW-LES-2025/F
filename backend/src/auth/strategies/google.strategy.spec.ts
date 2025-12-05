/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

describe('GoogleStrategy', () => {
	let strategy: GoogleStrategy;
	let authService: AuthService;

	beforeEach(async () => {
		const mockAuthService = {
			validateGoogleUser: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				GoogleStrategy,
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		}).compile();

		strategy = module.get<GoogleStrategy>(GoogleStrategy);
		authService = module.get<AuthService>(AuthService);
	});

	it('should be defined', () => {
		expect(strategy.validate.bind(strategy)).toBeDefined();
	});

	describe('validate', () => {
		it('should validate and return user', async () => {
			const accessToken = 'access-token';
			const refreshToken = 'refresh-token';
			const profile = {
				id: 'google-id',
				emails: [{ value: 'test@example.com' }],
				name: { givenName: 'Test', familyName: 'User' },
				photos: [{ value: 'photo-url' }],
			};
			const done = jest.fn();

			const validatedUser = { id: 'user-id', email: 'test@example.com' };
			(authService.validateGoogleUser as jest.Mock).mockResolvedValue(
				validatedUser,
			);

			await strategy.validate(
				accessToken,
				refreshToken,
				profile as unknown as Profile,
				done,
			);

			expect(
				authService.validateGoogleUser as jest.Mock,
			).toHaveBeenCalledWith({
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				picture: 'photo-url',
				googleId: 'google-id',
				accessToken,
			});
			expect(done).toHaveBeenCalledWith(null, validatedUser);
		});

		it('should return error if no email found', async () => {
			const accessToken = 'access-token';
			const refreshToken = 'refresh-token';
			const profile = {
				id: 'google-id',
				emails: [],
				name: { givenName: 'Test', familyName: 'User' },
				photos: [{ value: 'photo-url' }],
			};
			const done = jest.fn();

			await strategy.validate(
				accessToken,
				refreshToken,
				profile as unknown as Profile,
				done,
			);

			expect(done).toHaveBeenCalledWith(expect.any(Error), undefined);

			expect(
				authService.validateGoogleUser as jest.Mock,
			).not.toHaveBeenCalled();
		});

		it('should handle missing name and photos', async () => {
			const accessToken = 'access-token';
			const refreshToken = 'refresh-token';
			const profile = {
				id: 'google-id',
				emails: [{ value: 'test@example.com' }],
				// Missing name and photos
			};
			const done = jest.fn();

			const validatedUser = { id: 'user-id', email: 'test@example.com' };
			(authService.validateGoogleUser as jest.Mock).mockResolvedValue(
				validatedUser,
			);

			await strategy.validate(
				accessToken,
				refreshToken,
				profile as unknown as Profile,
				done,
			);

			expect(
				authService.validateGoogleUser as jest.Mock,
			).toHaveBeenCalledWith({
				email: 'test@example.com',
				firstName: '',
				lastName: '',
				picture: '',
				googleId: 'google-id',
				accessToken,
			});
			expect(done).toHaveBeenCalledWith(null, validatedUser);
		});
	});
});
