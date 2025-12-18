import { Test, TestingModule } from '@nestjs/testing';
import { TaskRecurrenceService } from './task-recurrence.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
	RecurrencePattern,
	NotificationCategory,
	NotificationLevel,
	TaskSize,
	Task,
} from '@prisma/client';

describe('TaskRecurrenceService', () => {
	let service: TaskRecurrenceService;
	let prisma: jest.Mocked<PrismaService>;
	let notificationsService: jest.Mocked<NotificationsService>;

	beforeEach(async () => {
		const mockPrisma = {
			task: {
				findMany: jest.fn(),
				create: jest.fn(),
				update: jest.fn(),
			},
			taskToUser: {
				createMany: jest.fn(),
			},
		};

		const mockNotificationsService = {
			create: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskRecurrenceService,
				{ provide: PrismaService, useValue: mockPrisma },
				{
					provide: NotificationsService,
					useValue: mockNotificationsService,
				},
			],
		}).compile();

		service = module.get<TaskRecurrenceService>(TaskRecurrenceService);
		prisma = module.get(PrismaService);
		notificationsService = module.get(NotificationsService);
	});

	describe('calculateNextRecurrence', () => {
		it('should calculate daily recurrence correctly', () => {
			const currentDate = new Date('2025-12-18T10:00:00.000Z');
			const nextDate = (
				service as unknown as {
					calculateNextRecurrence: (
						d: Date,
						p: RecurrencePattern,
						i: number,
					) => Date;
				}
			).calculateNextRecurrence(currentDate, RecurrencePattern.DAILY, 1);

			expect(nextDate.getDate()).toBe(19);
			expect(nextDate.getMonth()).toBe(11); // December (0-indexed)
			expect(nextDate.getFullYear()).toBe(2025);
		});

		it('should calculate daily recurrence with interval > 1', () => {
			const currentDate = new Date('2025-12-18T10:00:00.000Z');
			const nextDate = (
				service as unknown as {
					calculateNextRecurrence: (
						d: Date,
						p: RecurrencePattern,
						i: number,
					) => Date;
				}
			).calculateNextRecurrence(currentDate, RecurrencePattern.DAILY, 3);

			expect(nextDate.getDate()).toBe(21);
		});

		it('should calculate weekly recurrence correctly', () => {
			const currentDate = new Date('2025-12-18T10:00:00.000Z');
			const nextDate = (
				service as unknown as {
					calculateNextRecurrence: (
						d: Date,
						p: RecurrencePattern,
						i: number,
					) => Date;
				}
			).calculateNextRecurrence(currentDate, RecurrencePattern.WEEKLY, 1);

			expect(nextDate.getDate()).toBe(25);
			expect(nextDate.getMonth()).toBe(11); // December
			expect(nextDate.getFullYear()).toBe(2025);
		});

		it('should calculate weekly recurrence with interval > 1', () => {
			const currentDate = new Date('2025-12-18T10:00:00.000Z');
			const nextDate = (
				service as unknown as {
					calculateNextRecurrence: (
						d: Date,
						p: RecurrencePattern,
						i: number,
					) => Date;
				}
			).calculateNextRecurrence(currentDate, RecurrencePattern.WEEKLY, 2);

			expect(nextDate.getDate()).toBe(1);
			expect(nextDate.getMonth()).toBe(0); // January (next year)
			expect(nextDate.getFullYear()).toBe(2026);
		});

		it('should calculate monthly recurrence correctly', () => {
			const currentDate = new Date('2025-12-18T10:00:00.000Z');
			const nextDate = (
				service as unknown as {
					calculateNextRecurrence: (
						d: Date,
						p: RecurrencePattern,
						i: number,
					) => Date;
				}
			).calculateNextRecurrence(
				currentDate,
				RecurrencePattern.MONTHLY,
				1,
			);

			expect(nextDate.getDate()).toBe(18);
			expect(nextDate.getMonth()).toBe(0); // January (next year)
			expect(nextDate.getFullYear()).toBe(2026);
		});

		it('should handle month-end edge case (Jan 31 -> Feb 28)', () => {
			const currentDate = new Date('2025-01-31T10:00:00.000Z');
			const nextDate = (
				service as unknown as {
					calculateNextRecurrence: (
						d: Date,
						p: RecurrencePattern,
						i: number,
					) => Date;
				}
			).calculateNextRecurrence(
				currentDate,
				RecurrencePattern.MONTHLY,
				1,
			);

			// Should set to last day of February (28 in 2025, non-leap year)
			expect(nextDate.getDate()).toBe(28);
			expect(nextDate.getMonth()).toBe(1); // February
			expect(nextDate.getFullYear()).toBe(2025);
		});

		it('should handle month-end edge case in leap year (Jan 31 -> Feb 29)', () => {
			const currentDate = new Date('2024-01-31T10:00:00.000Z');
			const nextDate = (
				service as unknown as {
					calculateNextRecurrence: (
						d: Date,
						p: RecurrencePattern,
						i: number,
					) => Date;
				}
			).calculateNextRecurrence(
				currentDate,
				RecurrencePattern.MONTHLY,
				1,
			);

			// Should set to last day of February (29 in 2024, leap year)
			expect(nextDate.getDate()).toBe(29);
			expect(nextDate.getMonth()).toBe(1); // February
			expect(nextDate.getFullYear()).toBe(2024);
		});

		it('should handle monthly recurrence with interval > 1', () => {
			const currentDate = new Date('2025-12-18T10:00:00.000Z');
			const nextDate = (
				service as unknown as {
					calculateNextRecurrence: (
						d: Date,
						p: RecurrencePattern,
						i: number,
					) => Date;
				}
			).calculateNextRecurrence(
				currentDate,
				RecurrencePattern.MONTHLY,
				3,
			);

			expect(nextDate.getDate()).toBe(18);
			expect(nextDate.getMonth()).toBe(2); // March (next year)
			expect(nextDate.getFullYear()).toBe(2026);
		});
	});

	describe('handleRecurringTasks', () => {
		it('should process recurring tasks due today', async () => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const mockRecurringTask = {
				id: 'task-1',
				title: 'Daily Task',
				description: 'Test task',
				assigneeId: 'user-1',
				createdById: 'creator-1',
				houseId: 'house-1',
				status: 'todo',
				size: TaskSize.MEDIUM,
				isRecurring: true,
				recurrencePattern: RecurrencePattern.DAILY,
				recurrenceInterval: 1,
				nextRecurrenceDate: today,
				deadline: today,
				archived: false,
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
				house: {
					id: 'house-1',
					name: 'Test House',
				},
				assigneeLinks: [{ userId: 'user-1' }],
			};

			const mockNewTask = {
				id: 'task-2',
				title: 'Daily Task',
				description: 'Test task',
				assigneeId: 'user-1',
				deadline: today,
				houseId: 'house-1',
				house: {
					id: 'house-1',
					name: 'Test House',
				},
				assignee: {
					id: 'user-1',
					name: 'John',
					email: 'john@test.com',
					username: 'john',
				},
			};

			(prisma.task.findMany as jest.Mock).mockResolvedValue([
				mockRecurringTask,
			]);

			(prisma.task.create as jest.Mock).mockResolvedValue(mockNewTask);
			(prisma.taskToUser.createMany as jest.Mock).mockResolvedValue({
				count: 1,
			});

			(prisma.task.update as jest.Mock).mockResolvedValue(
				mockRecurringTask,
			);

			await service.handleRecurringTasks();

			const findManyCall = (
				(prisma.task.findMany as jest.Mock).mock.calls[0] as unknown[]
			)[0] as {
				where: {
					isRecurring: boolean;
					nextRecurrenceDate: { lte: Date };
				};
			};
			expect(findManyCall.where.isRecurring).toBe(true);
			expect(findManyCall.where.nextRecurrenceDate.lte).toBeInstanceOf(
				Date,
			);
			expect(
				(prisma.task.create as jest.Mock).mock.calls.length,
			).toBeGreaterThan(0);
		});

		it('should send notifications to assignees', async () => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const mockRecurringTask = {
				id: 'task-1',
				title: 'Daily Task',
				description: 'Test task',
				assigneeId: 'user-1',
				createdById: 'creator-1',
				houseId: 'house-1',
				status: 'todo',
				size: TaskSize.MEDIUM,
				isRecurring: true,
				recurrencePattern: RecurrencePattern.DAILY,
				recurrenceInterval: 1,
				nextRecurrenceDate: today,
				deadline: today,
				archived: false,
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
				house: {
					id: 'house-1',
					name: 'Test House',
				},
				assigneeLinks: [{ userId: 'user-1' }, { userId: 'user-2' }],
			};

			const mockNewTask = {
				id: 'task-2',
				title: 'Daily Task',
				description: 'Test task',
				assigneeId: 'user-1',
				deadline: today,
				houseId: 'house-1',
				house: {
					id: 'house-1',
					name: 'Test House',
				},
				assignee: {
					id: 'user-1',
					name: 'John',
					email: 'john@test.com',
					username: 'john',
				},
			};

			(prisma.task.findMany as jest.Mock).mockResolvedValue([
				mockRecurringTask,
			]);
			(prisma.task.create as jest.Mock).mockResolvedValue(
				mockNewTask as unknown as Task,
			);
			(prisma.taskToUser.createMany as jest.Mock).mockResolvedValue({
				count: 2,
			});
			(prisma.task.update as jest.Mock).mockResolvedValue(
				mockRecurringTask as unknown as Task,
			);

			await service.handleRecurringTasks();

			const createCall = (
				(notificationsService.create as jest.Mock).mock
					.calls[0] as unknown[]
			)[0] as {
				category: NotificationCategory;
				level: NotificationLevel;
				title: string;
				body: string;
				userIds: string[];
				actionUrl: string;
				houseId: string;
			};
			expect(createCall.category).toBe(NotificationCategory.SCRUM);
			expect(createCall.level).toBe(NotificationLevel.LOW);
			expect(createCall.title).toBe('Recurring task: Daily Task');
			expect(createCall.body).toContain('Daily Task');
			expect(createCall.userIds).toEqual(['user-1', 'user-2']);
			expect(createCall.actionUrl).toBe('/activities');
			expect(createCall.houseId).toBe('house-1');
		});
	});
});
