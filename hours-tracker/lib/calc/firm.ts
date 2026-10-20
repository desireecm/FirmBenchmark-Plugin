import { hoursToCents, roundHours, sumHours } from "./hours";

export interface EngagementMonth {
  type: "MONTHLY_RETAINER" | "ONE_TIME_FIXED" | "ONE_TIME_HOURLY" | "AD_HOC_HOURLY";
  /** Retainer: monthly budget hours. Others: planned (allocated) hours this month. */
  budgetOrPlannedHours: number;
  usedHours: number;
  rateCents: number;
  /** Monthly dollar value of the retainer (retainers only). */
  monthlyAmountCents?: number;
}

/** Firm billable target: sum of retainer + planned one-off hours, unless an admin overrides it. */
export function firmMonthlyTarget(
  engagements: readonly EngagementMonth[],
  override: number | null = null,
): number {
  if (override != null) return override;
  return sumHours(engagements.map((e) => e.budgetOrPlannedHours));
}

export interface RevenueView {
  /** Billable hours × rate across all engagements. */
  billableAmountCents: number;
  /** Sum of monthly retainer dollar amounts. */
  retainerAmountCents: number;
  /** Dollar value of retainer hours not yet delivered (money left on the table). */
  unrealizedRetainerCents: number;
}

export function revenueView(engagements: readonly EngagementMonth[]): RevenueView {
  let billable = 0;
  let retainer = 0;
  let unrealized = 0;
  for (const e of engagements) {
    billable += hoursToCents(e.usedHours, e.rateCents);
    if (e.type === "MONTHLY_RETAINER") {
      retainer += e.monthlyAmountCents ?? 0;
      const unused = roundHours(Math.max(0, e.budgetOrPlannedHours - e.usedHours));
      unrealized += hoursToCents(unused, e.rateCents);
    }
  }
  return {
    billableAmountCents: billable,
    retainerAmountCents: retainer,
    unrealizedRetainerCents: unrealized,
  };
}
