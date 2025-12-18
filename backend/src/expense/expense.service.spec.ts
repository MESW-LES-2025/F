import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseService } from './expense.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateExpenseDto, ExpenseCategory } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

describe('ExpenseService', () => {
	let service: ExpenseService;

	const mockPrismaService = {
		expense: {
			create: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		user: {
			findUnique: jest.fn(),
			findMany: jest.fn(),
		},
		house: {
			findUnique: jest.fn(),
		},
		houseToUser: {
			findMany: jest.fn(),
		},
	};

	const mockPayer = {
		id: 'user-123',
		name: 'John Doe',
		email: 'john@example.com',
		username: 'johndoe',
		deletedAt: null,
	};

	const mockHouse = {
		id: 'house-1',
		name: 'Test House',
		invitationCode: 'ABC123',
	};

	const mockExpense = {
		id: 'expense-123',
		amount: 100.5,
		description: 'Groceries for the week',
		category: 'GROCERIES',
		date: new Date('2025-11-15'),
		paidById: 'user-123',
		houseId: 'house-1',
		splitWith: ['user-123', 'user-456'],
		createdAt: new Date(),
		updatedAt: new Date(),
		splits: [
			{ userId: 'user-123', percentage: 50, expenseId: 'expense-123' },
			{ userId: 'user-456', percentage: 50, expenseId: 'expense-123' },
		],
		paidBy: {
			id: 'user-123',
			name: 'John Doe',
			email: 'john@example.com',
			username: 'johndoe',
		},
		house: {
			id: 'house-1',
			name: 'Test House',
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ExpenseService,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
			],
		}).compile();

		service = module.get<ExpenseService>(ExpenseService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		const createExpenseDto: CreateExpenseDto = {
			amount: 100.5,
			description: 'Groceries for the week',
			category: ExpenseCategory.GROCERIES,
			paidById: 'user-123',
			houseId: 'house-1',
			splitWith: ['user-123', 'user-456'],
			date: '2025-11-15T00:00:00.000Z',
		};

		it('should create an expense successfully', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockPayer);
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.user.findMany.mockResolvedValue([
				mockPayer,
				{ id: 'user-456', deletedAt: null },
			]);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([
				{ userId: 'user-123', houseId: 'house-1' },
				{ userId: 'user-456', houseId: 'house-1' },
			]);
			mockPrismaService.expense.create.mockResolvedValue(mockExpense);

			const result = await service.create(createExpenseDto);

			expect(result).toEqual(mockExpense);
			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { id: 'user-123' },
			});
			expect(mockPrismaService.house.findUnique).toHaveBeenCalledWith({
				where: { id: 'house-1' },
			});
			expect(mockPrismaService.expense.create).toHaveBeenCalledWith({
				data: {
					amount: 100.5,
					description: 'Groceries for the week',
					category: 'GROCERIES',
					paidById: 'user-123',
					houseId: 'house-1',
					splitWith: ['user-123', 'user-456'],
					date: new Date('2025-11-15T00:00:00.000Z'),
					splits: {
						create: [
							{ userId: 'user-123', percentage: 50 },
							{ userId: 'user-456', percentage: 50 },
						],
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
		});

		it('should throw NotFoundException when payer does not exist', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			await expect(service.create(createExpenseDto)).rejects.toThrow(
				NotFoundException,
			);
			await expect(service.create(createExpenseDto)).rejects.toThrow(
				'Payer user not found or is deleted',
			);
		});

		it('should throw NotFoundException when payer is soft-deleted', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue({
				...mockPayer,
				deletedAt: new Date(),
			});

			await expect(service.create(createExpenseDto)).rejects.toThrow(
				NotFoundException,
			);
			await expect(service.create(createExpenseDto)).rejects.toThrow(
				'Payer user not found or is deleted',
			);
		});

		it('should throw NotFoundException when house does not exist', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockPayer);
			mockPrismaService.house.findUnique.mockResolvedValue(null);

			await expect(service.create(createExpenseDto)).rejects.toThrow(
				NotFoundException,
			);
			await expect(service.create(createExpenseDto)).rejects.toThrow(
				'House not found',
			);
		});

		it('should throw BadRequestException when a user in splitWith does not exist', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockPayer);
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.user.findMany.mockResolvedValue([mockPayer]);

			await expect(service.create(createExpenseDto)).rejects.toThrow(
				BadRequestException,
			);
			await expect(service.create(createExpenseDto)).rejects.toThrow(
				'One or more users in splitWith do not exist or are deleted',
			);
		});

		it('should throw BadRequestException when a user in splitWith is soft-deleted', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockPayer);
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.user.findMany.mockResolvedValue([
				mockPayer,
				{ id: 'user-456', deletedAt: new Date() },
			]);

			await expect(service.create(createExpenseDto)).rejects.toThrow(
				BadRequestException,
			);
		});

		it('should throw BadRequestException when a user in splitWith is not in the house', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockPayer);
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.user.findMany.mockResolvedValue([
				mockPayer,
				{ id: 'user-456', deletedAt: null },
			]);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([
				{ userId: 'user-123', houseId: 'house-1' },
			]);

			await expect(service.create(createExpenseDto)).rejects.toThrow(
				BadRequestException,
			);
			await expect(service.create(createExpenseDto)).rejects.toThrow(
				'Payer or one or more users in splitWith are not members of this house',
			);
		});
		it('should create an expense with default date if not provided', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockPayer);
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.user.findMany.mockResolvedValue([
				mockPayer,
				{ id: 'user-456', deletedAt: null },
			]);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([
				{ userId: 'user-123', houseId: 'house-1' },
				{ userId: 'user-456', houseId: 'house-1' },
			]);
			mockPrismaService.expense.create.mockResolvedValue(mockExpense);

			const dtoWithoutDate = { ...createExpenseDto };
			delete dtoWithoutDate.date;

			await service.create(dtoWithoutDate);

			expect(mockPrismaService.expense.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						date: expect.any(Date) as unknown,
					}) as unknown,
				}),
			);
		});
	});

	describe('findAll', () => {
		it('should return all expenses', () => {
			const expenses = [mockExpense];
			mockPrismaService.expense.findMany.mockReturnValue(expenses);

			const result = service.findAll();

			expect(result).toEqual(expenses);
			expect(mockPrismaService.expense.findMany).toHaveBeenCalledWith({
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
		});
	});

	describe('findOne', () => {
		it('should return an expense by id', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(mockExpense);

			const result = await service.findOne('expense-123');

			expect(result).toEqual(mockExpense);
			expect(mockPrismaService.expense.findUnique).toHaveBeenCalledWith({
				where: { id: 'expense-123' },
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
		});

		it('should throw NotFoundException when expense does not exist', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(null);

			await expect(service.findOne('nonexistent-id')).rejects.toThrow(
				NotFoundException,
			);
			await expect(service.findOne('nonexistent-id')).rejects.toThrow(
				'Expense with ID nonexistent-id not found',
			);
		});
	});

	describe('findByHouse', () => {
		it('should return expenses for a specific house', async () => {
			const expenses = [mockExpense];
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue(expenses);

			const result = await service.findByHouse('house-1');

			expect(result).toEqual(expenses);
			expect(mockPrismaService.house.findUnique).toHaveBeenCalledWith({
				where: { id: 'house-1' },
			});
			expect(mockPrismaService.expense.findMany).toHaveBeenCalledWith({
				where: { houseId: 'house-1' },
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
		});

		it('should throw NotFoundException when house does not exist', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(null);

			await expect(
				service.findByHouse('nonexistent-house'),
			).rejects.toThrow(NotFoundException);
			await expect(
				service.findByHouse('nonexistent-house'),
			).rejects.toThrow('House not found');
		});
	});

	describe('update', () => {
		const updateExpenseDto: UpdateExpenseDto = {
			amount: 150.0,
			description: 'Updated description',
		};

		it('should update an expense successfully', async () => {
			const updatedExpense = { ...mockExpense, ...updateExpenseDto };
			mockPrismaService.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrismaService.expense.update.mockResolvedValue(updatedExpense);

			const result = await service.update(
				'expense-123',
				updateExpenseDto,
			);

			expect(result).toEqual(updatedExpense);
			expect(mockPrismaService.expense.findUnique).toHaveBeenCalledWith({
				where: { id: 'expense-123' },
			});
			expect(mockPrismaService.expense.update).toHaveBeenCalledWith({
				where: { id: 'expense-123' },
				data: updateExpenseDto,
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
		});

		it('should handle partial updates without optional fields', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrismaService.expense.update.mockResolvedValue(mockExpense);

			const partialDto = { description: 'Just desc' };
			await service.update('expense-123', partialDto);

			expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
			expect(mockPrismaService.house.findUnique).not.toHaveBeenCalled();
			expect(mockPrismaService.user.findMany).not.toHaveBeenCalled();
		});

		it('should update date if provided', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrismaService.expense.update.mockResolvedValue(mockExpense);

			const dateDto = { date: '2025-12-25T00:00:00.000Z' };
			await service.update('expense-123', dateDto);

			expect(mockPrismaService.expense.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						date: new Date(dateDto.date) as unknown,
					}) as unknown,
				}),
			);
		});

		it('should throw NotFoundException when updating paidById with non-existent user', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			await expect(
				service.update('expense-123', { paidById: 'nonexistent' }),
			).rejects.toThrow(NotFoundException);
			await expect(
				service.update('expense-123', { paidById: 'nonexistent' }),
			).rejects.toThrow('Payer user not found or is deleted');
		});

		it('should throw NotFoundException when updating houseId with non-existent house', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrismaService.house.findUnique.mockResolvedValue(null);

			await expect(
				service.update('expense-123', { houseId: 'nonexistent' }),
			).rejects.toThrow(NotFoundException);
			await expect(
				service.update('expense-123', { houseId: 'nonexistent' }),
			).rejects.toThrow('House not found');
		});

		it('should throw BadRequestException when updating splitWith with non-existent users', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrismaService.user.findMany.mockResolvedValue([]);

			await expect(
				service.update('expense-123', { splitWith: ['nonexistent'] }),
			).rejects.toThrow(BadRequestException);
			await expect(
				service.update('expense-123', { splitWith: ['nonexistent'] }),
			).rejects.toThrow(
				'One or more users in splitWith do not exist or are deleted',
			);
		});

		it('should throw NotFoundException when expense does not exist', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(null);

			await expect(
				service.update('nonexistent-id', updateExpenseDto),
			).rejects.toThrow(NotFoundException);
			await expect(
				service.update('nonexistent-id', updateExpenseDto),
			).rejects.toThrow('Expense with ID nonexistent-id not found');
		});
	});

	describe('remove', () => {
		it('should delete an expense successfully', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrismaService.expense.delete.mockResolvedValue(mockExpense);

			const result = await service.remove('expense-123');

			expect(result).toEqual({
				message: 'Expense with ID expense-123 deleted successfully',
				id: 'expense-123',
			});
			expect(mockPrismaService.expense.findUnique).toHaveBeenCalledWith({
				where: { id: 'expense-123' },
			});
			expect(mockPrismaService.expense.delete).toHaveBeenCalledWith({
				where: { id: 'expense-123' },
			});
		});

		it('should throw NotFoundException when expense does not exist', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(null);

			await expect(service.remove('nonexistent-id')).rejects.toThrow(
				NotFoundException,
			);
			await expect(service.remove('nonexistent-id')).rejects.toThrow(
				'Expense with ID nonexistent-id not found',
			);
		});
	});

	describe('getSummary', () => {
		it('should return expense summary', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([mockExpense]);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([
				{ userId: 'user-123', user: mockPayer },
				{ userId: 'user-456', user: { ...mockPayer, id: 'user-456' } },
			]);

			const result = await service.getSummary('house-1');

			expect(result).toHaveProperty('totalSpending');
			expect(result).toHaveProperty('perPersonTotals');
			expect(result).toHaveProperty('expenseCount');
			expect(result).toHaveProperty('categoryBreakdown');
		});

		it('should exclude settlements and handle zero spending', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([
				{ ...mockExpense, category: 'SETTLEMENT' },
			]);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([]);

			const result = await service.getSummary('house-1');

			expect(result.totalSpending).toBe(0);
			expect(result.expenseCount).toBe(0);
			expect(result.categoryBreakdown).toEqual([]);
		});

		it('should throw NotFoundException if house not found', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(null);

			await expect(service.getSummary('house-1')).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('getBalances', () => {
		it('should return balances', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([mockExpense]);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([
				{ userId: 'user-123', user: mockPayer },
				{ userId: 'user-456', user: { ...mockPayer, id: 'user-456' } },
			]);

			const result = await service.getBalances('house-1');

			expect(result).toHaveProperty('balances');
			expect(result).toHaveProperty('settlements');
		});

		it('should handle settlements correctly', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([
				{
					...mockExpense,
					category: 'SETTLEMENT',
					amount: 50,
					paidById: 'user-123',
					splitWith: ['user-456'],
				},
			]);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([
				{ userId: 'user-123', user: mockPayer },
				{ userId: 'user-456', user: { ...mockPayer, id: 'user-456' } },
			]);

			const result = await service.getBalances('house-1');
			const payer = result.balances.find((b) => b.userId === 'user-123');
			const receiver = result.balances.find(
				(b) => b.userId === 'user-456',
			);

			expect(payer?.balance).toBe(50);
			expect(receiver?.balance).toBe(-50);
		});

		it('should throw NotFoundException if house not found', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(null);

			await expect(service.getBalances('house-1')).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('getSpendingOverTime', () => {
		it('should return spending trends', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([mockExpense]);

			const result = await service.getSpendingOverTime('house-1');

			expect(result).toHaveProperty('data');
			expect(result).toHaveProperty('period');
			expect(result).toHaveProperty('totalDays');
		});

		it('should handle week and month periods', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([mockExpense]);

			await service.getSpendingOverTime('house-1', 'week');
			await service.getSpendingOverTime('house-1', 'month');
		});

		it('should throw NotFoundException if house not found', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(null);

			await expect(
				service.getSpendingOverTime('house-1'),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('getCategoryBreakdown', () => {
		it('should return category breakdown', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([mockExpense]);

			const result = await service.getCategoryBreakdown('house-1');

			expect(result).toHaveProperty('categories');
			expect(result).toHaveProperty('totalSpending');
		});

		it('should aggregate multiple expenses of same category', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([
				mockExpense,
				{ ...mockExpense, id: 'exp-2', amount: 50 },
			]);

			const result = await service.getCategoryBreakdown('house-1');
			expect(result.categories[0].total).toBe(150.5);
			expect(result.categories[0].count).toBe(2);
		});

		it('should handle zero spending', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([]);

			const result = await service.getCategoryBreakdown('house-1');
			expect(result.totalSpending).toBe(0);
		});

		it('should throw NotFoundException if house not found', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(null);

			await expect(
				service.getCategoryBreakdown('house-1'),
			).rejects.toThrow(NotFoundException);
		});
	});
});
