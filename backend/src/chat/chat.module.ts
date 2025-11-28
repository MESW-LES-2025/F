import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../shared/websockets/websocket.module';

@Module({
	imports: [PrismaModule, WebsocketModule],
	controllers: [ChatController],
	providers: [ChatService],
})
export class ChatModule {}
