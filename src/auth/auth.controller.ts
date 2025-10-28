import {
	Controller,
	Post,
	Body,
	Get,
	UseGuards,
	Request,
} from '@nestjs/common';
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
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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
	async logoutAll(@Request() req: any) {
		return this.authService.logoutAll(req.user.userId);
	}

	@Get('profile')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Get current user profile' })
	@ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async getProfile(@Request() req: any) {
		return this.authService.validateUser(req.user.userId);
	}
}
