
import { normalizeGarminActivity } from './garmin-activity.normalizer';
import { GarminActivityPayload } from './garmin.types';

describe('normalizeGarminActivity', () => {
    const validPayload: GarminActivityPayload = {
        activityId: 24910273355,
        activityName: 'Gianyar Running',
        startTimeLocal: '2026-10-31 06:59:53',
        startTimeGMT: '2026-10-30 22:59:53',
        beginTimestamp: 1793401193000,
        activityType: {
        typeKey: 'running',
        },
        distance: 1570.47,
        duration: 748.02,
        movingDuration: 738,
        averageHR: 162,
        maxHR: 173,
        averageRunningCadenceInStepsPerMinute: 146.92,
        maxRunningCadenceInStepsPerMinute: 179,
        elevationGain: 27,
        elevationLoss: 4,
        calories: 143,
        aerobicTrainingEffect: 2.3,
        anaerobicTrainingEffect: 0,
        trainingEffectLabel: 'TEMPO',
        hrTimeInZone_1: 0,
        hrTimeInZone_2: 21.03,
        hrTimeInZone_3: 205.98,
        hrTimeInZone_4: 520.99,
        hrTimeInZone_5: 0,
        avgPower: 247,
        maxPower: 478,
        normPower: 272,
        steps: 1956,
        avgGroundContactTime: 283.1,
        avgStrideLength: 81.56,
        avgVerticalOscillation: 7.56,
        avgVerticalRatio: 9.34,
        maxSpeed: 2.893,
    };

    it('should normalize a complete Garmin payload', () => {
        const result = normalizeGarminActivity(validPayload);

        expect(result.externalActivityId).toBe('24910273355');
        expect(result.name).toBe('Gianyar Running');
        expect(result.sportType).toBe('running');

        expect(result.startedAt).toEqual(
        new Date(1793401193000),
        );

        expect(result.distanceM).toBe(1570.47);
        expect(result.averageHr).toBe(162);
        expect(result.averagePowerW).toBe(247);
        expect(result.normalizedPowerW).toBe(272);
        expect(result.trainingEffectLabel).toBe('TEMPO');
        expect(result.steps).toBe(1956);
        expect(result.maxSpeedMps).toBe(2.893);
    });

    it('should map missing optional metrics to null', () => {
        const payload: GarminActivityPayload = {
            activityId: 12345,
            beginTimestamp: 1793401193000,
            activityType: {
                typeKey: 'running',
            },
        };

        const result = normalizeGarminActivity(payload);

        expect(result.externalActivityId).toBe('12345');
        expect(result.distanceM).toBeNull();
        expect(result.averageHr).toBeNull();
        expect(result.averagePowerW).toBeNull();
        expect(result.hrTimeInZone1Seconds).toBeNull();
        expect(result.trainingEffectLabel).toBeNull();
    });

    it('should preserve zero values instead of converting them to null', () => {
        const payload: GarminActivityPayload = {
            ...validPayload,
            anaerobicTrainingEffect: 0,
            hrTimeInZone_1: 0,
        };

        const result = normalizeGarminActivity(payload);

        expect(result.anaerobicTrainingEffect).toBe(0);
        expect(result.hrTimeInZone1Seconds).toBe(0);
    });

    it('should preserve non-running activity types', () => {
        const payload: GarminActivityPayload = {
            ...validPayload,
            activityType: {
                typeKey: 'cycling',
            },
        };

        const result = normalizeGarminActivity(payload);

        expect(result.sportType).toBe('cycling');
    });
});
