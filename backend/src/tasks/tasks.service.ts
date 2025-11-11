import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
	constructor(private prisma: PrismaService) {}

	/**
	 * Helper method to get houses shared by two users
	 */
	private async getSharedHouses(
		userId1: string,
		userId2: string,
	): Promise<string[]> {
		const user1Houses = await this.prisma.houseToUser.findMany({
			where: { userId: userId1 },
			select: { houseId: true },
		});

		const user2Houses = await this.prisma.houseToUser.findMany({
			where: { userId: userId2 },
			select: { houseId: true },
		});

		const user1HouseIds = user1Houses.map((h) => h.houseId);
		const user2HouseIds = user2Houses.map((h) => h.houseId);

		// Find intersection of house IDs
		return user1HouseIds.filter((houseId) =>
			user2HouseIds.includes(houseId),
		);
	}

	/**
	 * Validate that two users belong to the same house
	 */
	private async validateSameHouse(
		userId1: string,
		userId2: string,
	): Promise<void> {
		const sharedHouses = await this.getSharedHouses(userId1, userId2);

		if (sharedHouses.length === 0) {
			throw new BadRequestException(
				'Cannot assign task to user from different house. Users must belong to the same house.',
			);
		}
	}

	async create(createTaskDto: CreateTaskDto, createdById: string) {
		const { title, description, assigneeId, deadline } = createTaskDto;

		// Verify assignee exists
		const assignee = await this.prisma.user.findUnique({
			where: { id: assigneeId },
		});

		if (!assignee) {
			throw new NotFoundException('Assignee user not found');
		}

		// Validate that creator and assignee belong to the same house
		await this.validateSameHouse(createdById, assigneeId);

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

		// If updating assignee, verify new assignee exists and is in the same house
		if (updateTaskDto.assigneeId) {
			const assignee = await this.prisma.user.findUnique({
				where: { id: updateTaskDto.assigneeId },
			});

			if (!assignee) {
				throw new NotFoundException('Assignee user not found');
			}

			// Validate that the user updating the task and the new assignee belong to the same house
			await this.validateSameHouse(userId, updateTaskDto.assigneeId);
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
