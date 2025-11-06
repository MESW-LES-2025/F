import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	Request,
	UseGuards,
} from '@nestjs/common';
import { PantryItemService } from './pantry-item.service';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRequest } from 'src/shared/types/user_request';

@Controller('pantry-item')
export class PantryItemController {
	// To-do: we need to add a security here so only admin users can see this
	constructor(private readonly pantryItemService: PantryItemService) {}

	@ApiOperation({ summary: 'Create a new pantry item' })
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':houseId')
	create(
		@Body() createPantryItemDto: CreatePantryItemDto,
		@Request() req: UserRequest,
		@Param('houseId') houseId: string,
	) {
		return this.pantryItemService.create(
			createPantryItemDto,
			req.user.userId,
			houseId,
		);
	}

	@ApiOperation({ summary: 'Update a specific pantry item' })
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() updatePantryItemDto: UpdatePantryItemDto,
		@Request() req: UserRequest,
	) {
		return this.pantryItemService.update(
			id,
			updatePantryItemDto,
			req.user.userId,
		);
	}

	@ApiOperation({ summary: 'Delete a specific pantry item' })
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Delete(':id')
	remove(@Param('id') id: string, @Request() req: UserRequest) {
		return this.pantryItemService.remove(id, req.user.userId);
	}

	@ApiOperation({ summary: 'Find all pantry items created by the user' })
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get('user')
	findAllUser(@Request() req: UserRequest) {
		return this.pantryItemService.findAllUser(req.user.userId);
	}

	@ApiOperation({ summary: 'Find all pantry items in the house' })
	@Get(':houseId')
	findAllHouse(@Param('houseId') houseId: string) {
		return this.pantryItemService.findAllHouse(houseId);
	}

	@ApiOperation({ summary: 'Find a specific pantry item' })
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.pantryItemService.findOne(id);
	}

	@ApiOperation({ summary: '[ADMIN] Find all pantry items in the system' })
	@Get('admin')
	findAll() {
		return this.pantryItemService.findAll();
	}
}
