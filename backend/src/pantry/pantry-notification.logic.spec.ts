import {
	evaluatePantryNotifications,
	PantryNotificationEvaluationInput,
} from './pantry-notification.logic';

describe('PantryNotificationLogic', () => {
	const now = new Date('2023-01-01T12:00:00Z');

	it('should notify low stock if quantity is low and cooldown is over', () => {
		const input: PantryNotificationEvaluationInput = {
			now,
			item: {
				quantity: 1,
				expiryDate: null,
				lastLowStockNotificationAt: null,
				lastExpiryNotificationAt: null,
			},
		};

		const result = evaluatePantryNotifications(input);
		expect(result.shouldNotifyLowStock).toBe(true);
		expect(result.nextLowStockNotifiedAt).toEqual(now);
	});

	it('should NOT notify low stock if quantity is high', () => {
		const input: PantryNotificationEvaluationInput = {
			now,
			item: {
				quantity: 2,
				expiryDate: null,
				lastLowStockNotificationAt: null,
				lastExpiryNotificationAt: null,
			},
		};

		const result = evaluatePantryNotifications(input);
		expect(result.shouldNotifyLowStock).toBe(false);
	});

	it('should NOT notify low stock if cooldown is active', () => {
		const lastNotified = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
		const input: PantryNotificationEvaluationInput = {
			now,
			item: {
				quantity: 1,
				expiryDate: null,
				lastLowStockNotificationAt: lastNotified,
				lastExpiryNotificationAt: null,
			},
		};

		const result = evaluatePantryNotifications(input);
		expect(result.shouldNotifyLowStock).toBe(false);
	});

	it('should notify expiry if near expiry and cooldown is over', () => {
		const expiryDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
		const input: PantryNotificationEvaluationInput = {
			now,
			item: {
				quantity: 10,
				expiryDate,
				lastLowStockNotificationAt: null,
				lastExpiryNotificationAt: null,
			},
		};

		const result = evaluatePantryNotifications(input);
		expect(result.shouldNotifyExpiry).toBe(true);
		expect(result.nextExpiryNotifiedAt).toEqual(now);
	});

	it('should NOT notify expiry if NOT near expiry', () => {
		const expiryDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
		const input: PantryNotificationEvaluationInput = {
			now,
			item: {
				quantity: 10,
				expiryDate,
				lastLowStockNotificationAt: null,
				lastExpiryNotificationAt: null,
			},
		};

		const result = evaluatePantryNotifications(input);
		expect(result.shouldNotifyExpiry).toBe(false);
	});

	it('should NOT notify expiry if cooldown is active', () => {
		const expiryDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
		const lastNotified = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
		const input: PantryNotificationEvaluationInput = {
			now,
			item: {
				quantity: 10,
				expiryDate,
				lastLowStockNotificationAt: null,
				lastExpiryNotificationAt: lastNotified,
			},
		};

		const result = evaluatePantryNotifications(input);
		expect(result.shouldNotifyExpiry).toBe(false);
	});
});
