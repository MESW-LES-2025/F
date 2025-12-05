import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsString,
	IsUUID,
	IsOptional,
	IsDateString,
	IsArray,
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

	@ApiProperty({
		example: '550e8400-e29b-41d4-a716-446655440000',
		description: 'UUID of the house this task belongs to',
	})
	@IsNotEmpty()
	@IsUUID()
	houseId: string;
}
