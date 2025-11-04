import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional, IsDateString, IsEnum } from 'class-validator';

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

	@ApiProperty({
		example: '2025-12-31T23:59:59.000Z',
		description: 'Task deadline in ISO 8601 format',
	})
	@IsNotEmpty()
	@IsDateString()
	deadline: string;
}
