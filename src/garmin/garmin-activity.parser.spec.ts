
import { parseGarminActivity } from './garmin-activity.parser';

describe('parseGarminActivity', () => {
  const validPayload = {
    activityId: 24910273355,
    activityName: 'Gianyar Running',
    startTimeLocal: '2026-10-31 06:59:53',
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

  it('should validate and normalize a valid Garmin payload', () => {
    const result = parseGarminActivity(validPayload);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.externalActivityId).toBe('24910273355');
      expect(result.data.sportType).toBe('running');
      expect(result.data.distanceM).toBe(1570.47);
      expect(result.data.averagePowerW).toBe(247);
      expect(result.data.startedAt).toEqual(
        new Date(1793401193000),
      );
    }
  });

  it('should reject an invalid payload without throwing an exception', () => {
    const invalidPayload = {
      ...validPayload,
      beginTimestamp: 'invalid-timestamp',
    };

    expect(() => parseGarminActivity(invalidPayload)).not.toThrow();

    const result = parseGarminActivity(invalidPayload);

    expect(result).toEqual({
      success: false,
      error: 'INVALID_GARMIN_ACTIVITY_PAYLOAD',
    });
  });
});
