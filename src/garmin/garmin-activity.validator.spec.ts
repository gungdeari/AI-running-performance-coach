
import { isGarminActivityPayload } from './garmin-activity.validator';

describe('isGarminActivityPayload', () => {
    const validPayload = {
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

    it('should accept a valid Garmin activity payload', () => {
        expect(isGarminActivityPayload(validPayload)).toBe(true);
    });

    it('should accept a payload with missing optional metrics', () => {
        const payload = {
        activityId: 12345,
        beginTimestamp: 1793401193000,
        activityType: {
            typeKey: 'running',
        },
        };

        expect(isGarminActivityPayload(payload)).toBe(true);
    });

    it('should accept null optional metrics', () => {
        const payload = {
        ...validPayload,
        averageHR: null,
        distance: null,
        calories: null,
        };

        expect(isGarminActivityPayload(payload)).toBe(true);
    });

    it('should reject a payload without activityId', () => {
        const { activityId, ...payload } = validPayload;

        expect(isGarminActivityPayload(payload)).toBe(false);
    });

    it('should reject a payload without activityType.typeKey', () => {
        const payload = {
        ...validPayload,
        activityType: {},
        };

        expect(isGarminActivityPayload(payload)).toBe(false);
    });

    it('should reject an invalid beginTimestamp', () => {
        const payload = {
        ...validPayload,
        beginTimestamp: '1793401193000',
        };

        expect(isGarminActivityPayload(payload)).toBe(false);
    });

    it('should reject non-finite optional numeric metrics', () => {
        const payload = {
        ...validPayload,
        distance: Number.NaN,
        };

        expect(isGarminActivityPayload(payload)).toBe(false);
    });

    it('should reject optional numeric metrics with the wrong type', () => {
        const payload = {
        ...validPayload,
        averageHR: '162',
        };

        expect(isGarminActivityPayload(payload)).toBe(false);
    });

    it('should reject decimal values for integer fields', () => {
        const payload = {
        ...validPayload,
        steps: 1956.5,
        };

        expect(isGarminActivityPayload(payload)).toBe(false);
    });

    it('should reject an array instead of an activity object', () => {
        expect(isGarminActivityPayload([])).toBe(false);
    });
});
