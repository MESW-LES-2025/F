import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto, TaskStatus } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

describe('TasksController', () => {
	let controller: TasksController;

	const mockService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
		findByAssignee: jest.fn(),
		findByStatus: jest.fn(),
		findAllForUser: jest.fn(),
		findByHouse: jest.fn(),
		archive: jest.fn(),
		unarchive: jest.fn(),
	};

	const mockReq = {
		user: {
			userId: 'user-123',
		},
	};

	const mockTask = {
		id: 'task-123',
		title: 'Clean the Kitchen',
		description: 'Clean all surfaces',
		assigneeId: 'user-456',
		deadline: new Date('2025-12-31'),
		createdById: 'user-123',
		status: 'todo',
		createdAt: new Date(),
		updatedAt: new Date(),
		assignee: {
			id: 'user-456',
			name: 'John Doe',
			email: 'john@example.com',
			username: 'johndoe',
		},
		createdBy: {
			id: 'user-123',
			name: 'Jane Smith',
			email: 'jane@example.com',
			username: 'janesmith',
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TasksController],
			providers: [
				{
					provide: TasksService,
					useValue: mockService,
				},
			],
		}).compile();

		controller = module.get<TasksController>(TasksController);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should create a task successfully', async () => {
			const createTaskDto: CreateTaskDto = {
				title: 'Clean the Kitchen',
				description: 'Clean all surfaces',
				assigneeId: 'user-456',
				deadline: '2025-12-31T23:59:59.000Z',
			};

			mockService.create.mockResolvedValue(mockTask);

			const result = await controller.create(createTaskDto, mockReq);

			expect(result).toEqual(mockTask);
			expect(mockService.create).toHaveBeenCalledWith(
				createTaskDto,
				'user-123',
			);
			expect(mockService.create).toHaveBeenCalledTimes(1);
		});

		it('should pass the correct user ID from request', async () => {
			const createTaskDto: CreateTaskDto = {
				title: 'Test Task',
				assigneeId: 'user-789',
				deadline: '2025-12-31T23:59:59.000Z',
			};

			const customReq = {
				user: {
					userId: 'custom-user-id',
				},
			};

			mockService.create.mockResolvedValue(mockTask);

			await controller.create(createTaskDto, customReq);

			expect(mockService.create).toHaveBeenCalledWith(
				createTaskDto,
				'custom-user-id',
			);
		});
	});

	describe('findAll', () => {
		const mockTasks = [mockTask, { ...mockTask, id: 'task-456' }];

		it('should return all tasks when no filters provided', async () => {
			mockService.findAllForUser.mockResolvedValue(mockTasks);

			const result = await controller.findAll(
				undefined,
				undefined,
				undefined,
				undefined,
				mockReq,
			);

			expect(result).toEqual(mockTasks);
			expect(mockService.findAllForUser).toHaveBeenCalledWith(
				'user-123',
				{
					assigneeId: undefined,
					status: undefined,
					archived: undefined,
				},
			);
		});

		it('should filter tasks by assigneeId when provided', async () => {
			const assigneeTasks = [mockTask];
			mockService.findAllForUser.mockResolvedValue(assigneeTasks);

			const result = await controller.findAll(
				'user-456',
				undefined,
				undefined,
				undefined,
				mockReq,
			);

			expect(result).toEqual(assigneeTasks);
			expect(mockService.findAllForUser).toHaveBeenCalledWith(
				'user-123',
				{
					assigneeId: 'user-456',
					status: undefined,
					archived: undefined,
				},
			);
		});

		it('should filter tasks by status when provided', async () => {
			const statusTasks = [{ ...mockTask, status: 'doing' }];
			mockService.findAllForUser.mockResolvedValue(statusTasks);

			const result = await controller.findAll(
				undefined,
				'doing',
				undefined,
				undefined,
				mockReq,
			);

			expect(result).toEqual(statusTasks);
			expect(mockService.findAllForUser).toHaveBeenCalledWith(
				'user-123',
				{
					assigneeId: undefined,
					status: 'doing',
					archived: undefined,
				},
			);
		});

		it('should handle multiple filters together', async () => {
			const assigneeTasks = [mockTask];
			mockService.findAllForUser.mockResolvedValue(assigneeTasks);

			const result = await controller.findAll(
				'user-456',
				'todo',
				undefined,
				undefined,
				mockReq,
			);

			expect(result).toEqual(assigneeTasks);
			expect(mockService.findAllForUser).toHaveBeenCalledWith(
				'user-123',
				{
					assigneeId: 'user-456',
					status: 'todo',
					archived: undefined,
				},
			);
		});
	});

	describe('findOne', () => {
		it('should return a single task by id', async () => {
			mockService.findOne.mockResolvedValue(mockTask);

			const result = await controller.findOne('task-123');

			expect(result).toEqual(mockTask);
			expect(mockService.findOne).toHaveBeenCalledWith('task-123');
			expect(mockService.findOne).toHaveBeenCalledTimes(1);
		});

		it('should pass the correct task id to service', async () => {
			mockService.findOne.mockResolvedValue(mockTask);

			await controller.findOne('different-task-id');

			expect(mockService.findOne).toHaveBeenCalledWith(
				'different-task-id',
			);
		});
	});

	describe('update', () => {
		it('should update a task successfully', async () => {
			const updateTaskDto: UpdateTaskDto = {
				title: 'Updated Title',
				status: TaskStatus.DOING,
			};

			const updatedTask = { ...mockTask, ...updateTaskDto };
			mockService.update.mockResolvedValue(updatedTask);

			const result = await controller.update(
				'task-123',
				updateTaskDto,
				mockReq,
			);

			expect(result).toEqual(updatedTask);
			expect(mockService.update).toHaveBeenCalledWith(
				'task-123',
				updateTaskDto,
				'user-123',
			);
			expect(mockService.update).toHaveBeenCalledTimes(1);
		});

		it('should pass user ID from request to service', async () => {
			const updateTaskDto: UpdateTaskDto = {
				description: 'New description',
			};

			const customReq = {
				user: {
					userId: 'different-user',
				},
			};

			mockService.update.mockResolvedValue(mockTask);

			await controller.update('task-123', updateTaskDto, customReq);

			expect(mockService.update).toHaveBeenCalledWith(
				'task-123',
				updateTaskDto,
				'different-user',
			);
		});

		it('should handle updating multiple fields', async () => {
			const updateTaskDto: UpdateTaskDto = {
				title: 'New Title',
				description: 'New Description',
				status: TaskStatus.DONE,
				assigneeId: 'user-789',
				deadline: '2026-01-01T00:00:00.000Z',
			};

			mockService.update.mockResolvedValue({
				...mockTask,
				...updateTaskDto,
			});

			const result = await controller.update(
				'task-123',
				updateTaskDto,
				mockReq,
			);

			expect(mockService.update).toHaveBeenCalledWith(
				'task-123',
				updateTaskDto,
				'user-123',
			);
			expect(result).toMatchObject({
				title: 'New Title',
				description: 'New Description',
			});
		});
	});

	describe('remove', () => {
		it('should delete a task successfully', async () => {
			const deleteResponse = { message: 'Task deleted successfully' };
			mockService.remove.mockResolvedValue(deleteResponse);

			const result = await controller.remove('task-123', mockReq);

			expect(result).toEqual(deleteResponse);
			expect(mockService.remove).toHaveBeenCalledWith(
				'task-123',
				'user-123',
			);
			expect(mockService.remove).toHaveBeenCalledTimes(1);
		});

		it('should pass correct user ID from request', async () => {
			const customReq = {
				user: {
					userId: 'creator-user-id',
				},
			};

			mockService.remove.mockResolvedValue({
				message: 'Task deleted successfully',
			});

			await controller.remove('task-456', customReq);

			expect(mockService.remove).toHaveBeenCalledWith(
				'task-456',
				'creator-user-id',
			);
		});

		it('should handle different task ids', async () => {
			mockService.remove.mockResolvedValue({
				message: 'Task deleted successfully',
			});

			await controller.remove('unique-task-id', mockReq);

			expect(mockService.remove).toHaveBeenCalledWith(
				'unique-task-id',
				'user-123',
			);
		});
	});
});
