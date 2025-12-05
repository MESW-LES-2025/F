import { Test, TestingModule } from '@nestjs/testing';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto, ExpenseCategory } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

describe('ExpenseController', () => {
	let controller: ExpenseController;

	const mockService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		findByHouse: jest.fn(),
		findByUser: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
		getSummary: jest.fn(),
		getBalances: jest.fn(),
		getSpendingOverTime: jest.fn(),
		getCategoryBreakdown: jest.fn(),
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
			controllers: [ExpenseController],
			providers: [
				{
					provide: ExpenseService,
					useValue: mockService,
				},
			],
		}).compile();

		controller = module.get<ExpenseController>(ExpenseController);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should create an expense successfully', async () => {
			const createExpenseDto: CreateExpenseDto = {
				amount: 100.5,
				description: 'Groceries for the week',
				category: ExpenseCategory.GROCERIES,
				paidById: 'user-123',
				houseId: 'house-1',
				splitWith: ['user-123', 'user-456'],
				date: '2025-11-15T00:00:00.000Z',
			};

			mockService.create.mockResolvedValue(mockExpense);

			const result = await controller.create(createExpenseDto);

			expect(result).toEqual(mockExpense);
			expect(mockService.create).toHaveBeenCalledWith(createExpenseDto);
			expect(mockService.create).toHaveBeenCalledTimes(1);
		});

		it('should handle validation errors from the service', async () => {
			const createExpenseDto: CreateExpenseDto = {
				amount: 100.5,
				description: 'Groceries for the week',
				category: ExpenseCategory.GROCERIES,
				paidById: 'nonexistent-user',
				houseId: 'house-1',
				splitWith: ['user-123', 'user-456'],
				date: '2025-11-15T00:00:00.000Z',
			};

			mockService.create.mockRejectedValue(
				new Error('Payer user not found or is deleted'),
			);

			await expect(controller.create(createExpenseDto)).rejects.toThrow(
				'Payer user not found or is deleted',
			);
		});
	});

	describe('findAll', () => {
		it('should return all expenses when no houseId is provided', async () => {
			const expenses = [mockExpense];
			mockService.findAll.mockResolvedValue(expenses);

			const result = await controller.findAll();

			expect(result).toEqual(expenses);
			expect(mockService.findAll).toHaveBeenCalledTimes(1);
			expect(mockService.findByHouse).not.toHaveBeenCalled();
		});

		it('should return expenses filtered by houseId when provided', async () => {
			const expenses = [mockExpense];
			mockService.findByHouse.mockResolvedValue(expenses);

			const result = await controller.findAll('house-1');

			expect(result).toEqual(expenses);
			expect(mockService.findByHouse).toHaveBeenCalledWith('house-1');
			expect(mockService.findByHouse).toHaveBeenCalledTimes(1);
			expect(mockService.findAll).not.toHaveBeenCalled();
		});
	});

	describe('findOne', () => {
		it('should return a single expense by id', async () => {
			mockService.findOne.mockResolvedValue(mockExpense);

			const result = await controller.findOne('expense-123');

			expect(result).toEqual(mockExpense);
			expect(mockService.findOne).toHaveBeenCalledWith('expense-123');
			expect(mockService.findOne).toHaveBeenCalledTimes(1);
		});

		it('should handle not found errors from the service', async () => {
			mockService.findOne.mockRejectedValue(
				new Error('Expense with ID nonexistent-id not found'),
			);

			await expect(controller.findOne('nonexistent-id')).rejects.toThrow(
				'Expense with ID nonexistent-id not found',
			);
		});
	});

	describe('update', () => {
		it('should update an expense successfully', async () => {
			const updateExpenseDto: UpdateExpenseDto = {
				amount: 150.0,
				description: 'Updated description',
			};
			const updatedExpense = { ...mockExpense, ...updateExpenseDto };
			mockService.update.mockResolvedValue(updatedExpense);

			const result = await controller.update(
				'expense-123',
				updateExpenseDto,
			);

			expect(result).toEqual(updatedExpense);
			expect(mockService.update).toHaveBeenCalledWith(
				'expense-123',
				updateExpenseDto,
			);
			expect(mockService.update).toHaveBeenCalledTimes(1);
		});

		it('should handle partial updates', async () => {
			const updateExpenseDto: UpdateExpenseDto = {
				amount: 200.0,
			};
			const updatedExpense = { ...mockExpense, amount: 200.0 };
			mockService.update.mockResolvedValue(updatedExpense);

			const result = await controller.update(
				'expense-123',
				updateExpenseDto,
			);

			expect(result).toEqual(updatedExpense);
			expect(mockService.update).toHaveBeenCalledWith(
				'expense-123',
				updateExpenseDto,
			);
		});

		it('should handle not found errors from the service', async () => {
			const updateExpenseDto: UpdateExpenseDto = {
				amount: 150.0,
			};
			mockService.update.mockRejectedValue(
				new Error('Expense with ID nonexistent-id not found'),
			);

			await expect(
				controller.update('nonexistent-id', updateExpenseDto),
			).rejects.toThrow('Expense with ID nonexistent-id not found');
		});
	});

	describe('remove', () => {
		it('should delete an expense successfully', async () => {
			mockService.remove.mockResolvedValue({
				message: 'Expense with ID expense-123 deleted successfully',
				id: 'expense-123',
			});

			const result = await controller.remove('expense-123');

			expect(result).toEqual({
				message: 'Expense with ID expense-123 deleted successfully',
				id: 'expense-123',
			});
			expect(mockService.remove).toHaveBeenCalledWith('expense-123');
			expect(mockService.remove).toHaveBeenCalledTimes(1);
		});

		it('should handle not found errors from the service', async () => {
			mockService.remove.mockRejectedValue(
				new Error('Expense with ID nonexistent-id not found'),
			);

			await expect(controller.remove('nonexistent-id')).rejects.toThrow(
				'Expense with ID nonexistent-id not found',
			);
		});
	});

	describe('getSummary', () => {
		it('should return expense summary', async () => {
			const summary = { total: 100 };
			mockService.getSummary.mockResolvedValue(summary);

			const result = await controller.getSummary('house-1');

			expect(result).toEqual(summary);
			expect(mockService.getSummary).toHaveBeenCalledWith('house-1');
		});
	});

	describe('getBalances', () => {
		it('should return balances', async () => {
			const balances = { user1: 10 };
			mockService.getBalances.mockResolvedValue(balances);

			const result = await controller.getBalances('house-1');

			expect(result).toEqual(balances);
			expect(mockService.getBalances).toHaveBeenCalledWith('house-1');
		});
	});

	describe('getSpendingOverTime', () => {
		it('should return spending trends', async () => {
			const trends = [{ date: '2023-01-01', amount: 100 }];
			mockService.getSpendingOverTime.mockResolvedValue(trends);

			const result = await controller.getSpendingOverTime(
				'house-1',
				'month',
				'30',
			);

			expect(result).toEqual(trends);
			expect(mockService.getSpendingOverTime).toHaveBeenCalledWith(
				'house-1',
				'month',
				30,
			);
		});

		it('should use default values', async () => {
			const trends = [{ date: '2023-01-01', amount: 100 }];
			mockService.getSpendingOverTime.mockResolvedValue(trends);

			await controller.getSpendingOverTime('house-1');

			expect(mockService.getSpendingOverTime).toHaveBeenCalledWith(
				'house-1',
				'day',
				30,
			);
		});
	});

	describe('getCategoryBreakdown', () => {
		it('should return category breakdown', async () => {
			const breakdown = { GROCERIES: 100 };
			mockService.getCategoryBreakdown.mockResolvedValue(breakdown);

			const result = await controller.getCategoryBreakdown('house-1');

			expect(result).toEqual(breakdown);
			expect(mockService.getCategoryBreakdown).toHaveBeenCalledWith(
				'house-1',
			);
		});
	});
});
