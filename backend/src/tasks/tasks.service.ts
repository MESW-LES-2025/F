import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationCategory, NotificationLevel, Task } from '@prisma/client';
import { CreateTaskDto, TaskSize } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { calculateNextRecurrence } from './utils/recurrence.util';
import { PRISMA_TASK_INCLUDE } from './utils/task-selects';

import { TaskWithRelations } from './types/task-with-relations.type';

@Injectable()
export class TasksService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly notificationsService: NotificationsService,
	) {}

	async create(createTaskDto: CreateTaskDto, createdById: string) {
		const {
			title,
			description,
			assigneeId,
			deadline,
			houseId,
			assignedUserIds,
			size,
			isRecurring,
			recurrencePattern,
			recurrenceInterval,
		} = createTaskDto;

		await this.validateCreateContext(houseId, createdById);

		const assignees = assignedUserIds?.length
			? assignedUserIds
			: [assigneeId];

		await this.validateAssignees(assignees, houseId);

		const primaryAssignee = assignees[0];
		const deadlineDate = new Date(deadline);
		const nextRecurrenceDate =
			isRecurring && recurrencePattern && recurrenceInterval
				? calculateNextRecurrence(
						deadlineDate,
						recurrencePattern,
						recurrenceInterval,
					)
				: null;

		const task = await this.prisma.task.create({
			data: {
				title,
				description,
				assigneeId: primaryAssignee,
				deadline: deadlineDate,
				createdById,
				houseId,
				status: 'todo',
				size: size ?? TaskSize.MEDIUM,
				isRecurring: isRecurring ?? false,
				recurrencePattern: recurrencePattern ?? null,
				recurrenceInterval: recurrenceInterval ?? null,
				nextRecurrenceDate: nextRecurrenceDate,
				lastRecurrenceDate: isRecurring ? deadlineDate : null,
			},
			include: PRISMA_TASK_INCLUDE,
		});

		await this.persistTaskAssignees(task.id, assignees);
		await this.notifyTaskAssignment(task, assignees, createdById);

		return task;
	}

	private async validateCreateContext(houseId: string, createdById: string) {
		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});
		if (!house) throw new NotFoundException('House not found');

		const creatorInHouse = await this.prisma.houseToUser.findFirst({
			where: { userId: createdById, houseId },
		});
		if (!creatorInHouse)
			throw new ForbiddenException('You do not belong to this house');
	}

	private async validateAssignees(assigneeIds: string[], houseId: string) {
		for (const aid of assigneeIds) {
			const user = await this.prisma.user.findUnique({
				where: { id: aid },
			});
			if (!user) throw new NotFoundException('Assignee user not found');

			const inHouse = await this.prisma.houseToUser.findFirst({
				where: { userId: aid, houseId },
			});
			if (!inHouse) {
				throw new BadRequestException(
					'Cannot assign task to user not in this house',
				);
			}
		}
	}

	private async persistTaskAssignees(taskId: string, assignees: string[]) {
		if (!assignees?.length) return;
		try {
			await this.prisma.taskToUser.createMany({
				data: assignees.map((u) => ({ taskId, userId: u })),
				skipDuplicates: true,
			});
		} catch (err) {
			console.error(
				'[TasksService] Failed to persist task assignees',
				err,
			);
		}
	}

	private async notifyTaskAssignment(
		task: TaskWithRelations,
		assignees: string[],
		createdById: string,
	) {
		const notifyUserIds = (assignees || []).filter(
			(u) => u !== createdById,
		);
		if (!notifyUserIds.length) return;

		try {
			await this.notificationsService.create({
				category: NotificationCategory.SCRUM,
				level: NotificationLevel.LOW,
				title: `Task assigned: ${task.title}`,
				body: `You were assigned '${task.title}' in house ${task.house.name}. Deadline: ${task.deadline.toLocaleDateString()}`,
				userIds: notifyUserIds,
				actionUrl: '/activities',
				houseId: task.houseId,
			});
		} catch (err) {
			console.error(
				'[TasksService] Failed to create assignment notification',
				err,
			);
		}
	}

	async findAll() {
		const tasks = await this.prisma.task.findMany({
			include: PRISMA_TASK_INCLUDE,
			orderBy: { createdAt: 'desc' },
		});

		// Map join rows to assignedUsers convenience field
		type AssigneeLink = {
			user: {
				id: string;
				name: string;
				imageUrl?: string | null;
				username: string;
			};
		};
		return tasks.map((t) => ({
			...t,
			assignedUsers:
				(t.assigneeLinks as AssigneeLink[] | undefined)?.map(
					(l) => l.user,
				) ?? [],
		}));
	}

	async findOne(id: string) {
		const task = await this.prisma.task.findUnique({
			where: { id },
			include: PRISMA_TASK_INCLUDE,
		});

		if (!task) {
			throw new NotFoundException('Task not found');
		}
		type AssigneeLink = {
			user: {
				id: string;
				name: string;
				imageUrl?: string | null;
				username: string;
			};
		};
		return {
			...task,
			assignedUsers:
				(task.assigneeLinks as AssigneeLink[] | undefined)?.map(
					(l) => l.user,
				) ?? [],
		};
	}

	async findAllForUser(
		userId: string,
		filters?: {
			assigneeId?: string;
			status?: 'todo' | 'doing' | 'done';
			archived?: string;
		},
	) {
		// user's houses
		const memberships = await this.prisma.houseToUser.findMany({
			where: { userId },
			select: { houseId: true },
		});
		const houseIds = memberships.map((m) => m.houseId);

		if (houseIds.length === 0) {
			return [];
		}

		let archived: boolean | undefined;
		if (filters?.archived === 'true') {
			archived = true;
		} else if (filters?.archived === 'false') {
			archived = false;
		}

		const tasks = await this.prisma.task.findMany({
			where: {
				houseId: { in: houseIds },
				assigneeId: filters?.assigneeId || undefined,
				status: filters?.status ?? undefined,
				archived,
			},
			include: PRISMA_TASK_INCLUDE,
			orderBy: { createdAt: 'desc' },
		});

		type AssigneeLink = {
			user: {
				id: string;
				name: string;
				imageUrl?: string | null;
				username: string;
			};
		};
		return tasks.map((t) => ({
			...t,
			assignedUsers:
				(t.assigneeLinks as AssigneeLink[] | undefined)?.map(
					(l) => l.user,
				) ?? [],
		}));
	}

	async archive(id: string, userId: string) {
		const task = await this.findOne(id);
		// Permission: reuse update logic subset
		if (task.createdById !== userId && task.assigneeId !== userId) {
			// ensure user shares house
			const membership = await this.prisma.houseToUser.findFirst({
				where: { userId, houseId: task.houseId },
			});
			if (!membership) {
				throw new ForbiddenException(
					'You do not have permission to archive this task',
				);
			}
		}
		if (task.archived) {
			return task; // idempotent
		}
		if (task.status !== 'done') {
			throw new BadRequestException(
				'Only completed tasks can be archived',
			);
		}
		return this.prisma.task.update({
			where: { id },
			data: { archived: true, archivedAt: new Date() },
			include: PRISMA_TASK_INCLUDE,
		});
	}

	async unarchive(id: string, userId: string) {
		const task = await this.findOne(id);
		if (task.createdById !== userId && task.assigneeId !== userId) {
			const membership = await this.prisma.houseToUser.findFirst({
				where: { userId, houseId: task.houseId },
			});
			if (!membership) {
				throw new ForbiddenException(
					'You do not have permission to unarchive this task',
				);
			}
		}
		if (!task.archived) {
			return task; // idempotent
		}
		return this.prisma.task.update({
			where: { id },
			data: { archived: false, archivedAt: null },
			include: PRISMA_TASK_INCLUDE,
		});
	}

	async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
		const task = await this.findOne(id);
		await this.validateUpdatePermissions(task, userId);

		const assignedUserIds = updateTaskDto.assignedUserIds;

		if (assignedUserIds?.length) {
			await this.validateAssignees(assignedUserIds, task.houseId);
		}

		if (!assignedUserIds && updateTaskDto.assigneeId) {
			await this.validateAssignees(
				[updateTaskDto.assigneeId],
				task.houseId,
			);
		}

		type UpdateData = Omit<UpdateTaskDto, 'deadline'> & { deadline?: Date };
		const dataToUpdate: Partial<UpdateData> = {
			...updateTaskDto,
		} as Partial<UpdateData>;
		delete dataToUpdate.assignedUserIds;

		if (dataToUpdate.deadline) {
			dataToUpdate.deadline = new Date(dataToUpdate.deadline);
		} else if (dataToUpdate.deadline === undefined) {
			delete dataToUpdate.deadline;
		}

		if (assignedUserIds?.length) {
			dataToUpdate.assigneeId = assignedUserIds[0];
		}

		if (updateTaskDto.size !== undefined) {
			dataToUpdate.size = updateTaskDto.size;
		}

		const updatedTask = await this.prisma.task.update({
			where: { id },
			data: dataToUpdate,
			include: PRISMA_TASK_INCLUDE,
		});

		if (assignedUserIds?.length) {
			await this.updateTaskAssignees(id, assignedUserIds, updatedTask);
		}

		if (task.status !== 'done' && updatedTask.status === 'done') {
			await this.notifyTaskCompletion(updatedTask, userId);
		}

		return updatedTask;
	}

	private async validateUpdatePermissions(task: Task, userId: string) {
		if (task.createdById === userId || task.assigneeId === userId) return;

		const userHouses = await this.prisma.houseToUser.findMany({
			where: { userId },
			select: { houseId: true },
		});
		const userHouseIds = new Set(userHouses.map((h) => h.houseId));

		const creatorHouses = await this.prisma.houseToUser.findMany({
			where: { userId: task.createdById },
			select: { houseId: true },
		});
		const sharesWithCreator = creatorHouses.some((ch) =>
			userHouseIds.has(ch.houseId),
		);

		let sharesWithAssignee = false;
		if (task.assigneeId && task.assigneeId !== task.createdById) {
			const assigneeHouses = await this.prisma.houseToUser.findMany({
				where: { userId: task.assigneeId },
				select: { houseId: true },
			});
			sharesWithAssignee = assigneeHouses.some((ah) =>
				userHouseIds.has(ah.houseId),
			);
		}

		if (!sharesWithCreator && !sharesWithAssignee) {
			throw new ForbiddenException(
				'You do not have permission to update this task',
			);
		}
	}

	private async updateTaskAssignees(
		taskId: string,
		assignedUserIds: string[],
		updatedTask: TaskWithRelations,
	) {
		let previousAssigneeIds: string[] = [];
		try {
			// Get existing links to diff
			const existingLinks = await this.prisma.taskToUser.findMany({
				where: { taskId },
				select: { userId: true },
			});
			previousAssigneeIds = existingLinks.map((l) => l.userId);
		} catch {
			previousAssigneeIds = [];
		}

		// Re-create links
		try {
			await this.prisma.taskToUser.deleteMany({ where: { taskId } });
			await this.prisma.taskToUser.createMany({
				data: assignedUserIds.map((u) => ({ taskId, userId: u })),
				skipDuplicates: true,
			});
		} catch (err) {
			console.error(
				'[TasksService] Failed to update task assignees',
				err,
			);
		}

		// Notification for new assignees
		const prevSet = new Set(previousAssigneeIds);
		const addedAssigneeIds = assignedUserIds.filter(
			(uid) => !prevSet.has(uid),
		);
		if (addedAssigneeIds.length) {
			await this.createUpdateNotification(updatedTask, addedAssigneeIds);
		}
	}

	private async createUpdateNotification(
		updatedTask: TaskWithRelations,
		userIds: string[],
	) {
		try {
			await this.notificationsService.create({
				category: NotificationCategory.SCRUM,
				level: NotificationLevel.LOW,
				title: `Task updated: ${updatedTask.title}`,
				body: `You were assigned to '${updatedTask.title}' in house ${updatedTask.house.name}.`,
				userIds,
				actionUrl: '/activities',
				houseId: updatedTask.houseId,
			});
		} catch (err) {
			console.error(
				'[TasksService] Failed to create update assignment notification',
				err,
			);
		}
	}

	private async notifyTaskCompletion(
		updatedTask: TaskWithRelations,
		userId: string,
	) {
		try {
			const memberships = await this.prisma.houseToUser.findMany({
				where: { houseId: updatedTask.houseId },
				select: { userId: true },
			});
			const userIds = memberships.map((m) => m.userId);
			let actorUser = null;
			if (updatedTask.createdById === userId) {
				actorUser = updatedTask.createdBy;
			} else if (updatedTask.assigneeId === userId) {
				actorUser = updatedTask.assignee;
			}
			const actorName = actorUser?.name || 'A member';
			await this.notificationsService.create({
				category: NotificationCategory.SCRUM,
				level: NotificationLevel.MEDIUM,
				title: `Task completed: ${updatedTask.title}`,
				body: `${actorName} marked '${updatedTask.title}' as done in house ${updatedTask.house.name}.`,
				userIds,
				actionUrl: '/activities',
				houseId: updatedTask.houseId,
			});
		} catch (err) {
			console.error(
				'[TasksService] Failed to create completion notification',
				err,
			);
		}
	}

	async remove(id: string, userId: string) {
		const task = await this.findOne(id);

		// Only creator can delete
		if (task.createdById !== userId) {
			throw new ForbiddenException(
				'You do not have permission to delete this task',
			);
		}

		await this.prisma.task.delete({
			where: { id },
		});

		return { message: 'Task deleted successfully' };
	}

	async findByAssignee(assigneeId: string) {
		const tasks = await this.prisma.task.findMany({
			where: { assigneeId },
			include: PRISMA_TASK_INCLUDE,
			orderBy: { createdAt: 'desc' },
		});

		type AssigneeLink = {
			user: {
				id: string;
				name: string;
				imageUrl?: string | null;
				username: string;
			};
		};
		return tasks.map((t) => ({
			...t,
			assignedUsers:
				(t.assigneeLinks as AssigneeLink[] | undefined)?.map(
					(l) => l.user,
				) ?? [],
		}));
	}

	async findByHouse(houseId: string, archived?: string) {
		let archivedQuery = {};
		if (archived === 'true') {
			archivedQuery = { archived: true };
		} else if (archived === 'false') {
			archivedQuery = { archived: false };
		}

		const tasks = await this.prisma.task.findMany({
			where: {
				houseId,
				...archivedQuery,
			},
			include: PRISMA_TASK_INCLUDE,
			orderBy: { createdAt: 'desc' },
		});

		type AssigneeLink = {
			user: {
				id: string;
				name: string;
				imageUrl?: string | null;
				username: string;
			};
		};
		return tasks.map((t) => ({
			...t,
			assignedUsers:
				(t.assigneeLinks as AssigneeLink[] | undefined)?.map(
					(l) => l.user,
				) ?? [],
		}));
	}

	async findByStatus(status: string) {
		const tasks = await this.prisma.task.findMany({
			where: { status },
			include: PRISMA_TASK_INCLUDE,
			orderBy: { createdAt: 'desc' },
		});
		type AssigneeLink = {
			user: {
				id: string;
				name: string;
				imageUrl?: string | null;
				username: string;
			};
		};
		return tasks.map((t) => ({
			...t,
			assignedUsers:
				(t.assigneeLinks as AssigneeLink[] | undefined)?.map(
					(l) => l.user,
				) ?? [],
		}));
	}

	/**
	 * Stop a recurring task (sets isRecurring to false)
	 */
	async stopRecurrence(id: string, userId: string) {
		const task = await this.findOne(id);

		// Only creator can stop recurrence
		if (task.createdById !== userId) {
			throw new ForbiddenException(
				'You do not have permission to stop this recurring task',
			);
		}

		if (!task.isRecurring) {
			throw new BadRequestException('This task is not recurring');
		}

		const updatedTask = await this.prisma.task.update({
			where: { id },
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

		return {
			message: 'Recurring task stopped successfully',
			task: updatedTask,
		};
	}

	/**
	 * Get all instances of a recurring task
	 */
	async getRecurringTaskInstances(id: string, userId: string) {
		const task = await this.findOne(id);

		// Verify user has permission (shares house with task)
		const userInHouse = await this.prisma.houseToUser.findFirst({
			where: {
				userId,
				houseId: task.houseId,
			},
		});

		if (!userInHouse) {
			throw new ForbiddenException(
				'You do not have permission to view this task',
			);
		}

		if (!task.isRecurring) {
			throw new BadRequestException('This task is not a recurring task');
		}

		const instances = await this.prisma.task.findMany({
			where: {
				parentRecurringTaskId: id,
			},
			include: PRISMA_TASK_INCLUDE,
			orderBy: { deadline: 'desc' },
		});

		type AssigneeLink = {
			user: {
				id: string;
				name: string;
				imageUrl?: string | null;
				username: string;
			};
		};

		return {
			template: task,
			instances: instances.map((t) => ({
				...t,
				assignedUsers:
					(t.assigneeLinks as AssigneeLink[] | undefined)?.map(
						(l) => l.user,
					) ?? [],
			})),
		};
	}
}
