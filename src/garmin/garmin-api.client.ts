
import { Injectable } from '@nestjs/common';
import { GarminAuthService } from './garmin-auth.service';

const API_BASE_URL = 'https://personal.connectapi.garmin.com';
const ACTIVITIES_PATH =
  '/activitylist-service/activities/search/activities';

const REQUEST_TIMEOUT_MS = 15_000;

@Injectable()
export class GarminApiClient {
  constructor(
    private readonly authService: GarminAuthService,
  ) {}

  /**
   * Fetch activities using a newly obtained access token.
   */
  async fetchActivities(
    start = 0,
    limit = 10,
  ): Promise<unknown> {
    // Validate parameters BEFORE obtaining an access token.
    this.validatePaginationParams(start, limit);

    const accessToken =
      await this.authService.obtainAccessToken();

    return this.fetchActivitiesWithToken(
      start,
      limit,
      accessToken,
    );
  }

  /**
   * Fetch activities using an existing access token.
   * Used by GarminPaginationService to reuse one token
   * across multiple pagination requests.
   */
  async fetchActivitiesWithToken(
    start: number,
    limit: number,
    accessToken: string,
  ): Promise<unknown> {
    this.validatePaginationParams(start, limit);

    if (
      typeof accessToken !== 'string' ||
      accessToken.trim().length === 0
    ) {
      throw new Error('Garmin access token tidak valid.');
    }

    const params = new URLSearchParams({
      start: String(start),
      limit: String(limit),
    });

    const url =
      `${API_BASE_URL}${ACTIVITIES_PATH}?${params.toString()}`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new Error(
        'Request daftar aktivitas Garmin gagal karena masalah jaringan atau timeout.',
      );
    }

    if (!response.ok) {
      throw new Error(
        `Gagal mengambil aktivitas Garmin. HTTP status: ${response.status}.`,
      );
    }

    try {
      return await response.json();
    } catch {
      throw new Error(
        'Respons daftar aktivitas Garmin tidak dapat dibaca sebagai JSON.',
      );
    }
  }

  /**
   * Shared pagination parameter validation.
   */
  private validatePaginationParams(
    start: number,
    limit: number,
  ): void {
    if (!Number.isInteger(start) || start < 0) {
      throw new Error(
        'Parameter start harus berupa integer >= 0.',
      );
    }

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error(
        'Parameter limit harus berupa integer > 0.',
      );
    }
  }
}
