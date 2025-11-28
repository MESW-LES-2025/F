import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRequest } from 'src/shared/types/user_request';
import { HouseService } from 'src/house/house.service';
import { House } from '@prisma/client';

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
		joinHouseWithCode: jest
			.fn()
			.mockResolvedValue({ houseId: 'house-id-1' }),
		inviteToHouse: jest.fn().mockResolvedValue({ id: 'notification-id-1' }),
		leaveHouse: jest.fn().mockResolvedValue({ houseId: 'house-id-1' }),
	};

	const mockHouseService = {
		create: jest
			.fn<Promise<House>, [{ name: string }]>()
			.mockResolvedValue({
				id: 'house-id-1',
				name: 'My House',
				invitationCode: 'INVITE123',
				createdAt: new Date(),
				updatedAt: new Date(),
			} as House),
		join: jest
			.fn()
			.mockResolvedValue({ success: true } as { success: boolean }),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [
				{ provide: UserService, useValue: mockUserService },
				{ provide: HouseService, useValue: mockHouseService },
			],
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

	it('joinHouse should join a house and return the house id', async () => {
		const req = { user: { userId: mockUser.id } } as unknown as UserRequest;

		const newHouse: House = await mockHouseService.create({
			name: 'My House',
		});
		const inviteCode = newHouse.invitationCode;

		const result: { houseId: string | null } = await controller.joinHouse(
			req,
			{ inviteCode },
		);
		expect(mockUserService.joinHouseWithCode).toHaveBeenCalledWith(
			mockUser.id,
			{ inviteCode },
		);
		expect(result).toEqual({ houseId: 'house-id-1' });
	});

	it('inviteUser should call userService.inviteToHouse with correct params', async () => {
		const req = {
			user: { userId: mockUser.id },
		} as unknown as UserRequest;

		const dto = {
			houseId: 'house-id-1',
			email: 'invite@test.com',
		};

		const mockNotificationResult = { id: 'notification-id-1' };

		mockUserService.inviteToHouse = jest
			.fn()
			.mockResolvedValue(mockNotificationResult);

		const result = await controller.inviteUserToHouse(dto, req);

		expect(mockUserService.inviteToHouse).toHaveBeenCalledWith(
			dto,
			mockUser.id,
		);

		expect(result).toEqual(mockNotificationResult);
	});

	it('leaveHouse should call userService.leaveHouse and return success', async () => {
		const req = { user: { userId: mockUser.id } } as unknown as UserRequest;
		const dto = { houseId: 'house-id-1' };

		const mockLeaveResult = { success: true };
		mockUserService.leaveHouse = jest
			.fn()
			.mockResolvedValue(mockLeaveResult);

		const result = await controller.leaveHouse(req, dto);

		expect(mockUserService.leaveHouse).toHaveBeenCalledWith(
			mockUser.id,
			dto.houseId,
		);
		expect(result).toEqual(mockLeaveResult);
	});
});
