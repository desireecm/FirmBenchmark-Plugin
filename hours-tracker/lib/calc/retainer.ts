import type { ISODate } from "./dates";
import { monthStart } from "./dates";
import { fromHundredths } from "./hours";

export interface RetainerTermInput {
  effectiveFrom: ISODate;
  effectiveTo: ISODate | null;
  monthlyAmountCents: number;
  hourlyRateCents: number;
  monthlyHoursOverride: number | null;
}

/** monthlyHoursOverride ?? round(amount / rate, 2). */
export function monthlyHours(
  term: Omit<RetainerTermInput, "effectiveFrom" | "effectiveTo">,
): number {
  if (term.monthlyHoursOverride != null) return term.monthlyHoursOverride;
  if (term.hourlyRateCents <= 0) return 0;
  return fromHundredths(Math.round((term.monthlyAmountCents * 100) / term.hourlyRateCents));
}

/** Human-readable formula for tooltips, e.g. "10.15 hrs = $1,675 ÷ $165". */
export function monthlyHoursFormula(
  term: Omit<RetainerTermInput, "effectiveFrom" | "effectiveTo">,
): string {
  const hrs = monthlyHours(term).toFixed(2);
  if (term.monthlyHoursOverride != null) return `${hrs} hrs (admin override)`;
  return `${hrs} hrs = ${formatDollars(term.monthlyAmountCents)} ÷ ${formatDollars(term.hourlyRateCents)}`;
}

export function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/**
 * The term in effect on the 1st of the month. A change made mid-month does not
 * apply until the following month (decisions.md Q8).
 */
export function activeTermForMonth<T extends RetainerTermInput>(
  terms: readonly T[],
  month: ISODate,
): T | null {
  const first = monthStart(month);
  const covering = terms.filter(
    (t) => t.effectiveFrom <= first && (t.effectiveTo == null || t.effectiveTo >= first),
  );
  if (covering.length === 0) return null;
  // If ranges overlap, the most recently started term wins.
  return covering.reduce((a, b) => (b.effectiveFrom > a.effectiveFrom ? b : a));
}
