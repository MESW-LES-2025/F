import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationCategory, NotificationLevel, Task } from '@prisma/client';

interface TaskWithRelations extends Task {
	house: { id: string; name: string };
	assignee?: {
		id: string;
		name: string | null;
		email: string;
		username: string;
		imageUrl: string | null;
	} | null;
	createdBy: {
		id: string;
		name: string | null;
		email: string;
		username: string;
		imageUrl: string | null;
	};
	assigneeLinks: {
		user: {
			id: string;
			name: string | null;
			imageUrl: string | null;
			username: string;
		};
	}[];
}
import { CreateTaskDto, TaskSize } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly notificationsService: NotificationsService,
	) {}

	private readonly taskInclude = {
		assignee: {
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				imageUrl: true,
			},
		},
		createdBy: {
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				imageUrl: true,
			},
		},
		house: { select: { id: true, name: true } },
		assigneeLinks: {
			include: {
				user: {
					select: {
						id: true,
						name: true,
						imageUrl: true,
						username: true,
					},
				},
			},
		},
	};

	private mapTask(task: TaskWithRelations) {
		return {
			...task,
			assignedUsers: task.assigneeLinks?.map((l) => l.user) ?? [],
		};
	}

	async create(createTaskDto: CreateTaskDto, createdById: string) {
		const {
			title,
			description,
			assigneeId,
			deadline,
			houseId,
			assignedUserIds,
			size,
		} = createTaskDto;

		// Verify house exists
		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});

		if (!house) {
			throw new NotFoundException('House not found');
		}

		// Verify creator belongs to the house
		const creatorInHouse = await this.prisma.houseToUser.findFirst({
			where: {
				userId: createdById,
				houseId: houseId,
			},
		});

		if (!creatorInHouse) {
			throw new ForbiddenException('You do not belong to this house');
		}

		const assignees = assignedUserIds?.length
			? assignedUserIds
			: [assigneeId];

		await this.validateAssignees(assignees, houseId);

		const primaryAssignee = assignees[0];

		const task = await this.prisma.task.create({
			data: {
				title,
				description,
				assigneeId: primaryAssignee,
				deadline: new Date(deadline),
				createdById,
				houseId,
				status: 'todo',
				size: size ?? TaskSize.MEDIUM,
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
			},
		});

		if (assignees?.length) {
			try {
				await this.prisma.taskToUser.createMany({
					data: assignees.map((u) => ({
						taskId: task.id,
						userId: u,
					})),
					skipDuplicates: true,
				});
			} catch (err) {
				console.error(
					'[TasksService] Failed to persist task assignees',
					err,
				);
			}
		}

		const notifyUserIds = (assignees || []).filter(
			(u) => u !== createdById,
		);
		if (notifyUserIds.length) {
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

		return task;
	}

	async findAll() {
		const tasks = await this.prisma.task.findMany({
			include: this.taskInclude,
			orderBy: { createdAt: 'desc' },
		});

		return tasks.map((t) => this.mapTask(t));
	}

	async findOne(id: string) {
		const task = await this.prisma.task.findUnique({
			where: { id },
			include: this.taskInclude,
		});

		if (!task) {
			throw new NotFoundException('Task not found');
		}
		return this.mapTask(task);
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
		if (filters?.archived === 'true') archived = true;
		else if (filters?.archived === 'false') archived = false;

		const tasks = await this.prisma.task.findMany({
			where: {
				houseId: { in: houseIds },
				assigneeId: filters?.assigneeId || undefined,
				status: filters?.status ?? undefined,
				archived,
			},
			include: {
				assignee: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
						imageUrl: true,
					},
				},
				createdBy: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
						imageUrl: true,
					},
				},
				house: { select: { id: true, name: true } },
				assigneeLinks: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								imageUrl: true,
								username: true,
							},
						},
					},
				},
			},
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
				house: { select: { id: true, name: true } },
			},
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
				house: { select: { id: true, name: true } },
			},
		});
	}

	async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
		const task = await this.findOne(id);

		await this.checkUpdatePermissions(task, userId);

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
			// leave undefined so Prisma won't change it
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
			include: this.taskInclude,
		});

		if (assignedUserIds?.length) {
			await this.updateTaskAssignees(id, assignedUserIds, updatedTask);
		}

		await this.notifyCompletion(task, updatedTask, userId);

		return updatedTask;
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
			include: this.taskInclude,
			orderBy: { createdAt: 'desc' },
		});

		return tasks.map((t) => this.mapTask(t));
	}

	async findByHouse(houseId: string, archived?: string) {
		let archivedFilter: boolean | undefined;
		if (archived === 'true') archivedFilter = true;
		else if (archived === 'false') archivedFilter = false;

		const tasks = await this.prisma.task.findMany({
			where: {
				houseId,
				...(archivedFilter !== undefined && {
					archived: archivedFilter,
				}),
			},
			include: this.taskInclude,
			orderBy: { createdAt: 'desc' },
		});
		return tasks.map((t) => this.mapTask(t));
	}

	async findByStatus(status: string) {
		const tasks = await this.prisma.task.findMany({
			where: { status },
			include: this.taskInclude,
			orderBy: { createdAt: 'desc' },
		});
		return tasks.map((t) => this.mapTask(t));
	}

	private async validateAssignees(
		assignees: string[],
		houseId: string,
	): Promise<void> {
		for (const aid of assignees) {
			const user = await this.prisma.user.findUnique({
				where: { id: aid },
			});
			if (!user) {
				throw new NotFoundException('Assignee user not found');
			}

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

	private async checkUpdatePermissions(
		task: { createdById: string; assigneeId: string | null },
		userId: string,
	) {
		if (task.createdById !== userId && task.assigneeId !== userId) {
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
	}

	private async updateTaskAssignees(
		id: string,
		assignedUserIds: string[],
		updatedTask: TaskWithRelations,
	) {
		let previousAssigneeIds: string[] = [];
		try {
			const existingLinks = await this.prisma.taskToUser.findMany({
				where: { taskId: id },
				select: { userId: true },
			});
			previousAssigneeIds = existingLinks.map((l) => l.userId);
		} catch {
			previousAssigneeIds = [];
		}

		const prevSet = new Set(previousAssigneeIds);
		const addedAssigneeIds = assignedUserIds.filter(
			(uid) => !prevSet.has(uid),
		);

		try {
			await this.prisma.taskToUser.deleteMany({
				where: { taskId: id },
			});
			await this.prisma.taskToUser.createMany({
				data: assignedUserIds.map((u) => ({
					taskId: id,
					userId: u,
				})),
				skipDuplicates: true,
			});
		} catch (err) {
			console.error(
				'[TasksService] Failed to update task assignees',
				err,
			);
		}

		if (addedAssigneeIds.length) {
			try {
				await this.notificationsService.create({
					category: NotificationCategory.SCRUM,
					level: NotificationLevel.LOW,
					title: `Task updated: ${updatedTask.title}`,
					body: `You were assigned to '${updatedTask.title}' in house ${updatedTask.house.name}.`,
					userIds: addedAssigneeIds,
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
	}

	private async notifyCompletion(
		task: { status: string },
		updatedTask: TaskWithRelations,
		userId: string,
	) {
		if (task.status !== 'done' && updatedTask.status === 'done') {
			try {
				const memberships = await this.prisma.houseToUser.findMany({
					where: { houseId: updatedTask.houseId },
					select: { userId: true },
				});
				const userIds = memberships.map((m) => m.userId);
				let actorUser;
				if (updatedTask.createdById === userId) {
					actorUser = updatedTask.createdBy;
				} else if (updatedTask.assigneeId === userId) {
					actorUser = updatedTask.assignee;
				} else {
					actorUser = null;
				}
				const actorName = actorUser?.name || 'A member';
				await this.notificationsService.create({
					category: NotificationCategory.SCRUM,
					level: NotificationLevel.MEDIUM,
					title: `Task completed: ${updatedTask.title}`,
					body: `${actorName} marked '${updatedTask.title}' as done in house ${updatedTask.house.name}.`,
					userIds,
					houseId: updatedTask.houseId,
					actionUrl: '/activities',
				});
			} catch (err) {
				console.error(
					'[TasksService] Failed to create completion notification',
					err,
				);
			}
		}
	}
}
