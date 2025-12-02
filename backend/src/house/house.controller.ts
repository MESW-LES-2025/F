import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Request,
	UseGuards,
} from '@nestjs/common';
import { HouseService } from './house.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRequest } from '../shared/types/user_request';

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

	@ApiOperation({ summary: 'Find a specific house' })
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.houseService.findOne(id);
	}

	/* To-do: not implemented
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHouseDto: UpdateHouseDto) {
    return this.houseService.update(+id, updateHouseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.houseService.remove(+id);
  } */
}
