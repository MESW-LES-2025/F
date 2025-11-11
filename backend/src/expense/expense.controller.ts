import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Delete,
	UseGuards,
	Request,
	Query,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiParam,
	ApiQuery,
} from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ExpenseController {
	constructor(private readonly expenseService: ExpenseService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new expense' })
	@ApiResponse({ status: 201, description: 'Expense created successfully' })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({
		status: 404,
		description: 'Payer, house, or user in splitWith not found',
	})
	async create(@Body() createExpenseDto: CreateExpenseDto) {
		return this.expenseService.create(createExpenseDto);
	}

	@Get()
	@ApiOperation({ summary: 'Get all expenses or filter by house' })
	@ApiQuery({
		name: 'houseId',
		required: false,
		description: 'Filter expenses by house ID',
	})
	@ApiResponse({
		status: 200,
		description: 'Expenses retrieved successfully',
	})
	async findAll(@Query('houseId') houseId?: string) {
		if (houseId) {
			return this.expenseService.findByHouse(houseId);
		}
		return this.expenseService.findAll();
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get an expense by ID' })
	@ApiParam({ name: 'id', description: 'Expense UUID' })
	@ApiResponse({
		status: 200,
		description: 'Expense retrieved successfully',
	})
	@ApiResponse({ status: 404, description: 'Expense not found' })
	async findOne(@Param('id') id: string) {
		return this.expenseService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update an expense' })
	@ApiParam({ name: 'id', description: 'Expense UUID' })
	@ApiResponse({ status: 200, description: 'Expense updated successfully' })
	@ApiResponse({ status: 404, description: 'Expense not found' })
	async update(
		@Param('id') id: string,
		@Body() updateExpenseDto: UpdateExpenseDto,
	) {
		return this.expenseService.update(id, updateExpenseDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete an expense' })
	@ApiParam({ name: 'id', description: 'Expense UUID' })
	@ApiResponse({ status: 200, description: 'Expense deleted successfully' })
	@ApiResponse({ status: 404, description: 'Expense not found' })
	async remove(@Param('id') id: string) {
		return this.expenseService.remove(id);
	}
}
