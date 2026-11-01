
import { Injectable } from '@nestjs/common';
import { GarminAuthService } from './garmin-auth.service';
import { GarminApiClient } from './garmin-api.client';

@Injectable()
export class GarminPaginationService {
  constructor(
    private readonly authService: GarminAuthService,
    private readonly apiClient: GarminApiClient,
  ) {}

  async fetchAllActivities(
    pageSize = 10,
    maxPages = 100,
  ): Promise<unknown[]> {
    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      throw new Error('pageSize harus berupa integer > 0.');
    }

    if (!Number.isInteger(maxPages) || maxPages <= 0) {
      throw new Error('maxPages harus berupa integer > 0.');
    }

    const accessToken = await this.authService.obtainAccessToken();

    const allActivities: unknown[] = [];
    let start = 0;

    for (let page = 0; page < maxPages; page++) {
      const response = await this.apiClient.fetchActivitiesWithToken(
        start,
        pageSize,
        accessToken,
      );

      if (!Array.isArray(response)) {
        throw new Error(
          `Respons aktivitas pada halaman ${page + 1} bukan array.`,
        );
      }

      if (response.length === 0) {
        break;
      }

      allActivities.push(...response);

      if (response.length < pageSize) {
        break;
      }

      start += response.length;

      if (page === maxPages - 1) {
        throw new Error(
          `Batas maksimum pagination (${maxPages} halaman) tercapai. Data mungkin belum lengkap.`,
        );
      }
    }

    return allActivities;
  }
}
