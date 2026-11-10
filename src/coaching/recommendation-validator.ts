
import {
  COACHING_MINIMUM_RECENT_ACTIVITIES,
  COACHING_OBSERVATION_CODES,
} from './coaching.constants';

import type {
  CoachingContext,
  RecommendationValidationIssue,
  RecommendationValidationResult,
  WorkoutPrescription,
} from './coaching.types';

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function addIssue(
  issues: RecommendationValidationIssue[],
  code: string,
  description: string,
): void {
  issues.push({
    code,
    severity: 'error',
    description,
  });
}

function validatePrescriptionFields(
  prescription: WorkoutPrescription,
  issues: RecommendationValidationIssue[],
): void {
  if (!prescription.title?.trim()) {
    addIssue(issues, 'missing_title', 'Workout title is required.');
  }

  if (!prescription.objective?.trim()) {
    addIssue(issues, 'missing_objective', 'Workout objective is required.');
  }

  if (
    prescription.durationMinutes != null &&
    !isPositiveFinite(prescription.durationMinutes)
  ) {
    addIssue(
      issues,
      'invalid_duration',
      'Workout duration must be a positive finite number.',
    );
  }

  if (
    prescription.distanceKm != null &&
    !isPositiveFinite(prescription.distanceKm)
  ) {
    addIssue(
      issues,
      'invalid_distance',
      'Workout distance must be a positive finite number.',
    );
  }

  if (
    prescription.durationMinutes == null &&
    prescription.distanceKm == null
  ) {
    addIssue(
      issues,
      'missing_workout_target',
      'Workout must define either duration or distance.',
    );
  }

  if (!Array.isArray(prescription.segments)) {
    addIssue(issues, 'invalid_segments', 'Workout segments must be provided.');
    return;
  }

  if (prescription.segments.length === 0) {
    addIssue(issues, 'empty_segments', 'Workout must contain at least one segment.');
    return;
  }

  const requiredSegmentTypes = ['warmup', 'main', 'cooldown'] as const;

  for (const requiredType of requiredSegmentTypes) {
    if (
      !prescription.segments.some(
        (segment) => segment.type === requiredType,
      )
    ) {
      addIssue(
        issues,
        'missing_required_segment',
        `Workout must contain a ${requiredType} segment.`,
      );
    }
  }

  for (const [index, segment] of prescription.segments.entries()) {
    if (!segment.description?.trim()) {
      addIssue(
        issues,
        'missing_segment_description',
        `Segment ${index + 1} requires a description.`,
      );
    }

    if (
      segment.durationMinutes != null &&
      !isPositiveFinite(segment.durationMinutes)
    ) {
      addIssue(
        issues,
        'invalid_segment_duration',
        `Segment ${index + 1} has an invalid duration.`,
      );
    }

    if (
      segment.distanceKm != null &&
      !isPositiveFinite(segment.distanceKm)
    ) {
      addIssue(
        issues,
        'invalid_segment_distance',
        `Segment ${index + 1} has an invalid distance.`,
      );
    }

    const hasDuration = segment.durationMinutes != null;
    const hasDistance = segment.distanceKm != null;

    if (hasDuration === hasDistance) {
      addIssue(
        issues,
        'invalid_segment_target',
        `Segment ${index + 1} must define exactly one target: duration or distance.`,
      );
    }
  }

  if (
    prescription.durationMinutes != null &&
    prescription.segments.every(
      (segment) => segment.durationMinutes != null,
    )
  ) {
    const totalDuration = prescription.segments.reduce(
      (total, segment) => total + (segment.durationMinutes ?? 0),
      0,
    );

    if (Math.abs(totalDuration - prescription.durationMinutes) > 0.01) {
      addIssue(
        issues,
        'duration_mismatch',
        'Segment durations do not match the workout duration.',
      );
    }
  }

  if (prescription.distanceKm != null) {
    const totalDistance = prescription.segments.reduce(
      (total, segment) => total + (segment.distanceKm ?? 0),
      0,
    );

    if (Math.abs(totalDistance - prescription.distanceKm) > 0.01) {
      addIssue(
        issues,
        'distance_mismatch',
        'Segment distances do not match the workout distance.',
      );
    }
  }

  for (const code of prescription.rationaleObservationCodes) {
    if (
      !COACHING_OBSERVATION_CODES.some(
        (validCode) => validCode === code,
      )
    ) {
      addIssue(
        issues,
        'invalid_rationale_code',
        `Unsupported rationale observation code: ${code}.`,
      );
    }
  }
}

