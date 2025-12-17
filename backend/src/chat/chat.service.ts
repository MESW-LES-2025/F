import {
	Injectable,
	NotFoundException,
	ForbiddenException,
	BadRequestException,
} from '@nestjs/common';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

import { WebsocketService } from '../shared/websockets/websocket.service';

@Injectable()
export class ChatService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly websocketService: WebsocketService,
	) {}

	async create(
		createChatMessageDto: CreateChatMessageDto,
		userId: string,
		houseId: string,
	) {
		if (
			!createChatMessageDto ||
			typeof createChatMessageDto.content !== 'string'
		) {
			throw new BadRequestException('Content is required');
		}
		const content = createChatMessageDto.content.trim();
		if (!content) {
			throw new BadRequestException('Message content cannot be empty');
		}

		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});
		if (!house) {
			throw new NotFoundException('House not found');
		}

		const membership = await this.prisma.houseToUser.findFirst({
			where: { userId, houseId },
		});
		if (!membership) {
			throw new ForbiddenException('You do not belong to this house');
		}

		// If parentId provided, validate that the parent message exists and belongs to same house
		const parentId: string | undefined = createChatMessageDto.parentId;
		if (parentId) {
			const parentMessage = await this.prisma.chatMessage.findUnique({
				where: { id: parentId },
			});
			if (!parentMessage) {
				throw new BadRequestException('Parent message not found');
			}
			if (parentMessage.houseId !== houseId) {
				throw new BadRequestException(
					'Parent message belongs to different house',
				);
			}
		}

		const data: Prisma.ChatMessageUncheckedCreateInput = {
			content,
			userId,
			houseId,
			...(parentId ? { parentId } : {}),
		} as Prisma.ChatMessageUncheckedCreateInput;

		const message = await this.prisma.chatMessage.create({
			data,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						imageUrl: true,
					},
				},
				parent: {
					select: {
						id: true,
						content: true,
						userId: true,
						user: {
							select: { id: true, name: true, imageUrl: true },
						},
					},
				},
			},
		});

		await this.websocketService.trigger(
			`house-${houseId}-chat`,
			'message-created',
			message,
		);

		// Create notification for reply
		if (message.parent && message.parent.userId !== userId) {
			await this.prisma.notification.create({
				data: {
					category: 'CHAT',
					level: 'MEDIUM',
					title: `${message.user.name} replied to your message`,
					body: message.content,
					actionUrl: `/chat?houseId=${houseId}&messageId=${message.id}`,
					houseId,
					deliveredTo: {
						create: {
							userId: message.parent.userId,
						},
					},
				},
			});
		}

		return message;
	}

	async update(
		id: string,
		updateChatMessageDto: UpdateChatMessageDto,
		userId: string,
	) {
		const message = await this.prisma.chatMessage.findFirst({
			where: { id },
		});

		if (!message) {
			throw new NotFoundException('Message not found');
		}

		if (message.userId !== userId) {
			throw new ForbiddenException(
				'You are not the author of this message',
			);
		}

		if (
			!updateChatMessageDto ||
			typeof updateChatMessageDto.content !== 'string'
		) {
			throw new BadRequestException('Content is required');
		}
		const content = updateChatMessageDto.content.trim();
		if (!content) {
			throw new BadRequestException('Message content cannot be empty');
		}

		const updated = await this.prisma.chatMessage.update({
			where: { id },
			data: { content },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						imageUrl: true,
					},
				},
				parent: {
					select: {
						id: true,
						content: true,
						userId: true,
						user: {
							select: { id: true, name: true, imageUrl: true },
						},
					},
				},
			},
		});

		await this.websocketService.trigger(
			`house-${message.houseId}-chat`,
			'message-updated',
			updated,
		);

		return updated;
	}

	async remove(id: string, userId: string) {
		// Validate uuid to prevent P2023 (Prisma crash on invalid uuid)
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(id)) {
			throw new NotFoundException('Message not found (invalid id)');
		}

		const message = await this.prisma.chatMessage.findFirst({
			where: { id },
		});
		if (!message) {
			throw new NotFoundException('Message not found');
		}

		if (message.userId !== userId) {
			throw new ForbiddenException(
				'You are not the author of this message',
			);
		}

		await this.prisma.chatMessage.delete({ where: { id } });

		await this.websocketService.trigger(
			`house-${message.houseId}-chat`,
			'message-deleted',
			{ id },
		);

		return { id };
	}

	async read(houseId: string, userId: string, limit = 20, cursor?: string) {
		// Validate limit
		const take = Math.min(Math.max(1, limit), 100);

		// Verify house exists
		const house = await this.prisma.house.findUnique({
			where: { id: houseId },
		});
		if (!house) {
			throw new NotFoundException('House not found');
		}

		// Verify user belongs to the house
		const membership = await this.prisma.houseToUser.findFirst({
			where: { userId, houseId },
		});
		if (!membership) {
			throw new ForbiddenException('You do not belong to this house');
		}

		// Cursor-based pagination. Order by createdAt descending (newest first)
		const findManyArgs: Prisma.ChatMessageFindManyArgs = {
			where: { houseId },
			orderBy: { createdAt: 'desc' },
			take: take + 1, // fetch one extra to detect next cursor
			include: {
				user: {
					select: {
						id: true,
						name: true,
						username: true,
						imageUrl: true,
					},
				},
				parent: {
					select: {
						id: true,
						content: true,
						userId: true,
						user: {
							select: { id: true, name: true, imageUrl: true },
						},
					},
				},
				readLogs: {
					select: {
						userId: true,
						readAt: true,
						user: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		};

		if (cursor) {
			findManyArgs.cursor = {
				id: cursor,
			} as Prisma.ChatMessageWhereUniqueInput;
			findManyArgs.skip = 1;
		}

		const messages = await this.prisma.chatMessage.findMany(findManyArgs);

		let nextCursor: string | null = null;
		if (messages.length > take) {
			messages.pop();
			nextCursor = messages.at(-1)!.id;
		}

		return {
			messages,
			nextCursor,
		};
	}

	async markMessagesAsRead(messageIds: string[], userId: string) {
		if (!messageIds.length) return { count: 0 };

		// Fetch existing logs for these messages and user
		const existingLogs = await this.prisma.messageReadLog.findMany({
			where: {
				userId,
				messageId: { in: messageIds },
			},
			select: { messageId: true },
		});

		const existingLogIds = new Set(existingLogs.map((l) => l.messageId));
		const newIds = messageIds.filter((id) => !existingLogIds.has(id));

		if (newIds.length === 0) return { count: 0 };

		// Create logs
		await this.prisma.messageReadLog.createMany({
			data: newIds.map((id) => ({
				messageId: id,
				userId,
			})),
			skipDuplicates: true,
		});

		// Fetch messages to get houseId for triggers
		const messages = await this.prisma.chatMessage.findMany({
			where: { id: { in: newIds } },
			select: { id: true, houseId: true },
		});

		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true },
		});

		const now = new Date();

		// Trigger events
		await Promise.all(
			messages.map((msg) =>
				this.websocketService.trigger(
					`house-${msg.houseId}-chat`,
					'message-read',
					{
						messageId: msg.id,
						userId,
						readAt: now.toISOString(),
						user,
					},
				),
			),
		);

		return { count: newIds.length };
	}
}
