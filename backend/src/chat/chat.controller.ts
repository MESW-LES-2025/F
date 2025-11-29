import {
	Controller,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Request,
	UseGuards,
	Get,
	Query,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
import { ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReadChatMessagesDto } from './dto/read-chat-messages.dto';
import { MarkMessagesAsReadDto } from './dto/mark-messages-read.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserRequest } from 'src/shared/types/user_request';

@Controller('chat')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@ApiOperation({ summary: 'Mark multiple messages as read' })
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post('mark-messages-read')
	markMessagesAsRead(
		@Body() markMessagesAsReadDto: MarkMessagesAsReadDto,
		@Request() req: UserRequest,
	) {
		return this.chatService.markMessagesAsRead(
			markMessagesAsReadDto.messageIds,
			req.user.userId,
		);
	}

	@ApiOperation({ summary: 'Send a chat message to a house' })
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Post(':houseId')
	sendMessage(
		@Body() createChatMessageDto: CreateChatMessageDto,
		@Request() req: UserRequest,
		@Param('houseId') houseId: string,
	) {
		return this.chatService.create(
			createChatMessageDto,
			req.user.userId,
			houseId,
		);
	}

	@ApiOperation({ summary: 'Edit a chat message' })
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Patch(':id')
	editMessage(
		@Param('id') id: string,
		@Body() updateChatMessageDto: UpdateChatMessageDto,
		@Request() req: UserRequest,
	) {
		return this.chatService.update(
			id,
			updateChatMessageDto,
			req.user.userId,
		);
	}

	@ApiOperation({
		summary: 'Read chat messages for a house (cursor-based pagination)',
	})
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Get(':houseId/read')
	read(
		@Param('houseId') houseId: string,
		@Query() query: ReadChatMessagesDto,
		@Request() req: UserRequest,
	) {
		const limit = query.limit ?? 20;
		return this.chatService.read(
			houseId,
			req.user.userId,
			limit,
			query.cursor,
		);
	}

	@ApiOperation({ summary: 'Delete a chat message' })
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@Delete(':id')
	deleteMessage(@Param('id') id: string, @Request() req: UserRequest) {
		return this.chatService.remove(id, req.user.userId);
	}
}
