import type { ISODate } from "./dates";
import { businessDaysElapsed, businessDaysInMonth } from "./dates";
import { roundHours } from "./hours";

export interface PaceInput {
  budgetHours: number;
  usedHours: number;
  month: ISODate;
  asOf: ISODate;
  holidays?: ReadonlySet<ISODate>;
  includeToday?: boolean;
}

export interface Pace {
  businessDaysInMonth: number;
  businessDaysElapsed: number;
  businessDaysRemaining: number;
  /** Share of the month's business days that have elapsed, 0–1. */
  expectedPct: number;
  /** usedHours / budgetHours; null when the budget is 0. */
  usedPct: number | null;
  /** usedPct / expectedPct; null before any business day has elapsed or with no budget. */
  paceRatio: number | null;
  expectedHoursToDate: number;
  /** Positive = behind, negative = ahead. */
  hoursBehind: number;
  remainingHours: number;
  /** Hours per remaining business day needed to hit the budget; null if no days remain. */
  requiredDailyRate: number | null;
}

export function computePace(input: PaceInput): Pace {
  const holidays = input.holidays ?? new Set<ISODate>();
  const total = businessDaysInMonth(input.month, holidays);
  const elapsed = businessDaysElapsed(input.month, input.asOf, holidays, input.includeToday);
  const remainingDays = total - elapsed;
  const expectedPct = total === 0 ? 1 : elapsed / total;
  const usedPct = input.budgetHours > 0 ? input.usedHours / input.budgetHours : null;
  const paceRatio = usedPct != null && expectedPct > 0 ? usedPct / expectedPct : null;
  const expectedHoursToDate = roundHours(input.budgetHours * expectedPct);
  const remainingHours = roundHours(Math.max(0, input.budgetHours - input.usedHours));
  return {
    businessDaysInMonth: total,
    businessDaysElapsed: elapsed,
    businessDaysRemaining: remainingDays,
    expectedPct,
    usedPct,
    paceRatio,
    expectedHoursToDate,
    hoursBehind: roundHours(expectedHoursToDate - input.usedHours),
    remainingHours,
    requiredDailyRate: remainingDays > 0 ? roundHours(remainingHours / remainingDays) : null,
  };
}
