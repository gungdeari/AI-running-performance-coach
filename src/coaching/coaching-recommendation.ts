import type {
  CoachingContext,
  CoachingRecommendationResult,
  WorkoutPrescription,
} from './coaching.types';

import { analyzeTraining } from './training-analysis';
import { generateWorkoutPrescription } from './workout-rules';
import { validateWorkoutPrescription } from './recommendation-validator';
import { buildCoachingExplanation } from './coaching-explanation';

export function finalizeCoachingRecommendation(
  context: CoachingContext,
  prescription: WorkoutPrescription,
): CoachingRecommendationResult {
  const analysis = analyzeTraining(context);

  const validation = validateWorkoutPrescription(
    prescription,
    context,
  );

  if (!validation.valid) {
    return {
      status: 'rejected',
      prescription,
      validation,
    };
  }

  const explanation = buildCoachingExplanation(
    analysis,
    prescription,
  );

  return {
    status: 'approved',
    recommendation: {
      prescription,
      validation,
      explanation,
    },
  };
}

export function generateCoachingRecommendation(
  context: CoachingContext,
  requestedWorkoutType?: Parameters<
    typeof generateWorkoutPrescription
  >[1],
): CoachingRecommendationResult {
  const prescription = generateWorkoutPrescription(
    context,
    requestedWorkoutType,
  );

  return finalizeCoachingRecommendation(
    context,
    prescription,
  );
}