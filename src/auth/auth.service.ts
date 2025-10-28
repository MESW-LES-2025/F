import {
	Injectable,
	UnauthorizedException,
	ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
	) {}

	async register(registerDto: RegisterDto) {
		const { email, username, password, name } = registerDto;

		// Check if user already exists
		const existingUser = await this.prisma.user.findFirst({
			where: {
				OR: [{ email }, { username }],
			},
		});

		if (existingUser) {
			throw new ConflictException(
				'User with this email or username already exists',
			);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create user
		const user = await this.prisma.user.create({
			data: {
				email,
				username,
				password: hashedPassword,
				name,
			},
		});

		// Generate tokens with DB storage
		const accessToken = this.generateToken(user.id, user.email);
		const refreshToken = await this.createRefreshToken(user.id);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
			expires_in: 3600, // 1 hour in seconds
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				name: user.name,
			},
		};
	}

	async login(loginDto: LoginDto) {
		const { email, password } = loginDto;

		// Find user
		const user = await this.prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Generate tokens with DB storage
		const accessToken = this.generateToken(user.id, user.email);
		const refreshToken = await this.createRefreshToken(user.id);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
			expires_in: 3600, // 1 hour in seconds
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				name: user.name,
			},
		};
	}

	private generateToken(userId: string, email: string): string {
		const payload = { sub: userId, email };
		return this.jwtService.sign(payload);
	}

	private async createRefreshToken(userId: string): Promise<string> {
		// Clean up expired tokens for this user
		await this.prisma.refreshToken.deleteMany({
			where: {
				userId,
				expiresAt: { lt: new Date() },
			},
		});

		// Generate token string
		const payload = { sub: userId, type: 'refresh' };
		const token = this.jwtService.sign(payload, { expiresIn: '30d' });

		// Store in database
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 30);

		await this.prisma.refreshToken.create({
			data: {
				token,
				userId,
				expiresAt,
			},
		});

		return token;
	}

	async refreshToken(refreshToken: string) {
		try {
			// Verify JWT signature and expiration
			const payload = this.jwtService.verify(refreshToken);

			if (payload.type !== 'refresh') {
				throw new UnauthorizedException('Invalid token type');
			}

			// Check if token exists and is not revoked in database
			const storedToken = await this.prisma.refreshToken.findUnique({
				where: { token: refreshToken },
				include: { user: true },
			});

			if (!storedToken || storedToken.isRevoked) {
				throw new UnauthorizedException('Token has been revoked');
			}

			if (storedToken.expiresAt < new Date()) {
				throw new UnauthorizedException('Token has expired');
			}

			// Revoke old refresh token (rotation)
			await this.prisma.refreshToken.update({
				where: { id: storedToken.id },
				data: {
					isRevoked: true,
					revokedAt: new Date(),
				},
			});

			// Generate new tokens
			const accessToken = this.generateToken(
				storedToken.user.id,
				storedToken.user.email,
			);
			const newRefreshToken = await this.createRefreshToken(
				storedToken.user.id,
			);

			return {
				access_token: accessToken,
				refresh_token: newRefreshToken,
				expires_in: 3600, // 1 hour in seconds
			};
		} catch (error) {
			throw new UnauthorizedException('Invalid or expired refresh token');
		}
	}

	async logout(refreshToken: string): Promise<{ message: string }> {
		try {
			// Find and revoke the refresh token
			const storedToken = await this.prisma.refreshToken.findUnique({
				where: { token: refreshToken },
			});

			if (storedToken && !storedToken.isRevoked) {
				await this.prisma.refreshToken.update({
					where: { id: storedToken.id },
					data: {
						isRevoked: true,
						revokedAt: new Date(),
					},
				});
			}

			return { message: 'Successfully logged out' };
		} catch (error) {
			// Even if token is invalid, we consider logout successful
			return { message: 'Successfully logged out' };
		}
	}

	async logoutAll(userId: string): Promise<{ message: string }> {
		// Revoke all refresh tokens for the user
		await this.prisma.refreshToken.updateMany({
			where: {
				userId,
				isRevoked: false,
			},
			data: {
				isRevoked: true,
				revokedAt: new Date(),
			},
		});

		return { message: 'Successfully logged out from all devices' };
	}

	async validateUser(userId: string) {
		return this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				username: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		});
	}
}
