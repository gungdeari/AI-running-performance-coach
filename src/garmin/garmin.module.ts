import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GarminAuthService } from './garmin-auth.service';
import { GarminApiClient } from './garmin-api.client';
import { GarminPaginationService } from './garmin-pagination.service';
import { ActivityPersistenceService } from './activity-persistence.service';

@Module({
  imports: [PrismaModule],
  providers: [
    GarminAuthService,
    GarminApiClient,
    GarminPaginationService,
    ActivityPersistenceService,
  ],
  exports: [
    GarminAuthService,
    GarminApiClient,
    GarminPaginationService,
    ActivityPersistenceService,
  ],
})
export class GarminModule {}