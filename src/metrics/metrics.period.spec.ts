import { getPeriodKey } from './metrics.period';

describe('Metrics Period', () => {
    describe('getPeriodKey', () => {
        describe('weekly period', () => {
        it('should return the same date for Monday', () => {
            expect(
            getPeriodKey('2026-10-26T02:00:00.000Z', 'weekly'),
            ).toBe('2026-10-26');
        });

        it('should return the previous Monday for Sunday', () => {
            expect(
            getPeriodKey('2026-11-01T10:00:00.000Z', 'weekly'),
            ).toBe('2026-10-26');
        });

        it('should return the correct Monday for Tuesday', () => {
            expect(
            getPeriodKey('2026-10-27T02:00:00.000Z', 'weekly'),
            ).toBe('2026-10-26');
        });

        it('should handle year transition', () => {
            expect(
            getPeriodKey('2027-01-01T02:00:00.000Z', 'weekly'),
            ).toBe('2026-12-28');
        });
        });

        describe('monthly period', () => {
        it('should return the correct month', () => {
            expect(
            getPeriodKey('2026-10-28T02:00:00.000Z', 'monthly'),
            ).toBe('2026-10');
        });

        it('should handle month transition', () => {
            expect(
            getPeriodKey('2026-11-01T10:00:00.000Z', 'monthly'),
            ).toBe('2026-11');
        });

        it('should handle year transition', () => {
            expect(
            getPeriodKey('2027-01-01T02:00:00.000Z', 'monthly'),
            ).toBe('2027-01');
        });
        });

        describe('timezone handling', () => {
        it('should use Asia/Makassar local date instead of UTC date', () => {
            // 31 October 2026, 22:00 UTC
            // is 1 November 2026, 06:00 in Asia/Makassar.
            expect(
            getPeriodKey('2026-10-31T22:00:00.000Z', 'monthly'),
            ).toBe('2026-11');
        });

        it('should calculate weekly period using local date', () => {
            expect(
            getPeriodKey('2026-10-31T22:00:00.000Z', 'weekly'),
            ).toBe('2026-10-26');
        });
        });

        describe('invalid input', () => {
        it('should return null for invalid date string', () => {
            expect(
            getPeriodKey('invalid-date', 'weekly'),
            ).toBeNull();
        });

        it('should return null for invalid Date object', () => {
            expect(
            getPeriodKey(new Date('invalid'), 'monthly'),
            ).toBeNull();
        });
        });
    });
});