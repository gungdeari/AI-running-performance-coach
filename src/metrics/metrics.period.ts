import { MetricsPeriodType } from './metrics.types';

const TIMEZONE = 'Asia/Makassar';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

export function getPeriodKey(
  date: Date | string,
  periodType: MetricsPeriodType,
): string | null {
    const parsedDate = date instanceof Date ? date : new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    const parts = dateFormatter.formatToParts(parsedDate);

    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const day = Number(parts.find((part) => part.type === 'day')?.value);

    if (!year || !month || !day) {
        return null;
    }

    if (periodType === 'monthly') {
        return `${year}-${String(month).padStart(2, '0')}`;
    }

    if (periodType === 'weekly') {
        // Calculate Monday of the local calendar week.
        const localDate = new Date(Date.UTC(year, month - 1, day));
        const dayOfWeek = localDate.getUTCDay();
        const daysSinceMonday = (dayOfWeek + 6) % 7;

        localDate.setUTCDate(localDate.getUTCDate() - daysSinceMonday);

        const mondayYear = localDate.getUTCFullYear();
        const mondayMonth = String(localDate.getUTCMonth() + 1).padStart(2, '0');
        const mondayDay = String(localDate.getUTCDate()).padStart(2, '0');

        return `${mondayYear}-${mondayMonth}-${mondayDay}`;
    }

    return null;
}