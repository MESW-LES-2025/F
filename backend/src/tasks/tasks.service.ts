import {
	Injectable,
	NotFoundException,
	ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
	constructor(private prisma: PrismaService) {}

	async create(createTaskDto: CreateTaskDto, createdById: string) {
		const { title, description, assigneeId, deadline } = createTaskDto;

		// Verify assignee exists
		const assignee = await this.prisma.user.findUnique({
			where: { id: assigneeId },
		});

		if (!assignee) {
			throw new NotFoundException('Assignee user not found');
		}

		const task = await this.prisma.task.create({
			data: {
				title,
				description,
				assigneeId,
				deadline: new Date(deadline),
				createdById,
				status: 'todo',
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
			},
		});

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
			},
		});

		if (!task) {
			throw new NotFoundException('Task not found');
		}

		return task;
	}

	async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
		const task = await this.findOne(id);

		// Verify user has permission (either creator or assignee)
		if (task.createdById !== userId && task.assigneeId !== userId) {
			throw new ForbiddenException(
				'You do not have permission to update this task',
			);
		}

		// If updating assignee, verify new assignee exists
		if (updateTaskDto.assigneeId) {
			const assignee = await this.prisma.user.findUnique({
				where: { id: updateTaskDto.assigneeId },
			});

			if (!assignee) {
				throw new NotFoundException('Assignee user not found');
			}
		}

		const updatedTask = await this.prisma.task.update({
			where: { id },
			data: {
				...updateTaskDto,
				deadline: updateTaskDto.deadline
					? new Date(updateTaskDto.deadline)
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
			},
		});

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
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
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
			},
			orderBy: {
				createdAt: 'desc',
			},
		});
	}
}
