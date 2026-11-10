
import { analyzeTraining } from './training-analysis';
import type { CoachingContext } from './coaching.types';

describe('analyzeTraining', () => {
  const createContext = (
    overrides: Partial<CoachingContext> = {},
  ): CoachingContext => ({
    generatedAt: '2026-11-07T10:00:00.000Z',

    analysisWindow: {
      startDate: '2026-10-19T00:00:00.000Z',
      endDate: '2026-11-07T02:00:00.000Z',
    },

    activities: [],

    currentPeriod: null,
    previousPeriod: null,

    periodComparison: {
      distanceKm: {
        currentValue: 15,
        previousValue: 12,
        difference: 3,
        percentageChange: 25,
      },
      activityCount: {
        currentValue: 3,
        previousValue: 2,
        difference: 1,
        percentageChange: 50,
      },
      longestRunDistanceKm: {
        currentValue: 8,
        previousValue: 6,
        difference: 2,
        percentageChange: 33.33,
      },
      averagePaceSecondsPerKm: {
        currentValue: 400,
        previousValue: 420,
        difference: -20,
        percentageChange: -4.76,
      },
      averageMovingPaceSecondsPerKm: {
        currentValue: 390,
        previousValue: 410,
        difference: -20,
        percentageChange: -4.87,
      },
    },

    personalRecords: [],
    dataStatus: 'sufficient',
    limitations: [],

    ...overrides,
  });

  it('should analyze volume, consistency, pace, and long-run trends', () => {
    const result = analyzeTraining(createContext());

    expect(result.observations.map((item) => item.code)).toEqual([
      'volume_trend',
      'consistency',
      'pace_trend',
      'long_run',
    ]);

    expect(result.observations[0].summary).toContain('meningkat');
    expect(result.observations[1].summary).toContain('meningkat');
    expect(result.observations[2].summary).toContain('lebih cepat');
    expect(result.observations[3].summary).toContain('meningkat');

    expect(result.observations[0].evidence[0]).toEqual({
      metric: 'weekly_distance',
      currentValue: 15,
      previousValue: 12,
      unit: 'km',
    });
  });

  it('should identify slower pace when current pace is higher', () => {
    const context = createContext({
      periodComparison: {
        ...createContext().periodComparison!,
        averagePaceSecondsPerKm: {
          currentValue: 430,
          previousValue: 420,
          difference: 10,
          percentageChange: 2.38,
        },
      },
    });

    const result = analyzeTraining(context);

    const paceObservation = result.observations.find(
      (item) => item.code === 'pace_trend',
    );

    expect(paceObservation?.summary).toContain('lebih lambat');
  });

  it('should identify stable metrics when values are equal', () => {
    const base = createContext();

    const context = createContext({
      periodComparison: {
        ...base.periodComparison!,
        distanceKm: {
          currentValue: 10,
          previousValue: 10,
          difference: 0,
          percentageChange: 0,
        },
      },
    });

    const result = analyzeTraining(context);

    const volumeObservation = result.observations.find(
      (item) => item.code === 'volume_trend',
    );

    expect(volumeObservation?.summary).toContain('stabil');
  });

  it('should skip comparisons when previous values are unavailable', () => {
    const base = createContext();

    const context = createContext({
      periodComparison: {
        ...base.periodComparison!,
        distanceKm: {
          currentValue: 15,
          previousValue: null,
          difference: null,
          percentageChange: null,
        },
      },
    });

    const result = analyzeTraining(context);

    expect(
      result.observations.some((item) => item.code === 'volume_trend'),
    ).toBe(false);
  });

  it('should include personal records inside the analysis window', () => {
    const context = createContext({
      personalRecords: [
        {
          key: '5k',
          label: '5K',
          targetDistanceM: 5000,
          minDistanceM: 4950,
          maxDistanceM: 5050,
          record: {
            activityId: 'activity-1',
            distanceM: 5000,
            durationSeconds: 1800,
            startedAt: '2026-10-25T08:00:00.000Z',
          },
        },
        {
          key: '10k',
          label: '10K',
          targetDistanceM: 10000,
          minDistanceM: 9900,
          maxDistanceM: 10100,
          record: {
            activityId: 'activity-2',
            distanceM: 10000,
            durationSeconds: 3900,
            startedAt: '2026-10-10T08:00:00.000Z',
          },
        },
      ],
    });

    const result = analyzeTraining(context);

    const personalRecords = result.observations.filter(
      (item) => item.code === 'personal_record',
    );

    expect(personalRecords).toHaveLength(1);
    expect(personalRecords[0].summary).toContain('5K');
    expect(personalRecords[0].evidence[0]).toEqual({
      metric: 'personal_record_5k',
      currentValue: 1800,
      unit: 'seconds',
    });
  });

  it('should return no trend observations when period comparison is unavailable', () => {
    const result = analyzeTraining(
      createContext({
        periodComparison: null,
        personalRecords: [],
      }),
    );

    expect(result.observations).toEqual([]);
  });

  it('should preserve data status and limitations from context', () => {
    const context = createContext({
      dataStatus: 'insufficient',
      limitations: [
        {
          code: 'insufficient_activity_history',
          description: 'Not enough recent activities.',
        },
      ],
    });

    const result = analyzeTraining(context);

    expect(result.dataStatus).toBe('insufficient');
    expect(result.limitations).toEqual(context.limitations);
  });

  it('should reject an invalid analysis window', () => {
    const context = createContext({
      analysisWindow: {
        startDate: 'invalid',
        endDate: '2026-11-07T00:00:00.000Z',
      },
    });

    expect(() => analyzeTraining(context)).toThrow(
      'Invalid coaching analysis window',
    );
  });
});
