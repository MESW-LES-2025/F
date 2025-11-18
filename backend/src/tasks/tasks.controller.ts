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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TasksController {
	constructor(private readonly tasksService: TasksService) {}

	@Post()
	@ApiOperation({ summary: 'Create a new task' })
	@ApiResponse({ status: 201, description: 'Task created successfully' })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Assignee not found' })
	async create(
		@Body() createTaskDto: CreateTaskDto,
		@Request() req: { user: { userId: string } },
	) {
		return this.tasksService.create(createTaskDto, req.user.userId);
	}

	@Get()
	@ApiOperation({ summary: 'Get all tasks' })
	@ApiQuery({
		name: 'assigneeId',
		required: false,
		description: 'Filter by assignee ID',
	})
	@ApiQuery({
		name: 'status',
		required: false,
		description: 'Filter by status (todo, doing, done)',
	})
	@ApiResponse({ status: 200, description: 'Tasks retrieved successfully' })
	async findAll(
		@Query('assigneeId') assigneeId?: string,
		@Query('status') status?: string,
		@Request() req?: { user: { userId: string } },
	) {
		const userId = req?.user.userId as string;
		// tasks across all houses the user belongs to
		return this.tasksService.findAllForUser(userId, { assigneeId, status });
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a task by ID' })
	@ApiParam({ name: 'id', description: 'Task UUID' })
	@ApiResponse({ status: 200, description: 'Task retrieved successfully' })
	@ApiResponse({ status: 404, description: 'Task not found' })
	async findOne(@Param('id') id: string) {
		return this.tasksService.findOne(id);
	}

	@Patch(':id')
	@ApiOperation({ summary: 'Update a task' })
	@ApiParam({ name: 'id', description: 'Task UUID' })
	@ApiResponse({ status: 200, description: 'Task updated successfully' })
	@ApiResponse({
		status: 403,
		description: 'Forbidden - no permission to update',
	})
	@ApiResponse({ status: 404, description: 'Task not found' })
	async update(
		@Param('id') id: string,
		@Body() updateTaskDto: UpdateTaskDto,
		@Request() req: { user: { userId: string } },
	) {
		return this.tasksService.update(id, updateTaskDto, req.user.userId);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Delete a task' })
	@ApiParam({ name: 'id', description: 'Task UUID' })
	@ApiResponse({ status: 200, description: 'Task deleted successfully' })
	@ApiResponse({
		status: 403,
		description: 'Forbidden - only creator can delete',
	})
	@ApiResponse({ status: 404, description: 'Task not found' })
	async remove(
		@Param('id') id: string,
		@Request() req: { user: { userId: string } },
	) {
		return this.tasksService.remove(id, req.user.userId);
	}
}
