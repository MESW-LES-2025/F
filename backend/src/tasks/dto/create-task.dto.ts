import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsString,
	IsUUID,
	IsOptional,
	IsDateString,
	IsArray,
	IsBoolean,
	IsEnum,
	IsInt,
	Min,
} from 'class-validator';

export enum TaskSize {
	SMALL = 'SMALL',
	MEDIUM = 'MEDIUM',
	LARGE = 'LARGE',
	XL = 'XL',
}

export enum TaskStatus {
	TODO = 'todo',
	DOING = 'doing',
	DONE = 'done',
}

export enum RecurrencePattern {
	DAILY = 'DAILY',
	WEEKLY = 'WEEKLY',
	MONTHLY = 'MONTHLY',
}

export class CreateTaskDto {
	@ApiProperty({
		example: 'Clean the Kitchen',
		description: 'Task title',
	})
	@IsNotEmpty()
	@IsString()
	title: string;

	@ApiPropertyOptional({
		example: 'Clean all surfaces, wash dishes, and mop the floor',
		description: 'Detailed task description',
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({
		example: '550e8400-e29b-41d4-a716-446655440000',
		description: 'UUID of the user assigned to this task',
	})
	@IsNotEmpty()
	@IsUUID()
	assigneeId: string;

	@ApiPropertyOptional({
		example: ['550e8400-e29b-41d4-a716-446655440000'],
		description: 'List of UUIDs of users assigned to this task',
	})
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	assignedUserIds?: string[];

	@ApiPropertyOptional({
		enum: TaskSize,
		example: TaskSize.MEDIUM,
		description: 'Estimated effort size for the task',
	})
	@IsOptional()
	size?: TaskSize;

	@ApiProperty({
		example: '2025-12-31T23:59:59.000Z',
		description: 'Task deadline in ISO 8601 format',
	})
	@IsNotEmpty()
	@IsDateString()
	deadline: string;

	@ApiPropertyOptional({
		example: false,
		description: 'Whether this task is recurring',
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	isRecurring?: boolean;

	@ApiPropertyOptional({
		enum: RecurrencePattern,
		example: RecurrencePattern.WEEKLY,
		description: 'Recurrence pattern (DAILY, WEEKLY, or MONTHLY)',
	})
	@IsOptional()
	@IsEnum(RecurrencePattern)
	recurrencePattern?: RecurrencePattern;

	@ApiPropertyOptional({
		example: 1,
		description:
			'Recurrence interval (e.g., every 1, 2, 3... days/weeks/months)',
		default: 1,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	recurrenceInterval?: number;

	@ApiProperty({
		example: '550e8400-e29b-41d4-a716-446655440000',
		description: 'UUID of the house this task belongs to',
	})
	@IsNotEmpty()
	@IsUUID()
	houseId: string;
}
