import {
	Controller,
	Post,
	Body,
	UseGuards,
	Request,
	Get,
	Res,
	UnauthorizedException,
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserRequest } from '../shared/types/user_request';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: 'Register a new user' })
	@ApiResponse({ status: 201, description: 'User successfully registered' })
	@ApiResponse({ status: 409, description: 'User already exists' })
	async register(
		@Body() registerDto: RegisterDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const data = await this.authService.register(registerDto);
		this.setCookies(res, data.access_token, data.refresh_token);
		return data;
	}

	@Post('login')
	@ApiOperation({ summary: 'Login user' })
	@ApiResponse({ status: 200, description: 'User successfully logged in' })
	@ApiResponse({ status: 401, description: 'Invalid credentials' })
	async login(
		@Body() loginDto: LoginDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const data = await this.authService.login(loginDto);
		this.setCookies(res, data.access_token, data.refresh_token);
		return data;
	}

	@Get('refresh')
	@ApiOperation({ summary: 'Refresh access token' })
	@ApiResponse({ status: 200, description: 'Token refreshed successfully' })
	@ApiResponse({
		status: 401,
		description: 'Invalid or expired refresh token',
	})
	async refresh(
		@Request() req: ExpressRequest,
		@Res({ passthrough: true }) res: Response,
	) {
		const refreshToken = req.cookies['refresh_token'] as string;
		if (!refreshToken) {
			throw new UnauthorizedException('No refresh token found');
		}
		const data = await this.authService.refreshToken(refreshToken);
		this.setCookies(res, data.access_token, data.refresh_token);
		return { message: 'Token refreshed successfully' };
	}

	@Post('logout')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Logout user and revoke refresh token' })
	@ApiResponse({ status: 200, description: 'Successfully logged out' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	logout(@Res({ passthrough: true }) res: Response) {
		this.clearCookies(res);
		return { message: 'Successfully logged out' };
	}

	@Post('logout-all')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Logout from all devices' })
	@ApiResponse({
		status: 200,
		description: 'Successfully logged out from all devices',
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async logoutAll(@Request() req: UserRequest) {
		return this.authService.logoutAll(req.user.userId);
	}

	@Post('change-password')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Change password for authenticated user' })
	async changePassword(
		@Request() req: UserRequest,
		@Body() dto: ChangePasswordDto,
	) {
		return this.authService.changePassword(req.user.userId, dto);
	}

	@Post('forgot-password')
	@ApiOperation({ summary: 'Request password reset' })
	@ApiResponse({
		status: 200,
		description: 'Reset link sent if email exists',
	})
	async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
		return this.authService.forgotPassword(forgotPasswordDto);
	}

	@Post('reset-password')
	@ApiOperation({ summary: 'Reset password' })
	@ApiResponse({ status: 200, description: 'Password successfully reset' })
	@ApiResponse({ status: 401, description: 'Invalid or expired token' })
	async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
		return this.authService.resetPassword(resetPasswordDto);
	}

	@Post('verify-email')
	@ApiOperation({ summary: 'Verify email address' })
	@ApiResponse({ status: 200, description: 'Email successfully verified' })
	@ApiResponse({ status: 401, description: 'Invalid verification token' })
	async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
		return this.authService.verifyEmail(verifyEmailDto.token);
	}

	@Get('google')
	@UseGuards(AuthGuard('google'))
	@ApiOperation({ summary: 'Google login' })
	googleAuth() {
		// Initiates the Google OAuth2 flow
	}

	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	@ApiOperation({ summary: 'Google login callback' })
	async googleAuthRedirect(
		@Request()
		req: ExpressRequest & {
			user: { access_token: string; refresh_token: string };
		},
		@Res() res: Response,
	) {
		const { access_token, refresh_token } = req.user;

		// Store tokens and get a temporary code
		const code = await this.authService.storeGoogleTokens({
			access_token,
			refresh_token,
		});

		// Ensure CORS_ORIGIN doesn't have a trailing slash
		const origin = process.env.CORS_ORIGIN
			? process.env.CORS_ORIGIN.replace(/\/$/, '')
			: 'http://localhost:8080';

		// Redirect to frontend with code
		res.redirect(`${origin}/auth/callback?code=${code}`);
	}

	@Post('google/exchange')
	@ApiOperation({ summary: 'Exchange google code for tokens' })
	@ApiResponse({ status: 200, description: 'Tokens retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Invalid or expired code' })
	async exchangeGoogleCode(
		@Body('code') code: string,
		@Res({ passthrough: true }) res: Response,
	) {
		const data = await this.authService.exchangeGoogleTokens(code);
		this.setCookies(res, data.access_token, data.refresh_token);
		return { message: 'Tokens retrieved successfully' };
	}

	private setCookies(
		res: Response,
		accessToken: string,
		refreshToken: string,
	) {
		const isProduction = process.env.NODE_ENV === 'production';

		res.cookie('access_token', accessToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'strict',
			maxAge: 15 * 60 * 1000, // 15 minutes
			path: '/',
		});
		res.cookie('refresh_token', refreshToken, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'strict',
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
			path: '/',
		});
	}

	private clearCookies(res: Response) {
		res.clearCookie('access_token', {
			path: '/',
			secure: true,
			sameSite: 'strict',
		});
		res.clearCookie('refresh_token', {
			path: '/',
			secure: true,
			sameSite: 'strict',
		});
	}
}
