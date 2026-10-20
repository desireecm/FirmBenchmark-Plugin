import type { ISODate } from "./dates";
import { fromHundredths, toHundredths } from "./hours";

export type MatchStatus = "MATCHED" | "UNMATCHED_CLIENT" | "UNMATCHED_USER" | "IGNORED";

export interface EntryInput {
  date: ISODate;
  durationHours: number;
  billable: boolean;
  approved: boolean;
  matchStatus: MatchStatus;
  isDeletedInSource: boolean;
}

export interface UsageOptions {
  /** Inclusive. Omit for no lower bound (lifetime totals). */
  from?: ISODate;
  /** Inclusive. Omit for no upper bound. */
  to?: ISODate;
  /** Count only approved entries (setting `usage.approvedOnly`). */
  approvedOnly?: boolean;
}

export interface UsageSummary {
  /** Counts against the budget: billable, matched, not deleted. */
  billableHours: number;
  /** Tracked on the client but doesn't count against the budget. */
  nonBillableHours: number;
  /** "Total time on client" = billable + non-billable. */
  totalHours: number;
  lastEntryDate: ISODate | null;
}

export function summarizeUsage(
  entries: Iterable<EntryInput>,
  opts: UsageOptions = {},
): UsageSummary {
  let billable = 0;
  let nonBillable = 0;
  let last: ISODate | null = null;
  for (const e of entries) {
    if (e.isDeletedInSource || e.matchStatus !== "MATCHED") continue;
    if (opts.from && e.date < opts.from) continue;
    if (opts.to && e.date > opts.to) continue;
    if (opts.approvedOnly && !e.approved) continue;
    if (e.billable) billable += toHundredths(e.durationHours);
    else nonBillable += toHundredths(e.durationHours);
    if (last == null || e.date > last) last = e.date;
  }
  return {
    billableHours: fromHundredths(billable),
    nonBillableHours: fromHundredths(nonBillable),
    totalHours: fromHundredths(billable + nonBillable),
    lastEntryDate: last,
  };
}
