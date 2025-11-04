import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class UsersController {
	constructor(private readonly prisma: PrismaService) {}

	@Get('users')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Get all users (for task assignment)' })
	@ApiResponse({ status: 200, description: 'Users retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async getUsers() {
		const users = await this.prisma.user.findMany({
			select: {
				id: true,
				email: true,
				username: true,
				name: true,
			},
			orderBy: {
				name: 'asc',
			},
		});

		return users;
	}
}
