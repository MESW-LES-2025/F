import {
	BadRequestException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationCategory, NotificationLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
	CreateTaskDto,
	TaskSize,
	TaskStatus,
	RecurrencePattern,
} from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

type MockPrismaTask = {
	id: string;
	title: string;
	description: string;
	assigneeId: string;
	createdById: string;
	houseId: string;
	status: 'todo' | 'doing' | 'done';
	archived: boolean;
	archivedAt: Date | null;
	deadline: Date;
	house: { id: string; name: string };
	assignee: { id: string; name: string; email: string; username: string };
	createdBy: {
		id: string;
		name: string;
		email: string;
		username: string;
	};
};

type MockHouseToUser = { userId: string; houseId: string };

type MockPrismaService = {
	house: {
		findUnique: jest.Mock<
			Promise<{ id: string; name: string } | null>,
			[{ where: { id: string } }]
		>;
	};
	houseToUser: {
		findFirst: jest.Mock<
			Promise<MockHouseToUser | null>,
			[{ where: { userId: string; houseId: string } }]
		>;
		findMany: jest.Mock<
			Promise<MockHouseToUser[]>,
			[
				{
					where: { userId?: string; houseId?: string };
					select?: { houseId: true };
				},
			]
		>;
	};
	user: {
		findUnique: jest.Mock<
			Promise<{
				id: string;
				name: string;
				email: string;
				username: string;
			} | null>,
			[{ where: { id: string } }]
		>;
	};
	task: {
		create: jest.Mock<
			Promise<MockPrismaTask>,
			[
				{
					data: {
						title: string;
						description: string;
						assigneeId: string;
						deadline: Date;
						createdById: string;
						houseId: string;
						status: string;
						size: TaskSize;
					};
					include: unknown;
				},
			]
		>;
		findUnique: jest.Mock<
			Promise<MockPrismaTask | null>,
			[{ where: { id: string }; include?: unknown }]
		>;
		update: jest.Mock<
			Promise<MockPrismaTask>,
			[
				{
					where: { id: string };
					data: Partial<MockPrismaTask>;
					include?: unknown;
				},
			]
		>;
		findMany: jest.Mock<Promise<MockPrismaTask[]>, [unknown]>;
		delete: jest.Mock<Promise<void>, [{ where: { id: string } }]>;
	};
	taskToUser: {
		createMany: jest.Mock<
			Promise<void>,
			[
				{
					data: { taskId: string; userId: string }[];
					skipDuplicates?: boolean;
				},
			]
		>;
		deleteMany: jest.Mock<Promise<void>, [{ where: { taskId: string } }]>;
		findMany: jest.Mock<
			Promise<{ userId: string }[]>,
			[{ where: { taskId: string }; select?: { userId: true } }]
		>;
	};
};

type MockNotificationsService = {
	create: jest.Mock<
		Promise<void>,
		[
			{
				category: NotificationCategory;
				level: NotificationLevel;
				title: string;
				body: string;
				userIds: string[];
				actionUrl: string;
				houseId: string;
			},
		]
	>;
};

