import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { HouseService } from './house.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('house')
export class HouseController {
	constructor(private readonly houseService: HouseService) {}

	// To-do: we need to add a security here so only admin users can see this
	@ApiOperation({ summary: '[ADMIN] Create a new house' })
	@Post()
	create(@Body() createHouseDto: CreateHouseDto) {
		return this.houseService.create(createHouseDto);
	}

	// To-do: we need to add a security here so only admin users can see this
	@ApiOperation({ summary: '[ADMIN] Find all houses in the system' })
	@Get()
	findAll() {
		return this.houseService.findAll();
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
