import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
} from '@nestjs/common';
import { PantryItemService } from './pantry-item.service';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('pantry-item')
export class PantryItemController {
	// To-do: we need to add a security here so only admin users can see this
	constructor(private readonly pantryItemService: PantryItemService) {}

	@ApiOperation({ summary: '[ADMIN] Create a new pantry item' })
	@Post()
	create(@Body() createPantryItemDto: CreatePantryItemDto) {
		return this.pantryItemService.create(createPantryItemDto);
	}

	@ApiOperation({ summary: '[ADMIN] Find all pantry items in the system' })
	@Get()
	findAll() {
		return this.pantryItemService.findAll();
	}

	@ApiOperation({ summary: '[ADMIN] Find a specific pantry item' })
	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.pantryItemService.findOne(id);
	}

	@ApiOperation({ summary: '[ADMIN] Update a specific pantry item' })
	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() updatePantryItemDto: UpdatePantryItemDto,
	) {
		return this.pantryItemService.update(id, updatePantryItemDto);
	}

	@ApiOperation({ summary: '[ADMIN] Delete a specific pantry item' })
	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.pantryItemService.remove(id);
	}
}
