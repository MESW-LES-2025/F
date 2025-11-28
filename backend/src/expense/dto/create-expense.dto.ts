import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsNumber,
	IsString,
	IsUUID,
	IsArray,
	IsEnum,
	IsOptional,
	Min,
	MaxLength,
	IsDateString,
} from 'class-validator';

export enum ExpenseCategory {
	GROCERIES = 'GROCERIES',
	UTILITIES = 'UTILITIES',
	HOUSEHOLD = 'HOUSEHOLD',
	FOOD = 'FOOD',
	ENTERTAINMENT = 'ENTERTAINMENT',
	TRANSPORTATION = 'TRANSPORTATION',
	SETTLEMENT = 'SETTLEMENT',
	OTHER = 'OTHER',
}

export class CreateExpenseDto {
	@ApiProperty({
		example: 45.5,
		description: 'Amount spent on the expense',
		minimum: 0.01,
	})
	@IsNotEmpty()
	@IsNumber()
	@Min(0.01, { message: 'Amount must be greater than 0' })
	amount: number;

	@ApiProperty({
		example: 'Groceries - Weekly Shopping',
		description: 'Description of the expense',
		maxLength: 255,
	})
	@IsNotEmpty()
	@IsString()
	@MaxLength(255)
	description: string;

	@ApiProperty({
		example: 'GROCERIES',
		description: 'Category of the expense',
		enum: ExpenseCategory,
	})
	@IsNotEmpty()
	@IsEnum(ExpenseCategory)
	category: ExpenseCategory;

	@ApiProperty({
		example: '550e8400-e29b-41d4-a716-446655440000',
		description: 'UUID of the user who paid for this expense',
	})
	@IsNotEmpty()
	@IsUUID()
	paidById: string;

	@ApiProperty({
		example: '550e8400-e29b-41d4-a716-446655440001',
		description: 'UUID of the house this expense belongs to',
	})
	@IsNotEmpty()
	@IsUUID()
	houseId: string;

	@ApiProperty({
		example: [
			'550e8400-e29b-41d4-a716-446655440000',
			'550e8400-e29b-41d4-a716-446655440002',
		],
		description: 'Array of user UUIDs to split the expense with',
		type: [String],
	})
	@IsNotEmpty()
	@IsArray()
	@IsUUID('4', { each: true })
	splitWith: string[];

	@ApiPropertyOptional({
		example: '2025-11-11T10:30:00.000Z',
		description: 'Date of the expense in ISO 8601 format',
	})
	@IsOptional()
	@IsDateString()
	date?: string;
}
