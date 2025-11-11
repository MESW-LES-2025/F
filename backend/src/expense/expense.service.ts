import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpenseService {
	constructor(private prisma: PrismaService) {}

	async create(createExpenseDto: CreateExpenseDto) {
		const {
			amount,
			description,
			category,
			paidById,
			houseId,
			splitWith,
			date,
		} = createExpenseDto;

		// Verify payer exists and is not soft-deleted
		const payer = await this.prisma.user.findUnique({
			where: {
				id: paidById,
			},
		});

		if (!payer || payer.deletedAt !== null) {
			throw new NotFoundException('Payer user not found or is deleted');
		}

		// Verify house exists
		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});

		if (!house) {
			throw new NotFoundException('House not found');
		}

		// Verify all users in splitWith exist and are not soft-deleted
		const usersToSplit = await this.prisma.user.findMany({
			where: {
				id: { in: splitWith },
			},
		});

		// Filter out deleted users
		const activeUsers = usersToSplit.filter((u) => u.deletedAt === null);

		if (activeUsers.length !== splitWith.length) {
			throw new BadRequestException(
				'One or more users in splitWith do not exist or are deleted',
			);
		}

		// Verify all users are members of the house
		const houseMembers = await this.prisma.houseToUser.findMany({
			where: {
				houseId,
				userId: { in: [...splitWith, paidById] },
			},
		});

		const memberIds = houseMembers.map((hm) => hm.userId);
		const allUsersAreMemberss = [...splitWith, paidById].every((userId) =>
			memberIds.includes(userId),
		);

		if (!allUsersAreMemberss) {
			throw new BadRequestException(
				'Payer or one or more users in splitWith are not members of this house',
			);
		}

		// Create the expense
		const expense = await this.prisma.expense.create({
			data: {
				amount,
				description,
				category,
				paidById,
				houseId,
				splitWith,
				date: date ? new Date(date) : new Date(),
			},
			include: {
				paidBy: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
						imageUrl: true,
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

		return expense;
	}

	async findAll() {
		return this.prisma.expense.findMany({
			include: {
				paidBy: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
						imageUrl: true,
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
				date: 'desc',
			},
		});
	}

	async findOne(id: string) {
		const expense = await this.prisma.expense.findUnique({
			where: { id },
			include: {
				paidBy: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
						imageUrl: true,
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

		if (!expense) {
			throw new NotFoundException(`Expense with ID ${id} not found`);
		}

		return expense;
	}

	async findByHouse(houseId: string) {
		// Verify house exists
		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});

		if (!house) {
			throw new NotFoundException('House not found');
		}

		return this.prisma.expense.findMany({
			where: { houseId },
			include: {
				paidBy: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
						imageUrl: true,
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
				date: 'desc',
			},
		});
	}

	async update(id: string, updateExpenseDto: UpdateExpenseDto) {
		// Check if expense exists
		const existingExpense = await this.prisma.expense.findUnique({
			where: { id },
		});

		if (!existingExpense) {
			throw new NotFoundException(`Expense with ID ${id} not found`);
		}

		// If updating paidById, verify user exists
		if (updateExpenseDto.paidById) {
			const payer = await this.prisma.user.findUnique({
				where: {
					id: updateExpenseDto.paidById,
				},
			});

			if (!payer || payer.deletedAt !== null) {
				throw new NotFoundException(
					'Payer user not found or is deleted',
				);
			}
		}

		// If updating houseId, verify house exists
		if (updateExpenseDto.houseId) {
			const house = await this.prisma.house.findUnique({
				where: { id: updateExpenseDto.houseId },
			});

			if (!house) {
				throw new NotFoundException('House not found');
			}
		}

		// If updating splitWith, verify all users exist
		if (updateExpenseDto.splitWith) {
			const usersToSplit = await this.prisma.user.findMany({
				where: {
					id: { in: updateExpenseDto.splitWith },
				},
			});

			// Filter out deleted users
			const activeUsers = usersToSplit.filter(
				(u) => u.deletedAt === null,
			);

			if (activeUsers.length !== updateExpenseDto.splitWith.length) {
				throw new BadRequestException(
					'One or more users in splitWith do not exist or are deleted',
				);
			}
		}

		// Cast incoming DTO to a known partial type so we avoid `any` usage
		const dto = updateExpenseDto as Partial<CreateExpenseDto>;
		// Use a safe, loosely-typed container for the update payload that avoids `any`
		const updateData: Partial<Record<string, unknown>> = { ...dto };
		if (dto.date) {
			updateData.date = new Date(dto.date);
		}

		const expense = await this.prisma.expense.update({
			where: { id },
			data: updateData,
			include: {
				paidBy: {
					select: {
						id: true,
						name: true,
						email: true,
						username: true,
						imageUrl: true,
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

		return expense;
	}

	async remove(id: string) {
		// Check if expense exists
		const expense = await this.prisma.expense.findUnique({
			where: { id },
		});

		if (!expense) {
			throw new NotFoundException(`Expense with ID ${id} not found`);
		}

		await this.prisma.expense.delete({
			where: { id },
		});

		return {
			message: `Expense with ID ${id} deleted successfully`,
			id,
		};
	}
}
