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
	const mockUser = { id: 'user1', name: 'User One' };
	const mockMessage = {
		id: 'msg1',
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
			const result = await service.update('msg1', updateDto, 'user1');
			expect(mockPrismaService.chatMessage.update).toHaveBeenCalledWith(
				expect.objectContaining({ where: { id: 'msg1' } }),
			);
			expect(result.content).toBe('Updated');
		});

		it('should throw NotFoundException if message not found', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue(null);
			const badUpdateDto: UpdateChatMessageDto = {
				content: 'x',
			} as UpdateChatMessageDto;
			await expect(
				service.update('bad', badUpdateDto, 'user1'),
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
				service.update('msg1', notAuthorUpdateDto, 'user1'),
			).rejects.toThrow(ForbiddenException);
		});
	});

	describe('remove', () => {
		it('should delete the message if author', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue(
				mockMessage,
			);
			mockPrismaService.chatMessage.delete.mockResolvedValue(mockMessage);
			const result = await service.remove('msg1', 'user1');
			expect(mockPrismaService.chatMessage.delete).toHaveBeenCalledWith({
				where: { id: 'msg1' },
			});
			expect(result).toEqual({ id: 'msg1' });
		});

		it('should throw NotFoundException if message not found', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue(null);
			await expect(service.remove('bad', 'user1')).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw ForbiddenException if not author', async () => {
			mockPrismaService.chatMessage.findFirst.mockResolvedValue({
				...mockMessage,
				userId: 'otherUser',
			});
			await expect(service.remove('msg1', 'user1')).rejects.toThrow(
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
});
