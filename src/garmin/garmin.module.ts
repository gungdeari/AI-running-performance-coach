import { Module } from '@nestjs/common';
import { GarminAuthService } from './garmin-auth.service';
import { GarminApiClient } from './garmin-api.client';
import { GarminPaginationService } from './garmin-pagination.service';

@Module({
  providers: [
    GarminAuthService,
    GarminApiClient,
    GarminPaginationService,
  ],
  exports: [
    GarminAuthService,
    GarminApiClient,
    GarminPaginationService,
  ],
})
export class GarminModule {}