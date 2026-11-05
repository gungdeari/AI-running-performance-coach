import { aggregateActivitiesByPeriod } from './metrics.aggregation';
import { MetricActivityInput } from './metrics.types';

describe('Metrics Aggregation', () => {
    const activities: MetricActivityInput[] = [
        {
            id: 'activity-1',
            sportType: 'running',
            startedAt: '2026-10-26T02:00:00.000Z',
            distanceM: 5000,
            durationSeconds: 1800,
            movingDurationSeconds: 1750,
            averageHr: 150,
            maxHr: 175,
            averageCadence: 160,
            elevationGainM: 50,
        },
        {
            id: 'activity-2',
            sportType: 'running',
            startedAt: '2026-10-28T02:00:00.000Z',
            distanceM: 10000,
            durationSeconds: 3600,
            movingDurationSeconds: 3500,
            averageHr: 160,
            maxHr: 185,
            averageCadence: 170,
            elevationGainM: 100,
        },
        {
            id: 'activity-3',
            sportType: 'treadmill_running',
            startedAt: '2026-11-02T02:00:00.000Z',
            distanceM: 6000,
            durationSeconds: 2160,
            movingDurationSeconds: 2100,
            averageHr: 155,
            maxHr: 180,
            averageCadence: 165,
            elevationGainM: null,
        },
        {
            id: 'activity-4',
            sportType: 'cycling',
            startedAt: '2026-10-27T02:00:00.000Z',
            distanceM: 20000,
            durationSeconds: 3600,
        },
        {
            id: 'activity-5',
            sportType: 'running',
            startedAt: '2026-10-27T02:00:00.000Z',
            distanceM: 0,
            durationSeconds: 1800,
        },
        {
            id: 'activity-6',
            sportType: 'running',
            startedAt: 'invalid-date',
            distanceM: 5000,
            durationSeconds: 1800,
        },
        {
            id: 'activity-7',
            sportType: 'running',
            startedAt: null,
            distanceM: 5000,
            durationSeconds: 1800,
        },
    ];

    describe('weekly aggregation', () => {
        it('should group activities by weekly period', () => {
        const result = aggregateActivitiesByPeriod(
            activities,
            'weekly',
        );

        expect(result).toHaveLength(2);

        expect(result[0].periodKey).toBe('2026-10-26');
        expect(result[0].activityCount).toBe(2);
        expect(result[0].totalDistanceKm).toBe(15);
        expect(result[0].longestRunDistanceKm).toBe(10);

        expect(result[1].periodKey).toBe('2026-11-02');
        expect(result[1].activityCount).toBe(1);
        expect(result[1].totalDistanceKm).toBe(6);
        });

        it('should return results sorted by period key ascending', () => {
        const reversedActivities = [...activities].reverse();

        const result = aggregateActivitiesByPeriod(
            reversedActivities,
            'weekly',
        );

        expect(result.map((item) => item.periodKey)).toEqual([
            '2026-10-26',
            '2026-11-02',
        ]);
        });
    });

    describe('monthly aggregation', () => {
        it('should group activities by monthly period', () => {
        const result = aggregateActivitiesByPeriod(
            activities,
            'monthly',
        );

        expect(result).toHaveLength(2);

        expect(result[0].periodKey).toBe('2026-10');
        expect(result[0].activityCount).toBe(2);
        expect(result[0].totalDistanceKm).toBe(15);

        expect(result[1].periodKey).toBe('2026-11');
        expect(result[1].activityCount).toBe(1);
        expect(result[1].totalDistanceKm).toBe(6);
        });
    });

    describe('aggregation eligibility', () => {
        it('should exclude non-running activities', () => {
        const result = aggregateActivitiesByPeriod(
            activities,
            'weekly',
        );

        const totalActivityCount = result.reduce(
            (total, period) => total + period.activityCount,
            0,
        );

        expect(totalActivityCount).toBe(3);
        });

        it('should exclude invalid activities', () => {
        const result = aggregateActivitiesByPeriod(
            activities,
            'weekly',
        );

        expect(
            result.every((period) => period.activityCount > 0),
        ).toBe(true);
        });

        it('should exclude activities without valid startedAt', () => {
        const result = aggregateActivitiesByPeriod(
            activities,
            'weekly',
        );

        expect(
            result.reduce(
            (total, period) => total + period.activityCount,
            0,
            ),
        ).toBe(3);
        });
    });

    describe('calculated metrics', () => {
        it('should reuse volume and physiology calculations', () => {
        const result = aggregateActivitiesByPeriod(
            activities,
            'weekly',
        );

        expect(result[0].totalDurationSeconds).toBe(5400);
        expect(result[0].totalMovingDurationSeconds).toBe(5250);
        expect(result[0].averagePaceSecondsPerKm).toBe(360);
        expect(result[0].averageMovingPaceSecondsPerKm).toBe(350);

        expect(result[0].averageHr).toBeCloseTo(156.6667, 3);
        expect(result[0].maxHr).toBe(185);
        expect(result[0].averageCadence).toBeCloseTo(166.6667, 3);
        expect(result[0].totalElevationGainM).toBe(150);
        });

        it('should return empty array when no eligible activities exist', () => {
        const result = aggregateActivitiesByPeriod(
            [],
            'weekly',
        );

        expect(result).toEqual([]);
        });
    });
});