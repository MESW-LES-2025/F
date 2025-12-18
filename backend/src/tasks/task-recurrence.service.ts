import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
	NotificationCategory,
	NotificationLevel,
	RecurrencePattern,
} from '@prisma/client';

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
		console.log('[TaskRecurrenceService] Starting recurring tasks check...');
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

		console.log(
			`[TaskRecurrenceService] Found ${recurringTasks.length} recurring tasks to process`,
		);

		for (const task of recurringTasks) {
			try {
				await this.createRecurringTaskInstance(task);
			} catch (err) {
				console.error(
					`[TaskRecurrenceService] Failed to create recurring instance for task ${task.id}:`,
					err,
				);
			}
		}

		console.log('[TaskRecurrenceService] Recurring tasks check completed');
	}

	/**
	 * Creates a new instance of a recurring task
	 */
	private async createRecurringTaskInstance(task: any) {
		// Calculate the new deadline based on the recurrence pattern
		const newDeadline = this.calculateNextRecurrence(
			task.nextRecurrenceDate,
			task.recurrencePattern,
			task.recurrenceInterval,
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
		const assigneeIds =
			task.assigneeLinks?.map((link: { userId: string }) => link.userId) ||
			[task.assigneeId];
		const notifyUserIds = assigneeIds.filter(
			(id: string) => id !== task.createdById,
		);

		if (notifyUserIds.length > 0) {
			try {
				await this.notificationsService.create({
					category: NotificationCategory.SCRUM,
					level: NotificationLevel.LOW,
					title: `Recurring task: ${newTask.title}`,
					body: `A recurring task '${newTask.title}' has been created in house ${newTask.house.name}. Deadline: ${newTask.deadline.toLocaleDateString()}`,
					userIds: notifyUserIds,
					actionUrl: '/activities',
					houseId: newTask.houseId,
				});
			} catch (err) {
				console.error(
					'[TaskRecurrenceService] Failed to send notification for recurring task',
					err,
				);
			}
		}

		console.log(
			`[TaskRecurrenceService] Created recurring task instance: ${newTask.id} from template ${task.id}`,
		);
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
			case RecurrencePattern.MONTHLY:
				// Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
				const currentDay = nextDate.getDate();
				nextDate.setMonth(nextDate.getMonth() + interval);
				// If the day changed (e.g., from 31 to 1-3), set to last day of previous month
				if (nextDate.getDate() !== currentDay) {
					nextDate.setDate(0); // Sets to last day of previous month
				}
				break;
			default:
				console.error(
					`[TaskRecurrenceService] Invalid recurrence pattern: ${pattern}`,
				);
				// Fallback: add interval days
				nextDate.setDate(nextDate.getDate() + interval);
				break;
		}

		return nextDate;
	}
}
