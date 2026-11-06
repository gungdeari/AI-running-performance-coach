import { calculatePersonalRecords } from './metrics.personal-records';

import {
  PERSONAL_RECORD_TARGETS,
  PERSONAL_RECORD_TOLERANCE,
} from './metrics.constants';

import { PersonalRecordActivityInput } from './metrics.types';

describe('Personal Records Calculator', () => {
    const createActivity = (
        overrides: Partial<PersonalRecordActivityInput> = {},
      ): PersonalRecordActivityInput => ({
        sportType: 'running',
        distanceM: 5000,
        durationSeconds: 1800,
        startedAt: '2026-10-25T06:00:00.000Z',
        ...overrides,
        id: overrides.id ?? 'activity-001',
      });

    it('should return all six targets in the defined order', () => {
        const result = calculatePersonalRecords([]);

        expect(result.map((item) => item.key)).toEqual(
        PERSONAL_RECORD_TARGETS.map((item) => item.key),
        );

        expect(result).toHaveLength(6);
        expect(result.every((item) => item.record === null)).toBe(true);
    });

    it.each(PERSONAL_RECORD_TARGETS)(
        'should calculate the $label record',
        (target) => {
        const activity = createActivity({
            id: `activity-${target.key}`,
            distanceM: target.distanceM,
            durationSeconds: 1800,
        });

        const result = calculatePersonalRecords([activity]);
        const record = result.find(
            (item) => item.key === target.key,
        )?.record;

        expect(record).toEqual({
            activityId: `activity-${target.key}`,
            distanceM: target.distanceM,
            durationSeconds: 1800,
            startedAt: '2026-10-25T06:00:00.000Z',
        });
        },
    );

    it.each(PERSONAL_RECORD_TARGETS)(
        'should include both tolerance boundaries for $label',
        (target) => {
        const minDistance =
            target.distanceM * (1 - PERSONAL_RECORD_TOLERANCE);

        const maxDistance =
            target.distanceM * (1 + PERSONAL_RECORD_TOLERANCE);

        const result = calculatePersonalRecords([
            createActivity({
            id: `min-${target.key}`,
            distanceM: minDistance,
            durationSeconds: 2000,
            }),
            createActivity({
            id: `max-${target.key}`,
            distanceM: maxDistance,
            durationSeconds: 1900,
            }),
        ]);

        const record = result.find(
            (item) => item.key === target.key,
        )?.record;

        expect(record?.activityId).toBe(`max-${target.key}`);
        },
    );

    it('should select the activity with the shortest duration', () => {
        const result = calculatePersonalRecords([
        createActivity({
            id: 'slower',
            distanceM: 5000,
            durationSeconds: 2000,
        }),
        createActivity({
            id: 'faster',
            distanceM: 5000,
            durationSeconds: 1800,
        }),
    ]);

    expect(
            result.find((item) => item.key === '5k')?.record?.activityId,
        ).toBe('faster');
    });

    it('should use the earlier activity when durations are equal', () => {
        const result = calculatePersonalRecords([
        createActivity({
            id: 'later',
            durationSeconds: 1800,
            startedAt: '2026-10-26T06:00:00.000Z',
        }),
        createActivity({
            id: 'earlier',
            durationSeconds: 1800,
            startedAt: '2026-10-25T06:00:00.000Z',
        }),
    ]);

    expect(
        result.find((item) => item.key === '5k')?.record?.activityId,
        ).toBe('earlier');
    });

    it('should use lexical activity ID when duration and date are equal', () => {
        const result = calculatePersonalRecords([
        createActivity({
            id: 'activity-b',
            durationSeconds: 1800,
        }),
        createActivity({
            id: 'activity-a',
            durationSeconds: 1800,
        }),
    ]);

    expect(
        result.find((item) => item.key === '5k')?.record?.activityId,
        ).toBe('activity-a');
    });

    it('should prefer a valid timestamp over a missing timestamp on a tie', () => {
        const result = calculatePersonalRecords([
        createActivity({
            id: 'without-date',
            durationSeconds: 1800,
            startedAt: null,
        }),
        createActivity({
            id: 'with-date',
            durationSeconds: 1800,
            startedAt: '2026-10-25T06:00:00.000Z',
        }),
    ]);

    expect(
        result.find((item) => item.key === '5k')?.record?.activityId,
        ).toBe('with-date');
    });

    it('should exclude unsupported sports and invalid activities', () => {
        const result = calculatePersonalRecords([
        createActivity({
            id: 'cycling',
            sportType: 'cycling',
        }),
        createActivity({
            id: 'invalid-distance',
            distanceM: 0,
        }),
        createActivity({
            id: 'invalid-duration',
            durationSeconds: null,
        }),
    ]);

    expect(
        result.find((item) => item.key === '5k')?.record,
        ).toBeNull();
    });

    it('should preserve source activity traceability', () => {
        const result = calculatePersonalRecords([
        createActivity({
            id: 'garmin-activity-123',
            distanceM: 5000,
            durationSeconds: 1800,
        }),
    ]);

    expect(
        result.find((item) => item.key === '5k')?.record?.activityId,
        ).toBe('garmin-activity-123');
    });

    it.each(PERSONAL_RECORD_TARGETS)(
        'should exclude distances outside the tolerance for $label',
        (target) => {
        const minDistance =
            target.distanceM * (1 - PERSONAL_RECORD_TOLERANCE);

        const maxDistance =
            target.distanceM * (1 + PERSONAL_RECORD_TOLERANCE);

        const result = calculatePersonalRecords([
            createActivity({
            id: `below-${target.key}`,
            distanceM: minDistance - 0.001,
            durationSeconds: 1000,
            }),
            createActivity({
            id: `above-${target.key}`,
            distanceM: maxDistance + 0.001,
            durationSeconds: 900,
        }),
     ]);

        expect(
            result.find((item) => item.key === target.key)?.record,
        ).toBeNull();
        },
    );
});