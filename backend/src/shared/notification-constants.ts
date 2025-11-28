export const NOTIFICATION_CATEGORIES = [
	'HOUSE',
	'PANTRY',
	'EXPENSES',
	'SCRUM',
	'OTHER',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_LEVEL = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export type NotificationLevel = (typeof NOTIFICATION_LEVEL)[number];
