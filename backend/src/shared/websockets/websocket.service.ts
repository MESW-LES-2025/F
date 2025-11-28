import { Injectable } from '@nestjs/common';
import { WebsocketProvider } from './websocket-provider.interface';
import { PusherWebsocketProvider } from './providers/pusher.provider';

@Injectable()
export class WebsocketService {
	private provider: WebsocketProvider;

	constructor() {
		this.provider = new PusherWebsocketProvider();
	}

	/**
	 * Trigger an event on a channel
	 * @param channel - The channel name
	 * @param event - The event name
	 * @param data - The data to send
	 * @param socketId - Optional socket ID to exclude
	 */
	async trigger(
		channel: string,
		event: string,
		data: any,
		socketId?: string,
	) {
		return this.provider.trigger(channel, event, data, socketId);
	}
}
