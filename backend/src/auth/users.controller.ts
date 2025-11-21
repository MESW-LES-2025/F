import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
} from '@nestjs/swagger';
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

	@Get('users/house/:houseId')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({
		summary: 'Get all users in a specific house (for task assignment)',
	})
	@ApiParam({ name: 'houseId', description: 'House UUID' })
	@ApiResponse({ status: 200, description: 'Users retrieved successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	async getUsersByHouse(@Param('houseId') houseId: string) {
		const users = await this.prisma.user.findMany({
			where: {
				houses: {
					some: {
						houseId: houseId,
					},
				},
			},
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
