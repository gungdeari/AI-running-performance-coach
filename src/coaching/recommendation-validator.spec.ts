import type {
  CoachingContext,
  WorkoutPrescription,
} from './coaching.types';

import type {
  PeriodMetrics,
} from '../metrics/metrics.types';

import { generateWorkoutPrescription } from './workout-rules';

import {
  validateWorkoutPrescription,
} from './recommendation-validator';

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

function createPrescription(
  workoutType: 'easy' | 'long_run' | 'strength_training' = 'easy',
): WorkoutPrescription {
  return generateWorkoutPrescription(
    createContext(),
    workoutType,
  );
}

describe('Recommendation Validator', () => {
  describe('Valid prescriptions', () => {
    it('should accept a valid Easy Run prescription', () => {
      const result = validateWorkoutPrescription(
        createPrescription('easy'),
        createContext(),
      );

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should accept a valid Long Run prescription', () => {
      const result = validateWorkoutPrescription(
        createPrescription('long_run'),
        createContext(),
      );

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should accept a valid Strength Training prescription', () => {
      const result = validateWorkoutPrescription(
        createPrescription('strength_training'),
        createContext(),
      );

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should reject a workout with NaN duration', () => {
      const prescription = createPrescription();
      prescription.durationMinutes = Number.NaN;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_duration',
        }),
      );
    });

    it('should reject a workout with infinite distance', () => {
      const prescription = createPrescription('long_run');
      prescription.distanceKm = Number.POSITIVE_INFINITY;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_distance',
        }),
      );
    });

    it('should reject a segment without a duration or distance', () => {
      const prescription = createPrescription();

      prescription.segments[0].durationMinutes = null;
      prescription.segments[0].distanceKm = null;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_segment_target',
        }),
      );
    });

    it('should reject inconsistent total distance', () => {
      const prescription = createPrescription('long_run');

      prescription.distanceKm = 10;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'distance_mismatch',
        }),
      );
    });

    it('should reject an unsupported rationale code', () => {
      const prescription = createPrescription();

      prescription.rationaleObservationCodes = [
        'unsupported_code' as never,
      ];

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_rationale_code',
        }),
      );
    });

    it.each(['tempo', 'interval'] as const)(
      'should reject %s prescriptions',
      (workoutType) => {
        const prescription = {
          ...createPrescription(),
          workoutType,
        };

        const result = validateWorkoutPrescription(
          prescription,
          createContext(),
        );

        expect(result.valid).toBe(false);
        expect(result.issues).toContainEqual(
          expect.objectContaining({
            code: 'unsupported_workout_type',
          }),
        );
      },
    );
  });

  describe('Required fields', () => {
    it('should reject a prescription without a title', () => {
      const prescription = createPrescription();
      prescription.title = '   ';

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'missing_title',
          severity: 'error',
        }),
      );
    });

    it('should reject a prescription without an objective', () => {
      const prescription = createPrescription();
      prescription.objective = '';

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'missing_objective',
        }),
      );
    });

    it('should reject a prescription without a workout target', () => {
      const prescription = createPrescription();
      prescription.durationMinutes = null;
      prescription.distanceKm = null;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'missing_workout_target',
        }),
      );
    });
  });

  describe('Segment validation', () => {
    it('should reject missing required segments', () => {
      const prescription = createPrescription();
      prescription.segments = prescription.segments.filter(
        (segment) => segment.type !== 'warmup',
      );

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'missing_required_segment',
        }),
      );
    });

    it('should reject segments with invalid duration', () => {
      const prescription = createPrescription();

      prescription.segments[0].durationMinutes = 0;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_segment_duration',
        }),
      );
    });

    it('should reject inconsistent total duration', () => {
      const prescription = createPrescription();

      prescription.segments[0].durationMinutes = 10;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'duration_mismatch',
        }),
      );
    });
  });

  describe('Workout-specific rules', () => {
    it('should reject Easy Run with high intensity', () => {
      const prescription = createPrescription();
      prescription.intensity = 'high';

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_easy_intensity',
        }),
      );
    });

    it('should reject Long Run exceeding the established baseline', () => {
      const prescription = createPrescription('long_run');

      prescription.distanceKm = 9;

      const mainSegment = prescription.segments.find(
        (segment) => segment.type === 'main',
      );

      if (!mainSegment) {
        throw new Error('Main segment not found in test fixture.');
      }

      mainSegment.distanceKm = 9;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'long_run_exceeds_baseline',
        }),
      );
    });

    it('should reject Long Run without sufficient history', () => {
      const prescription = createPrescription('long_run');

      const context = createContext({
        dataStatus: 'insufficient',
      });

      const result = validateWorkoutPrescription(
        prescription,
        context,
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'insufficient_long_run_history',
        }),
      );
    });

    it('should reject Strength Training with high intensity', () => {
      const prescription = createPrescription('strength_training');
      prescription.intensity = 'high';

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_strength_intensity',
        }),
      );
    });
  });

  describe('Segment Consistency', () => {
    it('should reject a segment with both duration and distance', () => {
      const prescription = createPrescription();
      prescription.segments[0].distanceKm = 1;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: 'invalid_segment_target' }),
      );
    });

    it('should reject Easy Run segments with distance targets', () => {
      const prescription = createPrescription();
      prescription.segments[0].durationMinutes = null;
      prescription.segments[0].distanceKm = 1;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_easy_segment_target',
        }),
      );
    });

    it('should reject Strength Training segments with distance targets', () => {
      const prescription = createPrescription('strength_training');
      prescription.segments[0].durationMinutes = null;
      prescription.segments[0].distanceKm = 1;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_strength_segment_target',
        }),
      );
    });

    it('should reject Long Run main segments with duration targets', () => {
      const prescription = createPrescription('long_run');
      const mainSegment = prescription.segments.find(
        (segment) => segment.type === 'main',
      );

      if (!mainSegment) {
        throw new Error('Main segment not found in test fixture.');
      }

      mainSegment.distanceKm = null;
      mainSegment.durationMinutes = 20;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_long_run_main_segment',
        }),
      );
    });

    it('should reject Long Run supporting segments with distance targets', () => {
      const prescription = createPrescription('long_run');
      prescription.segments[0].durationMinutes = null;
      prescription.segments[0].distanceKm = 1;

      const result = validateWorkoutPrescription(
        prescription,
        createContext(),
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          code: 'invalid_long_run_supporting_segment',
        }),
      );
    });
  });
});