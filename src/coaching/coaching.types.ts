import {
  COACHING_DATA_STATUSES,
  COACHING_LIMITATION_CODES,
  COACHING_OBSERVATION_CODES,
  COACHING_OBSERVATION_SEVERITIES,
  COACHING_WORKOUT_TYPES,
  RECOMMENDATION_VALIDATION_SEVERITIES,
  WORKOUT_INTENSITY_LEVELS,
  WORKOUT_SEGMENT_TYPES,
} from './coaching.constants';

import type {
  MetricActivityInput,
  PeriodMetrics,
  PeriodComparison,
  PersonalRecordResult,
} from '../metrics/metrics.types';

export type CoachingWorkoutType =
  (typeof COACHING_WORKOUT_TYPES)[number];

export type CoachingDataStatus =
  (typeof COACHING_DATA_STATUSES)[number];

export type CoachingObservationCode =
  (typeof COACHING_OBSERVATION_CODES)[number];

export type CoachingObservationSeverity =
  (typeof COACHING_OBSERVATION_SEVERITIES)[number];

export type CoachingLimitationCode =
  (typeof COACHING_LIMITATION_CODES)[number];

export type WorkoutIntensityLevel =
  (typeof WORKOUT_INTENSITY_LEVELS)[number];

export type WorkoutSegmentType =
  (typeof WORKOUT_SEGMENT_TYPES)[number];

export type RecommendationValidationSeverity =
  (typeof RECOMMENDATION_VALIDATION_SEVERITIES)[number];

export interface CoachingLimitation {
  code: CoachingLimitationCode;
  description: string;
}

export interface CoachingAnalysisWindow {
  startDate: string;
  endDate: string;
}

export interface CoachingContext {
  generatedAt: string;
  analysisWindow: CoachingAnalysisWindow;
  activities: MetricActivityInput[];
  currentPeriod: PeriodMetrics | null;
  previousPeriod: PeriodMetrics | null;
  periodComparison: PeriodComparison | null;
  personalRecords: PersonalRecordResult[];
  dataStatus: CoachingDataStatus;
  limitations: CoachingLimitation[];
}

export interface TrainingEvidence {
  metric: string;
  currentValue: number | null;
  previousValue?: number | null;
  unit: string;
}

export interface TrainingObservation {
  code: CoachingObservationCode;
  severity: CoachingObservationSeverity;
  summary: string;
  evidence: TrainingEvidence[];
}

export interface TrainingAnalysis {
  dataStatus: CoachingDataStatus;
  observations: TrainingObservation[];
  limitations: CoachingLimitation[];
}

export interface WorkoutSegment {
  type: WorkoutSegmentType;
  description: string;
  durationMinutes: number | null;
  distanceKm: number | null;
}

export interface WorkoutPrescription {
  workoutType: CoachingWorkoutType;
  title: string;
  objective: string;
  intensity: WorkoutIntensityLevel;
  durationMinutes: number | null;
  distanceKm: number | null;
  segments: WorkoutSegment[];
  rationaleObservationCodes: CoachingObservationCode[];
}

export interface RecommendationValidationIssue {
  code: string;
  severity: RecommendationValidationSeverity;
  description: string;
}

export interface RecommendationValidationResult {
  valid: boolean;
  issues: RecommendationValidationIssue[];
}

export interface CoachingExplanation {
  summary: string;
  rationale: string[];
  limitations: string[];
}

export interface CoachingRecommendation {
  prescription: WorkoutPrescription;
  validation: RecommendationValidationResult;
  explanation: CoachingExplanation;
}

export type CoachingRecommendationResult =
| {
    status: 'approved';
    recommendation: CoachingRecommendation;
  }
| {
    status: 'rejected';
    prescription: WorkoutPrescription;
    validation: RecommendationValidationResult;
  };