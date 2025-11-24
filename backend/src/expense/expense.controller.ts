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
	async create(@Body() createExpenseDto: CreateExpenseDto): Promise<unknown> {
		return this.expenseService.create(createExpenseDto);
	}

	@Get('summary')
	@ApiOperation({ summary: 'Get expense summary for a house' })
	@ApiQuery({
		name: 'houseId',
		required: true,
		description: 'House ID to get summary for',
	})
	@ApiResponse({
		status: 200,
		description: 'Expense summary retrieved successfully',
	})
	@ApiResponse({ status: 404, description: 'House not found' })
	async getSummary(@Query('houseId') houseId: string): Promise<unknown> {
		return this.expenseService.getSummary(houseId);
	}

	@Get('balances')
	@ApiOperation({
		summary: 'Get balances and settlement suggestions for a house',
	})
	@ApiQuery({
		name: 'houseId',
		required: true,
		description: 'House ID to get balances for',
	})
	@ApiResponse({
		status: 200,
		description: 'Balances retrieved successfully',
	})
	@ApiResponse({ status: 404, description: 'House not found' })
	async getBalances(@Query('houseId') houseId: string): Promise<unknown> {
		return this.expenseService.getBalances(houseId);
	}

	@Get('trends')
	@ApiOperation({ summary: 'Get spending trends over time for a house' })
	@ApiQuery({
		name: 'houseId',
		required: true,
		description: 'House ID to get trends for',
	})
	@ApiQuery({
		name: 'period',
		required: false,
		enum: ['day', 'week', 'month'],
		description: 'Period to group by (default: day)',
	})
	@ApiQuery({
		name: 'days',
		required: false,
		description: 'Number of days to look back (default: 30)',
	})
	@ApiResponse({
		status: 200,
		description: 'Spending trends retrieved successfully',
	})
	@ApiResponse({ status: 404, description: 'House not found' })
	async getSpendingOverTime(
		@Query('houseId') houseId: string,
		@Query('period') period?: 'day' | 'week' | 'month',
		@Query('days') days?: string,
	): Promise<unknown> {
		return this.expenseService.getSpendingOverTime(
			houseId,
			period || 'day',
			days ? parseInt(days) : 30,
		);
	}

	@Get('categories')
	@ApiOperation({ summary: 'Get spending breakdown by category for a house' })
	@ApiQuery({
		name: 'houseId',
		required: true,
		description: 'House ID to get category breakdown for',
	})
	@ApiResponse({
		status: 200,
		description: 'Category breakdown retrieved successfully',
	})
	@ApiResponse({ status: 404, description: 'House not found' })
	async getCategoryBreakdown(
		@Query('houseId') houseId: string,
	): Promise<unknown> {
		return this.expenseService.getCategoryBreakdown(houseId);
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
	async findAll(@Query('houseId') houseId?: string): Promise<unknown> {
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
	async findOne(@Param('id') id: string): Promise<unknown> {
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
	): Promise<unknown> {
		return this.expenseService.update(id, updateExpenseDto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete an expense' })
	@ApiParam({ name: 'id', description: 'Expense UUID' })
	@ApiResponse({ status: 200, description: 'Expense deleted successfully' })
	@ApiResponse({ status: 404, description: 'Expense not found' })
	async remove(@Param('id') id: string): Promise<unknown> {
		return this.expenseService.remove(id);
	}
}
