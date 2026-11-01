
import { Injectable } from '@nestjs/common';

const TOKEN_URL =
  'https://personal.connectapi.garmin.com/personalapitoken-service/personal-api/personal-api-key/token';

const REQUEST_TIMEOUT_MS = 15_000;

@Injectable()
export class GarminAuthService {
  async obtainAccessToken(): Promise<string> {
    const apiKey = process.env.GARMIN_PERSONAL_API_KEY?.trim();

    if (!apiKey) {
      throw new Error(
        'GARMIN_PERSONAL_API_KEY tidak ditemukan. Periksa konfigurasi environment.',
      );
    }

    let response: Response;

    try {
      response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          Authorization: `ApiKey ${apiKey}`,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new Error(
        'Request autentikasi Garmin gagal karena masalah jaringan atau timeout.',
      );
    }

    if (!response.ok) {
      throw new Error(
        `Autentikasi Garmin gagal. HTTP status: ${response.status}.`,
      );
    }

    let token: string;

    try {
      token = (await response.text()).trim();
    } catch {
      throw new Error('Gagal membaca respons autentikasi Garmin.');
    }

    const parts = token.split('.');

    if (parts.length !== 3 || parts.some((part) => !part)) {
      throw new Error(
        'Respons autentikasi tidak memiliki format JWT yang diharapkan.',
      );
    }

    const payloadPart = parts[1];

    if (!payloadPart) {
      throw new Error('Payload token tidak ditemukan.');
    }

    let payload: { exp?: number };

    try {
      payload = JSON.parse(
        Buffer.from(payloadPart, 'base64url').toString('utf8'),
      ) as { exp?: number };
    } catch {
      throw new Error('Payload token tidak dapat divalidasi.');
    }

    if (
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp)
    ) {
      throw new Error('Token tidak memiliki klaim exp yang valid.');
    }

    const currentTimeSeconds = Math.floor(Date.now() / 1000);

    if (payload.exp <= currentTimeSeconds) {
      throw new Error('Token Garmin yang diterima sudah kedaluwarsa.');
    }

    return token;
  }
}
