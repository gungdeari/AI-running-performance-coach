import type {
  CoachingContext,
  WorkoutPrescription,
} from './coaching.types';

import type { PeriodMetrics } from '../metrics/metrics.types';

import {
  finalizeCoachingRecommendation,
  generateCoachingRecommendation,
} from './coaching-recommendation';

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

describe('Coaching Recommendation Orchestration', () => {
  describe('Approved recommendations', () => {
    it.each([
      'easy',
      'long_run',
      'strength_training',
    ] as const)(
      'should generate an approved %s recommendation',
      (workoutType) => {
        const result = generateCoachingRecommendation(
          createContext(),
          workoutType,
        );

        expect(result.status).toBe('approved');

        if (result.status !== 'approved') {
          throw new Error('Expected an approved recommendation.');
        }

        expect(result.recommendation.prescription.workoutType)
          .toBe(workoutType);

        expect(result.recommendation.validation.valid).toBe(true);

        expect(
          result.recommendation.explanation.summary,
        ).toBeTruthy();
      },
    );

    it('should use Easy Run as fallback with insufficient data', () => {
      const result = generateCoachingRecommendation(
        createContext({
          dataStatus: 'insufficient',
        }),
      );

      expect(result.status).toBe('approved');

      if (result.status !== 'approved') {
        throw new Error('Expected an approved recommendation.');
      }

      expect(result.recommendation.prescription.workoutType)
        .toBe('easy');

      expect(result.recommendation.explanation.limitations)
        .toEqual(
          createContext({
            dataStatus: 'insufficient',
          }).limitations,
        );
    });
  });

  describe('Validation gate', () => {
    it('should reject an invalid prescription without producing an explanation', () => {
      const context = createContext();

      // const prescription = {
      //   ...generateCoachingRecommendation(context),
      // };

      // Use the existing workout rule to obtain a valid prescription.
      const validResult = generateCoachingRecommendation(context);

      if (validResult.status !== 'approved') {
        throw new Error('Expected a valid fixture recommendation.');
      }

      const invalidPrescription: WorkoutPrescription = {
        ...validResult.recommendation.prescription,
        title: '   ',
      };

      const result = finalizeCoachingRecommendation(
        context,
        invalidPrescription,
      );

      expect(result.status).toBe('rejected');

      if (result.status !== 'rejected') {
        throw new Error('Expected a rejected recommendation.');
      }

      expect(result.validation.valid).toBe(false);

      expect(result.validation.issues).toContainEqual(
        expect.objectContaining({
          code: 'missing_title',
        }),
      );

      expect(result).not.toHaveProperty('explanation');
      expect(result).not.toHaveProperty('recommendation');
    });
  });

  describe('Unsupported workout types', () => {
    it.each(['tempo', 'interval'] as const)(
      'should propagate the existing unsupported %s rule',
      (workoutType) => {
        expect(() =>
          generateCoachingRecommendation(
            createContext(),
            workoutType,
          ),
        ).toThrow(RangeError);
      },
    );
  });
});