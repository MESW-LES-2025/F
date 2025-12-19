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
			include: {
				assignee: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
					},
				},
				createdBy: {
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
				assigneeLinks: {
					select: {
						userId: true,
					},
				},
			},
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
		const newDeadline = this.calculateNextRecurrence(
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

	/**
	 * Calculate the next recurrence date based on a given date, pattern, and interval
	 */
	private calculateNextRecurrence(
		currentDate: Date,
		pattern: RecurrencePattern,
		interval: number,
	): Date {
		const nextDate = new Date(currentDate);

		switch (pattern) {
			case RecurrencePattern.DAILY:
				nextDate.setDate(nextDate.getDate() + interval);
				break;
			case RecurrencePattern.WEEKLY:
				nextDate.setDate(nextDate.getDate() + interval * 7);
				break;
			case RecurrencePattern.MONTHLY: {
				// Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
				const currentDay = nextDate.getDate();
				nextDate.setMonth(nextDate.getMonth() + interval);
				// If the day changed (e.g., from 31 to 1-3), set to last day of previous month
				if (nextDate.getDate() !== currentDay) {
					nextDate.setDate(0); // Sets to last day of previous month
				}
				break;
			}
			default:
				nextDate.setDate(nextDate.getDate() + interval);
				break;
		}

		return nextDate;
	}
}
