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
	constructor(private readonly prisma: PrismaService) {}

	async create(createExpenseDto: CreateExpenseDto): Promise<unknown> {
		const {
			amount,
			description,
			category,
			paidById,
			houseId,
			splitWith,
			date,
			splits,
		} = createExpenseDto;

		// Verify payer exists and is not soft-deleted
		await this.validatePayer(paidById);

		// Verify house exists
		await this.validateHouse(houseId);

		// Verify all users in splitWith exist and are not soft-deleted
		await this.validateSplitUsers(splitWith);

		// Verify all users are members of the house
		await this.validateHouseMembers(houseId, [...splitWith, paidById]);

		// Validate splits if provided or default to equal split
		const expenseSplits = this.calculateAndValidateSplits(
			splitWith,
			splits,
		);

		// Create the expense with splits
		const expense = await this.prisma.expense.create({
			data: {
				amount,
				description,
				category,
				paidById,
				houseId,
				splitWith,
				date: date ? new Date(date) : new Date(),
				splits: {
					create: expenseSplits,
				},
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
				splits: true,
			},
		});

		return expense;
	}

	findAll() {
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
				splits: true,
			},
			orderBy: {
				date: 'desc',
			},
		});
	}

	async findOne(id: string): Promise<unknown> {
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
				splits: true,
			},
		});

		if (!expense) {
			throw new NotFoundException(`Expense with ID ${id} not found`);
		}

		return expense;
	}

	async findByHouse(houseId: string): Promise<unknown> {
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
				splits: true,
			},
			orderBy: {
				date: 'desc',
			},
		});
	}

	async update(
		id: string,
		updateExpenseDto: UpdateExpenseDto,
	): Promise<unknown> {
		// Check if expense exists
		const existingExpense = await this.prisma.expense.findUnique({
			where: { id },
		});

		if (!existingExpense) {
			throw new NotFoundException(`Expense with ID ${id} not found`);
		}

		// If updating paidById, verify user exists
		if (updateExpenseDto.paidById) {
			await this.validatePayer(updateExpenseDto.paidById);
		}

		// If updating houseId, verify house exists
		if (updateExpenseDto.houseId) {
			await this.validateHouse(updateExpenseDto.houseId);
		}

		// If updating splitWith, verify all users exist
		if (updateExpenseDto.splitWith) {
			await this.validateSplitUsers(updateExpenseDto.splitWith);
		}

		// Validate splits if provided
		const splitWith =
			updateExpenseDto.splitWith || existingExpense.splitWith;
		let expenseSplits: { userId: string; percentage: number }[] | undefined;

		if (updateExpenseDto.splits && updateExpenseDto.splits.length > 0) {
			expenseSplits = this.calculateAndValidateSplits(
				splitWith,
				updateExpenseDto.splits,
			);
		} else if (updateExpenseDto.splitWith) {
			// If splitWith changed but no splits provided, recalculate equal split
			expenseSplits = this.calculateAndValidateSplits(splitWith);
		}

		// Cast incoming DTO to a known partial type so we avoid `any` usage
		const dto = updateExpenseDto as Partial<CreateExpenseDto>;
		// Use a safe, loosely-typed container for the update payload that avoids `any`
		const updateData: Partial<Record<string, unknown>> = { ...dto };
		if (dto.date) {
			updateData.date = new Date(dto.date);
		}
		// Remove splits from the main update data as we'll handle it separately
		delete updateData.splits;

		// Update expense with splits
		const expense = await this.prisma.expense.update({
			where: { id },
			data: {
				...updateData,
				...(expenseSplits && {
					splits: {
						deleteMany: {},
						create: expenseSplits,
					},
				}),
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
				splits: true,
			},
		});

		return expense;
	}

	async remove(id: string): Promise<{ message: string; id: string }> {
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

	async getSummary(houseId: string): Promise<{
		totalSpending: number;
		perPersonTotals: Array<{
			userId: string;
			userName: string;
			userImageUrl: string | null;
			totalPaid: number;
			totalOwed: number;
			balance: number;
		}>;
		expenseCount: number;
		categoryBreakdown: Array<{
			category: string;
			total: number;
			percentage: number;
		}>;
	}> {
		// Verify house exists
		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});

		if (!house) {
			throw new NotFoundException('House not found');
		}

		// Get all expenses for the house
		const expenses = await this.prisma.expense.findMany({
			where: { houseId },
			include: {
				paidBy: {
					select: {
						id: true,
						name: true,
						imageUrl: true,
					},
				},
				splits: true,
			},
		});

		// Calculate total spending (excluding settlements)
		const totalSpending = expenses
			.filter((expense) => expense.category !== 'SETTLEMENT')
			.reduce((sum, expense) => sum + expense.amount, 0);

		// Get all house members
		const houseMembers = await this.prisma.houseToUser.findMany({
			where: { houseId },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						imageUrl: true,
					},
				},
			},
		});

		// Calculate per-person totals
		const perPersonData = new Map<
			string,
			{
				userId: string;
				userName: string;
				userImageUrl: string | null;
				totalPaid: number;
				totalOwed: number;
			}
		>();

		// Initialize all house members
		houseMembers.forEach((member) => {
			perPersonData.set(member.userId, {
				userId: member.userId,
				userName: member.user.name || 'Unknown',
				userImageUrl: member.user.imageUrl,
				totalPaid: 0,
				totalOwed: 0,
			});
		});

		// Calculate totals
		expenses.forEach((expense) => {
			// Add to payer's total paid
			const payerData = perPersonData.get(expense.paidById);
			if (payerData) {
				payerData.totalPaid += expense.amount;
			}

			// Calculate how much each person owes based on their split percentage
			expense.splits.forEach((split) => {
				const userData = perPersonData.get(split.userId);
				if (userData) {
					userData.totalOwed +=
						(expense.amount * split.percentage) / 100;
				}
			});
		});

		// Convert to array and calculate balance
		const perPersonTotals = Array.from(perPersonData.values()).map(
			(person) => ({
				...person,
				balance: person.totalPaid - person.totalOwed,
			}),
		);

		// Calculate category breakdown (excluding settlements)
		const categoryTotals = expenses
			.filter((expense) => expense.category !== 'SETTLEMENT')
			.reduce(
				(acc, expense) => {
					acc[expense.category] =
						(acc[expense.category] || 0) + expense.amount;
					return acc;
				},
				{} as Record<string, number>,
			);

		const categoryBreakdown = Object.entries(categoryTotals)
			.map(([category, total]) => ({
				category,
				total,
				percentage:
					totalSpending > 0 ? (total / totalSpending) * 100 : 0,
			}))
			.sort((a, b) => b.total - a.total);

		return {
			totalSpending,
			perPersonTotals,
			expenseCount: expenses.filter((e) => e.category !== 'SETTLEMENT')
				.length,
			categoryBreakdown,
		};
	}

	async getBalances(houseId: string): Promise<{
		balances: Array<{
			userId: string;
			userName: string;
			userImageUrl: string | null;
			balance: number;
		}>;
		settlements: Array<{
			from: string;
			fromName: string;
			to: string;
			toName: string;
			amount: number;
		}>;
	}> {
		// Verify house exists
		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});

		if (!house) {
			throw new NotFoundException('House not found');
		}

		// Get all expenses for the house
		const expenses = await this.prisma.expense.findMany({
			where: { houseId },
			include: {
				paidBy: {
					select: {
						id: true,
						name: true,
						imageUrl: true,
					},
				},
				splits: true,
			},
		});

		// Get all house members
		const houseMembers = await this.prisma.houseToUser.findMany({
			where: { houseId },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						imageUrl: true,
					},
				},
			},
		});

		// Calculate per-person balances
		const balanceData = new Map<
			string,
			{
				userId: string;
				userName: string;
				userImageUrl: string | null;
				balance: number;
			}
		>();

		// Initialize all house members
		houseMembers.forEach((member) => {
			balanceData.set(member.userId, {
				userId: member.userId,
				userName: member.user.name || 'Unknown',
				userImageUrl: member.user.imageUrl,
				balance: 0,
			});
		});

		// Calculate balances
		expenses.forEach((expense) => {
			if (expense.category === 'SETTLEMENT') {
				// For settlements:
				// - paidById is the person paying (FROM) - their debt decreases
				// - splitWith[0] is the person receiving (TO) - their credit decreases
				// The payer's balance increases (they're settling their debt)
				const payerData = balanceData.get(expense.paidById);
				if (payerData) {
					payerData.balance += expense.amount;
				}

				// The receiver's balance decreases (they're being paid back)
				if (expense.splitWith.length > 0) {
					const receiverData = balanceData.get(expense.splitWith[0]);
					if (receiverData) {
						receiverData.balance -= expense.amount;
					}
				}
			} else {
				// Regular expense: use percentage-based split logic
				// Payer gets credited
				const payerData = balanceData.get(expense.paidById);
				if (payerData) {
					payerData.balance += expense.amount;
				}

				// Each person in splits gets debited based on their percentage
				expense.splits.forEach((split) => {
					const userData = balanceData.get(split.userId);
					if (userData) {
						userData.balance -=
							(expense.amount * split.percentage) / 100;
					}
				});
			}
		});

		const balances = Array.from(balanceData.values());

		// Calculate settlement suggestions using greedy algorithm
		const settlements: Array<{
			from: string;
			fromName: string;
			to: string;
			toName: string;
			amount: number;
		}> = [];

		// Separate debtors and creditors
		const debtors = balances
			.filter((b) => b.balance < -0.01)
			.map((b) => ({ ...b }))
			.sort((a, b) => a.balance - b.balance);
		const creditors = balances
			.filter((b) => b.balance > 0.01)
			.map((b) => ({ ...b }))
			.sort((a, b) => b.balance - a.balance);

		let i = 0,
			j = 0;
		while (i < debtors.length && j < creditors.length) {
			const debt = Math.abs(debtors[i].balance);
			const credit = creditors[j].balance;
			const amount = Math.min(debt, credit);

			settlements.push({
				from: debtors[i].userId,
				fromName: debtors[i].userName,
				to: creditors[j].userId,
				toName: creditors[j].userName,
				amount: Math.round(amount * 100) / 100,
			});

			debtors[i].balance += amount;
			creditors[j].balance -= amount;

			if (Math.abs(debtors[i].balance) < 0.01) i++;
			if (Math.abs(creditors[j].balance) < 0.01) j++;
		}

		return {
			balances: balances.map((b) => ({
				...b,
				balance: Math.round(b.balance * 100) / 100,
			})),
			settlements,
		};
	}

	async getSpendingOverTime(
		houseId: string,
		period: 'day' | 'week' | 'month' = 'day',
		days: number = 30,
	): Promise<{
		data: Array<{
			date: string;
			total: number;
			count: number;
		}>;
		period: string;
		totalDays: number;
	}> {
		// Verify house exists
		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});

		if (!house) {
			throw new NotFoundException('House not found');
		}

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);
		startDate.setHours(0, 0, 0, 0);

		// Get all expenses for the house within the time range
		const expenses = await this.prisma.expense.findMany({
			where: {
				houseId,
				date: {
					gte: startDate,
				},
			},
			orderBy: {
				date: 'asc',
			},
		});

		// Group expenses by period
		const groupedData = new Map<string, { total: number; count: number }>();

		expenses.forEach((expense) => {
			let key: string;
			const expenseDate = new Date(expense.date);

			switch (period) {
				case 'week': {
					// Get start of week (Monday)
					const weekStart = new Date(expenseDate);
					const day = weekStart.getDay();
					const diff =
						weekStart.getDate() - day + (day === 0 ? -6 : 1);
					weekStart.setDate(diff);
					weekStart.setHours(0, 0, 0, 0);
					key = weekStart.toISOString().split('T')[0];
					break;
				}
				case 'month': {
					key = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
					break;
				}
				default: {
					// day
					key = expenseDate.toISOString().split('T')[0];
					break;
				}
			}

			const existing = groupedData.get(key) || { total: 0, count: 0 };
			existing.total += expense.amount;
			existing.count += 1;
			groupedData.set(key, existing);
		});

		// Convert to array and fill in missing dates/periods
		const data: Array<{ date: string; total: number; count: number }> = [];
		const currentDate = new Date(startDate);
		const endDate = new Date();

		while (currentDate <= endDate) {
			let key: string;

			switch (period) {
				case 'week': {
					const weekStart = new Date(currentDate);
					const day = weekStart.getDay();
					const diff =
						weekStart.getDate() - day + (day === 0 ? -6 : 1);
					weekStart.setDate(diff);
					weekStart.setHours(0, 0, 0, 0);
					key = weekStart.toISOString().split('T')[0];
					currentDate.setDate(currentDate.getDate() + 7);
					break;
				}
				case 'month': {
					key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
					currentDate.setMonth(currentDate.getMonth() + 1);
					break;
				}
				default: {
					// day
					key = currentDate.toISOString().split('T')[0];
					currentDate.setDate(currentDate.getDate() + 1);
					break;
				}
			}

			const existing = groupedData.get(key);
			if (!data.some((d) => d.date === key)) {
				data.push({
					date: key,
					total: existing?.total || 0,
					count: existing?.count || 0,
				});
			}
		}

		data.sort((a, b) => a.date.localeCompare(b.date));

		return {
			data,
			period,
			totalDays: days,
		};
	}

	async getCategoryBreakdown(houseId: string): Promise<{
		categories: Array<{
			category: string;
			total: number;
			count: number;
			percentage: number;
			averageAmount: number;
		}>;
		totalSpending: number;
	}> {
		// Verify house exists
		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});

		if (!house) {
			throw new NotFoundException('House not found');
		}

		// Get all expenses for the house (excluding settlements)
		const expenses = await this.prisma.expense.findMany({
			where: {
				houseId,
				category: { not: 'SETTLEMENT' },
			},
		});

		const totalSpending = expenses.reduce(
			(sum, expense) => sum + expense.amount,
			0,
		);

		// Group by category
		const categoryData = expenses.reduce(
			(acc, expense) => {
				if (!acc[expense.category]) {
					acc[expense.category] = {
						total: 0,
						count: 0,
					};
				}
				acc[expense.category].total += expense.amount;
				acc[expense.category].count += 1;
				return acc;
			},
			{} as Record<string, { total: number; count: number }>,
		);

		const categories = Object.entries(categoryData)
			.map(([category, data]) => ({
				category,
				total: data.total,
				count: data.count,
				percentage:
					totalSpending > 0 ? (data.total / totalSpending) * 100 : 0,
				averageAmount: data.total / data.count,
			}))
			.sort((a, b) => b.total - a.total);

		return {
			categories,
			totalSpending,
		};
	}

	private async validatePayer(paidById: string) {
		const payer = await this.prisma.user.findUnique({
			where: {
				id: paidById,
			},
		});

		if (payer?.deletedAt !== null) {
			throw new NotFoundException('Payer user not found or is deleted');
		}
	}

	private async validateHouse(houseId: string) {
		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});

		if (!house) {
			throw new NotFoundException('House not found');
		}
	}

	private async validateSplitUsers(splitWith: string[]) {
		const usersToSplit = await this.prisma.user.findMany({
			where: {
				id: { in: splitWith },
			},
		});

		const activeUsers = usersToSplit.filter((u) => u.deletedAt === null);

		if (activeUsers.length !== splitWith.length) {
			throw new BadRequestException(
				'One or more users in splitWith do not exist or are deleted',
			);
		}
	}

	private async validateHouseMembers(houseId: string, userIds: string[]) {
		const houseMembers = await this.prisma.houseToUser.findMany({
			where: {
				houseId,
				userId: { in: userIds },
			},
		});

		const memberIds = new Set(houseMembers.map((hm) => hm.userId));
		const allUsersAreMemberss = userIds.every((userId) =>
			memberIds.has(userId),
		);

		if (!allUsersAreMemberss) {
			throw new BadRequestException(
				'Payer or one or more users in splitWith are not members of this house',
			);
		}
	}

	private calculateAndValidateSplits(
		splitWith: string[],
		splits?: { userId: string; percentage: number }[],
	): { userId: string; percentage: number }[] {
		if (splits && splits.length > 0) {
			const splitUserIds = splits.map((s) => s.userId);
			const splitsSet = new Set(splitUserIds);

			if (splitUserIds.length !== splitWith.length) {
				throw new BadRequestException(
					'Splits must match the users in splitWith',
				);
			}

			for (const userId of splitWith) {
				if (!splitsSet.has(userId)) {
					throw new BadRequestException(
						'Splits must include all users from splitWith',
					);
				}
			}

			const totalPercentage = splits.reduce(
				(sum, split) => sum + split.percentage,
				0,
			);
			if (Math.abs(totalPercentage - 100) > 0.01) {
				throw new BadRequestException(
					'Split percentages must sum to 100',
				);
			}

			return splits;
		}

		const equalPercentage = 100 / splitWith.length;
		return splitWith.map((userId) => ({
			userId,
			percentage: equalPercentage,
		}));
	}
}
