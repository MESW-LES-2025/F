import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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
	async register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}

	@Post('login')
	@ApiOperation({ summary: 'Login user' })
	@ApiResponse({ status: 200, description: 'User successfully logged in' })
	@ApiResponse({ status: 401, description: 'Invalid credentials' })
	async login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto);
	}

	@Post('refresh')
	@ApiOperation({ summary: 'Refresh access token' })
	@ApiResponse({ status: 200, description: 'Token refreshed successfully' })
	@ApiResponse({
		status: 401,
		description: 'Invalid or expired refresh token',
	})
	async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
		return this.authService.refreshToken(refreshTokenDto.refresh_token);
	}

	@Post('logout')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Logout user and revoke refresh token' })
	@ApiResponse({ status: 200, description: 'Successfully logged out' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async logout(@Body() refreshTokenDto: RefreshTokenDto) {
		return this.authService.logout(refreshTokenDto.refresh_token);
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
}
