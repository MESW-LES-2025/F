import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersController', () => {
	let controller: UsersController;

	const mockUsers = [
		{
			id: 'user-1',
			email: 'user1@example.com',
			username: 'user1',
			name: 'User One',
			imageUrl: null,
		},
		{
			id: 'user-2',
			email: 'user2@example.com',
			username: 'user2',
			name: 'User Two',
			imageUrl: 'https://example.com/user2.jpg',
		},
	];

	const mockPrismaService = {
		user: {
			findMany: jest.fn(),
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [
				{ provide: PrismaService, useValue: mockPrismaService },
			],
		}).compile();

		controller = module.get<UsersController>(UsersController);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('getUsers', () => {
		it('should return all users sorted by name', async () => {
			mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

			const result = await controller.getUsers();

			expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
				select: {
					id: true,
					email: true,
					username: true,
					name: true,
					imageUrl: true,
				},
				orderBy: {
					name: 'asc',
				},
			});
			expect(result).toEqual(mockUsers);
		});

		it('should return empty array when no users exist', async () => {
			mockPrismaService.user.findMany.mockResolvedValue([]);

			const result = await controller.getUsers();

			expect(result).toEqual([]);
		});
	});
});
