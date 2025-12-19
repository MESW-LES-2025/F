import { calculateNextRecurrence } from './recurrence.util';
import { RecurrencePattern } from '@prisma/client';

describe('recurrence.util', () => {
    describe('calculateNextRecurrence', () => {
        it('should calculate daily recurrence correctly', () => {
            const currentDate = new Date('2025-12-18T10:00:00.000Z');
            const nextDate = calculateNextRecurrence(currentDate, RecurrencePattern.DAILY, 1);

            expect(nextDate.getDate()).toBe(19);
            expect(nextDate.getMonth()).toBe(11); // December (0-indexed)
            expect(nextDate.getFullYear()).toBe(2025);
        });

        it('should calculate daily recurrence with interval > 1', () => {
            const currentDate = new Date('2025-12-18T10:00:00.000Z');
            const nextDate = calculateNextRecurrence(currentDate, RecurrencePattern.DAILY, 3);

            expect(nextDate.getDate()).toBe(21);
        });

        it('should calculate weekly recurrence correctly', () => {
            const currentDate = new Date('2025-12-18T10:00:00.000Z');
            const nextDate = calculateNextRecurrence(currentDate, RecurrencePattern.WEEKLY, 1);

            expect(nextDate.getDate()).toBe(25);
            expect(nextDate.getMonth()).toBe(11); // December
            expect(nextDate.getFullYear()).toBe(2025);
        });

        it('should calculate weekly recurrence with interval > 1', () => {
            const currentDate = new Date('2025-12-18T10:00:00.000Z');
            const nextDate = calculateNextRecurrence(currentDate, RecurrencePattern.WEEKLY, 2);

            expect(nextDate.getDate()).toBe(1);
            expect(nextDate.getMonth()).toBe(0); // January (next year)
            expect(nextDate.getFullYear()).toBe(2026);
        });

        it('should calculate monthly recurrence correctly', () => {
            const currentDate = new Date('2025-12-18T10:00:00.000Z');
            const nextDate = calculateNextRecurrence(
                currentDate,
                RecurrencePattern.MONTHLY,
                1,
            );

            expect(nextDate.getDate()).toBe(18);
            expect(nextDate.getMonth()).toBe(0); // January (next year)
            expect(nextDate.getFullYear()).toBe(2026);
        });

        it('should handle month-end edge case (Jan 31 -> Feb 28)', () => {
            const currentDate = new Date('2025-01-31T10:00:00.000Z');
            const nextDate = calculateNextRecurrence(
                currentDate,
                RecurrencePattern.MONTHLY,
                1,
            );

            // Should set to last day of February (28 in 2025, non-leap year)
            expect(nextDate.getDate()).toBe(28);
            expect(nextDate.getMonth()).toBe(1); // February
            expect(nextDate.getFullYear()).toBe(2025);
        });

        it('should handle month-end edge case in leap year (Jan 31 -> Feb 29)', () => {
            const currentDate = new Date('2024-01-31T10:00:00.000Z');
            const nextDate = calculateNextRecurrence(
                currentDate,
                RecurrencePattern.MONTHLY,
                1,
            );

            // Should set to last day of February (29 in 2024, leap year)
            expect(nextDate.getDate()).toBe(29);
            expect(nextDate.getMonth()).toBe(1); // February
            expect(nextDate.getFullYear()).toBe(2024);
        });

        it('should handle monthly recurrence with interval > 1', () => {
            const currentDate = new Date('2025-12-18T10:00:00.000Z');
            const nextDate = calculateNextRecurrence(
                currentDate,
                RecurrencePattern.MONTHLY,
                3,
            );

            expect(nextDate.getDate()).toBe(18);
            expect(nextDate.getMonth()).toBe(2); // March (next year)
            expect(nextDate.getFullYear()).toBe(2026);
        });
    });
});
