import type { CoachingContext } from './coaching.types';
import type { PeriodMetrics } from '../metrics/metrics.types';

import { generateWorkoutPrescription } from './workout-rules';

function createPeriodMetrics(
  overrides: Partial<PeriodMetrics> = {},
): PeriodMetrics {
  return {
    periodType: 'weekly',
    periodKey: '2026-10-26',
    activityCount: 3,
    totalDistanceKm: 15,
    totalDurationSeconds: 5400,
    totalMovingDurationSeconds: 5100,
    averagePaceSecondsPerKm: 360,
    averageMovingPaceSecondsPerKm: 340,
    longestRunDistanceKm: 8,
    averageHr: 150,
    maxHr: 175,
    averageCadence: 160,
    totalElevationGainM: 50,
    ...overrides,
  };
}

function createContext(
  overrides: Partial<CoachingContext> = {},
): CoachingContext {
  return {
    generatedAt: '2026-11-07T08:00:00.000Z',
    analysisWindow: {
      startDate: '2026-10-26T00:00:00.000Z',
      endDate: '2026-11-07T08:00:00.000Z',
    },
    activities: [
      {
        id: 'activity-1',
        sportType: 'running',
        startedAt: '2026-10-27T07:00:00.000Z',
        distanceM: 5000,
        durationSeconds: 1800,
      },
      {
        id: 'activity-2',
        sportType: 'running',
        startedAt: '2026-10-29T07:00:00.000Z',
        distanceM: 5000,
        durationSeconds: 1800,
      },
      {
        id: 'activity-3',
        sportType: 'running',
        startedAt: '2026-11-01T07:00:00.000Z',
        distanceM: 8000,
        durationSeconds: 2880,
      },
    ],
    currentPeriod: createPeriodMetrics(),
    previousPeriod: createPeriodMetrics({
      periodKey: '2026-10-19',
      longestRunDistanceKm: 7,
    }),
    periodComparison: null,
    personalRecords: [],
    dataStatus: 'sufficient',
    limitations: [],
    ...overrides,
  };
}

describe('Workout Rules', () => {
  describe('Easy Run', () => {
    it('should generate Easy Run as the default workout', () => {
      const prescription = generateWorkoutPrescription(
        createContext(),
      );

      expect(prescription.workoutType).toBe('easy');
      expect(prescription.intensity).toBe('low');
      expect(prescription.durationMinutes).toBe(30);
      expect(prescription.distanceKm).toBeNull();
    });

    it('should generate a structured Easy Run prescription', () => {
      const prescription = generateWorkoutPrescription(
        createContext(),
        'easy',
      );

      expect(prescription.segments).toHaveLength(3);

      expect(
        prescription.segments.map((segment) => segment.type),
      ).toEqual(['warmup', 'main', 'cooldown']);

      expect(
        prescription.segments.reduce(
          (total, segment) =>
            total + (segment.durationMinutes ?? 0),
          0,
        ),
      ).toBe(prescription.durationMinutes);
    });
  });

  describe('Long Run', () => {
    it('should use the established long-run distance baseline', () => {
      const prescription = generateWorkoutPrescription(
        createContext(),
        'long_run',
      );

      expect(prescription.workoutType).toBe('long_run');
      expect(prescription.intensity).toBe('low');
      expect(prescription.distanceKm).toBe(8);
      expect(prescription.durationMinutes).toBeNull();

      const mainSegment = prescription.segments.find(
        (segment) => segment.type === 'main',
      );

      expect(mainSegment?.distanceKm).toBe(8);
    });

    it('should reject Long Run when activity history is insufficient', () => {
      const context = createContext({
        dataStatus: 'insufficient',
      });

      expect(() =>
        generateWorkoutPrescription(context, 'long_run'),
      ).toThrow(RangeError);
    });

    it('should reject Long Run when recent activity count is insufficient', () => {
      const context = createContext({
        activities: [],
      });

      expect(() =>
        generateWorkoutPrescription(context, 'long_run'),
      ).toThrow(RangeError);
    });

    it('should reject Long Run when no valid distance baseline exists', () => {
      const context = createContext({
        currentPeriod: createPeriodMetrics({
          longestRunDistanceKm: null,
        }),
      });

      expect(() =>
        generateWorkoutPrescription(context, 'long_run'),
      ).toThrow(RangeError);
    });
  });

  describe('Strength Training', () => {
    it('should generate a moderate bodyweight strength session', () => {
      const prescription = generateWorkoutPrescription(
        createContext(),
        'strength_training',
      );

      expect(prescription.workoutType).toBe('strength_training');
      expect(prescription.intensity).toBe('moderate');
      expect(prescription.durationMinutes).toBe(25);
      expect(prescription.distanceKm).toBeNull();
      expect(prescription.segments).toHaveLength(3);
    });
  });

  describe('Unsupported Automatic Prescriptions', () => {
    it.each(['tempo', 'interval'] as const)(
      'should reject automatic %s prescription',
      (workoutType) => {
        expect(() =>
          generateWorkoutPrescription(
            createContext(),
            workoutType,
          ),
        ).toThrow(RangeError);
      },
    );
  });
});