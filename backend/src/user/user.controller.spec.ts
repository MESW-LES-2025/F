import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRequest } from 'src/shared/types/user_request';

describe('UserController', () => {
	let controller: UserController;

	const mockUser = {
		id: 'user-id-1',
		email: 'test@example.com',
		username: 'tester',
		name: 'Tester',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockUserService = {
		findOne: jest.fn().mockResolvedValue(mockUser),
		update: jest.fn().mockResolvedValue({ ...mockUser, name: 'Updated' }),
		remove: jest.fn().mockResolvedValue({ success: true }),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [{ provide: UserService, useValue: mockUserService }],
		}).compile();

		controller = module.get<UserController>(UserController);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('getCurrent should return the current user', async () => {
		const req = { user: { userId: mockUser.id } } as unknown as UserRequest;
		const result = await controller.getCurrent(req);
		expect(mockUserService.findOne).toHaveBeenCalledWith(mockUser.id);
		expect(result).toEqual(mockUser);
	});

	it('updateCurrent should update and return user', async () => {
		const req = { user: { userId: mockUser.id } } as unknown as UserRequest;
		const dto: UpdateUserDto = { name: 'Updated' };
		const result = await controller.updateCurrent(req, dto);
		expect(mockUserService.update).toHaveBeenCalledWith(mockUser.id, dto);
		expect(result).toEqual({ ...mockUser, name: 'Updated' });
	});

	it('removeCurrent should soft-delete and return success', async () => {
		const req = { user: { userId: mockUser.id } } as unknown as UserRequest;
		const result = await controller.removeCurrent(req);
		expect(mockUserService.remove).toHaveBeenCalledWith(mockUser.id);
		expect(result).toEqual({ success: true });
	});
});
