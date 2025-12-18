import { Test, TestingModule } from '@nestjs/testing';
import {
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import { WebsocketService } from '../shared/websockets/websocket.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChatService', () => {
	let service: ChatService;

	const mockPrismaService = {
		house: { findUnique: jest.fn() },
		houseToUser: { findFirst: jest.fn() },
		chatMessage: {
			create: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			findMany: jest.fn(),
			findUnique: jest.fn(),
		},
		messageReadLog: {
			findUnique: jest.fn(),
			create: jest.fn(),
			findMany: jest.fn(),
			createMany: jest.fn(),
		},
		user: {
			findUnique: jest.fn(),
		},
		notification: {
			create: jest.fn(),
		},
	};

	const mockWebsocketService = {
		trigger: jest.fn(),
	};

	const mockHouse = { id: 'house1' };
	const mockMembership = {
		id: 'membership1',
		userId: 'user1',
		houseId: 'house1',
	};
	// Valid UUID for testing
	const validUuid = '123e4567-e89b-12d3-a456-426614174000';
	const mockUser = { id: 'user1', name: 'User One' };
	const mockMessage = {
		id: validUuid,
		content: 'Hello',
		userId: 'user1',
		houseId: 'house1',
		createdAt: new Date(),
		updatedAt: new Date(),
		user: mockUser,
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ChatService,
				{ provide: PrismaService, useValue: mockPrismaService },
				{ provide: WebsocketService, useValue: mockWebsocketService },
			],
		}).compile();

		service = module.get<ChatService>(ChatService);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create a chat message', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockMembership,
			);
			mockPrismaService.chatMessage.create.mockResolvedValue({
				...mockMessage,
			});

			const dto: CreateChatMessageDto = {
				content: 'Hello',
			} as CreateChatMessageDto;
			const result = await service.create(dto, 'user1', 'house1');

			expect(mockPrismaService.chatMessage.create).toHaveBeenCalled();
			expect(result).toEqual({ ...mockMessage });
		});

		it('should throw NotFoundException if house not found', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(null);
			const dtoNotFound: CreateChatMessageDto = {
				content: 'Hi',
			} as CreateChatMessageDto;
			await expect(
				service.create(dtoNotFound, 'user1', 'houseX'),
			).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException if user not member of house', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(null);
			const dtoForbidden: CreateChatMessageDto = {
				content: 'Hi',
			} as CreateChatMessageDto;
			await expect(
				service.create(dtoForbidden, 'user1', 'house1'),
			).rejects.toThrow(ForbiddenException);
		});

		it('should throw BadRequestException if parent does not exist', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockMembership,
			);
			mockPrismaService.chatMessage.findUnique.mockResolvedValue(null);
			const dtoBadParent: CreateChatMessageDto = {
				content: 'Hi',
				parentId: 'bad',
			} as CreateChatMessageDto;
			await expect(
				service.create(dtoBadParent, 'user1', 'house1'),
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException if parent belongs to different house', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockMembership,
			);
			mockPrismaService.chatMessage.findUnique.mockResolvedValue({
				id: 'parent',
				houseId: 'otherHouse',
			});
			const dtoParentDiffHouse: CreateChatMessageDto = {
				content: 'Hi',
				parentId: 'parent',
			} as CreateChatMessageDto;
			await expect(
				service.create(dtoParentDiffHouse, 'user1', 'house1'),
			).rejects.toThrow(BadRequestException);
		});

		it('should create a chat message with parentId', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockMembership,
			);
			mockPrismaService.chatMessage.findUnique.mockResolvedValue({
				id: 'parent',
				houseId: 'house1',
			});
			mockPrismaService.chatMessage.create.mockResolvedValue({
				...mockMessage,
				parentId: 'parent',
			});

			const dto: CreateChatMessageDto = {
				content: 'Reply',
				parentId: 'parent',
			} as CreateChatMessageDto;
			const result = await service.create(dto, 'user1', 'house1');

			expect(mockPrismaService.chatMessage.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						parentId: 'parent',
					}) as object,
				}),
			);
			expect(result.parentId).toBe('parent');
		});

		it('should create a notification when replying to another user', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockMembership,
			);
			mockPrismaService.chatMessage.findUnique.mockResolvedValue({
				id: 'parent',
				houseId: 'house1',
				userId: 'otherUser',
			});
			mockPrismaService.chatMessage.create.mockResolvedValue({
				...mockMessage,
				parentId: 'parent',
				parent: {
					userId: 'otherUser',
				},
			});

			const dto: CreateChatMessageDto = {
				content: 'Reply',
				parentId: 'parent',
			} as CreateChatMessageDto;
			await service.create(dto, 'user1', 'house1');

			expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
				expect.objectContaining({
					data: expect.objectContaining({
						category: 'CHAT',
						level: 'MEDIUM',
						houseId: 'house1',
						deliveredTo: {
							create: {
								userId: 'otherUser',
							},
						},
					}) as object,
				}),
			);
		});
		it('should throw BadRequestException if content is missing or not string', async () => {
			const dtoMissing = {} as CreateChatMessageDto;
			await expect(
				service.create(dtoMissing, 'user1', 'house1'),
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException if content is empty', async () => {
			const dtoEmpty: CreateChatMessageDto = {
				content: '   ',
			} as CreateChatMessageDto;
			await expect(
				service.create(dtoEmpty, 'user1', 'house1'),
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('update', () => {
		it('should update the message if author', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue(
				mockMessage,
			);
			mockPrismaService.chatMessage.update.mockResolvedValue({
				...mockMessage,
				content: 'Updated',
			});
			const updateDto: UpdateChatMessageDto = {
				content: 'Updated',
			} as UpdateChatMessageDto;
			const result = await service.update(validUuid, updateDto, 'user1');
			expect(mockPrismaService.chatMessage.update).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: validUuid } }),
			);
			expect(result.content).toBe('Updated');
		});

		it('should throw NotFoundException if message not found', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue(null);
			const badUpdateDto: UpdateChatMessageDto = {
				content: 'x',
			} as UpdateChatMessageDto;
			// For update we haven't added validation yet in the service, but let's use validUuid to be safe/consistent
			// or stick to 'bad' if we didn't change update.
			// The user only showed errors in remove, but I should probably update 'update' tests too if I change mockMessage.id
			await expect(
				service.update(validUuid, badUpdateDto, 'user1'),
			).rejects.toThrow(NotFoundException);
		});

		it('should throw ForbiddenException if not author', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue({
				...mockMessage,
				userId: 'otherUser',
			});
			const notAuthorUpdateDto: UpdateChatMessageDto = {
				content: 'x',
			} as UpdateChatMessageDto;
			await expect(
				service.update(validUuid, notAuthorUpdateDto, 'user1'),
			).rejects.toThrow(ForbiddenException);
		});
		it('should throw BadRequestException if content is missing or not string', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue(
				mockMessage,
			);
			const dtoMissing = {} as UpdateChatMessageDto;
			await expect(
				service.update(validUuid, dtoMissing, 'user1'),
			).rejects.toThrow(BadRequestException);
		});

		it('should throw BadRequestException if content is empty', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue(
				mockMessage,
			);
			const dtoEmpty: UpdateChatMessageDto = {
				content: '   ',
			} as UpdateChatMessageDto;
			await expect(
				service.update(validUuid, dtoEmpty, 'user1'),
			).rejects.toThrow(BadRequestException);
		});
	});

	describe('remove', () => {
		it('should delete the message if author', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue(
				mockMessage,
			);
			mockPrismaService.chatMessage.delete.mockResolvedValue(mockMessage);
			const result = await service.remove(validUuid, 'user1');
			expect(mockPrismaService.chatMessage.delete).toHaveBeenCalledWith({
				where: { id: validUuid },
			});
			expect(result).toEqual({ id: validUuid });
		});

		it('should throw NotFoundException if message not found', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue(null);
			// Use validUuid here to ensure it passes validation but fails DB lookup
			await expect(service.remove(validUuid, 'user1')).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw ForbiddenException if not author', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue({
				...mockMessage,
				userId: 'otherUser',
			});
			await expect(service.remove(validUuid, 'user1')).rejects.toThrow(
				ForbiddenException,
			);
		});
	});

	describe('read', () => {
		it('should return paginated results with nextCursor when more than limit', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockMembership,
			);
			// Create array of 21 messages
			const messages = Array.from({ length: 21 }).map((_, i) => ({
				id: `msg-${i}`,
				content: `m${i}`,
				userId: 'user1',
				houseId: 'house1',
				createdAt: new Date(),
				updatedAt: new Date(),
				user: mockUser,
			}));
			const expectedCursor = messages[19].id;
			mockPrismaService.chatMessage.findMany.mockResolvedValue([
				...messages,
			]);
			const res = await service.read('house1', 'user1', 20);
			expect(res.messages.length).toBe(20);
			expect(res.nextCursor).toBe(expectedCursor);
		});

		it('should return nextCursor null when less or equal to limit', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockMembership,
			);
			const messages = Array.from({ length: 5 }).map((_, i) => ({
				id: `m${i}`,
				content: `m${i}`,
				userId: 'user1',
				houseId: 'house1',
				createdAt: new Date(),
				updatedAt: new Date(),
				user: mockUser,
			}));
			mockPrismaService.chatMessage.findMany.mockResolvedValue(messages);
			const res = await service.read('house1', 'user1', 20);
			expect(res.nextCursor).toBeNull();
			expect(res.messages.length).toBe(5);
		});

		it('should use default limit if not provided', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockMembership,
			);
			mockPrismaService.chatMessage.findMany.mockResolvedValue([]);

			await service.read('house1', 'user1');

			expect(mockPrismaService.chatMessage.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					take: 21,
				}),
			);
		});

		it('should use cursor if provided', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(
				mockMembership,
			);
			mockPrismaService.chatMessage.findMany.mockResolvedValue([]);
			await service.read('house1', 'user1', 20, 'cursorId');
			expect(mockPrismaService.chatMessage.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					cursor: { id: 'cursorId' },
					skip: 1,
				}),
			);
		});

		it('should throw NotFound if house not found', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(null);
			await expect(service.read('bad', 'user1', 20)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw Forbidden if not a member', async () => {
			mockPrismaService.house.findUnique.mockResolvedValue(mockHouse);
			mockPrismaService.houseToUser.findFirst.mockResolvedValue(null);
			await expect(service.read('house1', 'user1', 20)).rejects.toThrow(
				ForbiddenException,
			);
		});
	});

	describe('markMessagesAsRead', () => {
		it('should return count 0 if no messageIds provided', async () => {
			const res = await service.markMessagesAsRead([], 'user1');
			expect(res).toEqual({ count: 0 });
		});

		it('should filter existing logs and create new ones', async () => {
			mockPrismaService.messageReadLog.findMany.mockResolvedValue([
				{ messageId: 'msg1' },
			]);
			mockPrismaService.messageReadLog.createMany.mockResolvedValue({
				count: 1,
			});
			mockPrismaService.chatMessage.findMany.mockResolvedValue([
				{ id: 'msg2', houseId: 'house1' },
			]);
			mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

			const res = await service.markMessagesAsRead(
				['msg1', 'msg2'],
				'user1',
			);

			expect(
				mockPrismaService.messageReadLog.createMany,
			).toHaveBeenCalledWith({
				data: [{ messageId: 'msg2', userId: 'user1' }],
				skipDuplicates: true,
			});
			expect(mockWebsocketService.trigger).toHaveBeenCalledWith(
				'house-house1-chat',
				'message-read',
				expect.objectContaining({
					messageId: 'msg2',
					userId: 'user1',
				}),
			);
			expect(res).toEqual({ count: 1 });
		});

		it('should return count 0 if all messages already read', async () => {
			mockPrismaService.messageReadLog.findMany.mockResolvedValue([
				{ messageId: 'msg1' },
			]);
			const res = await service.markMessagesAsRead(['msg1'], 'user1');
			expect(
				mockPrismaService.messageReadLog.createMany,
			).not.toHaveBeenCalled();
			expect(res).toEqual({ count: 0 });
		});
	});
});
