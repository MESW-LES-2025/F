import {
	Injectable,
	UnauthorizedException,
	ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../shared/email/email.service';
import { v4 as uuidv4 } from 'uuid';

interface JwtPayload {
	sub: string;
	email: string;
	type?: string;
}

export interface GoogleUser {
	email: string;
	firstName: string;
	lastName: string;
	picture: string;
	googleId: string;
	accessToken: string;
}

export interface GoogleTokens {
	access_token: string;
	refresh_token: string;
}

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
		private emailService: EmailService,
	) {}

	async storeGoogleTokens(tokens: GoogleTokens): Promise<string> {
		const code = uuidv4();
		// Store tokens with 60s expiration
		await this.prisma.googleAuthCode.create({
			data: {
				code,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiresAt: new Date(Date.now() + 60000),
			},
		});
		return code;
	}

	async exchangeGoogleTokens(code: string): Promise<GoogleTokens> {
		const authCode = await this.prisma.googleAuthCode.findUnique({
			where: { code },
		});

		if (!authCode) {
			throw new UnauthorizedException('Invalid or expired code');
		}

		if (authCode.expiresAt < new Date()) {
			await this.prisma.googleAuthCode.delete({ where: { code } });
			throw new UnauthorizedException('Invalid or expired code');
		}

		// One-time use
		await this.prisma.googleAuthCode.delete({ where: { code } });

		return {
			access_token: authCode.accessToken,
			refresh_token: authCode.refreshToken,
		};
	}

	async register(registerDto: RegisterDto) {
		const { username, password, name } = registerDto;
		const email = registerDto.email.toLowerCase();
		const isDev = process.env.NODE_ENV === 'development';

		const userByEmail = await this.prisma.user.findUnique({
			where: { email },
		});
		const userByUsername = await this.prisma.user.findUnique({
			where: { username },
		});

		if (userByEmail && !userByEmail.deletedAt) {
			throw new ConflictException('User with this email already exists');
		}

		if (userByUsername && !userByUsername.deletedAt) {
			throw new ConflictException('Username is already taken');
		}

		// If username is taken by a DIFFERENT deleted user, we can't use it due to unique constraint
		if (
			userByUsername &&
			(!userByEmail || userByUsername.id !== userByEmail.id)
		) {
			throw new ConflictException('Username is already taken');
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		let user;

		if (userByEmail) {
			// Reactivate existing deleted user
			user = await this.prisma.user.update({
				where: { id: userByEmail.id },
				data: {
					username,
					password: hashedPassword,
					name,
					verificationToken: null,
					isEmailVerified: isDev ? true : false,
					deletedAt: null,
				},
			});
		} else {
			try {
				// Create user
				user = await this.prisma.user.create({
					data: {
						email,
						username,
						password: hashedPassword,
						name,
						verificationToken: null,
						isEmailVerified: isDev ? true : false,
					},
				});
			} catch (error) {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === 'P2002'
				) {
					const target = error.meta?.target as string[];
					if (target && target.includes('email')) {
						throw new ConflictException(
							'User with this email already exists',
						);
					}
					if (target && target.includes('username')) {
						throw new ConflictException(
							'Username is already taken',
						);
					}
				}
				throw error;
			}
		}

		// Generate tokens with DB storage
		const accessToken = this.generateToken(user.id, user.email);
		const refreshToken = await this.createRefreshToken(user.id);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
			expires_in: 900, // 15 minutes in seconds
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				name: user.name,
				imageUrl: user.imageUrl,
				houses: [],
				googleId: user.googleId,
			},
		};
	}

	async verifyEmail(token: string) {
		const user = await this.prisma.user.findFirst({
			where: { verificationToken: token },
			include: {
				houses: {
					select: { houseId: true },
				},
			},
		});

		if (!user) {
			throw new UnauthorizedException('Invalid verification token');
		}

		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				isEmailVerified: true,
				verificationToken: null,
			},
		});

		// Generate tokens with DB storage
		const accessToken = this.generateToken(user.id, user.email);
		const refreshToken = await this.createRefreshToken(user.id);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
			expires_in: 900, // 15 minutes in seconds
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				name: user.name,
				imageUrl: user.imageUrl,
				houses: user.houses.map((h) => ({ id: h.houseId })),
				googleId: user.googleId,
			},
		};
	}

	async login(loginDto: LoginDto) {
		const { email, password } = loginDto;

		// Find user
		const user = await this.prisma.user.findFirst({
			where: { email, deletedAt: null },
			select: {
				id: true,
				name: true,
				username: true,
				email: true,
				password: true,
				imageUrl: true,
				googleId: true,
				isEmailVerified: true,
				verificationToken: true,
				houses: {
					select: { houseId: true },
				},
			},
		});

		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			throw new UnauthorizedException('Invalid credentials');
		}

		if (!user.isEmailVerified) {
			// Generate verification token if not exists
			let verificationToken = user.verificationToken;
			if (!verificationToken) {
				verificationToken = uuidv4();
				await this.prisma.user.update({
					where: { id: user.id },
					data: { verificationToken },
				});
			}

			const verificationLink = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/verify-email?token=${verificationToken}`;

			await this.emailService.sendEmail(
				user.email,
				'Verify your email',
				`
				<h1>Welcome to Concordia!</h1>
				<p>Please verify your email address by clicking the link below:</p>
				<a href="${verificationLink}">Verify Email</a>
				`,
			);

			throw new UnauthorizedException(
				'Please verify your email before logging in',
			);
		}

		// Generate tokens with DB storage
		const accessToken = this.generateToken(user.id, user.email);
		const refreshToken = await this.createRefreshToken(user.id);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
			expires_in: 900, // 15 minutes in seconds
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				name: user.name,
				imageUrl: user.imageUrl,
				houses: user.houses.map((h) => ({ id: h.houseId })),
				googleId: user.googleId,
			},
		};
	}

	async validateGoogleUser(googleUser: GoogleUser) {
		const { email, firstName, lastName, picture, googleId } = googleUser;

		// 1. Try to find user by googleId first
		let user = await this.prisma.user.findUnique({
			where: { googleId },
		});

		// 2. If not found by googleId, try to find by email
		if (!user) {
			user = await this.prisma.user.findFirst({
				where: { email },
			});

			if (user) {
				// If user exists by email but doesn't have googleId, link it
				if (!user.googleId) {
					user = await this.prisma.user.update({
						where: { id: user.id },
						data: {
							googleId,
							imageUrl: user.imageUrl || picture,
							deletedAt: null, // Restore user if deleted
						},
					});
				}
			}
		} else if (user.deletedAt) {
			// If user exists by googleId but is deleted, restore it
			user = await this.prisma.user.update({
				where: { id: user.id },
				data: { deletedAt: null },
			});
		}

		if (user) {
			// Generate tokens
			const accessToken = this.generateToken(user.id, user.email);
			const refreshToken = await this.createRefreshToken(user.id);

			return {
				access_token: accessToken,
				refresh_token: refreshToken,
				expires_in: 900,
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					name: user.name,
					imageUrl: user.imageUrl,
					googleId: user.googleId,
				},
			};
		}

		// 3. Create new user if not found by googleId or email
		const password = uuidv4(); // Generate random password
		const hashedPassword = await bcrypt.hash(password, 10);
		const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

		const newUser = await this.prisma.user.create({
			data: {
				email,
				username,
				password: hashedPassword,
				name: `${firstName} ${lastName}`,
				imageUrl: picture,
				googleId,
				isEmailVerified: true, // Google verified email
			},
		});

		const accessToken = this.generateToken(newUser.id, newUser.email);
		const refreshToken = await this.createRefreshToken(newUser.id);

		return {
			access_token: accessToken,
			refresh_token: refreshToken,
			expires_in: 900,
			user: {
				id: newUser.id,
				email: newUser.email,
				username: newUser.username,
				name: newUser.name,
				imageUrl: newUser.imageUrl,
				googleId: newUser.googleId,
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
		const payload = { sub: userId, type: 'refresh', jti: uuidv4() };
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
			const payload = this.jwtService.verify<JwtPayload>(refreshToken);

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
				expires_in: 900, // 15 minutes in seconds
			};
		} catch {
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
		} catch {
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

	async changePassword(userId: string, dto: ChangePasswordDto) {
		const { currentPassword, newPassword } = dto;

		// Find user
		const user = await this.prisma.user.findFirst({
			where: { id: userId, deletedAt: null },
			select: { id: true, password: true, googleId: true },
		});
		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		if (user.googleId) {
			throw new UnauthorizedException(
				'Google accounts cannot change password',
			);
		}

		// Verify current password
		const isMatch = await bcrypt.compare(currentPassword, user.password);
		if (!isMatch) {
			throw new UnauthorizedException('Current password is incorrect');
		}

		// Hash new password and update
		const hashed = await bcrypt.hash(newPassword, 10);
		await this.prisma.user.update({
			where: { id: userId },
			data: { password: hashed },
		});

		// Revoke all refresh tokens so user must re-login on other devices
		await this.prisma.refreshToken.updateMany({
			where: { userId, isRevoked: false },
			data: { isRevoked: true, revokedAt: new Date() },
		});

		return { message: 'Password changed successfully' };
	}

	async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
		const { email } = forgotPasswordDto;
		const user = await this.prisma.user.findUnique({ where: { email } });

		if (!user) {
			// Don't reveal if user exists
			return {
				message:
					'If a user with this email exists, a password reset link has been sent.',
			};
		}

		if (user.googleId) {
			// Don't allow password reset for Google accounts
			// We still return the same message to avoid enumeration, but we don't send the email
			return {
				message:
					'If a user with this email exists, a password reset link has been sent.',
			};
		}

		const resetToken = uuidv4();
		const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				resetToken,
				resetTokenExpiry,
			},
		});

		const resetLink = `${process.env.CORS_ORIGIN || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

		await this.emailService.sendEmail(
			user.email,
			'Password Reset Request',
			`
			<h1>Password Reset Request</h1>
			<p>You requested a password reset. Click the link below to reset your password:</p>
			<a href="${resetLink}">Reset Password</a>
			<p>If you didn't request this, please ignore this email.</p>
			<p>This link will expire in 1 hour.</p>
			`,
		);

		return {
			message:
				'If a user with this email exists, a password reset link has been sent.',
		};
	}

	async resetPassword(resetPasswordDto: ResetPasswordDto) {
		const { token, password } = resetPasswordDto;

		const user = await this.prisma.user.findFirst({
			where: {
				resetToken: token,
				resetTokenExpiry: {
					gt: new Date(),
				},
			},
		});

		if (!user) {
			throw new UnauthorizedException('Invalid or expired reset token');
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				resetToken: null,
				resetTokenExpiry: null,
			},
		});

		return { message: 'Password successfully reset' };
	}
}
