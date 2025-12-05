import { plainToInstance } from 'class-transformer';
import { CreateNotificationDto } from './create-notification.dto';
import { validate } from 'class-validator';

describe('CreateNotificationDto', () => {
	it('should transform single userId string to array', async () => {
		const plain = {
			title: 'Test',
			userIds: 'user1',
		};
		const dto = plainToInstance(CreateNotificationDto, plain);
		expect(dto.userIds).toEqual(['user1']);

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('should transform array of userIds', async () => {
		const plain = {
			title: 'Test',
			userIds: ['user1', 'user2'],
		};
		const dto = plainToInstance(CreateNotificationDto, plain);
		expect(dto.userIds).toEqual(['user1', 'user2']);

		const errors = await validate(dto);
		expect(errors.length).toBe(0);
	});

	it('should transform non-string single value to string array', () => {
		const plain = {
			title: 'Test',
			userIds: 123,
		};
		const dto = plainToInstance(CreateNotificationDto, plain);
		expect(dto.userIds).toEqual(['123']);
	});
});