describe('TasksService', () => {
	let service: TasksService;
	let prisma: MockPrismaService;
	let notifications: MockNotificationsService;

	const baseMockTask: MockPrismaTask = {
		id: 'task-123',
		title: 'Task',
		description: 'Desc',
		assigneeId: 'user-123',
		createdById: 'user-123',
		houseId: 'house-1',
		status: 'todo',
		archived: false,
		archivedAt: null,
		deadline: new Date(),
		house: { id: 'house-1', name: 'House' },
		assignee: {
			id: 'user-123',
			name: 'User',
			email: 'user@example.com',
			username: 'user',
		},
		createdBy: {
			id: 'user-123',
			name: 'User',
			email: 'user@example.com',
			username: 'user',
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TasksService,
				{
					provide: PrismaService,
					useValue: {
						house: {
							findUnique:
								jest.fn() as MockPrismaService['house']['findUnique'],
						},
						houseToUser: {
							findFirst:
								jest.fn() as MockPrismaService['houseToUser']['findFirst'],
							findMany:
								jest.fn() as MockPrismaService['houseToUser']['findMany'],
						},
						user: {
							findUnique:
								jest.fn() as MockPrismaService['user']['findUnique'],
						},
						task: {
							create: jest.fn() as MockPrismaService['task']['create'],
							findUnique:
								jest.fn() as MockPrismaService['task']['findUnique'],
							update: jest.fn() as MockPrismaService['task']['update'],
							findMany:
								jest.fn() as MockPrismaService['task']['findMany'],
							delete: jest.fn() as MockPrismaService['task']['delete'],
						},
						taskToUser: {
							createMany:
								jest.fn() as MockPrismaService['taskToUser']['createMany'],
							deleteMany:
								jest.fn() as MockPrismaService['taskToUser']['deleteMany'],
							findMany:
								jest.fn() as MockPrismaService['taskToUser']['findMany'],
						},
					} satisfies MockPrismaService,
				},
				{
					provide: NotificationsService,
					useValue: {
						create: jest.fn() as MockNotificationsService['create'],
					} satisfies MockNotificationsService,
				},
			],
		}).compile();

		service = module.get<TasksService>(TasksService);
		prisma = module.get<PrismaService>(
			PrismaService,
		) as unknown as MockPrismaService;
		notifications = module.get<NotificationsService>(
			NotificationsService,
		) as unknown as MockNotificationsService;

		prisma.houseToUser.findMany.mockResolvedValue([
			{ houseId: 'house-1', userId: 'user-123' },
		]);
		prisma.user.findUnique.mockResolvedValue({
			id: 'u1',
			name: 'U1',
			email: 'u1@test.com',
			username: 'u1',
		} as unknown as Awaited<
			ReturnType<MockPrismaService['user']['findUnique']>
		>);
		prisma.houseToUser.findFirst.mockResolvedValue({
			userId: 'u1',
			houseId: 'house-1',
		} as unknown as Awaited<
			ReturnType<MockPrismaService['houseToUser']['findFirst']>
		>);
	});

	describe('create', () => {
		const baseDto: CreateTaskDto = {
			title: 'Test task',
			description: 'Description',
			assigneeId: 'user-2',
			deadline: new Date().toISOString(),
			houseId: 'house-1',
			assignedUserIds: [],
			size: TaskSize.MEDIUM,
		};

		it('creates a task when data is valid', async () => {
			(prisma.house.findUnique as jest.Mock).mockResolvedValue({
				id: 'house-1',
				name: 'House',
			});
			(prisma.houseToUser.findFirst as jest.Mock).mockResolvedValue({
				userId: 'user-1',
				houseId: 'house-1',
			});
			(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				id: 'user-2',
				name: 'User 2',
				email: 'u2@example.com',
				username: 'u2',
			});

			const mockTask: MockPrismaTask = {
				id: 'task-1',
				title: baseDto.title,
				description: baseDto.description,
				assigneeId: baseDto.assigneeId,
				createdById: 'user-1',
				houseId: baseDto.houseId,
				status: 'todo',
				archived: false,
				archivedAt: null,
				deadline: new Date(baseDto.deadline),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-2',
					name: 'User 2',
					email: 'u2@example.com',
					username: 'u2',
				},
				createdBy: {
					id: 'user-1',
					name: 'Creator',
					email: 'c@example.com',
					username: 'creator',
				},
			};

			(prisma.task.create as jest.Mock).mockResolvedValue(mockTask);
			(prisma.taskToUser.createMany as jest.Mock).mockResolvedValue();

			// notifications are triggered because assignee differs from creator
			(notifications.create as jest.Mock).mockResolvedValue();

			const result = await service.create(baseDto, 'user-1');

			expect(prisma.task.create).toHaveBeenCalled();
			expect(result.id).toBe('task-1');
			// Creator is different from assignee, so notification should be sent
			expect(notifications.create).toHaveBeenCalledTimes(1);
			expect(notifications.create).toHaveBeenCalledWith(
				expect.anything(),
			);
		});

		it('throws NotFoundException when house does not exist', async () => {
			(prisma.house.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(
				service.create(baseDto, 'user-1'),
			).rejects.toBeInstanceOf(NotFoundException);
		});

		it('throws ForbiddenException when creator not in house', async () => {
			(prisma.house.findUnique as jest.Mock).mockResolvedValue({
				id: 'house-1',
				name: 'House',
			});
			(prisma.houseToUser.findFirst as jest.Mock).mockResolvedValue(null);

			await expect(
				service.create(baseDto, 'user-1'),
			).rejects.toBeInstanceOf(ForbiddenException);
		});

		it('throws BadRequestException if assignee not in house', async () => {
			(prisma.house.findUnique as jest.Mock).mockResolvedValue({
				id: 'house-1',
				name: 'House',
			});
			(prisma.houseToUser.findFirst as jest.Mock)
				.mockResolvedValueOnce({ userId: 'user-1', houseId: 'house-1' })
				.mockResolvedValueOnce(null);
			(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				id: 'user-2',
				name: 'User 2',
				email: 'u2@example.com',
				username: 'u2',
			});

			await expect(
				service.create(baseDto, 'user-1'),
			).rejects.toBeInstanceOf(BadRequestException);
		});

		it('creates a task with multiple assignees and notifies all except creator', async () => {
			const multiDto: CreateTaskDto = {
				...baseDto,
				assigneeId: 'user-2',
				assignedUserIds: ['user-2', 'user-3'],
			};

			(prisma.house.findUnique as jest.Mock).mockResolvedValue({
				id: 'house-1',
				name: 'House',
			});
			(prisma.houseToUser.findFirst as jest.Mock)
				.mockResolvedValueOnce({ userId: 'user-1', houseId: 'house-1' })
				.mockResolvedValueOnce({ userId: 'user-2', houseId: 'house-1' })
				.mockResolvedValueOnce({
					userId: 'user-3',
					houseId: 'house-1',
				});

			(prisma.user.findUnique as jest.Mock)
				.mockResolvedValueOnce({
					id: 'user-2',
					name: 'User 2',
					email: 'u2@example.com',
					username: 'u2',
				})
				.mockResolvedValueOnce({
					id: 'user-3',
					name: 'User 3',
					email: 'u3@example.com',
					username: 'u3',
				});

			const mockTaskMulti: MockPrismaTask = {
				id: 'task-2',
				title: multiDto.title,
				description: multiDto.description,
				assigneeId: 'user-2',
				createdById: 'user-1',
				houseId: multiDto.houseId,
				status: 'todo',
				archived: false,
				archivedAt: null,
				deadline: new Date(multiDto.deadline),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-2',
					name: 'User 2',
					email: 'u2@example.com',
					username: 'u2',
				},
				createdBy: {
					id: 'user-1',
					name: 'Creator',
					email: 'c@example.com',
					username: 'creator',
				},
			};

			(prisma.task.create as jest.Mock).mockResolvedValue(mockTaskMulti);
			(prisma.taskToUser.createMany as jest.Mock).mockResolvedValue();
			(notifications.create as jest.Mock).mockResolvedValue();

			await service.create(multiDto, 'user-1');

			const createManyMock = prisma.taskToUser.createMany as jest.Mock<
				Promise<void>,
				[
					{
						data: { taskId: string; userId: string }[];
						skipDuplicates?: boolean;
					},
				]
			>;

			expect(createManyMock).toHaveBeenCalledWith({
				data: [
					{ taskId: 'task-2', userId: 'user-2' },
					{ taskId: 'task-2', userId: 'user-3' },
				],
				skipDuplicates: true,
			});
			const notificationsMock = notifications.create as jest.Mock<
				Promise<void>,
				[
					{
						category: NotificationCategory;
						level: NotificationLevel;
						title: string;
						body: string;
						userIds: string[];
						actionUrl: string;
						houseId: string;
					},
				]
			>;
			expect(notificationsMock).toHaveBeenCalledTimes(1);
			const [notificationPayload] = notificationsMock.mock.calls[0];
			expect(notificationPayload.userIds).toEqual(['user-2', 'user-3']);
		});
	});

	describe('findOne', () => {
		it('returns a task when found', async () => {
			const mockTask: MockPrismaTask & {
				assigneeLinks?: {
					user: { id: string; name: string; username: string };
				}[];
			} = {
				id: 'task-1',
				title: 'Task',
				description: 'Desc',
				assigneeId: 'user-1',
				createdById: 'user-1',
				houseId: 'house-1',
				status: 'todo',
				archived: false,
				archivedAt: null,
				deadline: new Date(),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
				createdBy: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
				assigneeLinks: [
					{
						user: { id: 'user-1', name: 'U1', username: 'u1' },
					},
				],
			};

			(prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);

			const result = await service.findOne('task-1');
			expect(result.id).toBe('task-1');
			expect(result.assignedUsers).toHaveLength(1);
		});

		it('throws NotFoundException when task missing', async () => {
			(prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

			await expect(service.findOne('missing')).rejects.toBeInstanceOf(
				NotFoundException,
			);
		});
	});

	describe('archive', () => {
		it('archives a done task when user has permission', async () => {
			const task: MockPrismaTask = {
				id: 'task-1',
				title: 'Task',
				description: 'Desc',
				assigneeId: 'user-1',
				createdById: 'user-1',
				houseId: 'house-1',
				status: 'done',
				archived: false,
				archivedAt: null,
				deadline: new Date(),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
				createdBy: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				task as unknown as ReturnType<
					typeof service.findOne
				> extends Promise<infer R>
					? R
					: never,
			);

			(prisma.task.update as jest.Mock).mockResolvedValue({
				...task,
				archived: true,
				archivedAt: new Date(),
			});

			const result = await service.archive('task-1', 'user-1');
			expect(result.archived).toBe(true);
		});

		it('throws BadRequestException if task not done', async () => {
			const task: MockPrismaTask = {
				id: 'task-1',
				title: 'Task',
				description: 'Desc',
				assigneeId: 'user-1',
				createdById: 'user-1',
				houseId: 'house-1',
				status: 'todo',
				archived: false,
				archivedAt: null,
				deadline: new Date(),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
				createdBy: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				task as unknown as ReturnType<
					typeof service.findOne
				> extends Promise<infer R>
					? R
					: never,
			);

			await expect(
				service.archive('task-1', 'user-1'),
			).rejects.toBeInstanceOf(BadRequestException);
		});
	});

	describe('unarchive', () => {
		it('unarchives a task when user has permission', async () => {
			const archivedTask: MockPrismaTask = {
				id: 'task-arch',
				title: 'Archived',
				description: 'Desc',
				assigneeId: 'user-1',
				createdById: 'user-1',
				houseId: 'house-1',
				status: 'done',
				archived: true,
				archivedAt: new Date(),
				deadline: new Date(),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
				createdBy: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				archivedTask as unknown as ReturnType<
					typeof service.findOne
				> extends Promise<infer R>
					? R
					: never,
			);

			(prisma.task.update as jest.Mock).mockResolvedValue({
				...archivedTask,
				archived: false,
				archivedAt: null,
			});

			const result = await service.unarchive('task-arch', 'user-1');
			expect(result.archived).toBe(false);
		});

		it('throws ForbiddenException when user not allowed to unarchive', async () => {
			const archivedTask: MockPrismaTask = {
				id: 'task-arch',
				title: 'Archived',
				description: 'Desc',
				assigneeId: 'user-1',
				createdById: 'user-1',
				houseId: 'house-1',
				status: 'done',
				archived: true,
				archivedAt: new Date(),
				deadline: new Date(),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
				createdBy: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				archivedTask as unknown as ReturnType<
					typeof service.findOne
				> extends Promise<infer R>
					? R
					: never,
			);

			(prisma.houseToUser.findFirst as jest.Mock).mockResolvedValue(null);

			await expect(
				service.unarchive('task-arch', 'intruder'),
			).rejects.toBeInstanceOf(ForbiddenException);
		});
	});

	describe('update', () => {
		it('updates task when user is creator', async () => {
			const existing: MockPrismaTask = {
				id: 'task-1',
				title: 'Old',
				description: 'Old',
				assigneeId: 'user-1',
				createdById: 'user-1',
				houseId: 'house-1',
				status: 'todo',
				archived: false,
				archivedAt: null,
				deadline: new Date(),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
				createdBy: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				existing as unknown as ReturnType<
					typeof service.findOne
				> extends Promise<infer R>
					? R
					: never,
			);

			const dto: UpdateTaskDto = {
				title: 'New title',
				assignedUserIds: ['user-1'],
			};

			// user lookup for new assignee inside service.update
			(prisma.user.findUnique as jest.Mock).mockResolvedValue({
				id: 'user-1',
				name: 'U1',
				email: 'u1@example.com',
				username: 'u1',
			});
			// verify new assignee is in the same house
			(prisma.houseToUser.findFirst as jest.Mock).mockResolvedValue({
				userId: 'user-1',
				houseId: 'house-1',
			});

			(prisma.task.update as jest.Mock).mockResolvedValue({
				...existing,
				...dto,
			});
			(prisma.taskToUser.findMany as jest.Mock).mockResolvedValue([]);
			(prisma.taskToUser.deleteMany as jest.Mock).mockResolvedValue();
			(prisma.taskToUser.createMany as jest.Mock).mockResolvedValue();
			(notifications.create as jest.Mock).mockResolvedValue();

			const result = await service.update('task-1', dto, 'user-1');

			expect(prisma.task.update).toHaveBeenCalled();
			expect(result.title).toBe('New title');
		});

		it('sends completion notification when status changes to done (actor is creator)', async () => {
			const existingDoneSource: MockPrismaTask = {
				...baseMockTask,
				status: 'todo',
				createdById: 'user-1',
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				existingDoneSource as unknown as Awaited<
					ReturnType<typeof service.findOne>
				>,
			);

			const dtoDone: UpdateTaskDto = { status: TaskStatus.DONE };

			(prisma.task.update as jest.Mock).mockResolvedValue({
				...existingDoneSource,
				status: TaskStatus.DONE,
			});

			(prisma.houseToUser.findMany as jest.Mock).mockResolvedValue([
				{ userId: 'user-1', houseId: 'house-1' },
				{ userId: 'user-2', houseId: 'house-1' },
			]);
			(notifications.create as jest.Mock).mockResolvedValue(undefined);

			await service.update('task-1', dtoDone, 'user-1');

			expect(notifications.create).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining(
						existingDoneSource.createdBy.name,
					) as unknown,
				}),
			);
		});

		it('sends completion notification when status changes to done (actor is assignee)', async () => {
			const existingDoneSource: MockPrismaTask = {
				...baseMockTask,
				status: 'todo',
				createdById: 'user-999',
				assigneeId: 'user-2',
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				existingDoneSource as unknown as Awaited<
					ReturnType<typeof service.findOne>
				>,
			);

			const dtoDone: UpdateTaskDto = { status: TaskStatus.DONE };

			(prisma.task.update as jest.Mock).mockResolvedValue({
				...existingDoneSource,
				status: TaskStatus.DONE,
			});

			(prisma.houseToUser.findMany as jest.Mock).mockResolvedValue([
				{ userId: 'user-1', houseId: 'house-1' },
			]);
			(notifications.create as jest.Mock).mockResolvedValue(undefined);

			await service.update('task-1', dtoDone, 'user-2');

			expect(notifications.create).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining(
						existingDoneSource.assignee.name,
					) as unknown,
				}),
			);
		});

		it('sends completion notification when status changes to done (actor is neither)', async () => {
			const existingDoneSource: MockPrismaTask = {
				...baseMockTask,
				status: 'todo',
				createdById: 'user-998',
				assigneeId: 'user-999',
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				existingDoneSource as unknown as Awaited<
					ReturnType<typeof service.findOne>
				>,
			);

			const dtoDone: UpdateTaskDto = { status: TaskStatus.DONE };

			(prisma.task.update as jest.Mock).mockResolvedValue({
				...existingDoneSource,
				status: TaskStatus.DONE,
			});

			(prisma.houseToUser.findMany as jest.Mock).mockResolvedValue([
				{ userId: 'user-1', houseId: 'house-1' },
			]);
			(notifications.create as jest.Mock).mockResolvedValue(undefined);

			await service.update('task-1', dtoDone, 'user-123');

			expect(notifications.create).toHaveBeenCalledWith(
				expect.objectContaining({
					body: expect.stringContaining('A member') as unknown,
				}),
			);
		});

		it('throws ForbiddenException when user has no permission', async () => {
			const existing: MockPrismaTask = {
				id: 'task-1',
				title: 'Old',
				description: 'Old',
				assigneeId: 'user-1',
				createdById: 'user-1',
				houseId: 'house-1',
				status: 'todo',
				archived: false,
				archivedAt: null,
				deadline: new Date(),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
				createdBy: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				existing as unknown as Awaited<
					ReturnType<typeof service.findOne>
				>,
			);

			(prisma.houseToUser.findMany as jest.Mock).mockResolvedValue([]);

			await expect(
				service.update('task-1', {}, 'intruder'),
			).rejects.toBeInstanceOf(ForbiddenException);
		});
	});

	describe('remove', () => {
		it('deletes when user is creator', async () => {
			const existing: MockPrismaTask = {
				id: 'task-1',
				title: 'Task',
				description: 'Desc',
				assigneeId: 'user-1',
				createdById: 'user-1',
				houseId: 'house-1',
				status: 'todo',
				archived: false,
				archivedAt: null,
				deadline: new Date(),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
				createdBy: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				existing as unknown as ReturnType<
					typeof service.findOne
				> extends Promise<infer R>
					? R
					: never,
			);
			(prisma.task.delete as jest.Mock).mockResolvedValue();

			const result = await service.remove('task-1', 'user-1');
			expect(prisma.task.delete).toHaveBeenCalledWith({
				where: { id: 'task-1' },
			});
			expect(result).toEqual({ message: 'Task deleted successfully' });
		});

		it('throws ForbiddenException when non-creator tries to delete', async () => {
			const existing: MockPrismaTask = {
				id: 'task-1',
				title: 'Task',
				description: 'Desc',
				assigneeId: 'user-1',
				createdById: 'user-1',
				houseId: 'house-1',
				status: 'todo',
				archived: false,
				archivedAt: null,
				deadline: new Date(),
				house: { id: 'house-1', name: 'House' },
				assignee: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
				createdBy: {
					id: 'user-1',
					name: 'U1',
					email: 'u1@example.com',
					username: 'u1',
				},
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(
				existing as unknown as ReturnType<
					typeof service.findOne
				> extends Promise<infer R>
					? R
					: never,
			);

			await expect(
				service.remove('task-1', 'intruder'),
			).rejects.toBeInstanceOf(ForbiddenException);
		});
	});
	describe('findAllForUser', () => {
		it('should return tasks for user houses', async () => {
			prisma.houseToUser.findMany.mockResolvedValue([
				{ houseId: 'house-1', userId: 'user-123' },
			]);
			prisma.task.findMany.mockResolvedValue([baseMockTask]);

			const result = await service.findAllForUser('user-123');

			expect(result).toEqual([
				{
					...baseMockTask,
					assignedUsers: [],
				},
			]);
			expect(prisma.houseToUser.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { userId: 'user-123' },
					select: { houseId: true },
				}) as unknown,
			);
			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						houseId: { in: ['house-1'] },
					}) as unknown,
				}) as unknown,
			);
		});

		it('should return empty array if user has no houses', async () => {
			prisma.houseToUser.findMany.mockResolvedValue([]);

			const result = await service.findAllForUser('user-123');

			expect(result).toEqual([]);
			expect(prisma.task.findMany).not.toHaveBeenCalled();
		});

		it('should apply filters', async () => {
			prisma.houseToUser.findMany.mockResolvedValue([
				{ houseId: 'house-1', userId: 'user-123' },
			]);
			prisma.task.findMany.mockResolvedValue([baseMockTask]);

			await service.findAllForUser('user-123', {
				status: 'todo',
				assigneeId: 'user-456',
				archived: 'true',
			});

			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						status: 'todo',
						assigneeId: 'user-456',
						archived: true,
					}) as unknown,
				}) as unknown,
			);
		});
	});

	describe('archive', () => {
		it('should archive a completed task', async () => {
			const completedTask: MockPrismaTask = {
				...baseMockTask,
				status: 'done',
			};
			prisma.task.findUnique.mockResolvedValue(completedTask);
			prisma.task.update.mockResolvedValue({
				...completedTask,
				archived: true,
			});

			const result = await service.archive('task-123', 'user-123');

			expect(result.archived).toBe(true);
			expect(prisma.task.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						archived: true,
					}) as unknown,
				}) as unknown,
			);
		});

		it('should throw BadRequest if task is not done', async () => {
			prisma.task.findUnique.mockResolvedValue(baseMockTask); // status: todo

			await expect(
				service.archive('task-123', 'user-123'),
			).rejects.toThrow(BadRequestException);
		});

		it('should throw Forbidden if user not allowed', async () => {
			prisma.task.findUnique.mockResolvedValue(baseMockTask);
			prisma.houseToUser.findFirst.mockResolvedValue(null);

			await expect(
				service.archive('task-123', 'other-user'),
			).rejects.toThrow(ForbiddenException);
		});
	});

	describe('unarchive', () => {
		it('should unarchive a task', async () => {
			const archivedTask: MockPrismaTask = {
				...baseMockTask,
				archived: true,
			};
			prisma.task.findUnique.mockResolvedValue(archivedTask);
			prisma.task.update.mockResolvedValue({
				...archivedTask,
				archived: false,
			});

			const result = await service.unarchive('task-123', 'user-123');

			expect(result.archived).toBe(false);
			expect(prisma.task.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						archived: false,
					}) as unknown,
				}) as unknown,
			);
		});
	});

	describe('Error Handling', () => {
		it('should handle failure in findMany in updateTaskAssignees', async () => {
			const existingTask = {
				...baseMockTask,
				id: 'task-1',
			} as MockPrismaTask;
			prisma.task.findUnique.mockResolvedValue(existingTask);
			prisma.task.update.mockResolvedValue(existingTask);
			prisma.taskToUser.findMany.mockRejectedValue(new Error('DB Error'));

			// Should not throw, just log error and continue
			await service.update(
				'task-1',
				{ assignedUserIds: ['u1'] },
				'user-123',
			);

			expect(prisma.task.update).toHaveBeenCalled();
		});

		it('should handle failure in deleteMany/createMany in updateTaskAssignees', async () => {
			const existingTask = {
				...baseMockTask,
				id: 'task-1',
			} as MockPrismaTask;
			prisma.task.findUnique.mockResolvedValue(existingTask);
			prisma.task.update.mockResolvedValue(existingTask);
			prisma.taskToUser.findMany.mockResolvedValue([]);
			prisma.taskToUser.deleteMany.mockRejectedValue(
				new Error('Delete Error'),
			);

			const consoleSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			await service.update(
				'task-1',
				{ assignedUserIds: ['u1'] },
				'user-123',
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				'[TasksService] Failed to update task assignees',
				expect.any(Error),
			);
			consoleSpy.mockRestore();
		});

		it('should handle failure in notification service during assignment', async () => {
			const existingTask = {
				...baseMockTask,
				id: 'task-1',
			} as MockPrismaTask;
			prisma.task.findUnique.mockResolvedValue(existingTask);
			prisma.task.update.mockResolvedValue(existingTask);
			prisma.taskToUser.findMany.mockResolvedValue([]);
			prisma.taskToUser.deleteMany.mockResolvedValue(undefined);
			prisma.taskToUser.createMany.mockResolvedValue(undefined);
			notifications.create.mockRejectedValue(
				new Error('Notification Error'),
			);

			const consoleSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			await service.update(
				'task-1',
				{ assignedUserIds: ['u1'] },
				'user-123',
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				'[TasksService] Failed to create update assignment notification',
				expect.any(Error),
			);
			consoleSpy.mockRestore();
		});

		it('should handle failure in notification service during completion', async () => {
			const existingTask = {
				...baseMockTask,
				id: 'task-1',
				status: 'todo',
			} as MockPrismaTask;
			const updatedTask = {
				...baseMockTask,
				id: 'task-1',
				status: 'done',
			} as MockPrismaTask;
			prisma.task.findUnique.mockResolvedValue(existingTask);
			prisma.task.update.mockResolvedValue(updatedTask);
			prisma.houseToUser.findMany.mockResolvedValue([
				{ userId: 'u1', houseId: 'h1' },
			]);
			notifications.create.mockRejectedValue(
				new Error('Completion Notification Error'),
			);

			const consoleSpy = jest
				.spyOn(console, 'error')
				.mockImplementation();
			await service.update(
				'task-1',
				{ status: TaskStatus.DONE },
				'user-1',
			);
			expect(consoleSpy).toHaveBeenCalledWith(
				'[TasksService] Failed to create completion notification',
				expect.any(Error),
			);
			consoleSpy.mockRestore();
		});
	});

	describe('findByHouse', () => {
		it('should return tasks for a house', async () => {
			prisma.task.findMany.mockResolvedValue([baseMockTask]);

			const result = await service.findByHouse('house-1');

			expect(result).toEqual([
				{
					...baseMockTask,
					assignedUsers: [],
				},
			]);
			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						houseId: 'house-1',
					}) as unknown,
				}) as unknown,
			);
		});

		it('should filter by archived status', async () => {
			prisma.task.findMany.mockResolvedValue([]);

			await service.findByHouse('house-1', 'true');

			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						archived: true,
					}) as unknown,
				}) as unknown,
			);
		});
	});

	describe('Recurring Tasks', () => {
		describe('create with recurrence', () => {
			it('should create a daily recurring task', async () => {
				const createTaskDto: CreateTaskDto = {
					title: 'Daily Standup',
					description: 'Team standup meeting',
					assigneeId: 'user-1',
					deadline: '2025-12-20T10:00:00.000Z',
					houseId: 'house-1',
					size: TaskSize.SMALL,
					isRecurring: true,
					recurrencePattern: RecurrencePattern.DAILY,
					recurrenceInterval: 1,
				};

				const mockHouse = { id: 'house-1', name: 'Test House' };
				const mockUser = {
					id: 'user-1',
					name: 'John',
					email: 'john@test.com',
					username: 'john',
				};
				const mockHouseToUser = {
					userId: 'user-1',
					houseId: 'house-1',
				};

				prisma.house.findUnique.mockResolvedValue(mockHouse);
				prisma.houseToUser.findFirst.mockResolvedValue(mockHouseToUser);
				prisma.user.findUnique.mockResolvedValue(mockUser);

				const expectedDeadline = new Date('2025-12-20T10:00:00.000Z');
				// Next recurrence will be computed in service; we assert flags

				const mockTask: MockPrismaTask = {
					id: 'task-1',
					title: createTaskDto.title,
					description: createTaskDto.description,
					assigneeId: createTaskDto.assigneeId,
					deadline: expectedDeadline,
					createdById: 'creator-1',
					houseId: createTaskDto.houseId,
					status: 'todo' as const,
					archived: false,
					archivedAt: null,
					house: mockHouse,
					assignee: mockUser,
					createdBy: mockUser,
				};

				prisma.task.create.mockResolvedValue(mockTask);
				prisma.taskToUser.createMany.mockResolvedValue(undefined);

				await service.create(createTaskDto, 'creator-1');

				const createCall = prisma.task.create.mock.calls[0][0] as {
					data: {
						isRecurring: boolean;
						recurrencePattern: RecurrencePattern;
						recurrenceInterval: number;
						lastRecurrenceDate: Date;
					};
				};
				expect(createCall.data.isRecurring).toBe(true);
				expect(createCall.data.recurrencePattern).toBe(
					RecurrencePattern.DAILY,
				);
				expect(createCall.data.recurrenceInterval).toBe(1);
				expect(createCall.data.lastRecurrenceDate).toEqual(
					expectedDeadline,
				);
			});

			it('should create a weekly recurring task', async () => {
				const createTaskDto: CreateTaskDto = {
					title: 'Weekly Review',
					description: 'Review tasks',
					assigneeId: 'user-1',
					deadline: '2025-12-20T10:00:00.000Z',
					houseId: 'house-1',
					size: TaskSize.MEDIUM,
					isRecurring: true,
					recurrencePattern: RecurrencePattern.WEEKLY,
					recurrenceInterval: 1,
				};

				const mockHouse = { id: 'house-1', name: 'Test House' };
				const mockUser = {
					id: 'user-1',
					name: 'John',
					email: 'john@test.com',
					username: 'john',
				};
				const mockHouseToUser = {
					userId: 'user-1',
					houseId: 'house-1',
				};

				prisma.house.findUnique.mockResolvedValue(mockHouse);
				prisma.houseToUser.findFirst.mockResolvedValue(mockHouseToUser);
				prisma.user.findUnique.mockResolvedValue(mockUser);

				const mockTask: MockPrismaTask = {
					id: 'task-1',
					title: createTaskDto.title,
					description: createTaskDto.description,
					assigneeId: createTaskDto.assigneeId,
					deadline: new Date(createTaskDto.deadline),
					createdById: 'creator-1',
					houseId: createTaskDto.houseId,
					status: 'todo' as const,
					archived: false,
					archivedAt: null,
					house: mockHouse,
					assignee: mockUser,
					createdBy: mockUser,
				};

				prisma.task.create.mockResolvedValue(mockTask);
				prisma.taskToUser.createMany.mockResolvedValue(undefined);

				await service.create(createTaskDto, 'creator-1');

				const createCallWeekly = prisma.task.create.mock
					.calls[0][0] as {
					data: {
						recurrencePattern: RecurrencePattern;
						recurrenceInterval: number;
					};
				};
				expect(createCallWeekly.data.recurrencePattern).toBe(
					RecurrencePattern.WEEKLY,
				);
				expect(createCallWeekly.data.recurrenceInterval).toBe(1);
			});

			it('should create a monthly recurring task with correct parameters', async () => {
				const createTaskDto: CreateTaskDto = {
					title: 'Monthly Report',
					description: 'Generate monthly report',
					assigneeId: 'user-1',
					deadline: '2025-12-31T10:00:00.000Z',
					houseId: 'house-1',
					size: TaskSize.LARGE,
					isRecurring: true,
					recurrencePattern: RecurrencePattern.MONTHLY,
					recurrenceInterval: 1,
				};

				const mockHouse = { id: 'house-1', name: 'Test House' };
				const mockUser = {
					id: 'user-1',
					name: 'John',
					email: 'john@test.com',
					username: 'john',
				};
				const mockHouseToUser = {
					userId: 'user-1',
					houseId: 'house-1',
				};

				const mockTask = {
					id: 'task-1',
					title: createTaskDto.title,
					description: createTaskDto.description,
					assigneeId: createTaskDto.assigneeId,
					deadline: new Date(createTaskDto.deadline),
					createdById: 'creator-1',
					houseId: createTaskDto.houseId,
					status: 'todo' as const,
					archived: false,
					archivedAt: null,
					house: mockHouse,
					assignee: mockUser,
					createdBy: mockUser,
				};

				prisma.house.findUnique.mockResolvedValue(mockHouse);
				prisma.houseToUser.findFirst.mockResolvedValue(mockHouseToUser);
				prisma.user.findUnique.mockResolvedValue(mockUser);
				prisma.task.create.mockResolvedValue(mockTask);
				prisma.taskToUser.createMany.mockResolvedValue(undefined);

				await service.create(createTaskDto, 'creator-1');

				const createCallMonthly = prisma.task.create.mock
					.calls[0][0] as {
					data: {
						recurrencePattern: RecurrencePattern;
						recurrenceInterval: number;
					};
				};
				expect(createCallMonthly.data.recurrencePattern).toBe(
					RecurrencePattern.MONTHLY,
				);
				expect(createCallMonthly.data.recurrenceInterval).toBe(1);
			});
		});

		describe('stopRecurrence', () => {
			it('should stop a recurring task', async () => {
				const mockTask: MockPrismaTask = {
					id: 'task-1',
					title: 'Test Task',
					description: 'Test Description',
					assigneeId: 'user-1',
					createdById: 'creator-1',
					houseId: 'house-1',
					status: 'todo' as const,
					archived: false,
					archivedAt: null,
					deadline: new Date(),
					isRecurring: true,
					house: { id: 'house-1', name: 'Test House' },
					assignee: {
						id: 'user-1',
						name: 'John',
						email: 'john@test.com',
						username: 'john',
					},
					createdBy: {
						id: 'creator-1',
						name: 'Creator',
						email: 'creator@test.com',
						username: 'creator',
					},
				};

				const updatedTask = {
					...mockTask,
					isRecurring: false,
				};

				prisma.task.findUnique.mockResolvedValue(mockTask);
				prisma.task.update.mockResolvedValue(
					updatedTask as unknown as MockPrismaTask,
				);

				const result = await service.stopRecurrence(
					'task-1',
					'creator-1',
				);

				expect(prisma.task.update).toHaveBeenCalledWith({
					where: { id: 'task-1' },
					data: {
						isRecurring: false,
						nextRecurrenceDate: null,
					},
					include: {
						assignee: {
							select: {
								id: true,
								name: true,
								email: true,
								username: true,
							},
						},
						house: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				});
				expect(result.message).toBe(
					'Recurring task stopped successfully',
				);
			});

			it('should throw ForbiddenException if user is not creator', async () => {
				const mockTask: MockPrismaTask = {
					id: 'task-1',
					title: 'Recurring Task',
					description: 'Test',
					assigneeId: 'user-1',
					createdById: 'creator-1',
					houseId: 'house-1',
					status: 'todo' as const,
					archived: false,
					archivedAt: null,
					deadline: new Date(),
					isRecurring: true,
					house: { id: 'house-1', name: 'Test House' },
					assignee: {
						id: 'user-1',
						name: 'John',
						email: 'john@test.com',
						username: 'john',
					},
					createdBy: {
						id: 'creator-1',
						name: 'Creator',
						email: 'creator@test.com',
						username: 'creator',
					},
				};

				prisma.task.findUnique.mockResolvedValue(mockTask);

				await expect(
					service.stopRecurrence('task-1', 'other-user'),
				).rejects.toThrow(ForbiddenException);
			});

			it('should throw BadRequestException if task is not recurring', async () => {
				const mockTask: MockPrismaTask = {
					id: 'task-1',
					title: 'Non-Recurring Task',
					description: 'Test',
					assigneeId: 'user-1',
					createdById: 'creator-1',
					houseId: 'house-1',
					status: 'todo' as const,
					archived: false,
					archivedAt: null,
					deadline: new Date(),
					isRecurring: false,
					house: { id: 'house-1', name: 'Test House' },
					assignee: {
						id: 'user-1',
						name: 'John',
						email: 'john@test.com',
						username: 'john',
					},
					createdBy: {
						id: 'creator-1',
						name: 'Creator',
						email: 'creator@test.com',
						username: 'creator',
					},
				};

				prisma.task.findUnique.mockResolvedValue(mockTask);

				await expect(
					service.stopRecurrence('task-1', 'creator-1'),
				).rejects.toThrow(BadRequestException);
			});
		});

		describe('getRecurringTaskInstances', () => {
			it('should return template and all instances', async () => {
				const mockTemplate = {
					id: 'task-1',
					title: 'Recurring Task',
					description: 'Test',
					assigneeId: 'user-1',
					createdById: 'creator-1',
					houseId: 'house-1',
					status: 'todo' as const,
					archived: false,
					archivedAt: null,
					deadline: new Date(),
					isRecurring: true,
					assignedUsers: [],
					house: { id: 'house-1', name: 'Test House' },
					assignee: {
						id: 'user-1',
						name: 'John',
						email: 'john@test.com',
						username: 'john',
					},
					createdBy: {
						id: 'creator-1',
						name: 'Creator',
						email: 'creator@test.com',
						username: 'creator',
					},
				};

				const mockInstances = [
					{
						id: 'task-2',
						title: 'Recurring Task',
						description: 'Test',
						assigneeId: 'user-1',
						createdById: 'creator-1',
						houseId: 'house-1',
						status: 'done' as const,
						archived: false,
						archivedAt: null,
						deadline: new Date('2025-12-19'),
						isRecurring: false,
						parentRecurringTaskId: 'task-1',
						house: { id: 'house-1', name: 'Test House' },
						assignee: {
							id: 'user-1',
							name: 'John',
							email: 'john@test.com',
							username: 'john',
							imageUrl: null,
						},
						createdBy: {
							id: 'creator-1',
							name: 'Creator',
							email: 'creator@test.com',
							username: 'creator',
							imageUrl: null,
						},
						assigneeLinks: [],
					},
				];

				prisma.task.findUnique.mockResolvedValue(
					mockTemplate as unknown as MockPrismaTask,
				);
				prisma.houseToUser.findFirst.mockResolvedValue({
					userId: 'user-1',
					houseId: 'house-1',
				});
				prisma.task.findMany.mockResolvedValue(
					mockInstances as unknown as MockPrismaTask[],
				);

				const result = await service.getRecurringTaskInstances(
					'task-1',
					'user-1',
				);

				expect(result.template).toEqual(mockTemplate);
				expect(result.instances).toHaveLength(1);

				const findManyCall = prisma.task.findMany.mock.calls[0][0] as {
					where: { parentRecurringTaskId: string };
					orderBy: { deadline: string };
				};
				expect(findManyCall.where.parentRecurringTaskId).toBe('task-1');
				expect(findManyCall.orderBy.deadline).toBe('desc');
			});

			it('should throw ForbiddenException if user not in house', async () => {
				const mockTask = {
					id: 'task-1',
					title: 'Recurring Task',
					description: 'Test',
					assigneeId: 'user-1',
					createdById: 'creator-1',
					houseId: 'house-1',
					status: 'todo' as const,
					archived: false,
					archivedAt: null,
					deadline: new Date(),
					isRecurring: true,
					house: { id: 'house-1', name: 'Test House' },
					assignee: {
						id: 'user-1',
						name: 'John',
						email: 'john@test.com',
						username: 'john',
					},
					createdBy: {
						id: 'creator-1',
						name: 'Creator',
						email: 'creator@test.com',
						username: 'creator',
					},
				};

				prisma.task.findUnique.mockResolvedValue(
					mockTask as unknown as MockPrismaTask,
				);
				prisma.houseToUser.findFirst.mockResolvedValue(null);

				await expect(
					service.getRecurringTaskInstances('task-1', 'other-user'),
				).rejects.toThrow(ForbiddenException);
			});

			it('should throw BadRequestException if task is not recurring', async () => {
				const mockTask = {
					id: 'task-1',
					title: 'Non-Recurring Task',
					description: 'Test',
					assigneeId: 'user-1',
					createdById: 'creator-1',
					houseId: 'house-1',
					status: 'todo' as const,
					archived: false,
					archivedAt: null,
					deadline: new Date(),
					isRecurring: false,
					house: { id: 'house-1', name: 'Test House' },
					assignee: {
						id: 'user-1',
						name: 'John',
						email: 'john@test.com',
						username: 'john',
					},
					createdBy: {
						id: 'creator-1',
						name: 'Creator',
						email: 'creator@test.com',
						username: 'creator',
					},
				};

				prisma.task.findUnique.mockResolvedValue(
					mockTask as unknown as MockPrismaTask,
				);
				prisma.houseToUser.findFirst.mockResolvedValue({
					userId: 'user-1',
					houseId: 'house-1',
				});

				await expect(
					service.getRecurringTaskInstances('task-1', 'user-1'),
				).rejects.toThrow(BadRequestException);
			});
		});
	});
});
