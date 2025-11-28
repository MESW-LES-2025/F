import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import type { ReadChatMessagesDto } from './dto/read-chat-messages.dto';
import type { UserRequest } from 'src/shared/types/user_request';
import type { ChatMessage as PrismaChatMessage } from '@prisma/client';

describe('ChatController', () => {
	let controller: ChatController;

	const mockService = {
		create: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
		read: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ChatController],
			providers: [{ provide: ChatService, useValue: mockService }],
		}).compile();

		controller = module.get<ChatController>(ChatController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('sendMessage should call service.create', async () => {
		mockService.create.mockResolvedValue({ id: 'msg1' });
		const body: CreateChatMessageDto = {
			content: 'Hello',
		} as CreateChatMessageDto;
		const req: UserRequest = { user: { userId: 'user1' } };
		await controller.sendMessage(body, req, 'house1');
		expect(mockService.create).toHaveBeenCalledWith(
			body,
			'user1',
			'house1',
		);
	});

	it('editMessage should call service.update', async () => {
		mockService.update.mockResolvedValue({
			id: 'msg1',
			content: 'Updated',
		});
		const req: UserRequest = { user: { userId: 'user1' } };
		const updateDto: UpdateChatMessageDto = {
			content: 'Updated',
		} as UpdateChatMessageDto;
		await controller.editMessage('msg1', updateDto, req);
		expect(mockService.update).toHaveBeenCalledWith(
			'msg1',
			updateDto,
			'user1',
		);
	});

	it('deleteMessage should call service.remove', async () => {
		mockService.remove.mockResolvedValue({ id: 'msg1' });
		const req: UserRequest = { user: { userId: 'user1' } };
		await controller.deleteMessage('msg1', req);
		expect(mockService.remove).toHaveBeenCalledWith('msg1', 'user1');
	});

	it('read should call service.read and return result', async () => {
		const readResult = { messages: [], nextCursor: null };
		mockService.read.mockResolvedValue(readResult);
		const req: UserRequest = { user: { userId: 'user1' } };
		const query: ReadChatMessagesDto = { limit: 20 } as ReadChatMessagesDto;
		const res = await controller.read('house1', query, req);
		expect(mockService.read).toHaveBeenCalledWith(
			'house1',
			'user1',
			20,
			undefined,
		);
		expect(res).toEqual(readResult);
	});

	it('sendMessage should return created message and support parentId', async () => {
		const created: PrismaChatMessage = {
			id: 'msg-1',
			content: 'Hi',
			userId: 'user1',
			houseId: 'house1',
			parentId: 'parent',
			createdAt: new Date(),
			updatedAt: new Date(),
			// Prisma ChatMessage type includes relations, but minimal form OK
		} as unknown as PrismaChatMessage;
		mockService.create.mockResolvedValue(created);
		const body: CreateChatMessageDto = {
			content: 'Hi',
			parentId: 'parent',
		} as CreateChatMessageDto;
		const req: UserRequest = { user: { userId: 'user1' } };
		const res = await controller.sendMessage(body, req, 'house1');
		expect(mockService.create).toHaveBeenCalledWith(
			body,
			'user1',
			'house1',
		);
		expect(res).toEqual(created);
	});

	it('sendMessage should propagate service errors', async () => {
		mockService.create.mockRejectedValue(new Error('bad'));
		const body: CreateChatMessageDto = {
			content: 'Hi',
		} as CreateChatMessageDto;
		const req: UserRequest = { user: { userId: 'user1' } };
		await expect(
			controller.sendMessage(body, req, 'house1'),
		).rejects.toThrow('bad');
	});

	it('editMessage should propagate service errors', async () => {
		mockService.update.mockRejectedValue(new Error('not allowed'));
		const req: UserRequest = { user: { userId: 'user1' } };
		const updateDto: UpdateChatMessageDto = {
			content: 'X',
		} as UpdateChatMessageDto;
		await expect(
			controller.editMessage('msg1', updateDto, req),
		).rejects.toThrow('not allowed');
	});

	it('deleteMessage should propagate service errors', async () => {
		mockService.remove.mockRejectedValue(new Error('not found'));
		const req: UserRequest = { user: { userId: 'user1' } };
		await expect(controller.deleteMessage('msg1', req)).rejects.toThrow(
			'not found',
		);
	});
});
