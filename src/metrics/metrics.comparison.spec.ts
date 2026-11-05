import { comparePeriods } from './metrics.comparison';
import { PeriodMetrics } from './metrics.types';

describe('Metrics Comparison', () => {
    const current: PeriodMetrics = {
        periodType: 'weekly',
        periodKey: '2026-11-02',
        activityCount: 4,
        totalDistanceKm: 25,
        totalDurationSeconds: 9000,
        totalMovingDurationSeconds: 8700,
        averagePaceSecondsPerKm: 360,
        averageMovingPaceSecondsPerKm: 348,
        longestRunDistanceKm: 12,
        averageHr: 155,
        maxHr: 180,
        averageCadence: 165,
        totalElevationGainM: 200,
    };

    const previous: PeriodMetrics = {
        periodType: 'weekly',
        periodKey: '2026-10-26',
        activityCount: 3,
        totalDistanceKm: 20,
        totalDurationSeconds: 7800,
        totalMovingDurationSeconds: 7500,
        averagePaceSecondsPerKm: 390,
        averageMovingPaceSecondsPerKm: 375,
        longestRunDistanceKm: 10,
        averageHr: 160,
        maxHr: 185,
        averageCadence: 160,
        totalElevationGainM: 150,
    };

    describe('valid comparison', () => {
        it('should compare all supported metrics', () => {
        const result = comparePeriods(current, previous);

        expect(result.distanceKm).toEqual({
            currentValue: 25,
            previousValue: 20,
            difference: 5,
            percentageChange: 25,
        });

        expect(result.activityCount).toEqual({
            currentValue: 4,
            previousValue: 3,
            difference: 1,
            percentageChange: expect.closeTo(33.333333, 4),
        });

        expect(result.longestRunDistanceKm).toEqual({
            currentValue: 12,
            previousValue: 10,
            difference: 2,
            percentageChange: 20,
        });

        expect(result.averagePaceSecondsPerKm).toEqual({
            currentValue: 360,
            previousValue: 390,
            difference: -30,
            percentageChange: expect.closeTo(-7.692307, 4),
        });

        expect(result.averageMovingPaceSecondsPerKm).toMatchObject({
            currentValue: 348,
            previousValue: 375,
            difference: -27,
        });

        expect(
            result.averageMovingPaceSecondsPerKm.percentageChange,
        ).toBeCloseTo(-7.2, 10);
        });
    });

    describe('percentage change', () => {
        it('should return null percentage when previous value is zero', () => {
        const result = comparePeriods(
            { ...current, totalDistanceKm: 10 },
            { ...previous, totalDistanceKm: 0 },
        );

        expect(result.distanceKm.difference).toBe(10);
        expect(result.distanceKm.percentageChange).toBeNull();
        });

        it('should return null percentage when both values are zero', () => {
        const result = comparePeriods(
            { ...current, totalDistanceKm: 0 },
            { ...previous, totalDistanceKm: 0 },
        );

        expect(result.distanceKm.difference).toBe(0);
        expect(result.distanceKm.percentageChange).toBeNull();
        });

        it('should return -100 percent when current value is zero', () => {
        const result = comparePeriods(
            { ...current, totalDistanceKm: 0 },
            { ...previous, totalDistanceKm: 10 },
        );

        expect(result.distanceKm.difference).toBe(-10);
        expect(result.distanceKm.percentageChange).toBe(-100);
        });
    });

    describe('missing values', () => {
        it('should return null comparison when current value is null', () => {
        const result = comparePeriods(
            { ...current, totalDistanceKm: null },
            previous,
        );

        expect(result.distanceKm).toEqual({
            currentValue: null,
            previousValue: 20,
            difference: null,
            percentageChange: null,
        });
        });

        it('should return null comparison when previous value is null', () => {
        const result = comparePeriods(
            current,
            { ...previous, totalDistanceKm: null },
        );

        expect(result.distanceKm).toEqual({
            currentValue: 25,
            previousValue: null,
            difference: null,
            percentageChange: null,
        });
        });
    });

    describe('pace comparison', () => {
        it('should return negative difference when pace improves', () => {
        const result = comparePeriods(current, previous);

        expect(result.averagePaceSecondsPerKm.difference).toBe(-30);
        });

        it('should return positive difference when pace becomes slower', () => {
        const result = comparePeriods(
            { ...current, averagePaceSecondsPerKm: 400 },
            { ...previous, averagePaceSecondsPerKm: 360 },
        );

        expect(result.averagePaceSecondsPerKm.difference).toBe(40);
        });
    });

    describe('period validation', () => {
        it('should reject different period types', () => {
        expect(() =>
            comparePeriods(
            { ...current, periodType: 'monthly', periodKey: '2026-11' },
            previous,
            ),
        ).toThrow(RangeError);
        });

        it('should reject the same period key', () => {
        expect(() =>
            comparePeriods(
            current,
            { ...previous, periodKey: current.periodKey },
            ),
        ).toThrow(RangeError);
        });

        it('should reject non-consecutive periods', () => {
        expect(() =>
            comparePeriods(
            current,
            { ...previous, periodKey: '2026-10-19' },
            ),
        ).toThrow(RangeError);
        });

        it('should reject an invalid weekly period key', () => {
        expect(() =>
            comparePeriods(
            { ...current, periodKey: '2026-11-03' },
            previous,
            ),
        ).toThrow(RangeError);
        });

        it('should support consecutive monthly periods', () => {
        const currentMonth: PeriodMetrics = {
            ...current,
            periodType: 'monthly',
            periodKey: '2027-01',
        };

        const previousMonth: PeriodMetrics = {
            ...previous,
            periodType: 'monthly',
            periodKey: '2026-12',
        };

        expect(() =>
            comparePeriods(currentMonth, previousMonth),
        ).not.toThrow();
        });

        it('should reject non-finite metric values', () => {
        expect(() =>
            comparePeriods(
            { ...current, totalDistanceKm: Number.NaN },
            previous,
            ),
        ).toThrow(RangeError);
        });
    });
});