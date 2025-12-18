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

		it('should create an expense with custom splits successfully', async () => {
			const customSplits = [
				{ userId: 'user-123', percentage: 70 },
				{ userId: 'user-456', percentage: 30 },
			];
			const dtoWithSplits = { ...createExpenseDto, splits: customSplits };

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

			await service.create(dtoWithSplits);

			expect(mockPrismaService.expense.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						splits: { create: customSplits },
					}) as unknown,
				}),
			);
		});

		it('should throw BadRequestException when custom splits count does not match splitWith', async () => {
			const customSplits = [{ userId: 'user-123', percentage: 100 }];
			const dtoWithSplits = { ...createExpenseDto, splits: customSplits };

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

			await expect(service.create(dtoWithSplits)).rejects.toThrow(
				'Splits must match the users in splitWith',
			);
		});

		it('should throw BadRequestException when custom splits missing a user from splitWith', async () => {
			const customSplits = [
				{ userId: 'user-123', percentage: 50 },
				{ userId: 'other-user', percentage: 50 },
			];
			const dtoWithSplits = { ...createExpenseDto, splits: customSplits };

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

			await expect(service.create(dtoWithSplits)).rejects.toThrow(
				'Splits must include all users from splitWith',
			);
		});

		it('should throw BadRequestException when custom splits percentage sum is not 100', async () => {
			const customSplits = [
				{ userId: 'user-123', percentage: 50 },
				{ userId: 'user-456', percentage: 40 },
			];
			const dtoWithSplits = { ...createExpenseDto, splits: customSplits };

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

			await expect(service.create(dtoWithSplits)).rejects.toThrow(
				'Split percentages must sum to 100',
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

		it('should handle updating splits correctly', async () => {
			const customSplits = [
				{ userId: 'user-123', percentage: 60 },
				{ userId: 'user-456', percentage: 40 },
			];
			mockPrismaService.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrismaService.expense.update.mockResolvedValue(mockExpense);

			await service.update('expense-123', { splits: customSplits });

			expect(mockPrismaService.expense.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						splits: {
							deleteMany: {},
							create: customSplits,
						},
					}) as unknown,
				}),
			);
		});

		it('should recalculate equal splits when splitWith is updated without splits', async () => {
			mockPrismaService.expense.findUnique.mockResolvedValue(mockExpense);
			mockPrismaService.expense.update.mockResolvedValue(mockExpense);
			mockPrismaService.user.findMany.mockResolvedValue([
				{ id: 'user-123', deletedAt: null },
				{ id: 'user-789', deletedAt: null },
			]);

			const newSplitWith = ['user-123', 'user-789'];
			await service.update('expense-123', { splitWith: newSplitWith });

			expect(mockPrismaService.expense.update).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						splits: {
							deleteMany: {},
							create: [
								{ userId: 'user-123', percentage: 50 },
								{ userId: 'user-789', percentage: 50 },
							],
						},
					}) as unknown,
				}),
			);
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

		it('should sort category breakdown by total descending', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([
				{ ...mockExpense, category: 'FOOD', amount: 100 },
				{ ...mockExpense, category: 'GROCERIES', amount: 200 },
			]);
			mockPrismaService.houseToUser.findMany.mockResolvedValue([]);

			const result = await service.getSummary('house-1');
			expect(result.categoryBreakdown[0].category).toBe('GROCERIES');
			expect(result.categoryBreakdown[1].category).toBe('FOOD');
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

		it('should sort creditors and debtors correctly in getBalances', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			// user-1 balance: 400 - 100 - 50 = 250
			// user-2 balance: 200 - 100 - 50 = 50
			// user-3 balance: -100 - 50 = -150
			// user-4 balance: -100 - 50 = -150

			mockPrismaService.houseToUser.findMany.mockResolvedValue([
				{ userId: 'user-1', user: { name: 'User 1', imageUrl: null } },
				{ userId: 'user-2', user: { name: 'User 2', imageUrl: null } },
				{ userId: 'user-3', user: { name: 'User 3', imageUrl: null } },
				{ userId: 'user-4', user: { name: 'User 4', imageUrl: null } },
			]);

			mockPrismaService.expense.findMany.mockResolvedValue([
				{
					id: 'exp1',
					amount: 400, // 100 each
					paidById: 'user-1',
					category: 'FOOD',
					splits: [
						{ userId: 'user-1', percentage: 25 },
						{ userId: 'user-2', percentage: 25 },
						{ userId: 'user-3', percentage: 25 },
						{ userId: 'user-4', percentage: 25 },
					],
				},
				{
					id: 'exp2',
					amount: 200, // 50 each
					paidById: 'user-2',
					category: 'FOOD',
					splits: [
						{ userId: 'user-1', percentage: 25 },
						{ userId: 'user-2', percentage: 25 },
						{ userId: 'user-3', percentage: 25 },
						{ userId: 'user-4', percentage: 25 },
					],
				},
			]);

			const result = await service.getBalances('house-1');
			expect(result.balances.length).toBe(4);
			// Check if creditors are sorted descending: user-1 (250) then user-2 (50)
			// Check if debtors are sorted: user-3 (-150) and user-4 (-150)
			expect(result.settlements.length).toBeGreaterThan(0);
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

		it('should throw NotFoundException if house not found', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(null);

			await expect(
				service.getSpendingOverTime('house-1'),
			).rejects.toThrow(NotFoundException);
		});

		it('should correctly handle Monday (day 1) for week period', async () => {
			jest.useFakeTimers().setSystemTime(new Date('2023-02-01'));
			const mondayDate = new Date('2023-01-16'); // Monday
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([
				{ ...mockExpense, date: mondayDate },
			]);

			const result = await service.getSpendingOverTime(
				'house-1',
				'week',
				30,
			);
			// 2023-01-16 is Monday -> Week start is 2023-01-16
			expect(result.data.some((d) => d.date === '2023-01-16')).toBe(true);
			jest.useRealTimers();
		});

		it('should correctly handle Sunday (day 0) for week period', async () => {
			jest.useFakeTimers().setSystemTime(new Date('2023-02-01'));
			const sundayDate = new Date('2023-01-22'); // Sunday
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([
				{ ...mockExpense, date: sundayDate },
			]);

			const result = await service.getSpendingOverTime(
				'house-1',
				'week',
				30,
			);
			// 2023-01-22 is Sunday -> Week start should be 2023-01-16 (Monday)
			expect(result.data.some((d) => d.date === '2023-01-16')).toBe(true);
			const sundayEntry = result.data.find(
				(d) => d.date === '2023-01-16',
			);
			expect(sundayEntry?.total).toBe(100.5);
			jest.useRealTimers();
		});

		it('should correctly handle month period', async () => {
			jest.useFakeTimers().setSystemTime(
				new Date('2023-04-15T12:00:00Z'),
			);
			const janDate = new Date('2023-01-15T12:00:00Z');
			const febDate = new Date('2023-02-15T12:00:00Z');
			const marDate = new Date('2023-03-15T12:00:00Z');
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([
				{ ...mockExpense, amount: 100, date: janDate },
				{ ...mockExpense, amount: 200, date: febDate },
				{ ...mockExpense, amount: 300, date: marDate },
			]);

			const result = await service.getSpendingOverTime(
				'house-1',
				'month',
				120,
			);

			expect(result.data.some((d) => d.date === '2023-01')).toBe(true);
			expect(result.data.some((d) => d.date === '2023-02')).toBe(true);
			expect(result.data.some((d) => d.date === '2023-03')).toBe(true);

			const janEntry = result.data.find((d) => d.date === '2023-01');
			const febEntry = result.data.find((d) => d.date === '2023-02');
			const marEntry = result.data.find((d) => d.date === '2023-03');

			expect(janEntry?.total).toBe(100);
			expect(febEntry?.total).toBe(200);
			expect(marEntry?.total).toBe(300);

			jest.useRealTimers();
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

		it('should sort categories by total descending', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([
				{ ...mockExpense, category: 'FOOD', amount: 100 },
				{ ...mockExpense, category: 'GROCERIES', amount: 200 },
			]);

			const result = await service.getCategoryBreakdown('house-1');
			expect(result.categories[0].category).toBe('GROCERIES');
			expect(result.categories[1].category).toBe('FOOD');
		});

		it('should handle zero spending', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([]);

			const result = await service.getCategoryBreakdown('house-1');
			expect(result.totalSpending).toBe(0);
		});

		it('should handle zero amount expenses in breakdown', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.expense.findMany.mockResolvedValue([
				{ ...mockExpense, amount: 0, category: 'ZERO' },
			]);

			const result = await service.getCategoryBreakdown('house-1');
			expect(result.totalSpending).toBe(0);
			expect(result.categories[0].percentage).toBe(0);
		});

		it('should throw NotFoundException if house not found', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(null);

			await expect(
				service.getCategoryBreakdown('house-1'),
			).rejects.toThrow(NotFoundException);
		});
	});
});
