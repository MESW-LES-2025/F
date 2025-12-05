import { Test, TestingModule } from '@nestjs/testing';
import { PusherWebsocketProvider } from './pusher.provider';
import Pusher from 'pusher';

jest.mock('pusher');

describe('PusherWebsocketProvider', () => {
	let provider: PusherWebsocketProvider;
	let pusherInstanceMock: { trigger: jest.Mock };

	beforeEach(async () => {
		pusherInstanceMock = {
			trigger: jest.fn(),
		} as unknown as { trigger: jest.Mock };
		(Pusher as unknown as jest.Mock).mockReturnValue(pusherInstanceMock);

		const module: TestingModule = await Test.createTestingModule({
			providers: [PusherWebsocketProvider],
		}).compile();

		provider = module.get<PusherWebsocketProvider>(PusherWebsocketProvider);
	});

	it('should be defined', () => {
		expect(provider).toBeDefined();
	});

	describe('trigger', () => {
		it('should trigger an event successfully', async () => {
			pusherInstanceMock.trigger.mockResolvedValue(undefined);

			await provider.trigger('channel', 'event', { data: 'test' });

			expect(pusherInstanceMock.trigger).toHaveBeenCalledWith(
				'channel',
				'event',
				{ data: 'test' },
				undefined,
			);
		});

		it('should pass socketId if provided', async () => {
			pusherInstanceMock.trigger.mockResolvedValue(undefined);

			await provider.trigger('channel', 'event', {}, 'socket-id');

			expect(pusherInstanceMock.trigger).toHaveBeenCalledWith(
				'channel',
				'event',
				{},
				{ socket_id: 'socket-id' },
			);
		});

		it('should log and rethrow error if trigger fails', async () => {
			const error = new Error('Pusher error');
			pusherInstanceMock.trigger.mockRejectedValue(error);
			const loggerSpy = jest
				.spyOn(
					(provider as unknown as { logger: { error: jest.Mock } })
						.logger,
					'error',
				)
				.mockImplementation();

			await expect(
				provider.trigger('channel', 'event', {}),
			).rejects.toThrow(error);

			expect(loggerSpy).toHaveBeenCalled();
		});
	});
});
