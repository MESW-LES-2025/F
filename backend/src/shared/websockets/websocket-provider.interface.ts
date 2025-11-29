export interface WebsocketProvider {
	trigger(
		channel: string,
		event: string,
		data: any,
		socketId?: string,
	): Promise<void>;
}
