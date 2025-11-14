import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageService } from 'src/shared/image/image.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { MulterFile } from 'src/shared/types/multer_file';
import { Readable } from 'stream';

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
		refreshToken: {
			updateMany: jest.MockedFunction<
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
	};

	const mockImageService = {
		uploadImage: jest.fn(),
		deleteImage: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: ImageService, useValue: mockImageService },
			],
		}).compile();

		service = module.get<UserService>(UserService);
		jest.clearAllMocks();
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

			const result = await service.remove(mockUser.id);

			expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
				where: { id: mockUser.id, deletedAt: null },
			});
			expect(mockPrismaService.user.update).toHaveBeenCalledWith({
				where: { id: mockUser.id },
				data: { deletedAt: expect.any(Date) as Date },
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

	describe('join house', () => {
		// to-do
	});
});
