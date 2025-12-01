import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsOptional,
	IsString,
	IsUUID,
	IsDateString,
	IsEnum,
	IsArray,
} from 'class-validator';
import { TaskStatus, TaskSize } from './create-task.dto';

export class UpdateTaskDto {
	@ApiPropertyOptional({
		example: 'Clean the Kitchen',
		description: 'Task title',
	})
	@IsOptional()
	@IsString()
	title?: string;

	@ApiPropertyOptional({
		example: 'Clean all surfaces, wash dishes, and mop the floor',
		description: 'Detailed task description',
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiPropertyOptional({
		example: '550e8400-e29b-41d4-a716-446655440000',
		description: 'UUID of the user assigned to this task',
	})
	@IsOptional()
	@IsUUID()
	assigneeId?: string;

	@ApiPropertyOptional({
		example: ['550e8400-e29b-41d4-a716-446655440000'],
		description: 'List of UUIDs of users assigned to this task',
	})
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	assignedUserIds?: string[];

	@ApiPropertyOptional({
		example: '2025-12-31T23:59:59.000Z',
		description: 'Task deadline in ISO 8601 format',
	})
	@IsOptional()
	@IsDateString()
	deadline?: string;

	@ApiPropertyOptional({
		enum: TaskStatus,
		example: TaskStatus.TODO,
		description: 'Task status',
	})
	@IsOptional()
	@IsEnum(TaskStatus)
	status?: TaskStatus;

	@ApiPropertyOptional({
		enum: TaskSize,
		example: TaskSize.MEDIUM,
		description: 'Estimated effort size for the task',
	})
	@IsOptional()
	@IsEnum(TaskSize)
	size?: TaskSize;
}
