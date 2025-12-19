import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
	NotificationCategory,
	NotificationLevel,
	RecurrencePattern,
	Task,
} from '@prisma/client';
import { calculateNextRecurrence } from './utils/recurrence.util'; // Updated path
import { PRISMA_TASK_INCLUDE } from './utils/task-selects'; // Updated path

interface RecurringTaskWithRelations extends Task {
	assignee: {
		id: string;
		name: string | null;
		email: string;
		username: string | null;
	};
	createdBy: {
		id: string;
		name: string | null;
		email: string;
		username: string | null;
	};
	house: {
		id: string;
		name: string;
	};
	assigneeLinks: {
		userId: string;
	}[];
}

@Injectable()
export class TaskRecurrenceService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly notificationsService: NotificationsService,
	) {}

	/**
	 * Runs daily at midnight to check for recurring tasks and create new instances
	 */
	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async handleRecurringTasks() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Find all recurring tasks where nextRecurrenceDate is today or earlier
		const recurringTasks = await this.prisma.task.findMany({
			where: {
				isRecurring: true,
				nextRecurrenceDate: {
					lte: today,
				},
			},
			include: PRISMA_TASK_INCLUDE,
		});
		for (const task of recurringTasks) {
			try {
				await this.createRecurringTaskInstance(task);
			} catch {
				// Continue processing other tasks if one fails
			}
		}
	}

	/**
	 * Creates a new instance of a recurring task
	 */
	private async createRecurringTaskInstance(
		task: RecurringTaskWithRelations,
	) {
		// Ensure nextRecurrenceDate exists
		if (!task.nextRecurrenceDate) {
			console.error(
				`[TaskRecurrenceService] Task ${task.id} has no nextRecurrenceDate`,
			);
			return;
		}

		// Calculate the new deadline based on the recurrence pattern
		const newDeadline = calculateNextRecurrence(
			task.nextRecurrenceDate,
			task.recurrencePattern as RecurrencePattern,
			task.recurrenceInterval as number,
		);

		// Create the new task instance
		const newTask = await this.prisma.task.create({
			data: {
				title: task.title,
				description: task.description,
				assigneeId: task.assigneeId,
				deadline: task.nextRecurrenceDate,
				createdById: task.createdById,
				houseId: task.houseId,
				status: 'todo',
				size: task.size,
				isRecurring: false, // Instances are not recurring themselves
				parentRecurringTaskId: task.id, // Link to the template
				archived: false,
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

		// Recreate assignee links for the new task instance
		if (task.assigneeLinks && task.assigneeLinks.length > 0) {
			await this.prisma.taskToUser.createMany({
				data: task.assigneeLinks.map((link: { userId: string }) => ({
					taskId: newTask.id,
					userId: link.userId,
				})),
				skipDuplicates: true,
			});
		}

		// Update the recurring task template with new recurrence dates
		await this.prisma.task.update({
			where: { id: task.id },
			data: {
				lastRecurrenceDate: task.nextRecurrenceDate,
				nextRecurrenceDate: newDeadline,
			},
		});

		// Notify assignees about the new recurring task
		const assigneeIds = task.assigneeLinks?.map(
			(link: { userId: string }) => link.userId,
		) || [task.assigneeId];
		const notifyUserIds = assigneeIds.filter(
			(id: string) => id !== task.createdById,
		);

		if (notifyUserIds.length > 0) {
			try {
				await this.notificationsService.create({
					category: NotificationCategory.SCRUM,
					level: NotificationLevel.LOW,
					title: `Recurring task: ${newTask.title}`,
					body: `A recurring task '${newTask.title}' has been created in house ${task.house.name}. Deadline: ${newTask.deadline.toLocaleDateString()}`,
					userIds: notifyUserIds,
					actionUrl: '/activities',
					houseId: newTask.houseId,
				});
			} catch {
				/* Notification failure should not prevent task creation */
			}
		}
	}
}
