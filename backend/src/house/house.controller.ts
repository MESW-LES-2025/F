import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Request,
	UseGuards,
	Put,
	Delete,
} from '@nestjs/common';
import { HouseService } from './house.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRequest } from '../shared/types/user_request';
import { UpdateHouseDto } from './dto/update-house.dto';

@Controller('house')
export class HouseController {
	constructor(private readonly houseService: HouseService) {}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Create a new house' })
	@Post()
	create(
		@Body() createHouseDto: CreateHouseDto,
		@Request() req: UserRequest,
	) {
		return this.houseService.create(createHouseDto, req.user.userId);
	}

	// To-do: we need to add a security here so only admin users can see this
	@ApiOperation({ summary: '[ADMIN] Find all houses in the system' })
	@Get()
	findAll() {
		return this.houseService.findAll();
	}

	@ApiOperation({
		summary: 'Find all houses in the system related to the user',
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get('user')
	findAllUserHouses(@Request() req: UserRequest) {
		return this.houseService.findAllUserHouses(req.user.userId);
	}

	@ApiOperation({
		summary: 'Get all users in a specific house (for task assignment)',
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get(':houseId/users')
	@Get(':houseId/users')
	getUsersByHouse(
		@Param('houseId') houseId: string,
		@Request() req: UserRequest,
	) {
		return this.houseService.getUsersByHouse(houseId, req.user.userId);
	}

	@ApiOperation({
		summary: 'Find details of a house in the system related to the user',
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get('details/:id')
	findHouseDetails(@Param('id') id: string, @Request() req: UserRequest) {
		return this.houseService.findHouseDetails(id, req.user.userId);
	}

	@ApiOperation({
		summary: 'Find a specific house in the system',
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.houseService.findOne(id);
	}

	@ApiOperation({
		summary: 'Edit a house',
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Put(':id')
	update(
		@Param('id') id: string,
		@Body() updateHouseDto: UpdateHouseDto,
		@Request() req: UserRequest,
	) {
		return this.houseService.update({
			houseId: id,
			dto: updateHouseDto,
			userId: req.user.userId,
		});
	}

	@ApiOperation({
		summary: 'Delete a house',
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Delete(':id')
	remove(@Param('id') id: string, @Request() req: UserRequest) {
		return this.houseService.remove({
			houseId: id,
			userId: req.user.userId,
		});
	}
}
