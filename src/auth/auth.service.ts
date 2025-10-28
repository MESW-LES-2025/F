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

		// Generate tokens
		const accessToken = this.generateToken(user.id, user.email);
		const refreshToken = this.generateRefreshToken(user.id, user.email);

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

		// Generate tokens
		const accessToken = this.generateToken(user.id, user.email);
		const refreshToken = this.generateRefreshToken(user.id, user.email);

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

	private generateRefreshToken(userId: string, email: string): string {
		const payload = { sub: userId, email, type: 'refresh' };
		return this.jwtService.sign(payload, { expiresIn: '30d' });
	}

	async refreshToken(refreshToken: string) {
		try {
			const payload = this.jwtService.verify(refreshToken);

			if (payload.type !== 'refresh') {
				throw new UnauthorizedException('Invalid token type');
			}

			const user = await this.prisma.user.findUnique({
				where: { id: payload.sub },
			});

			if (!user) {
				throw new UnauthorizedException('User not found');
			}

			const accessToken = this.generateToken(user.id, user.email);
			const newRefreshToken = this.generateRefreshToken(
				user.id,
				user.email,
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
