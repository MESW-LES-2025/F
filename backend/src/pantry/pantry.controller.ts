import {
	Controller,
	Get,
	Body,
	Patch,
	Param,
	Request,
	UseGuards,
} from '@nestjs/common';
import { PantryService } from './pantry.service';
import { UpdatePantryDto } from './dto/update-pantry.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRequest } from '../shared/types/user_request';

@Controller('pantry')
export class PantryController {
	constructor(private readonly pantryService: PantryService) {}

	// To-do: we need to add a security here so only admin users can see this
	@ApiOperation({ summary: '[ADMIN] Find all pantries in the system' })
	@Get()
	findAll() {
		return this.pantryService.findAll();
	}

	@ApiOperation({ summary: 'Find a specific pantry' })
	@Get(':houseId/:id')
	findOne(@Param('id') id: string, @Param('houseId') houseId: string) {
		return this.pantryService.findOne(id, houseId);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Update items in pantry' })
	@Patch(':houseId/:id')
	async update(
		@Param('id') id: string,
		@Param('houseId') houseId: string,
		@Body() updatePantryDto: UpdatePantryDto,
		@Request() req: UserRequest,
	) {
		return await this.pantryService.update({
			id,
			houseId,
			updatePantryDto,
			userId: req.user.userId,
		});
	}
}
