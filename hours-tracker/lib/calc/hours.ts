// Hours are summed in integer hundredths so totals never drift (0.1 + 0.2 !== 0.3).

export function toHundredths(hours: number): number {
  return Math.round(hours * 100);
}

export function fromHundredths(hundredths: number): number {
  return hundredths / 100;
}

export function roundHours(hours: number): number {
  return fromHundredths(toHundredths(hours));
}

export function sumHours(values: Iterable<number>): number {
  let total = 0;
  for (const v of values) total += toHundredths(v);
  return fromHundredths(total);
}

/** Dollar value in cents of `hours` at `rateCents` per hour, rounded to the cent. */
export function hoursToCents(hours: number, rateCents: number): number {
  return Math.round((toHundredths(hours) * rateCents) / 100);
}
