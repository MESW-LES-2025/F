import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { CreateTaskDto, TaskStatus } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const asMatcher = <T>(value: unknown) => value as T;

describe('TasksService', () => {
	let service: TasksService;

	const mockPrismaService = {
		task: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		user: {
			findUnique: jest.fn(),
		},
		house: {
			findUnique: jest.fn(),
		},
		houseToUser: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
		},
		taskToUser: {
			createMany: jest.fn(),
			deleteMany: jest.fn(),
		},
	};

	const mockNotificationsService: Pick<NotificationsService, 'create'> = {
		create: jest.fn().mockResolvedValue({ id: 'notification-id-1' }),
	};

	const mockAssignee = {
		id: 'user-456',
		name: 'Jane Smith',
		email: 'jane@example.com',
		username: 'janesmith',
	};

	const mockTask = {
		id: 'task-123',
		title: 'Clean the Kitchen',
		description: 'Clean all surfaces',
		assigneeId: 'user-456',
		deadline: new Date('2025-12-31'),
		createdById: 'user-123',
		houseId: 'house-1',
		status: 'todo',
		createdAt: new Date(),
		updatedAt: new Date(),
		assignee: {
			id: 'user-456',
			name: 'Jane Smith',
			email: 'jane@example.com',
			username: 'janesmith',
		},
		createdBy: {
			id: 'user-123',
			name: 'John Doe',
			email: 'john@example.com',
			username: 'johndoe',
		},
		house: {
			id: 'house-1',
			name: 'Test House',
		},
		assigneeLinks: [],
		assignedUsers: [],
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TasksService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
				{
					provide: NotificationsService,
					useValue: mockNotificationsService,
				},
			],
		}).compile();

		service = module.get<TasksService>(TasksService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		const createTaskDto: CreateTaskDto = {
			title: 'Clean the Kitchen',
			description: 'Clean all surfaces',
			assigneeId: 'user-456',
			deadline: '2025-12-31T23:59:59.000Z',
			houseId: 'house-1',
		};

		it('should create a task successfully when users are in the same house', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue({
				id: 'house-1',
				name: 'Test House',
			});
			mockPrismaService.houseToUser.findFirst
				.mockResolvedValueOnce({
					userId: 'user-123',
					houseId: 'house-1',
				})
				.mockResolvedValueOnce({
					userId: 'user-456',
					houseId: 'house-1',
				});
			mockPrismaService.user.findUnique.mockResolvedValue(mockAssignee);
			mockPrismaService.task.create.mockResolvedValue(mockTask);

			const result = await service.create(createTaskDto, 'user-123');

			expect(result).toEqual(mockTask);
			expect(mockPrismaService.house.findUnique).toHaveBeenCalledWith({
				where: { id: 'house-1' },
			});
			expect(
				mockPrismaService.houseToUser.findFirst,
			).toHaveBeenCalledTimes(2);
			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'user-456' },
			});
			expect(mockPrismaService.task.create).toHaveBeenCalled();
			const createCallArg = mockPrismaService.task.create.mock.calls[0][0];
			expect(createCallArg.data.assigneeId).toBe(createTaskDto.assigneeId);
			expect(createCallArg.data.deadline).toEqual(new Date(createTaskDto.deadline));
			expect(createCallArg.data.status).toBe('todo');
			expect(createCallArg.data.size).toBe('MEDIUM');

			expect(mockNotificationsService.create).toHaveBeenCalledWith(
				expect.objectContaining({
					category: asMatcher<string>(expect.any(String)),
					title: asMatcher<string>(
						expect.stringContaining('Task assigned'),
					),
					userIds: [createTaskDto.assigneeId],
				}),
			);
		});

		it('should throw NotFoundException when assignee does not exist', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue({
				id: 'house-1',
			});
			mockPrismaService.houseToUser.findFirst.mockResolvedValue({
				userId: 'user-123',
				houseId: 'house-1',
			});
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			await expect(
				service.create(createTaskDto, 'user-123'),
			).rejects.toThrow(NotFoundException);
			await expect(
				service.create(createTaskDto, 'user-123'),
			).rejects.toThrow('Assignee user not found');

			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'user-456' },
			});
			expect(mockPrismaService.task.create).not.toHaveBeenCalled();
		});

		it('should throw BadRequestException when users are not in the same house', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue({
				id: 'house-1',
			});
			mockPrismaService.user.findUnique.mockResolvedValue(mockAssignee);
			mockPrismaService.houseToUser.findFirst
				.mockResolvedValueOnce({
					userId: 'user-123',
					houseId: 'house-1',
				})
				.mockResolvedValueOnce(null);

			await expect(
				service.create(createTaskDto, 'user-123'),
			).rejects.toThrow(BadRequestException);

			// Reset mocks for second call
			mockPrismaService.house.findUnique.mockResolvedValue({
				id: 'house-1',
			});
			mockPrismaService.user.findUnique.mockResolvedValue(mockAssignee);
			mockPrismaService.houseToUser.findFirst
				.mockResolvedValueOnce({
					userId: 'user-123',
					houseId: 'house-1',
				})
				.mockResolvedValueOnce(null);

			await expect(
				service.create(createTaskDto, 'user-123'),
			).rejects.toThrow('Cannot assign task to user not in this house');
		});
		it('should set status to todo by default', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue({
				id: 'house-1',
			});
			mockPrismaService.houseToUser.findFirst
				.mockResolvedValueOnce({
					userId: 'user-123',
					houseId: 'house-1',
				})
				.mockResolvedValueOnce({
					userId: 'user-456',
					houseId: 'house-1',
				});
			mockPrismaService.user.findUnique.mockResolvedValue(mockAssignee);
			mockPrismaService.task.create.mockResolvedValue(mockTask);

			await service.create(createTaskDto, 'user-123');

			expect(mockPrismaService.task.create).toHaveBeenCalled();
			const callArg = mockPrismaService.task.create.mock.calls[0][0];
			expect(callArg.data.status).toBe('todo');
			expect(callArg.data.size).toBe('MEDIUM');
		});

		it('should convert deadline string to Date object', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue({
				id: 'house-1',
			});
			mockPrismaService.houseToUser.findFirst
				.mockResolvedValueOnce({
					userId: 'user-123',
					houseId: 'house-1',
				})
				.mockResolvedValueOnce({
					userId: 'user-456',
					houseId: 'house-1',
				});
			mockPrismaService.user.findUnique.mockResolvedValue(mockAssignee);
			mockPrismaService.task.create.mockResolvedValue(mockTask);

			await service.create(createTaskDto, 'user-123');

			expect(mockPrismaService.task.create).toHaveBeenCalled();
			const callArg2 = mockPrismaService.task.create.mock.calls[0][0];
			expect(callArg2.data.deadline).toEqual(
				new Date('2025-12-31T23:59:59.000Z'),
			);
			expect(callArg2.data.size).toBe('MEDIUM');
		});

		it('should persist taskToUser links and notify multiple assignees', async () => {
			const createMultiDto: CreateTaskDto = {
				title: 'Multi assign',
				description: 'Assign to many',
				assigneeId: undefined as unknown as string,
				assignedUserIds: ['user-456', 'user-789'],
				deadline: '2025-12-31T23:59:59.000Z',
				houseId: 'house-1',
			};

			mockPrismaService.house.findUnique.mockResolvedValue({ id: 'house-1' });
			// validate creator in house and each assignee in house
			mockPrismaService.houseToUser.findFirst
				.mockResolvedValueOnce({ userId: 'user-123', houseId: 'house-1' })
				.mockResolvedValueOnce({ userId: 'user-456', houseId: 'house-1' })
				.mockResolvedValueOnce({ userId: 'user-789', houseId: 'house-1' });
			mockPrismaService.user.findUnique
				.mockImplementation(({ where }: any) => {
					if (where.id === 'user-456') return Promise.resolve({ id: 'user-456', name: 'A' });
					if (where.id === 'user-789') return Promise.resolve({ id: 'user-789', name: 'B' });
					return Promise.resolve(null);
				});
			mockPrismaService.task.create.mockResolvedValue({ ...mockTask, id: 'task-multi' });
			mockPrismaService.taskToUser.createMany.mockResolvedValue({ count: 2 });

			await service.create(createMultiDto, 'user-123');

			expect(mockPrismaService.task.create).toHaveBeenCalled();
			expect(mockPrismaService.taskToUser.createMany).toHaveBeenCalledWith({
				data: expect.arrayContaining([
					expect.objectContaining({ userId: 'user-456' }),
					expect.objectContaining({ userId: 'user-789' }),
				]),
				skipDuplicates: true,
			});

			expect(mockNotificationsService.create).toHaveBeenCalledWith(
				expect.objectContaining({
					userIds: expect.arrayContaining(['user-456', 'user-789']),
				}),
			);
		});
	});

	describe('findAll', () => {
		it('should return all tasks', async () => {
			const mockTasks = [mockTask, { ...mockTask, id: 'task-456' }];
			mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

			const result = await service.findAll();

			expect(result).toEqual(mockTasks);
			expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
				include: {
					assignee: { select: { id: true, name: true, email: true, username: true, imageUrl: true } },
					createdBy: { select: { id: true, name: true, email: true, username: true, imageUrl: true } },
					house: { select: { id: true, name: true } },
					assigneeLinks: { include: { user: { select: { id: true, name: true, imageUrl: true, username: true } } } },
				},
				orderBy: {
					createdAt: 'desc',
				},
			});
		});

		it('should return empty array when no tasks exist', async () => {
			mockPrismaService.task.findMany.mockResolvedValue([]);

			const result = await service.findAll();

			expect(result).toEqual([]);
			expect(mockPrismaService.task.findMany).toHaveBeenCalledTimes(1);
		});
	});

	describe('findOne', () => {
		it('should return a task by id', async () => {
			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

			const result = await service.findOne('task-123');

			expect(result).toEqual(mockTask);
			expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith({
				where: { id: 'task-123' },
				include: {
					assignee: { select: { id: true, name: true, email: true, username: true, imageUrl: true } },
					createdBy: { select: { id: true, name: true, email: true, username: true, imageUrl: true } },
					house: { select: { id: true, name: true } },
					assigneeLinks: { include: { user: { select: { id: true, name: true, imageUrl: true, username: true } } } },
				},
			});
		});
		it('should throw NotFoundException when task does not exist', async () => {
			mockPrismaService.task.findUnique.mockResolvedValue(null);

			await expect(service.findOne('nonexistent-id')).rejects.toThrow(
				NotFoundException,
			);
			await expect(service.findOne('nonexistent-id')).rejects.toThrow(
				'Task not found',
			);
		});
	});

	describe('update', () => {
		const updateTaskDto: UpdateTaskDto = {
			title: 'Updated Title',
			status: TaskStatus.DOING,
		};

		it('should update a task when user is the creator', async () => {
			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
			mockPrismaService.task.update.mockResolvedValue({
				...mockTask,
				...updateTaskDto,
			});

			const result = await service.update(
				'task-123',
				updateTaskDto,
				'user-123',
			);

			expect(result).toMatchObject(updateTaskDto);
			expect(mockPrismaService.task.update).toHaveBeenCalled();
			const updateCall = mockPrismaService.task.update.mock.calls[0][0];
			expect(updateCall.where).toEqual({ id: 'task-123' });
			expect(updateCall.data.title).toBe(updateTaskDto.title);
			expect(updateCall.data.status).toBe(updateTaskDto.status);
		});

		it('should update a task when user is the assignee', async () => {
			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
			mockPrismaService.task.update.mockResolvedValue({
				...mockTask,
				...updateTaskDto,
			});

			const result = await service.update(
				'task-123',
				updateTaskDto,
				'user-456',
			);

			expect(result).toMatchObject(updateTaskDto);
			expect(mockPrismaService.task.update).toHaveBeenCalledTimes(1);
		});

		it('should throw ForbiddenException when user is neither creator nor assignee', async () => {
			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([]);

			await expect(
				service.update('task-123', updateTaskDto, 'unauthorized-user'),
			).rejects.toThrow(ForbiddenException);
			await expect(
				service.update('task-123', updateTaskDto, 'unauthorized-user'),
			).rejects.toThrow('You do not have permission to update this task');

			expect(mockPrismaService.task.update).not.toHaveBeenCalled();
		});

		it('should verify new assignee exists when updating assigneeId', async () => {
			const updateWithNewAssignee: UpdateTaskDto = {
				assigneeId: 'new-user-789',
			};

			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
			mockPrismaService.user.findUnique.mockResolvedValue({
				id: 'new-user-789',
				name: 'New User',
				email: 'new@example.com',
				username: 'newuser',
			});
			mockPrismaService.houseToUser.findFirst.mockResolvedValue({
				userId: 'new-user-789',
				houseId: 'house-1',
			});
			mockPrismaService.task.update.mockResolvedValue({
				...mockTask,
				assigneeId: 'new-user-789',
			});

			await service.update('task-123', updateWithNewAssignee, 'user-123');

			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'new-user-789' },
			});
			expect(mockPrismaService.houseToUser.findFirst).toHaveBeenCalled();
		});

		it('should throw NotFoundException when new assignee does not exist', async () => {
			const updateWithNewAssignee: UpdateTaskDto = {
				assigneeId: 'nonexistent-user',
			};

			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			await expect(
				service.update('task-123', updateWithNewAssignee, 'user-123'),
			).rejects.toThrow(NotFoundException);
			await expect(
				service.update('task-123', updateWithNewAssignee, 'user-123'),
			).rejects.toThrow('Assignee user not found');

			expect(mockPrismaService.task.update).not.toHaveBeenCalled();
		});

		it('should throw BadRequestException when new assignee is not in the same house', async () => {
			const updateWithNewAssignee: UpdateTaskDto = {
				assigneeId: 'new-user-789',
			};

			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
			mockPrismaService.user.findUnique.mockResolvedValue({
				id: 'new-user-789',
				name: 'New User',
				email: 'new@example.com',
				username: 'newuser',
			});
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(null);

			await expect(
				service.update('task-123', updateWithNewAssignee, 'user-123'),
			).rejects.toThrow(BadRequestException);
			await expect(
				service.update('task-123', updateWithNewAssignee, 'user-123'),
			).rejects.toThrow('Cannot assign task to user not in this house');

			expect(mockPrismaService.task.update).not.toHaveBeenCalled();
		});
		it('should convert deadline string to Date when updating', async () => {
			const updateWithDeadline: UpdateTaskDto = {
				deadline: '2026-06-15T12:00:00.000Z',
			};

			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
			mockPrismaService.task.update.mockResolvedValue(mockTask);

			await service.update('task-123', updateWithDeadline, 'user-123');

			expect(mockPrismaService.task.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						deadline: new Date('2026-06-15T12:00:00.000Z'),
					}) as Record<string, unknown>,
				}) as Record<string, unknown>,
			);
		});

		it('should handle undefined deadline', async () => {
			const updateWithoutDeadline: UpdateTaskDto = {
				title: 'New Title',
			};

			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
			mockPrismaService.task.update.mockResolvedValue(mockTask);

			await service.update('task-123', updateWithoutDeadline, 'user-123');

			expect(mockPrismaService.task.update).toHaveBeenCalled();
			const uCall = mockPrismaService.task.update.mock.calls[0][0];
			expect(uCall.data.title).toBe(updateWithoutDeadline.title);
		});

		it('should replace taskToUser links and notify new assignees when assignedUserIds provided', async () => {
			const updateDto: UpdateTaskDto = {
				assignedUserIds: ['user-789', 'user-999'],
			};

			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
			mockPrismaService.user.findUnique.mockImplementation(({ where }: any) => {
				if (where.id === 'user-789') return Promise.resolve({ id: 'user-789', name: 'C' });
				if (where.id === 'user-999') return Promise.resolve({ id: 'user-999', name: 'D' });
				return Promise.resolve(null);
			});
			// permission checks
			mockPrismaService.houseToUser.findFirst.mockResolvedValue({ userId: 'user-123', houseId: 'house-1' });
			mockPrismaService.task.update.mockResolvedValue({ ...mockTask, assigneeId: 'user-789' });
			mockPrismaService.taskToUser.deleteMany.mockResolvedValue({ count: 1 });
			mockPrismaService.taskToUser.createMany.mockResolvedValue({ count: 2 });

			await service.update('task-123', updateDto, 'user-123');

			expect(mockPrismaService.taskToUser.deleteMany).toHaveBeenCalledWith({ where: { taskId: 'task-123' } });
			expect(mockPrismaService.taskToUser.createMany).toHaveBeenCalledWith({
				data: expect.arrayContaining([
					expect.objectContaining({ userId: 'user-789' }),
					expect.objectContaining({ userId: 'user-999' }),
				]),
				skipDuplicates: true,
			});

			expect(mockNotificationsService.create).toHaveBeenCalledWith(
				expect.objectContaining({
					userIds: expect.arrayContaining(['user-789', 'user-999']),
				}),
			);
		});
	});

	describe('remove', () => {
		it('should delete a task when user is the creator', async () => {
			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
			mockPrismaService.task.delete.mockResolvedValue(mockTask);

			const result = await service.remove('task-123', 'user-123');

			expect(result).toEqual({ message: 'Task deleted successfully' });
			expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
				where: { id: 'task-123' },
			});
		});

		it('should emit completion notification when status transitions to done', async () => {
			const previousTask = { ...mockTask, status: 'doing' };
			const completedTask = { ...mockTask, status: 'done' };
			mockPrismaService.task.findUnique.mockResolvedValue(previousTask);
			mockPrismaService.task.update.mockResolvedValue(completedTask);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([
				{ userId: 'user-123' },
				{ userId: 'user-456' },
			]);

			await service.update(
				'task-123',
				{ status: TaskStatus.DONE },
				'user-456',
			);

			expect(mockNotificationsService.create).toHaveBeenCalledWith(
				expect.objectContaining({
					category: 'SCRUM',
					title: asMatcher<string>(
						expect.stringContaining('Task completed'),
					),
					userIds: asMatcher<string[]>(
						expect.arrayContaining(['user-123', 'user-456']),
					),
					actionUrl: asMatcher<string>('/activities'),
				}),
			);
		});

		it('should throw ForbiddenException when user is not the creator', async () => {
			mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

			await expect(
				service.remove('task-123', 'user-456'),
			).rejects.toThrow(ForbiddenException);
			await expect(
				service.remove('task-123', 'user-456'),
			).rejects.toThrow('You do not have permission to delete this task');

			expect(mockPrismaService.task.delete).not.toHaveBeenCalled();
		});

		it('should throw NotFoundException when task does not exist', async () => {
			mockPrismaService.task.findUnique.mockResolvedValue(null);

			await expect(
				service.remove('nonexistent-id', 'user-123'),
			).rejects.toThrow(NotFoundException);
			await expect(
				service.remove('nonexistent-id', 'user-123'),
			).rejects.toThrow('Task not found');

			expect(mockPrismaService.task.delete).not.toHaveBeenCalled();
		});

		it('should not allow assignee to delete task', async () => {
			const taskWithDifferentCreator = {
				...mockTask,
				createdById: 'creator-123',
				assigneeId: 'assignee-456',
			};

			mockPrismaService.task.findUnique.mockResolvedValue(
				taskWithDifferentCreator,
			);

			await expect(
				service.remove('task-123', 'assignee-456'),
			).rejects.toThrow(ForbiddenException);

			expect(mockPrismaService.task.delete).not.toHaveBeenCalled();
		});
	});

	describe('findByAssignee', () => {
		it('should return tasks filtered by assignee', async () => {
			const assigneeTasks = [mockTask, { ...mockTask, id: 'task-456' }];
			mockPrismaService.task.findMany.mockResolvedValue(assigneeTasks);

			const result = await service.findByAssignee('user-456');

			expect(result).toEqual(assigneeTasks);
			expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
				where: { assigneeId: 'user-456' },
				include: {
					assignee: { select: { id: true, name: true, email: true, username: true, imageUrl: true } },
					createdBy: { select: { id: true, name: true, email: true, username: true, imageUrl: true } },
					house: { select: { id: true, name: true } },
					assigneeLinks: { include: { user: { select: { id: true, name: true, imageUrl: true, username: true } } } },
				},
				orderBy: {
					createdAt: 'desc',
				},
			});
		});

		it('should return empty array when no tasks for assignee', async () => {
			mockPrismaService.task.findMany.mockResolvedValue([]);

			const result = await service.findByAssignee('user-999');

			expect(result).toEqual([]);
			expect(mockPrismaService.task.findMany).toHaveBeenCalledTimes(1);
		});
	});

	describe('findByStatus', () => {
		it('should return tasks filtered by status', async () => {
			const todoTasks = [mockTask, { ...mockTask, id: 'task-456' }];
			mockPrismaService.task.findMany.mockResolvedValue(todoTasks);

			const result = await service.findByStatus('todo');

			expect(result).toEqual(todoTasks);
			expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
				where: { status: 'todo' },
				include: {
					assignee: { select: { id: true, name: true, email: true, username: true, imageUrl: true } },
					createdBy: { select: { id: true, name: true, email: true, username: true, imageUrl: true } },
					house: { select: { id: true, name: true } },
					assigneeLinks: { include: { user: { select: { id: true, name: true, imageUrl: true, username: true } } } },
				},
				orderBy: {
					createdAt: 'desc',
				},
			});
		});

		it('should work with different status values', async () => {
			const doingTasks = [{ ...mockTask, status: 'doing' }];
			mockPrismaService.task.findMany.mockResolvedValue(doingTasks);

			const result = await service.findByStatus('doing');

			expect(result).toEqual(doingTasks);
			expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { status: 'doing' },
				}),
			);
		});

		it('should return empty array when no tasks match status', async () => {
			mockPrismaService.task.findMany.mockResolvedValue([]);

			const result = await service.findByStatus('done');

			expect(result).toEqual([]);
			expect(mockPrismaService.task.findMany).toHaveBeenCalledTimes(1);
		});
	});
});
