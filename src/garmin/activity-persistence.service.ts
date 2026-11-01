
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { parseGarminActivity } from './garmin-activity.parser';
import { ActivityDto } from './garmin.types';

export interface ActivityPersistenceResult {
  received: number;
  valid: number;
  invalid: number;
  created: number;
  duplicates: number;
}

@Injectable()
export class ActivityPersistenceService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async persistActivities(
    payloads: unknown[],
    userId: string,
    externalConnectionId: string,
  ): Promise<ActivityPersistenceResult> {
    const validActivities: ActivityDto[] = [];

    let invalid = 0;

    for (const payload of payloads) {
      const result = parseGarminActivity(payload);

      if (!result.success) {
        invalid++;
        continue;
      }

      validActivities.push(result.data);
    }

    if (validActivities.length === 0) {
      return {
        received: payloads.length,
        valid: 0,
        invalid,
        created: 0,
        duplicates: 0,
      };
    }

    const data: Prisma.ActivityCreateManyInput[] =
      validActivities.map((activity) => ({
        userId,
        externalConnectionId,

        externalActivityId: activity.externalActivityId,
        name: activity.name,
        sportType: activity.sportType,

        startedAt: activity.startedAt,
        sourceStartTimeLocal: activity.sourceStartTimeLocal,

        distanceM: activity.distanceM,
        durationSeconds: activity.durationSeconds,
        movingDurationSeconds: activity.movingDurationSeconds,

        averageHr: activity.averageHr,
        maxHr: activity.maxHr,
        averageCadence: activity.averageCadence,

        elevationGainM: activity.elevationGainM,
        elevationLossM: activity.elevationLossM,
        calories: activity.calories,

        aerobicTrainingEffect: activity.aerobicTrainingEffect,
        anaerobicTrainingEffect: activity.anaerobicTrainingEffect,
        trainingEffectLabel: activity.trainingEffectLabel,

        hrTimeInZone1Seconds: activity.hrTimeInZone1Seconds,
        hrTimeInZone2Seconds: activity.hrTimeInZone2Seconds,
        hrTimeInZone3Seconds: activity.hrTimeInZone3Seconds,
        hrTimeInZone4Seconds: activity.hrTimeInZone4Seconds,
        hrTimeInZone5Seconds: activity.hrTimeInZone5Seconds,

        averagePowerW: activity.averagePowerW,
        maxPowerW: activity.maxPowerW,
        normalizedPowerW: activity.normalizedPowerW,

        steps: activity.steps,
        avgGroundContactTimeMs: activity.avgGroundContactTimeMs,
        avgStrideLengthCm: activity.avgStrideLengthCm,
        avgVerticalOscillationCm: activity.avgVerticalOscillationCm,
        avgVerticalRatio: activity.avgVerticalRatio,
        maxRunningCadenceSpm: activity.maxRunningCadenceSpm,
        maxSpeedMps: activity.maxSpeedMps,
      }));

    const result = await this.prisma.activity.createMany({
      data,
      skipDuplicates: true,
    });

    return {
      received: payloads.length,
      valid: validActivities.length,
      invalid,
      created: result.count,
      duplicates: validActivities.length - result.count,
    };
  }
}
