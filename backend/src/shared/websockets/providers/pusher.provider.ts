import Pusher from 'pusher';
import { WebsocketProvider } from '../websocket-provider.interface';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PusherWebsocketProvider implements WebsocketProvider {
	private readonly pusher: Pusher;
	private readonly logger = new Logger(PusherWebsocketProvider.name);

	constructor() {
		this.pusher = new Pusher({
			appId: process.env.PUSHER_APP_ID!,
			key: process.env.PUSHER_KEY!,
			secret: process.env.PUSHER_SECRET!,
			cluster: process.env.PUSHER_CLUSTER!,
			useTLS: true,
		});
	}

	async trigger(
		channel: string,
		event: string,
		data: any,
		socketId?: string,
	): Promise<void> {
		try {
			const params = socketId ? { socket_id: socketId } : undefined;
			await this.pusher.trigger(channel, event, data, params);
		} catch (error) {
			this.logger.error(
				`Failed to trigger event ${event} on channel ${channel}`,
				error instanceof Error ? error.stack : String(error),
			);
			throw error;
		}
	}
}
