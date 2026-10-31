
import { isGarminActivityPayload } from './garmin-activity.validator';
import { normalizeGarminActivity } from './garmin-activity.normalizer';
import { ActivityDto } from './garmin.types';

export type GarminActivityParseResult =
  | {
      success: true;
      data: ActivityDto;
    }
  | {
      success: false;
      error: 'INVALID_GARMIN_ACTIVITY_PAYLOAD';
    };

/**
 * Validates and normalizes an untrusted Garmin activity payload.
 *
 * This is the single entry point that downstream services
 * should use when processing raw Garmin activity data.
 */
export function parseGarminActivity(
  payload: unknown,
): GarminActivityParseResult {
  if (!isGarminActivityPayload(payload)) {
    return {
      success: false,
      error: 'INVALID_GARMIN_ACTIVITY_PAYLOAD',
    };
  }

  return {
    success: true,
    data: normalizeGarminActivity(payload),
  };
}
