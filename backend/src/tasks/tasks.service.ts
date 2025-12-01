import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationCategory, NotificationLevel } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
	constructor(
		private prisma: PrismaService,
		private notificationsService: NotificationsService,
	) {}

	async create(createTaskDto: CreateTaskDto, createdById: string) {
		const { title, description, assigneeId, deadline, houseId, assignedUserIds, size } =
			createTaskDto as CreateTaskDto & { assignedUserIds?: string[]; size?: string };

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


		const assignees = assignedUserIds && assignedUserIds.length ? assignedUserIds : [assigneeId];

		// Validate each assignee exists and is in the house
		for (const aid of assignees) {
			const user = await this.prisma.user.findUnique({ where: { id: aid } });
			if (!user) {
				throw new NotFoundException('Assignee user not found');
			}

			const inHouse = await this.prisma.houseToUser.findFirst({
				where: { userId: aid, houseId },
			});
			if (!inHouse) {
				throw new BadRequestException('Cannot assign task to user not in this house');
			}
		}

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
				size: size || 'MEDIUM',
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

		if (assignees && assignees.length) {
			try {
				await this.prisma.taskToUser.createMany({
					data: assignees.map((u) => ({ taskId: task.id, userId: u })),
					skipDuplicates: true,
				});
			} catch (err) {
				console.error('[TasksService] Failed to persist task assignees', err);
			}
		}


		const notifyUserIds = (assignees || []).filter((u) => u !== createdById);
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
				console.error('[TasksService] Failed to create assignment notification', err);
			}
		}

		return task;
	}

	async findAll() {
		return this.prisma.task.findMany({
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
			orderBy: {
				createdAt: 'desc',
			},
		});
	}

	async findOne(id: string) {
		const task = await this.prisma.task.findUnique({
			where: { id },
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

		if (!task) {
			throw new NotFoundException('Task not found');
		}
		return task;
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

		return this.prisma.task.findMany({
			where: {
				houseId: { in: houseIds },
				assigneeId: filters?.assigneeId || undefined,
				status: filters?.status ?? undefined,
				archived:
					filters?.archived === 'true'
						? true
						: filters?.archived === 'false'
							? false
							: undefined,
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
				house: { select: { id: true, name: true } },
			},
			orderBy: { createdAt: 'desc' },
		});
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

		// Verify user has permission (creator, assignee), or shares a house with creator/assignee
		if (task.createdById !== userId && task.assigneeId !== userId) {
			// get house memberships for acting user
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

		const assignedUserIds = (updateTaskDto as any).assignedUserIds as
			| string[]
			| undefined;

		if (assignedUserIds && assignedUserIds.length) {
			for (const aid of assignedUserIds) {
				const assignee = await this.prisma.user.findUnique({ where: { id: aid } });
				if (!assignee) {
					throw new NotFoundException('Assignee user not found');
				}

				const assigneeInHouse = await this.prisma.houseToUser.findFirst({
					where: {
						userId: aid,
						houseId: task.houseId,
					},
				});

				if (!assigneeInHouse) {
					throw new BadRequestException('Cannot assign task to user not in this house');
				}
			}
		}

		if (!assignedUserIds && updateTaskDto.assigneeId) {
			const assignee = await this.prisma.user.findUnique({
				where: { id: updateTaskDto.assigneeId },
			});

			if (!assignee) {
				throw new NotFoundException('Assignee user not found');
			}

			// Verify the new assignee belongs to the task's house
			const assigneeInHouse = await this.prisma.houseToUser.findFirst({
				where: {
					userId: updateTaskDto.assigneeId,
					houseId: task.houseId,
				},
			});

			if (!assigneeInHouse) {
				throw new BadRequestException(
					'Cannot assign task to user not in this house',
				);
			}
		}

		const dataToUpdate: any = { ...updateTaskDto };
		delete dataToUpdate.assignedUserIds;
		if (dataToUpdate.deadline) {
			dataToUpdate.deadline = new Date(dataToUpdate.deadline);
		} else if (dataToUpdate.deadline === undefined) {
			// leave undefined so Prisma won't change it
			delete dataToUpdate.deadline;
		}

		if (assignedUserIds && assignedUserIds.length) {
			dataToUpdate.assigneeId = assignedUserIds[0];
		}

		if ((updateTaskDto as any).size !== undefined) {
			dataToUpdate.size = (updateTaskDto as any).size;
		}

		const updatedTask = await this.prisma.task.update({
			where: { id },
			data: dataToUpdate,
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

		if (assignedUserIds && assignedUserIds.length) {
			try {
				await this.prisma.taskToUser.deleteMany({ where: { taskId: id } });
				await this.prisma.taskToUser.createMany({
					data: assignedUserIds.map((u) => ({ taskId: id, userId: u })),
					skipDuplicates: true,
				});
			} catch (err) {
				console.error('[TasksService] Failed to update task assignees', err);
			}
		}

		if (task.status !== 'done' && updatedTask.status === 'done') {
			try {
				const memberships = await this.prisma.houseToUser.findMany({
					where: { houseId: updatedTask.houseId },
					select: { userId: true },
				});
				const userIds = memberships.map((m) => m.userId);
				const actorUser =
					updatedTask.createdById === userId
						? updatedTask.createdBy
						: updatedTask.assigneeId === userId
							? updatedTask.assignee
							: null;
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
		return this.prisma.task.findMany({
			where: { assigneeId },
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
			orderBy: {
				createdAt: 'desc',
			},
		});
	}

	async findByHouse(houseId: string, archived?: string) {
		const tasks = await this.prisma.task.findMany({
			where: {
				houseId,
				...(archived === 'true'
					? { archived: true }
					: archived === 'false'
						? { archived: false }
						: {}),
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
			orderBy: {
				createdAt: 'desc',
			},
		});
		return tasks;
	}

	async findByStatus(status: string) {
		return this.prisma.task.findMany({
			where: { status },
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
			orderBy: {
				createdAt: 'desc',
			},
		});
	}
}
