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
				},
			});
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
});
