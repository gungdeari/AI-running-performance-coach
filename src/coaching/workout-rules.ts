import {
  COACHING_MINIMUM_RECENT_ACTIVITIES,
} from './coaching.constants';

import type {
  CoachingContext,
  CoachingWorkoutType,
  WorkoutPrescription,
  WorkoutSegment,
} from './coaching.types';

function createEasyWorkout(): WorkoutPrescription {
  return {
    workoutType: 'easy',
    title: 'Easy Run',
    objective:
      'Maintain running consistency with a comfortable effort.',
    intensity: 'low',
    durationMinutes: 30,
    distanceKm: null,
    segments: [
      {
        type: 'warmup',
        description:
          'Start with gentle walking and easy movement.',
        durationMinutes: 5,
        distanceKm: null,
      },
      {
        type: 'main',
        description:
          'Run at a comfortable, conversational effort.',
        durationMinutes: 20,
        distanceKm: null,
      },
      {
        type: 'cooldown',
        description:
          'Finish with easy walking.',
        durationMinutes: 5,
        distanceKm: null,
      },
    ],
    rationaleObservationCodes: ['consistency'],
  };
}

function canRecommendLongRun(
  context: CoachingContext,
): boolean {
  const hasEnoughActivities =
    context.activities.length >=
    COACHING_MINIMUM_RECENT_ACTIVITIES;

  const hasEstablishedBaseline =
    context.currentPeriod?.longestRunDistanceKm != null &&
    context.currentPeriod.longestRunDistanceKm > 0;

  return (
    context.dataStatus === 'sufficient' &&
    hasEnoughActivities &&
    hasEstablishedBaseline
  );
}

function createLongRunWorkout(
  context: CoachingContext,
): WorkoutPrescription {
  const baselineDistance =
    context.currentPeriod?.longestRunDistanceKm;

  if (
    baselineDistance == null ||
    !Number.isFinite(baselineDistance) ||
    baselineDistance <= 0
  ) {
    throw new RangeError(
      'A valid long-run baseline is required.',
    );
  }

  return {
    workoutType: 'long_run',
    title: 'Long Run',
    objective:
      'Maintain the established long-run distance baseline.',
    intensity: 'low',
    durationMinutes: null,
    distanceKm: baselineDistance,
    segments: [
      {
        type: 'warmup',
        description:
          'Start with gentle walking and easy movement.',
        durationMinutes: 5,
        distanceKm: null,
      },
      {
        type: 'main',
        description:
          'Run comfortably and maintain the established distance baseline.',
        durationMinutes: null,
        distanceKm: baselineDistance,
      },
      {
        type: 'cooldown',
        description:
          'Finish with easy walking.',
        durationMinutes: 5,
        distanceKm: null,
      },
    ],
    rationaleObservationCodes: ['long_run'],
  };
}

function createStrengthWorkout(): WorkoutPrescription {
  return {
    workoutType: 'strength_training',
    title: 'Bodyweight Strength Training',
    objective:
      'Support general running strength with a moderate bodyweight session.',
    intensity: 'moderate',
    durationMinutes: 25,
    distanceKm: null,
    segments: [
      {
        type: 'warmup',
        description:
          'Perform gentle mobility and dynamic movements.',
        durationMinutes: 5,
        distanceKm: null,
      },
      {
        type: 'main',
        description:
          'Perform controlled bodyweight exercises with comfortable effort.',
        durationMinutes: 15,
        distanceKm: null,
      },
      {
        type: 'cooldown',
        description:
          'Finish with gentle mobility.',
        durationMinutes: 5,
        distanceKm: null,
      },
    ],
    rationaleObservationCodes: [],
  };
}

export function generateWorkoutPrescription(
  context: CoachingContext,
  requestedWorkoutType?: CoachingWorkoutType,
): WorkoutPrescription {
  const workoutType = requestedWorkoutType ?? 'easy';

  switch (workoutType) {
    case 'easy':
      return createEasyWorkout();

    case 'long_run':
      if (!canRecommendLongRun(context)) {
        throw new RangeError(
          'Insufficient training history for a long-run prescription.',
        );
      }

      return createLongRunWorkout(context);

    case 'strength_training':
      return createStrengthWorkout();

    case 'tempo':
    case 'interval':
      throw new RangeError(
        `Automatic prescription for ${workoutType} is not supported yet.`,
      );

    default:
      throw new RangeError(
        `Unsupported workout type: ${String(workoutType)}`,
      );
  }
}