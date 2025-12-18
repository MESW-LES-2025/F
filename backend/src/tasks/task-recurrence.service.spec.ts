import { Test, TestingModule } from '@nestjs/testing';
import { TaskRecurrenceService } from './task-recurrence.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
	RecurrencePattern,
	NotificationCategory,
	NotificationLevel,
	TaskSize,
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
			// @ts-expect-error - accessing private method for testing
			const nextDate = service.calculateNextRecurrence(
				currentDate,
				RecurrencePattern.DAILY,
				1,
			);

			expect(nextDate.getDate()).toBe(19);
			expect(nextDate.getMonth()).toBe(11); // December (0-indexed)
			expect(nextDate.getFullYear()).toBe(2025);
		});

		it('should calculate daily recurrence with interval > 1', () => {
			const currentDate = new Date('2025-12-18T10:00:00.000Z');
			// @ts-expect-error - accessing private method for testing
			const nextDate = service.calculateNextRecurrence(
				currentDate,
				RecurrencePattern.DAILY,
				3,
			);

			expect(nextDate.getDate()).toBe(21);
		});

		it('should calculate weekly recurrence correctly', () => {
			const currentDate = new Date('2025-12-18T10:00:00.000Z');
			// @ts-expect-error - accessing private method for testing
			const nextDate = service.calculateNextRecurrence(
				currentDate,
				RecurrencePattern.WEEKLY,
				1,
			);

			expect(nextDate.getDate()).toBe(25);
			expect(nextDate.getMonth()).toBe(11); // December
			expect(nextDate.getFullYear()).toBe(2025);
		});

		it('should calculate weekly recurrence with interval > 1', () => {
			const currentDate = new Date('2025-12-18T10:00:00.000Z');
			// @ts-expect-error - accessing private method for testing
			const nextDate = service.calculateNextRecurrence(
				currentDate,
				RecurrencePattern.WEEKLY,
				2,
			);

			expect(nextDate.getDate()).toBe(1);
			expect(nextDate.getMonth()).toBe(0); // January (next year)
			expect(nextDate.getFullYear()).toBe(2026);
		});

		it('should calculate monthly recurrence correctly', () => {
			const currentDate = new Date('2025-12-18T10:00:00.000Z');
			// @ts-expect-error - accessing private method for testing
			const nextDate = service.calculateNextRecurrence(
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
			// @ts-expect-error - accessing private method for testing
			const nextDate = service.calculateNextRecurrence(
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
			// @ts-expect-error - accessing private method for testing
			const nextDate = service.calculateNextRecurrence(
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
			// @ts-expect-error - accessing private method for testing
			const nextDate = service.calculateNextRecurrence(
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

			prisma.task.findMany.mockResolvedValue([mockRecurringTask] as any);
			prisma.task.create.mockResolvedValue(mockNewTask as any);
			prisma.taskToUser.createMany.mockResolvedValue({ count: 1 });
			prisma.task.update.mockResolvedValue(mockRecurringTask as any);
			notificationsService.create.mockResolvedValue({} as any);

			await service.handleRecurringTasks();

			expect(prisma.task.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						isRecurring: true,
						nextRecurrenceDate: {
							lte: expect.any(Date),
						},
					},
				}),
			);

			expect(prisma.task.create).toHaveBeenCalled();
			expect(prisma.task.update).toHaveBeenCalled();
		});

		it('should handle errors when creating recurring task instances', async () => {
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
				assigneeLinks: [],
			};

			prisma.task.findMany.mockResolvedValue([mockRecurringTask] as any);
			prisma.task.create.mockRejectedValue(
				new Error('Database error'),
			);

			// Should not throw, just log the error
			await expect(
				service.handleRecurringTasks(),
			).resolves.not.toThrow();
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

			prisma.task.findMany.mockResolvedValue([mockRecurringTask] as any);
			prisma.task.create.mockResolvedValue(mockNewTask as any);
			prisma.taskToUser.createMany.mockResolvedValue({ count: 2 });
			prisma.task.update.mockResolvedValue(mockRecurringTask as any);
			notificationsService.create.mockResolvedValue({} as any);

			await service.handleRecurringTasks();

			expect(notificationsService.create).toHaveBeenCalledWith({
				category: NotificationCategory.SCRUM,
				level: NotificationLevel.LOW,
				title: 'Recurring task: Daily Task',
				body: expect.stringContaining('Daily Task'),
				userIds: ['user-1', 'user-2'],
				actionUrl: '/activities',
				houseId: 'house-1',
			});
		});
	});
});
