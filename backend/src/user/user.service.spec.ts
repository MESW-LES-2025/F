import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageService } from 'src/shared/image/image.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { MulterFile } from 'src/shared/types/multer_file';
import { Readable } from 'stream';
import {
	House,
	HouseToUser,
	NotificationCategory,
	NotificationLevel,
	NotificationToUser,
} from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('UserService', () => {
	let service: UserService;

	const mockUser = {
		id: 'user-id-1',
		email: 'test@example.com',
		username: 'tester',
		name: 'Tester',
		imageUrl: null as string | null,
		imagePublicId: null as string | null,
		deletedAt: null as Date | null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	type UserType = typeof mockUser;

	type MockPrisma = {
		user: {
			findFirst: jest.MockedFunction<
				(...args: any[]) => Promise<UserType | null>
			>;
			findUnique: jest.MockedFunction<
				(...args: any[]) => Promise<UserType | null>
			>;
			update: jest.MockedFunction<
				(...args: any[]) => Promise<UserType & Record<string, any>>
			>;
		};
		notificationToUser: {
			findFirst: jest.MockedFunction<
				(...args: any[]) => Promise<NotificationToUser | null>
			>;
		};
		refreshToken: {
			updateMany: jest.MockedFunction<
				(...args: any[]) => Promise<{ count: number }>
			>;
		};
		house: {
			findFirst: jest.MockedFunction<
				(...args: any[]) => Promise<House | null>
			>;
			findUnique: jest.MockedFunction<
				(...args: any[]) => Promise<House | null>
			>;
		};
		houseToUser: {
			findFirst: jest.MockedFunction<
				(...args: any[]) => Promise<HouseToUser | null>
			>;
			findUnique: jest.MockedFunction<
				(...args: any[]) => Promise<HouseToUser | null>
			>;
			create: jest.MockedFunction<
				(...args: any[]) => Promise<HouseToUser | null>
			>;
			delete: jest.MockedFunction<
				(...args: any[]) => Promise<HouseToUser | null>
			>;
			deleteMany: jest.MockedFunction<
				(...args: any[]) => Promise<{ count: number }>
			>;
		};
	};

	const mockPrismaService: MockPrisma = {
		user: {
			findFirst: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<UserType | null>
			>,
			findUnique: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<UserType | null>
			>,
			update: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<UserType>
			>,
		},
		refreshToken: {
			updateMany: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<{ count: number }>
			>,
		},
		notificationToUser: {
			findFirst: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<NotificationToUser | null>
			>,
		},
		house: {
			findFirst: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<House | null>
			>,
			findUnique: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<House | null>
			>,
		},
		houseToUser: {
			findFirst: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<HouseToUser | null>
			>,
			findUnique: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<HouseToUser | null>
			>,
			create: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<HouseToUser | null>
			>,
			delete: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<HouseToUser | null>
			>,
			deleteMany: jest.fn() as jest.MockedFunction<
				(...args: any[]) => Promise<{ count: number }>
			>,
		},
	};

	const mockImageService = {
		uploadImage: jest.fn(),
		deleteImage: jest.fn(),
	};

	const mockNotificationService = {
		create: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: ImageService, useValue: mockImageService },
				{
					provide: NotificationsService,
					useValue: mockNotificationService,
				},
			],
		}).compile();

		service = module.get<UserService>(UserService);
		jest.resetAllMocks();
		mockPrismaService.notificationToUser.findFirst.mockResolvedValue(null);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findOne', () => {
		it('returns the user when found and not deleted', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

			const result = await service.findOne(mockUser.id);

			expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
				where: { id: mockUser.id, deletedAt: null },
				select: expect.any(Object) as unknown as object,
			});
			expect(result).toEqual(mockUser);
		});

		it('throws NotFoundException when user not found', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(service.findOne('no-id')).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('update', () => {
		it('updates allowed fields and returns updated user', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
			const updated = { ...mockUser, name: 'Updated' };
			mockPrismaService.user.update.mockResolvedValue(updated);

			const dto: UpdateUserDto = { name: 'Updated' };
			const result = await service.update(mockUser.id, dto);

			expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
				where: { id: mockUser.id, deletedAt: null },
			});
			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: { name: 'Updated' },
				select: expect.any(Object) as unknown as object,
			});
			expect(result).toEqual(updated);
		});

		it('throws NotFoundException when user not found', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(
				service.update('no-id', { name: 'X' } as UpdateUserDto),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('remove', () => {
		it('soft-deletes user and revokes refresh tokens', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
			mockPrismaService.user.update.mockResolvedValue({
				...mockUser,
				deletedAt: new Date(),
			});
			mockPrismaService.refreshToken.updateMany.mockResolvedValue({
				count: 2,
			});
			mockPrismaService.houseToUser.deleteMany.mockResolvedValue({
				count: 1,
			});

			const result = await service.remove(mockUser.id);

			expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
				where: { id: mockUser.id, deletedAt: null },
			});
			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: { deletedAt: expect.any(Date) as Date },
			});
			expect(
				mockPrismaService.houseToUser.deleteMany,
			).toHaveBeenCalledWith({
				where: { userId: mockUser.id },
			});
			expect(
				mockPrismaService.refreshToken.updateMany,
			).toHaveBeenCalledWith({
				where: { userId: mockUser.id, isRevoked: false },
				data: { isRevoked: true, revokedAt: expect.any(Date) as Date },
			});
			expect(result).toEqual({ success: true });
		});

		it('throws NotFoundException when user not found', async () => {
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(service.remove('no-id')).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('uploadImage', () => {
		const mockFile: MulterFile = {
			buffer: Buffer.from('test'),
			originalname: 'test.jpg',
			mimetype: 'image/jpeg',
			size: 1024,
			encoding: '7bit',
			fieldname: 'file',
			destination: '/tmp',
			filename: 'test.jpg',
			path: '/tmp/test.jpg',
			stream: new Readable(),
		};

		it('uploads image successfully and returns updated user', async () => {
			const userWithImage = {
				...mockUser,
				imageUrl: 'https://cloudinary.com/old-image.jpg',
				imagePublicId: 'old-public-id',
			};
			mockPrismaService.user.findUnique.mockResolvedValue(userWithImage);
			mockImageService.uploadImage.mockResolvedValue({
				url: 'https://cloudinary.com/new-image.jpg',
				publicId: 'new-public-id',
			});
			const updatedUser = {
				...mockUser,
				imageUrl: 'https://cloudinary.com/new-image.jpg',
			};
			mockPrismaService.user.update.mockResolvedValue(updatedUser);

			const result = await service.uploadImage(mockUser.id, mockFile);

			expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
				where: { id: mockUser.id },
			});
			expect(mockImageService.uploadImage).toHaveBeenCalledWith(
				mockFile,
				'users',
			);
			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: {
					imageUrl: 'https://cloudinary.com/new-image.jpg',
					imagePublicId: 'new-public-id',
				},
				select: expect.any(Object) as unknown as object,
			});
			expect(mockImageService.deleteImage).toHaveBeenCalledWith(
				'old-public-id',
			);
			expect(result).toEqual(updatedUser);
		});

		it('uploads image without deleting old image when user has no previous image', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
			mockImageService.uploadImage.mockResolvedValue({
				url: 'https://cloudinary.com/new-image.jpg',
				publicId: 'new-public-id',
			});
			const updatedUser = {
				...mockUser,
				imageUrl: 'https://cloudinary.com/new-image.jpg',
			};
			mockPrismaService.user.update.mockResolvedValue(updatedUser);

			const result = await service.uploadImage(mockUser.id, mockFile);

			expect(mockImageService.uploadImage).toHaveBeenCalledWith(
				mockFile,
				'users',
			);
			expect(mockImageService.deleteImage).not.toHaveBeenCalled();
			expect(result).toEqual(updatedUser);
		});

		it('throws NotFoundException when user not found', async () => {
			mockPrismaService.user.findUnique.mockResolvedValue(null);

			await expect(
				service.uploadImage('no-id', mockFile),
			).rejects.toThrow(NotFoundException);
		});

		it('throws NotFoundException when user is deleted', async () => {
			const deletedUser = { ...mockUser, deletedAt: new Date() };
			mockPrismaService.user.findUnique.mockResolvedValue(deletedUser);

			await expect(
				service.uploadImage(mockUser.id, mockFile),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('joinHouseWithCode', () => {
		const mockHouse = {
			id: 'house-id-1',
			invitationCode: 'INVITE123',
			name: 'Test House',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockHouseToUser = {
			id: 'house-to-user-id-1',
			houseId: mockHouse.id,
			userId: mockUser.id,
			role: '',
			joinedAt: new Date(),
		};

		it('throws BadRequestException if no code is sent', async () => {
			await expect(
				service.joinHouseWithCode(mockUser.id, {
					inviteCode: '',
				}),
			).rejects.toThrow(BadRequestException);
		});

		it('throws NotFoundException if house with code does not exist', async () => {
			mockPrismaService.house.findFirst.mockResolvedValue(null);

			await expect(
				service.joinHouseWithCode(mockUser.id, {
					inviteCode: 'INVALID',
				}),
			).rejects.toThrow(NotFoundException);

			expect(mockPrismaService.house.findFirst).toHaveBeenCalledWith({
				where: { invitationCode: 'INVALID' },
			});
		});

		it('throws BadRequestException if user is already in the house', async () => {
			mockPrismaService.house.findFirst.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockHouseToUser,
			);

			await expect(
				service.joinHouseWithCode(mockUser.id, {
					inviteCode: 'ABC123',
				}),
			).rejects.toThrow(BadRequestException);

			expect(
				mockPrismaService.houseToUser.findFirst,
			).toHaveBeenCalledWith({
				where: { houseId: mockHouse.id, userId: mockUser.id },
			});
		});

		it('adds user to house if everything is correct', async () => {
			mockPrismaService.house.findFirst.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(null);
			mockPrismaService.houseToUser.create.mockResolvedValue(
				mockHouseToUser,
			);

			const result = await service.joinHouseWithCode(mockUser.id, {
				inviteCode: 'ABC123',
			});

			expect(mockPrismaService.house.findFirst).toHaveBeenCalledWith({
				where: { invitationCode: 'ABC123' },
			});
			expect(
				mockPrismaService.houseToUser.findFirst,
			).toHaveBeenCalledWith({
				where: { houseId: mockHouse.id, userId: mockUser.id },
			});
			expect(mockPrismaService.houseToUser.create).toHaveBeenCalledWith({
				data: { houseId: mockHouse.id, userId: mockUser.id },
			});

			expect(result).toEqual({ houseId: 'house-id-1' });
		});

		it('returns houseId null if create fails', async () => {
			mockPrismaService.house.findFirst.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(null);
			mockPrismaService.houseToUser.create.mockResolvedValue(null);

			const result = await service.joinHouseWithCode(mockUser.id, {
				inviteCode: 'ABC123',
			});

			expect(result).toEqual({ houseId: null });
		});
	});

	describe('inviteToHouse', () => {
		const mockHouse = {
			id: 'house-id-1',
			name: 'Test House',
			invitationCode: 'INV123',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockInvitedUser = {
			id: 'invited-user-id',
			name: 'Invited User',
			email: 'invite@test.com',
			username: 'invitedUser',
			imageUrl: null,
			imagePublicId: null,
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockInvitingUser = {
			id: 'inviting-user-id',
			name: 'Inviting User',
			email: 'inviter@test.com',
			username: 'invitingUser',
			imageUrl: null,
			imagePublicId: null,
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it('throws BadRequestException if no email or username is provided', async () => {
			await expect(
				service.inviteToHouse(
					{ houseId: 'house-id-1', email: '', username: '' },
					mockInvitingUser.id,
				),
			).rejects.toThrow(BadRequestException);
		});

		it('throws NotFoundException if house does not exist', async () => {
			mockPrismaService.house.findUnique.mockResolvedValueOnce(null);

			await expect(
				service.inviteToHouse(
					{ houseId: 'invalid-house', email: 'test@test.com' },
					mockInvitingUser.id,
				),
			).rejects.toThrow(NotFoundException);

			expect(mockPrismaService.house.findUnique).toHaveBeenCalledWith({
				where: { id: 'invalid-house' },
			});
		});

		it('throws BadRequestException if invited user does not exist', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.user.findFirst.mockResolvedValue(null);

			await expect(
				service.inviteToHouse(
					{ houseId: mockHouse.id, email: 'missing@test.com' },
					mockInvitingUser.id,
				),
			).rejects.toThrow(BadRequestException);
		});

		it('throws BadRequestException if user is already in house', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.user.findFirst.mockResolvedValue(mockInvitedUser);

			mockPrismaService.houseToUser.findFirst.mockResolvedValue({
				id: 'houseToUserId',
				houseId: mockHouse.id,
				userId: mockInvitedUser.id,
				role: null,
				joinedAt: new Date(),
			});

			await expect(
				service.inviteToHouse(
					{ houseId: mockHouse.id, email: mockInvitedUser.email },
					mockInvitingUser.id,
				),
			).rejects.toThrow(BadRequestException);
		});

		it('throws BadRequestException if inviting user does not exist', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.user.findFirst.mockResolvedValue(mockInvitedUser);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(null);

			mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

			await expect(
				service.inviteToHouse(
					{ houseId: mockHouse.id, email: mockInvitedUser.email },
					mockInvitingUser.id,
				),
			).rejects.toThrow(BadRequestException);
		});

		it('throws BadRequestException if inviting user is not a member of the house', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.user.findFirst.mockResolvedValue(mockInvitedUser);
			mockPrismaService.houseToUser.findFirst
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce(null);
			mockPrismaService.user.findUnique.mockResolvedValue(
				mockInvitingUser,
			);

			await expect(
				service.inviteToHouse(
					{ houseId: mockHouse.id, email: mockInvitedUser.email },
					mockInvitingUser.id,
				),
			).rejects.toThrow(BadRequestException);
		});

		it('throws BadRequestException if second house check fails', async () => {
			mockPrismaService.house.findUnique
				.mockResolvedValueOnce(mockHouse) // first check
				.mockResolvedValueOnce(null); // second check

			mockPrismaService.user.findFirst.mockResolvedValue(mockInvitedUser);
			mockPrismaService.houseToUser.findFirst
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce({
					id: 'membership-id',
					houseId: mockHouse.id,
					userId: mockInvitingUser.id,
					role: null,
					joinedAt: new Date(),
				});
			mockPrismaService.user.findUnique.mockResolvedValue(
				mockInvitingUser,
			);

			await expect(
				service.inviteToHouse(
					{ houseId: mockHouse.id, email: mockInvitedUser.email },
					mockInvitingUser.id,
				),
			).rejects.toThrow(BadRequestException);
		});

		it('throws BadRequestException if user already has a pending invite', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.user.findFirst.mockResolvedValue(mockInvitedUser);
			mockPrismaService.houseToUser.findFirst
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce({
					id: 'membership-id',
					houseId: mockHouse.id,
					userId: mockInvitingUser.id,
					role: null,
					joinedAt: new Date(),
				});
			mockPrismaService.user.findUnique.mockResolvedValue(
				mockInvitingUser,
			);
			mockPrismaService.notificationToUser.findFirst.mockResolvedValue({
				id: 'notif-to-user-id',
				userId: mockInvitedUser.id,
				notificationId: 'notification-id',
				isRead: false,
				readAt: null,
				deletedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await expect(
				service.inviteToHouse(
					{ houseId: mockHouse.id, email: mockInvitedUser.email },
					mockInvitingUser.id,
				),
			).rejects.toThrow(BadRequestException);

			expect(
				mockPrismaService.notificationToUser.findFirst,
			).toHaveBeenCalled();
		});

		it('creates a notification successfully when everything is correct', async () => {
			mockPrismaService.house.findUnique
				.mockResolvedValueOnce(mockHouse) // first call
				.mockResolvedValueOnce(mockHouse); // second call

			mockPrismaService.user.findFirst.mockResolvedValue(mockInvitedUser);
			mockPrismaService.houseToUser.findFirst
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce({
					id: 'membership-id',
					houseId: mockHouse.id,
					userId: mockInvitingUser.id,
					role: null,
					joinedAt: new Date(),
				});
			mockPrismaService.user.findUnique.mockResolvedValue(
				mockInvitingUser,
			);

			const notificationResult = { id: 'notif-id-1' };
			mockNotificationService.create.mockResolvedValue(
				notificationResult,
			);

			const result = await service.inviteToHouse(
				{ houseId: mockHouse.id, email: mockInvitedUser.email },
				mockInvitingUser.id,
			);

			expect(mockNotificationService.create).toHaveBeenCalledWith({
				title: `${mockInvitingUser.name} invited you to join a house!`,
				body: `${mockInvitingUser.name} invited you to join the house ${mockHouse.name}, use the following code to join: ${mockHouse.invitationCode}`,
				userIds: [mockInvitedUser.id],
				level: NotificationLevel.MEDIUM,
				category: NotificationCategory.HOUSE,
				actionUrl: '/invite',
				houseId: mockHouse.id,
			});

			expect(result).toEqual(notificationResult);
		});
	});

	describe('leaveHouse', () => {
		const mockHouse = {
			id: 'house-id-1',
			name: 'Test House',
			invitationCode: 'INV123',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const mockHouseToUser = {
			id: 'houseToUser-id-1',
			houseId: mockHouse.id,
			userId: 'user-id-1',
			role: null,
			joinedAt: new Date(),
		};

		it('throws NotFoundException if house does not exist', async () => {
			mockPrismaService.house.findUnique.mockResolvedValueOnce(null);

			await expect(
				service.leaveHouse('user-id-1', 'invalid-house-id'),
			).rejects.toThrow(NotFoundException);

			expect(mockPrismaService.house.findUnique).toHaveBeenCalledWith({
				where: { id: 'invalid-house-id' },
			});
		});

		it('throws NotFoundException if user is not in the house', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValueOnce(null);

			await expect(
				service.leaveHouse('user-id-1', mockHouse.id),
			).rejects.toThrow(NotFoundException);

			expect(
				mockPrismaService.houseToUser.findFirst,
			).toHaveBeenCalledWith({
				where: { houseId: mockHouse.id, userId: 'user-id-1' },
			});
		});

		it('deletes the houseToUser relation and returns it if user is in the house', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockHouseToUser,
			);
			mockPrismaService.houseToUser.delete.mockResolvedValue(
				mockHouseToUser,
			);

			const result = await service.leaveHouse('user-id-1', mockHouse.id);

			expect(mockPrismaService.houseToUser.delete).toHaveBeenCalledWith({
				where: { id: mockHouseToUser.id },
			});
			expect(result).toEqual(mockHouseToUser);
		});
	});
});
