import type { ISODate } from "./dates";
import { monthEnd, monthStart } from "./dates";
import { fromHundredths, hoursToCents, roundHours } from "./hours";
import type { EntryInput } from "./usage";
import { summarizeUsage } from "./usage";

export interface FixedProjectInput {
  totalBudgetHours: number | null;
  totalBudgetCents: number | null;
  rateCents: number;
}

/** Lifetime budget hours: explicit hours, else budget $ ÷ rate. */
export function fixedBudgetHours(p: FixedProjectInput): number {
  if (p.totalBudgetHours != null) return p.totalBudgetHours;
  if (p.totalBudgetCents != null && p.rateCents > 0) {
    return fromHundredths(Math.round((p.totalBudgetCents * 100) / p.rateCents));
  }
  return 0;
}

export interface FixedProjectUsage {
  budgetHours: number;
  usedHours: number;
  remainingHours: number;
  usedPct: number | null;
  overageHours: number;
}

/** ONE_TIME_FIXED: usage across the project's whole life, not per month. */
export function fixedProjectUsage(
  p: FixedProjectInput,
  entries: Iterable<EntryInput>,
  asOf?: ISODate,
  approvedOnly = false,
): FixedProjectUsage {
  const budgetHours = fixedBudgetHours(p);
  const usedHours = summarizeUsage(entries, { to: asOf, approvedOnly }).billableHours;
  return {
    budgetHours,
    usedHours,
    remainingHours: roundHours(Math.max(0, budgetHours - usedHours)),
    usedPct: budgetHours > 0 ? usedHours / budgetHours : null,
    overageHours: roundHours(Math.max(0, usedHours - budgetHours)),
  };
}

/** ONE_TIME_HOURLY / AD_HOC_HOURLY: no cap; this month's hours and billable amount. */
export function hourlyWorkForMonth(
  entries: Iterable<EntryInput>,
  month: ISODate,
  rateCents: number,
  approvedOnly = false,
): { hours: number; amountCents: number } {
  const hours = summarizeUsage(entries, {
    from: monthStart(month),
    to: monthEnd(month),
    approvedOnly,
  }).billableHours;
  return { hours, amountCents: hoursToCents(hours, rateCents) };
}