function validateWorkoutType(
  prescription: WorkoutPrescription,
  context: CoachingContext,
  issues: RecommendationValidationIssue[],
): void {
  switch (prescription.workoutType) {
    case 'easy': {
      if (prescription.intensity !== 'low') {
        addIssue(
          issues,
          'invalid_easy_intensity',
          'Easy Run must use low intensity.',
        );
      }

      if (
        prescription.durationMinutes == null ||
        prescription.distanceKm != null
      ) {
        addIssue(
          issues,
          'invalid_easy_target',
          'Easy Run must use a duration-based target.',
        );
      }

      if (
        prescription.segments.some(
          (segment) =>
            segment.durationMinutes == null ||
            segment.distanceKm != null,
        )
      ) {
        addIssue(
          issues,
          'invalid_easy_segment_target',
          'All Easy Run segments must use duration-based targets.',
        );
      }

      break;
    }

    case 'long_run': {
      if (prescription.intensity !== 'low') {
        addIssue(
          issues,
          'invalid_long_run_intensity',
          'Long Run must use low intensity.',
        );
      }

      if (
        prescription.distanceKm == null ||
        prescription.durationMinutes != null
      ) {
        addIssue(
          issues,
          'invalid_long_run_target',
          'Long Run must use a distance-based target.',
        );
      }

      const mainSegments = prescription.segments.filter(
        (segment) => segment.type === 'main',
      );

      if (
        mainSegments.length !== 1 ||
        mainSegments[0]?.distanceKm == null ||
        mainSegments[0]?.durationMinutes != null
      ) {
        addIssue(
          issues,
          'invalid_long_run_main_segment',
          'Long Run must contain exactly one distance-based main segment.',
        );
      }

      const nonMainSegments = prescription.segments.filter(
        (segment) => segment.type !== 'main',
      );

      if (
        nonMainSegments.some(
          (segment) =>
            segment.durationMinutes == null ||
            segment.distanceKm != null,
        )
      ) {
        addIssue(
          issues,
          'invalid_long_run_supporting_segment',
          'Long Run supporting segments must use duration-based targets.',
        );
      }

      const baseline =
        context.currentPeriod?.longestRunDistanceKm;

      if (
        context.dataStatus !== 'sufficient' ||
        context.activities.length <
          COACHING_MINIMUM_RECENT_ACTIVITIES ||
        baseline == null ||
        !isPositiveFinite(baseline)
      ) {
        addIssue(
          issues,
          'insufficient_long_run_history',
          'Long Run requires sufficient recent activity history and a valid distance baseline.',
        );
      } else if (
        prescription.distanceKm != null &&
        prescription.distanceKm > baseline
      ) {
        addIssue(
          issues,
          'long_run_exceeds_baseline',
          'Long Run distance must not exceed the established baseline.',
        );
      }

      if (
        !prescription.rationaleObservationCodes.includes('long_run')
      ) {
        addIssue(
          issues,
          'missing_long_run_rationale',
          'Long Run must reference the long_run observation.',
        );
      }

      break;
    }

    case 'strength_training': {
      if (prescription.intensity !== 'moderate') {
        addIssue(
          issues,
          'invalid_strength_intensity',
          'Strength Training must use moderate intensity.',
        );
      }

      if (
        prescription.durationMinutes == null ||
        prescription.distanceKm != null
      ) {
        addIssue(
          issues,
          'invalid_strength_target',
          'Strength Training must use a duration-based target.',
        );
      }

      if (
        prescription.segments.some(
          (segment) =>
            segment.durationMinutes == null ||
            segment.distanceKm != null,
        )
      ) {
        addIssue(
          issues,
          'invalid_strength_segment_target',
          'All Strength Training segments must use duration-based targets.',
        );
      }

      break;
    }

    case 'tempo':
    case 'interval':
      addIssue(
        issues,
        'unsupported_workout_type',
        `${prescription.workoutType} prescriptions are not supported yet.`,
      );
      break;

    default:
      addIssue(
        issues,
        'unknown_workout_type',
        'Workout type is not supported.',
      );
  }
}

export function validateWorkoutPrescription(
  prescription: WorkoutPrescription,
  context: CoachingContext,
): RecommendationValidationResult {
  const issues: RecommendationValidationIssue[] = [];

  validatePrescriptionFields(prescription, issues);
  validateWorkoutType(prescription, context, issues);

  return {
    valid: issues.length === 0,
    issues,
  };
}
