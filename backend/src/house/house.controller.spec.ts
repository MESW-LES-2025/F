import { Test, TestingModule } from '@nestjs/testing';
import { HouseController } from './house.controller';
import { HouseService } from './house.service';
import { CreateHouseDto } from './dto/create-house.dto';
import { UserRequest } from '../shared/types/user_request';

describe('HouseController', () => {
	let controller: HouseController;

	const mockHouseService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findAllUserHouses: jest.fn(),
		findOne: jest.fn(),
		findHouseDetails: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
		getUsersByHouse: jest.fn(),
	};

	const mockReq = {
		user: {
			userId: 'user123',
		},
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [HouseController],
			providers: [
				{
					provide: HouseService,
					useValue: mockHouseService,
				},
			],
		}).compile();

		controller = module.get<HouseController>(HouseController);
		controller = module.get<HouseController>(HouseController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should create a house', async () => {
			const createHouseDto: CreateHouseDto = { name: 'Test House' };
			const req = { user: { userId: 'user-id' } } as UserRequest;
			const result = { id: 'house-id', ...createHouseDto };

			mockHouseService.create.mockResolvedValue(result);

			expect(await controller.create(createHouseDto, req)).toBe(result);
			expect(mockHouseService.create).toHaveBeenCalledWith(
				createHouseDto,
				req.user.userId,
			);
		});
	});

	describe('findAll', () => {
		it('should return an array of houses', async () => {
			const result = [{ id: 'house-id', name: 'Test House' }];
			mockHouseService.findAll.mockResolvedValue(result);

			expect(await controller.findAll()).toBe(result);
			expect(mockHouseService.findAll).toHaveBeenCalled();
		});
	});

	describe('findAllUserHouses', () => {
		it('should return an array of houses for a user', async () => {
			const req = { user: { userId: 'user-id' } } as UserRequest;
			const result = [{ id: 'house-id', name: 'Test House' }];
			mockHouseService.findAllUserHouses.mockResolvedValue(result);

			expect(await controller.findAllUserHouses(req)).toBe(result);
			expect(mockHouseService.findAllUserHouses).toHaveBeenCalledWith(
				req.user.userId,
			);
		});
	});

	describe('findOne', () => {
		it('should return a single house', async () => {
			const id = 'house-id';
			const result = { id, name: 'Test House' };
			mockHouseService.findOne.mockResolvedValue(result);

			expect(await controller.findOne(id)).toBe(result);
			expect(mockHouseService.findOne).toHaveBeenCalledWith(id);
		});
	});

	describe('getUsersByHouse', () => {
		it('should return users in a house', async () => {
			const houseId = 'house-id';
			const result = [{ id: 'user-id', username: 'user' }];
			mockHouseService.getUsersByHouse.mockResolvedValue(result);

			const req = { user: { userId: 'user-id' } } as UserRequest;
			expect(await controller.getUsersByHouse(houseId, req)).toBe(result);
			expect(mockHouseService.getUsersByHouse).toHaveBeenCalledWith(
				houseId,
				req.user.userId,
			);
		});
	});

	describe('findHouseDetails', () => {
		it('should return house details for the given id and user', async () => {
			const houseDetails = { id: 'house1', name: 'Casa 1' };

			mockHouseService.findHouseDetails = jest
				.fn()
				.mockResolvedValue(houseDetails);

			const result = await controller.findHouseDetails(
				'house1',
				mockReq as UserRequest,
			);

			expect(result).toEqual(houseDetails);
			expect(mockHouseService.findHouseDetails).toHaveBeenCalledWith(
				'house1',
				'user123',
			);
		});
	});

	describe('update', () => {
		it('should update a house', async () => {
			const houseId = 'house1';
			const updateHouseDto = { name: 'Updated House' };
			const mockResult = { id: houseId, name: 'Updated House' };

			mockHouseService.update = jest.fn().mockResolvedValue(mockResult);

			const result = await controller.update(
				houseId,
				updateHouseDto,
				mockReq as unknown as UserRequest,
			);

			expect(result).toEqual(mockResult);
			expect(mockHouseService.update).toHaveBeenCalledWith({
				houseId,
				dto: updateHouseDto,
				userId: 'user123',
			});
		});
	});

	describe('remove', () => {
		it('should delete a house', async () => {
			const houseId = 'house1';
			const mockResult = { success: true };

			mockHouseService.remove = jest.fn().mockResolvedValue(mockResult);

			const result = await controller.remove(
				houseId,
				mockReq as unknown as UserRequest,
			);

			expect(result).toEqual(mockResult);
			expect(mockHouseService.remove).toHaveBeenCalledWith({
				houseId,
				userId: 'user123',
			});
		});
	});

	describe('findHouseDetails', () => {
		it('should return house details for the given id and user', async () => {
			const houseDetails = { id: 'house1', name: 'Casa 1' };

			mockHouseService.findHouseDetails = jest
				.fn()
				.mockResolvedValue(houseDetails);

			const result = await controller.findHouseDetails(
				'house1',
				mockReq as UserRequest,
			);

			expect(result).toEqual(houseDetails);
			expect(mockHouseService.findHouseDetails).toHaveBeenCalledWith(
				'house1',
				'user123',
			);
		});
	});

	describe('update', () => {
		it('should update a house', async () => {
			const houseId = 'house1';
			const updateHouseDto = { name: 'Updated House' };
			const mockResult = { id: houseId, name: 'Updated House' };

			mockHouseService.update = jest.fn().mockResolvedValue(mockResult);

			const result = await controller.update(
				houseId,
				updateHouseDto,
				mockReq as unknown as UserRequest,
			);

			expect(result).toEqual(mockResult);
			expect(mockHouseService.update).toHaveBeenCalledWith({
				houseId,
				dto: updateHouseDto,
				userId: 'user123',
			});
		});
	});

	describe('remove', () => {
		it('should delete a house', async () => {
			const houseId = 'house1';
			const mockResult = { success: true };

			mockHouseService.remove = jest.fn().mockResolvedValue(mockResult);

			const result = await controller.remove(
				houseId,
				mockReq as unknown as UserRequest,
			);

			expect(result).toEqual(mockResult);
			expect(mockHouseService.remove).toHaveBeenCalledWith({
				houseId,
				userId: 'user123',
			});
		});
	});
});
