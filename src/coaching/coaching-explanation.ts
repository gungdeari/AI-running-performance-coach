
import type {
  CoachingExplanation,
  TrainingAnalysis,
  WorkoutPrescription,
} from './coaching.types';

function formatTarget(
  prescription: WorkoutPrescription,
): string {
  if (prescription.durationMinutes != null) {
    return `${prescription.durationMinutes} menit`;
  }

  if (prescription.distanceKm != null) {
    return `${prescription.distanceKm.toFixed(1)} km`;
  }

  return 'target belum tersedia';
}

function formatIntensity(intensity: WorkoutPrescription['intensity']): string {
  switch (intensity) {
    case 'low':
      return 'rendah';
    case 'moderate':
      return 'sedang';
    case 'high':
      return 'tinggi';
  }
}

function buildRationale(
  analysis: TrainingAnalysis,
  prescription: WorkoutPrescription,
): string[] {
  const rationale: string[] = [];

  for (const code of prescription.rationaleObservationCodes) {
    const observation = analysis.observations.find(
      (item) => item.code === code,
    );

    if (observation) {
      rationale.push(observation.summary);
    }
  }

  if (rationale.length === 0) {
    rationale.push(
      'Belum ada observasi latihan yang secara langsung mendukung rekomendasi ini. Sesi mengikuti aturan dasar untuk jenis workout yang dipilih.',
    );
  }

  for (const segment of prescription.segments) {
    rationale.push(
      `${segment.type}: ${segment.description}`,
    );
  }

  return rationale;
}

export function buildCoachingExplanation(
    analysis: TrainingAnalysis,
    prescription: WorkoutPrescription,
): CoachingExplanation {
  const summary =
    `${prescription.title}. ${prescription.objective} ` +
    `Target: ${formatTarget(prescription)}. ` +
    `Intensitas: ${formatIntensity(prescription.intensity)}.`;

  return {
    summary,
    rationale: buildRationale(analysis, prescription),
    limitations: analysis.limitations.map(
      (limitation) => limitation.description,
    ),
  };
}
