export function isValidPositiveNumber(
    value: number | null | undefined,
  ): value is number {
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value > 0
    );
  }

  export function isValidNonNegativeNumber(
    value: number | null | undefined,
  ): value is number {
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= 0
    );
  }