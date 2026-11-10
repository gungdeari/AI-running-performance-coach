
import type {
  CoachingContext,
  TrainingAnalysis,
  TrainingEvidence,
  TrainingObservation,
} from './coaching.types';
  
import type {
  PeriodComparisonMetric,
  PersonalRecordResult,
} from '../metrics/metrics.types';
  
function isFiniteNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}
  
function formatDistance(value: number): string {
  return `${value.toFixed(1)} km`;
}
  
function formatPace(value: number): string {
  const totalSeconds = Math.round(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')} min/km`;
}
  
function formatDuration(value: number): string {
  const totalSeconds = Math.round(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
  
function getDirection(
  currentValue: number,
  previousValue: number,
): 'increased' | 'decreased' | 'stable' {
  if (currentValue > previousValue) return 'increased';
  if (currentValue < previousValue) return 'decreased';
  return 'stable';
}
  
function createComparisonEvidence(
  metric: string,
  comparison: PeriodComparisonMetric,
  unit: string,
): TrainingEvidence | null {
  if (
    !isFiniteNumber(comparison.currentValue) ||
    !isFiniteNumber(comparison.previousValue)
  ) {
    return null;
  }

  return {
    metric,
    currentValue: comparison.currentValue,
    previousValue: comparison.previousValue,
    unit,
  };
}
  
function analyzeVolumeTrend(
  context: CoachingContext,
): TrainingObservation | null {
  const comparison = context.periodComparison?.distanceKm;

  if (!comparison) return null;

  const evidence = createComparisonEvidence(
    'weekly_distance',
    comparison,
    'km',
  );

  if (!evidence) return null;

  const direction = getDirection(
    evidence.currentValue as number,
    evidence.previousValue as number,
  );

  const summary =
    direction === 'increased'
      ? `Total jarak mingguan meningkat dari ${formatDistance(evidence.previousValue as number)} menjadi ${formatDistance(evidence.currentValue as number)}.`
      : direction === 'decreased'
        ? `Total jarak mingguan menurun dari ${formatDistance(evidence.previousValue as number)} menjadi ${formatDistance(evidence.currentValue as number)}.`
        : `Total jarak mingguan stabil di ${formatDistance(evidence.currentValue as number)}.`;

  return {
    code: 'volume_trend',
    severity: 'info',
    summary,
    evidence: [evidence],
  };
}
  
function analyzeConsistency(
  context: CoachingContext,
): TrainingObservation | null {
  const comparison = context.periodComparison?.activityCount;

  if (!comparison) return null;

  const evidence = createComparisonEvidence(
    'weekly_activity_count',
    comparison,
    'activities',
  );

  if (!evidence) return null;

  const direction = getDirection(
    evidence.currentValue as number,
    evidence.previousValue as number,
  );

  const summary =
    direction === 'increased'
      ? `Frekuensi aktivitas mingguan meningkat dari ${evidence.previousValue} menjadi ${evidence.currentValue} aktivitas.`
      : direction === 'decreased'
        ? `Frekuensi aktivitas mingguan menurun dari ${evidence.previousValue} menjadi ${evidence.currentValue} aktivitas.`
        : `Frekuensi aktivitas mingguan stabil di ${evidence.currentValue} aktivitas.`;

  return {
    code: 'consistency',
    severity: 'info',
    summary,
    evidence: [evidence],
  };
}
  
function analyzePaceTrend(
  context: CoachingContext,
): TrainingObservation | null {
  const comparison = context.periodComparison?.averagePaceSecondsPerKm;

  if (!comparison) return null;

  const evidence = createComparisonEvidence(
    'average_elapsed_pace',
    comparison,
    'seconds/km',
  );

  if (!evidence) return null;

  // A lower pace value means a faster running pace.
  const direction = getDirection(
    evidence.currentValue as number,
    evidence.previousValue as number,
  );

  const summary =
    direction === 'decreased'
      ? `Rata-rata elapsed pace lebih cepat, dari ${formatPace(evidence.previousValue as number)} menjadi ${formatPace(evidence.currentValue as number)}.`
      : direction === 'increased'
        ? `Rata-rata elapsed pace lebih lambat, dari ${formatPace(evidence.previousValue as number)} menjadi ${formatPace(evidence.currentValue as number)}.`
        : `Rata-rata elapsed pace stabil di ${formatPace(evidence.currentValue as number)}.`;

  return {
    code: 'pace_trend',
    severity: 'info',
    summary,
    evidence: [evidence],
  };
}
  
function analyzeLongRun(
  context: CoachingContext,
): TrainingObservation | null {
  const comparison = context.periodComparison?.longestRunDistanceKm;

  if (!comparison) return null;

  const evidence = createComparisonEvidence(
    'longest_run_distance',
    comparison,
    'km',
  );

  if (!evidence) return null;

  const direction = getDirection(
    evidence.currentValue as number,
    evidence.previousValue as number,
  );

  const summary =
    direction === 'increased'
      ? `Jarak lari terpanjang meningkat dari ${formatDistance(evidence.previousValue as number)} menjadi ${formatDistance(evidence.currentValue as number)}.`
      : direction === 'decreased'
        ? `Jarak lari terpanjang menurun dari ${formatDistance(evidence.previousValue as number)} menjadi ${formatDistance(evidence.currentValue as number)}.`
        : `Jarak lari terpanjang stabil di ${formatDistance(evidence.currentValue as number)}.`;

  return {
    code: 'long_run',
    severity: 'info',
    summary,
    evidence: [evidence],
  };
}
  
function analyzePersonalRecords(
  records: PersonalRecordResult[],
  startDate: string,
  endDate: string,
): TrainingObservation[] {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end < start
  ) {
    throw new RangeError('Invalid coaching analysis window');
  }

  return records.flatMap((item) => {
    const record = item.record;

    if (!record?.startedAt) return [];

    const recordDate = Date.parse(record.startedAt);

    if (
      !Number.isFinite(recordDate) ||
      recordDate < start ||
      recordDate > end
    ) {
      return [];
    }

    return [{
      code: 'personal_record' as const,
      severity: 'info' as const,
      summary: `Personal best ${item.label} tercatat dalam periode analisis: ${formatDuration(record.durationSeconds)}.`,
      evidence: [{
        metric: `personal_record_${item.key}`,
        currentValue: record.durationSeconds,
        unit: 'seconds',
      }],
    }];
  });
}
  
export function analyzeTraining(
  context: CoachingContext,
): TrainingAnalysis {
  const observations: TrainingObservation[] = [];

  const volume = analyzeVolumeTrend(context);
  const consistency = analyzeConsistency(context);
  const pace = analyzePaceTrend(context);
  const longRun = analyzeLongRun(context);

  if (volume) observations.push(volume);
  if (consistency) observations.push(consistency);
  if (pace) observations.push(pace);
  if (longRun) observations.push(longRun);

  observations.push(
    ...analyzePersonalRecords(
      context.personalRecords,
      context.analysisWindow.startDate,
      context.analysisWindow.endDate,
    ),
  );

  return {
    dataStatus: context.dataStatus,
    observations,
    limitations: context.limitations.map((limitation) => ({
      ...limitation,
    })),
  };
} 