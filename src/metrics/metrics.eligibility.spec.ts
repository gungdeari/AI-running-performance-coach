import {
    filterEligibleRunningActivities,
    validateActivityEligibility,
  } from './metrics.eligibility';

  import { MetricActivityInput } from './metrics.types';

  describe('Metrics Eligibility', () => {
    const validRunningActivity: MetricActivityInput = {
        id: 'activity-001',
        sportType: 'running',
        distanceM: 5000,
        durationSeconds: 1800,
        movingDurationSeconds: 1750,
        averageHr: 150,
        maxHr: 175,
        averageCadence: 165,
        elevationGainM: 50,
    };

    describe('validateActivityEligibility', () => {
      it('should accept valid running activity', () => {
        const result = validateActivityEligibility(validRunningActivity);

        expect(result).toEqual({
            eligible: true,
            reasons: [],
        });
      });

      it('should accept valid treadmill running activity', () => {
        const activity = {
            ...validRunningActivity,
            sportType: 'treadmill_running',
        };

        const result = validateActivityEligibility(activity);

        expect(result.eligible).toBe(true);
      });

      it('should reject unsupported sport type', () => {
        const activity = {
            ...validRunningActivity,
            sportType: 'strength_training',
        };

        const result = validateActivityEligibility(activity);

        expect(result).toEqual({
            eligible: false,
            reasons: ['unsupported_sport_type'],
        });
      });

      it('should reject null distance', () => {
        const activity = {
            ...validRunningActivity,
            distanceM: null,
        };

        const result = validateActivityEligibility(activity);

        expect(result.reasons).toContain('invalid_distance');
      });

      it('should reject zero distance', () => {
        const activity = {
            ...validRunningActivity,
            distanceM: 0,
        };

        const result = validateActivityEligibility(activity);

        expect(result.reasons).toContain('invalid_distance');
      });

      it('should reject negative distance', () => {
        const activity = {
            ...validRunningActivity,
            distanceM: -100,
        };

        const result = validateActivityEligibility(activity);

        expect(result.reasons).toContain('invalid_distance');
      });

      it('should reject invalid duration', () => {
        const activity = {
            ...validRunningActivity,
            durationSeconds: 0,
        };

        const result = validateActivityEligibility(activity);

        expect(result.reasons).toContain('invalid_duration');
      });

      it('should reject non-finite distance', () => {
        const activity = {
            ...validRunningActivity,
            distanceM: Number.NaN,
        };

        const result = validateActivityEligibility(activity);

        expect(result.reasons).toContain('invalid_distance');
      });

      it('should return multiple exclusion reasons', () => {
        const activity = {
            ...validRunningActivity,
            sportType: 'jump_rope',
            distanceM: null,
            durationSeconds: 0,
        };

        const result = validateActivityEligibility(activity);

        expect(result).toEqual({
            eligible: false,
            reasons: [
                'unsupported_sport_type',
                'invalid_distance',
                'invalid_duration',
            ],
        });
      });
    });

    describe('filterEligibleRunningActivities', () => {
      it('should separate eligible and excluded activities', () => {
        const activities: MetricActivityInput[] = [
            validRunningActivity,
            {
                ...validRunningActivity,
                id: 'activity-002',
                sportType: 'treadmill_running',
            },
            {
                ...validRunningActivity,
                id: 'activity-003',
                sportType: 'strength_training',
            },
            {
                ...validRunningActivity,
                id: 'activity-004',
                sportType: 'jump_rope',
                distanceM: null,
            },
        ];

        const result = filterEligibleRunningActivities(activities);

        expect(result.eligibleActivities).toHaveLength(2);
        expect(result.excludedActivities).toHaveLength(2);

        expect(
            result.eligibleActivities.map((activity) => activity.id),
        ).toEqual(['activity-001', 'activity-002']);
      });

      it('should return empty collections for empty input', () => {
        const result = filterEligibleRunningActivities([]);

        expect(result).toEqual({
          eligibleActivities: [],
          excludedActivities: [],
        });
      });

      it('should not modify original activities', () => {
        const activities = [validRunningActivity];
        const original = structuredClone(activities);

        filterEligibleRunningActivities(activities);

        expect(activities).toEqual(original);
      });
    });
  });