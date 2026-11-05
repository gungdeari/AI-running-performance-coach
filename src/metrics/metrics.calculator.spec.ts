import {
    calculateActivityPace,
    calculateRunningVolumeMetrics,
    calculateRunningPhysiologyMetrics,
  } from './metrics.calculator';

import { MetricActivityInput } from './metrics.types';

describe('Metrics Calculator', () => {
    const activityOne: MetricActivityInput = {
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

describe('calculateActivityPace', () => {
    it('should calculate elapsed and moving pace', () => {
    const result = calculateActivityPace(activityOne);

    expect(result).toEqual({
        distanceKm: 5,
        durationSeconds: 1800,
        movingDurationSeconds: 1750,
        averagePaceSecondsPerKm: 360,
        movingPaceSecondsPerKm: 350,
    });
    });

    it('should calculate pace for treadmill running', () => {
    const activity = {
        ...activityOne,
        sportType: 'treadmill_running',
        distanceM: 10000,
        durationSeconds: 3600,
    };

    const result = calculateActivityPace(activity);

    expect(result?.averagePaceSecondsPerKm).toBe(360);
    });

    it('should return null for invalid distance', () => {
    const activity = {
        ...activityOne,
        distanceM: 0,
    };

    expect(calculateActivityPace(activity)).toBeNull();
    });

    it('should return null for invalid duration', () => {
    const activity = {
        ...activityOne,
        durationSeconds: null,
    };

    expect(calculateActivityPace(activity)).toBeNull();
    });

    it('should return null moving pace when moving duration is unavailable', () => {
    const activity = {
        ...activityOne,
        movingDurationSeconds: null,
    };

    const result = calculateActivityPace(activity);

    expect(result?.averagePaceSecondsPerKm).toBe(360);
    expect(result?.movingDurationSeconds).toBeNull();
    expect(result?.movingPaceSecondsPerKm).toBeNull();
    });

    it('should return null moving pace for zero moving duration', () => {
    const activity = {
        ...activityOne,
        movingDurationSeconds: 0,
    };

    const result = calculateActivityPace(activity);

    expect(result?.movingPaceSecondsPerKm).toBeNull();
    });
});

describe('calculateRunningVolumeMetrics', () => {
    const physiologyActivities: MetricActivityInput[] = [
        {
          sportType: 'running',
          distanceM: 5000,
          durationSeconds: 1800,
          averageHr: 150,
          maxHr: 175,
          averageCadence: 160,
          elevationGainM: 50,
        },
        {
          sportType: 'running',
          distanceM: 10000,
          durationSeconds: 3600,
          averageHr: 160,
          maxHr: 185,
          averageCadence: 170,
          elevationGainM: 100,
        },
    ];

    it('should calculate weighted average HR, max HR, cadence, and elevation', () => {
    const result = calculateRunningPhysiologyMetrics(physiologyActivities);

    expect(result.averageHr).toBeCloseTo(156.6667, 3);
    expect(result.maxHr).toBe(185);
    expect(result.averageCadence).toBeCloseTo(166.6667, 3);
    expect(result.totalElevationGainM).toBe(150);
    });

    it('should calculate total running volume and aggregate pace', () => {
    const activities: MetricActivityInput[] = [
        activityOne,
        {
        ...activityOne,
        id: 'activity-002',
        distanceM: 10000,
        durationSeconds: 4200,
        movingDurationSeconds: 4000,
        },
    ];

    const result = calculateRunningVolumeMetrics(activities);

    expect(result).toEqual({
        activityCount: 2,
        totalDistanceKm: 15,
        totalDurationSeconds: 6000,
        totalMovingDurationSeconds: 5750,
        averagePaceSecondsPerKm: 400,
        averageMovingPaceSecondsPerKm: 383.3333333333333,
    });
    });

    it('should calculate moving pace using only activities with valid moving duration', () => {
    const activities: MetricActivityInput[] = [
        activityOne,
        {
        ...activityOne,
        id: 'activity-002',
        distanceM: 10000,
        durationSeconds: 4200,
        movingDurationSeconds: null,
        },
    ];

    const result = calculateRunningVolumeMetrics(activities);

    expect(result.totalDistanceKm).toBe(15);
    expect(result.totalDurationSeconds).toBe(6000);

    expect(result.totalMovingDurationSeconds).toBe(1750);
    expect(result.averageMovingPaceSecondsPerKm).toBe(350);
    });

    it('should return null moving metrics when all moving durations are unavailable', () => {
    const activities = [
        {
        ...activityOne,
        movingDurationSeconds: null,
        },
    ];

    const result = calculateRunningVolumeMetrics(activities);

    expect(result.totalMovingDurationSeconds).toBeNull();
    expect(result.averageMovingPaceSecondsPerKm).toBeNull();
    });

    it('should exclude unsupported sport types', () => {
    const activities: MetricActivityInput[] = [
        activityOne,
        {
        ...activityOne,
        id: 'activity-002',
        sportType: 'strength_training',
        },
    ];

    const result = calculateRunningVolumeMetrics(activities);

    expect(result.activityCount).toBe(1);
    expect(result.totalDistanceKm).toBe(5);
    });

    it('should exclude activities with invalid distance or duration', () => {
    const activities: MetricActivityInput[] = [
        activityOne,
        {
        ...activityOne,
        id: 'activity-002',
        distanceM: 0,
        },
        {
        ...activityOne,
        id: 'activity-003',
        durationSeconds: null,
        },
    ];

    const result = calculateRunningVolumeMetrics(activities);

    expect(result.activityCount).toBe(1);
    expect(result.totalDistanceKm).toBe(5);
    });

    it('should return unavailable metrics for empty input', () => {
    const result = calculateRunningVolumeMetrics([]);

    expect(result).toEqual({
        activityCount: 0,
        totalDistanceKm: null,
        totalDurationSeconds: null,
        totalMovingDurationSeconds: null,
        averagePaceSecondsPerKm: null,
        averageMovingPaceSecondsPerKm: null,
        });
        });
    });
});