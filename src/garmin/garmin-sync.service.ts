
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { GarminPaginationService } from './garmin-pagination.service';
import { ActivityPersistenceService } from './activity-persistence.service';

export interface GarminSyncResult {
    syncRunId: string;
    status: 'SUCCEEDED' | 'PARTIAL';
    activitiesFetched: number;
    activitiesCreated: number;
    activitiesUpdated: number;
    activitiesInvalid: number;
    activitiesDuplicates: number;
}

@Injectable()
export class GarminSyncService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paginationService: GarminPaginationService,
        private readonly persistenceService: ActivityPersistenceService,
    ) {}

    async syncActivities(
        userId: string,
        externalConnectionId: string,
    ): Promise<GarminSyncResult> {
    // 1. Validate connection ownership and status.
    const connection = await this.prisma.externalConnection.findFirst({
      where: {
        id: externalConnectionId,
        userId,
        provider: 'GARMIN',
        status: 'ACTIVE',
      },
    });

    if (!connection) {
      throw new Error('Active Garmin connection not found.');
    }

    // 2. Create sync run.
    const syncRun = await this.prisma.syncRun.create({
      data: {
        userId,
        externalConnectionId,
        status: 'RUNNING',
      },
    });

    try {
      // 3. Fetch all activities from Garmin.
      const payloads =
        await this.paginationService.fetchAllActivities();

      // 4. Persist activities.
      const persistenceResult =
        await this.persistenceService.persistActivities(
          payloads,
          userId,
          externalConnectionId,
        );

      // 5. Determine final status.
      const status =
        persistenceResult.invalid > 0 ? 'PARTIAL' : 'SUCCEEDED';

      // 6. Update SyncRun and connection.
      await this.prisma.$transaction([
        this.prisma.syncRun.update({
          where: { id: syncRun.id },
          data: {
            status,
            completedAt: new Date(),
            activitiesFetched: persistenceResult.received,
            activitiesCreated: persistenceResult.created,
            activitiesUpdated: 0,
          },
        }),

        this.prisma.externalConnection.update({
          where: { id: externalConnectionId },
          data: {
            lastSyncedAt: new Date(),
          },
        }),
      ]);

      return {
        syncRunId: syncRun.id,
        status,
        activitiesFetched: persistenceResult.received,
        activitiesCreated: persistenceResult.created,
        activitiesUpdated: 0,
        activitiesInvalid: persistenceResult.invalid,
        activitiesDuplicates: persistenceResult.duplicates,
      };
    } catch (error) {
      // 7. Mark sync as failed.
      await this.prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorCode: 'GARMIN_SYNC_FAILED',
          errorMessage: 'Garmin activity synchronization failed.',
        },
      });

      throw error;
    }
  }
}
