import { BadRequestException } from '@nestjs/common';
import { RecurrencePattern } from '@prisma/client';

/**
 * Calculate the next recurrence date based on a given date, pattern, and interval
 * @param currentDate - The current/base date to calculate from
 * @param pattern - The recurrence pattern (DAILY, WEEKLY, MONTHLY)
 * @param interval - The interval (e.g., every 1, 2, 3... units)
 * @returns The next recurrence date
 */
export function calculateNextRecurrence(
	currentDate: Date,
	pattern: RecurrencePattern,
	interval: number,
): Date {
	const nextDate = new Date(currentDate);

	switch (pattern) {
		case RecurrencePattern.DAILY:
			nextDate.setDate(nextDate.getDate() + interval);
			break;
		case RecurrencePattern.WEEKLY:
			nextDate.setDate(nextDate.getDate() + interval * 7);
			break;
		case RecurrencePattern.MONTHLY: {
			// Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
			const currentDay = nextDate.getDate();
			nextDate.setMonth(nextDate.getMonth() + interval);
			// If the day changed (e.g., from 31 to 1-3), set to last day of previous month
			if (nextDate.getDate() !== currentDay) {
				nextDate.setDate(0); // Sets to last day of previous month
			}
			break;
		}
		default:
			throw new BadRequestException('Invalid recurrence pattern');
	}

	return nextDate;
}
