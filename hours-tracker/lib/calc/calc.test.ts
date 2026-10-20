import { describe, expect, it } from "vitest";
import {
  activeTermForMonth,
  addMonths,
  businessDaysElapsed,
  businessDaysInMonth,
  computeOverage,
  computePace,
  firmMonthlyTarget,
  firstBusinessDay,
  fixedBudgetHours,
  fixedProjectUsage,
  formatDollars,
  hourlyWorkForMonth,
  hoursToCents,
  isInMonth,
  monthEnd,
  monthlyHours,
  monthlyHoursFormula,
  onOrNextBusinessDay,
  paceStatus,
  revenueView,
  STATUS_LABELS,
  sumHours,
  summarizeUsage,
  todayInChicago,
  type EntryInput,
  type RetainerTermInput,
} from "./index";

const entry = (over: Partial<EntryInput> = {}): EntryInput => ({
  date: "2026-10-05",
  durationHours: 1,
  billable: true,
  approved: true,
  matchStatus: "MATCHED",
  isDeletedInSource: false,
  ...over,
});

const term = (over: Partial<RetainerTermInput> = {}): RetainerTermInput => ({
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  monthlyAmountCents: 80000,
  hourlyRateCents: 16500,
  monthlyHoursOverride: null,
  ...over,
});

describe("§7.4 monthly hours", () => {
  it("$800 at $155 → 5.16 hrs", () => {
    expect(monthlyHours(term({ monthlyAmountCents: 80000, hourlyRateCents: 15500 }))).toBe(5.16);
  });
  it("$15,000 at $155 → 96.77 hrs", () => {
    expect(monthlyHours(term({ monthlyAmountCents: 1500000, hourlyRateCents: 15500 }))).toBe(96.77);
  });
  it("an override of 10.00 takes precedence", () => {
    expect(monthlyHours(term({ monthlyAmountCents: 50000, monthlyHoursOverride: 10 }))).toBe(10);
  });
  it("uses the confirmed $165 rate (decisions.md Q1)", () => {
    expect(monthlyHours(term({ monthlyAmountCents: 80000 }))).toBe(4.85);
    expect(monthlyHours(term({ monthlyAmountCents: 167500 }))).toBe(10.15);
    expect(monthlyHours(term({ monthlyAmountCents: 50000 }))).toBe(3.03);
  });
  it("a zero rate gives zero hours instead of dividing by zero", () => {
    expect(monthlyHours(term({ hourlyRateCents: 0 }))).toBe(0);
  });
  it("explains the formula for tooltips", () => {
    expect(monthlyHoursFormula(term({ monthlyAmountCents: 167500 }))).toBe(
      "10.15 hrs = $1,675 ÷ $165",
    );
    expect(monthlyHoursFormula(term({ monthlyHoursOverride: 10 }))).toBe(
      "10.00 hrs (admin override)",
    );
    expect(formatDollars(12345)).toBe("$123.45");
  });
});

describe("§7.4 mid-month retainer change", () => {
  const terms = [
    term({ effectiveFrom: "2026-01-01", effectiveTo: "2026-10-14", monthlyAmountCents: 160000 }),
    term({ effectiveFrom: "2026-10-15", monthlyAmountCents: 300000 }),
  ];
  it("the term in effect on the 1st wins for the whole month", () => {
    expect(activeTermForMonth(terms, "2026-10-20")?.monthlyAmountCents).toBe(160000);
  });
  it("the new term applies from the following month", () => {
    expect(activeTermForMonth(terms, "2026-11-01")?.monthlyAmountCents).toBe(300000);
  });
  it("returns null before any term starts", () => {
    expect(activeTermForMonth(terms, "2025-12-01")).toBeNull();
  });
  it("prefers the most recent term when ranges overlap", () => {
    const overlapping = [
      term({ monthlyAmountCents: 1 }),
      term({ effectiveFrom: "2026-06-01", monthlyAmountCents: 2 }),
    ];
    expect(activeTermForMonth(overlapping, "2026-07-01")?.monthlyAmountCents).toBe(2);
    expect(activeTermForMonth([...overlapping].reverse(), "2026-07-01")?.monthlyAmountCents).toBe(
      2,
    );
  });
});

describe("§7.4 pace on the 15th of a 22-business-day month with 40% used", () => {
  // October 2026 has 22 business days. On Thu Oct 15, 10 have elapsed (through Oct 14).
  const pace = computePace({
    budgetHours: 10,
    usedHours: 4,
    month: "2026-10-01",
    asOf: "2026-10-15",
  });
  it("counts business days", () => {
    expect(pace.businessDaysInMonth).toBe(22);
    expect(pace.businessDaysElapsed).toBe(10);
    expect(pace.businessDaysRemaining).toBe(12);
  });
  it("computes expected %, pace ratio, and hours behind", () => {
    expect(pace.expectedPct).toBeCloseTo(10 / 22, 10);
    expect(pace.usedPct).toBe(0.4);
    expect(pace.paceRatio).toBeCloseTo(0.88, 2);
    expect(pace.expectedHoursToDate).toBe(4.55);
    expect(pace.hoursBehind).toBe(0.55);
    expect(pace.remainingHours).toBe(6);
    expect(pace.requiredDailyRate).toBe(0.5);
  });
  it("is Slightly behind", () => {
    expect(paceStatus(pace, 4)).toBe("SLIGHTLY_BEHIND");
  });
  it("can count today when the setting is on", () => {
    expect(
      computePace({
        budgetHours: 10,
        usedHours: 4,
        month: "2026-10-01",
        asOf: "2026-10-15",
        includeToday: true,
      }).businessDaysElapsed,
    ).toBe(11);
  });
});

describe("pace edge cases", () => {
  it("has no pace ratio before any business day has elapsed", () => {
    const pace = computePace({
      budgetHours: 10,
      usedHours: 0,
      month: "2026-10-01",
      asOf: "2026-10-01",
    });
    expect(pace.paceRatio).toBeNull();
    expect(paceStatus(pace, 0)).toBe("NO_PACE");
  });
  it("has no required daily rate once the month is over", () => {
    const pace = computePace({
      budgetHours: 10,
      usedHours: 8,
      month: "2026-10-01",
      asOf: "2026-11-03",
    });
    expect(pace.businessDaysElapsed).toBe(22);
    expect(pace.requiredDailyRate).toBeNull();
  });
  it("handles a zero budget", () => {
    const zero = computePace({
      budgetHours: 0,
      usedHours: 0,
      month: "2026-10-01",
      asOf: "2026-10-15",
    });
    expect(zero.usedPct).toBeNull();
    expect(paceStatus(zero, 0)).toBe("NO_PACE");
    expect(paceStatus(zero, 1)).toBe("OVER_BUDGET");
  });
  it("excludes holidays from business days", () => {
    const holidays = new Set(["2026-11-26", "2026-11-27"]);
    expect(businessDaysInMonth("2026-11-01")).toBe(21);
    expect(businessDaysInMonth("2026-11-01", holidays)).toBe(19);
    expect(
      computePace({
        budgetHours: 10,
        usedHours: 0,
        month: "2026-11-01",
        asOf: "2026-11-02",
        holidays,
      }).expectedPct,
    ).toBe(0);
  });
  it("treats a month with no business days as fully elapsed", () => {
    const allHolidays = new Set(
      Array.from({ length: 22 }, (_, i) => `2026-10-${String(i + 1).padStart(2, "0")}`),
    );
    const oct = new Set([
      ...allHolidays,
      "2026-10-23",
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
    ]);
    expect(
      computePace({
        budgetHours: 10,
        usedHours: 5,
        month: "2026-10-01",
        asOf: "2026-10-15",
        holidays: oct,
      }).expectedPct,
    ).toBe(1);
  });
});

describe("status bands", () => {
  const at = (paceRatio: number, usedPct = 0.5) => paceStatus({ paceRatio, usedPct }, 1);
  it("maps pace ratios to bands at the default thresholds", () => {
    expect(at(0.69)).toBe("BEHIND");
    expect(at(0.7)).toBe("SLIGHTLY_BEHIND");
    expect(at(0.9)).toBe("ON_PACE");
    expect(at(1.15)).toBe("ON_PACE");
    expect(at(1.16)).toBe("AHEAD");
    expect(at(2, 1.01)).toBe("OVER_BUDGET");
  });
  it("has a text label for every status", () => {
    expect(STATUS_LABELS.OVER_BUDGET).toBe("Over budget");
  });
  it("respects custom thresholds", () => {
    expect(
      paceStatus({ paceRatio: 0.75, usedPct: 0.5 }, 1, {
        behindBelow: 0.8,
        slightlyBehindBelow: 0.9,
        aheadAbove: 1.2,
      }),
    ).toBe("BEHIND");
  });
});

describe("§7.4 overage", () => {
  it("12 hrs used on a 10 hr budget at $155 → 2 hrs / $310", () => {
    expect(computeOverage(10, 12, 15500, "BILL_AT_RATE")).toEqual({
      overageHours: 2,
      overageAmountCents: 31000,
      needsReview: false,
    });
  });
  it("REVIEW shows the amount and flags it", () => {
    expect(computeOverage(10, 12, 16500, "REVIEW")).toEqual({
      overageHours: 2,
      overageAmountCents: 33000,
      needsReview: true,
    });
  });
  it("ABSORB has no dollar amount", () => {
    expect(computeOverage(10, 12, 16500, "ABSORB").overageAmountCents).toBe(0);
  });
  it("no overage under budget", () => {
    expect(computeOverage(10, 8, 16500, "REVIEW")).toEqual({
      overageHours: 0,
      overageAmountCents: 0,
      needsReview: false,
    });
  });
});

describe("§7.4 usage filtering", () => {
  it("excludes deleted-in-source entries from totals", () => {
    const s = summarizeUsage([entry(), entry({ isDeletedInSource: true, durationHours: 5 })]);
    expect(s.billableHours).toBe(1);
    expect(s.totalHours).toBe(1);
  });
  it("excludes non-billable from usage but includes it in total time on client", () => {
    const s = summarizeUsage([
      entry({ durationHours: 2 }),
      entry({ billable: false, durationHours: 1.5 }),
    ]);
    expect(s.billableHours).toBe(2);
    expect(s.nonBillableHours).toBe(1.5);
    expect(s.totalHours).toBe(3.5);
  });
  it("excludes unmatched and ignored entries", () => {
    const s = summarizeUsage([
      entry({ matchStatus: "UNMATCHED_CLIENT" }),
      entry({ matchStatus: "IGNORED" }),
      entry(),
    ]);
    expect(s.billableHours).toBe(1);
  });
  it("can count approved entries only", () => {
    const entries = [entry(), entry({ approved: false })];
    expect(summarizeUsage(entries).billableHours).toBe(2);
    expect(summarizeUsage(entries, { approvedOnly: true }).billableHours).toBe(1);
  });
  it("sums without floating-point drift", () => {
    const s = summarizeUsage([entry({ durationHours: 0.1 }), entry({ durationHours: 0.2 })]);
    expect(s.billableHours).toBe(0.3);
    expect(sumHours([0.1, 0.2, 0.3])).toBe(0.6);
  });
  it("tracks the last entry date", () => {
    expect(
      summarizeUsage([entry({ date: "2026-10-09" }), entry({ date: "2026-10-03" })]).lastEntryDate,
    ).toBe("2026-10-09");
    expect(summarizeUsage([]).lastEntryDate).toBeNull();
  });
});

describe("§7.4 one-time fixed project across three months", () => {
  const entries = [
    entry({ date: "2026-08-20", durationHours: 10 }),
    entry({ date: "2026-09-10", durationHours: 12.5 }),
    entry({ date: "2026-10-02", durationHours: 8 }),
    entry({ date: "2026-10-03", durationHours: 3, billable: false }),
  ];
  it("tracks usage against the lifetime budget, not per month", () => {
    const u = fixedProjectUsage(
      { totalBudgetHours: 40, totalBudgetCents: null, rateCents: 16500 },
      entries,
    );
    expect(u).toEqual({
      budgetHours: 40,
      usedHours: 30.5,
      remainingHours: 9.5,
      usedPct: 30.5 / 40,
      overageHours: 0,
    });
  });
  it("derives budget hours from dollars when hours aren't set", () => {
    expect(
      fixedBudgetHours({ totalBudgetHours: null, totalBudgetCents: 495000, rateCents: 16500 }),
    ).toBe(30);
    expect(
      fixedBudgetHours({ totalBudgetHours: null, totalBudgetCents: null, rateCents: 16500 }),
    ).toBe(0);
    const over = fixedProjectUsage(
      { totalBudgetHours: null, totalBudgetCents: 495000, rateCents: 16500 },
      entries,
    );
    expect(over.overageHours).toBe(0.5);
    expect(over.remainingHours).toBe(0);
  });
  it("can stop at an as-of date", () => {
    expect(
      fixedProjectUsage(
        { totalBudgetHours: 40, totalBudgetCents: null, rateCents: 16500 },
        entries,
        "2026-09-30",
      ).usedHours,
    ).toBe(22.5);
  });
  it("has no used % without a budget", () => {
    expect(
      fixedProjectUsage(
        { totalBudgetHours: null, totalBudgetCents: null, rateCents: 16500 },
        entries,
      ).usedPct,
    ).toBeNull();
  });
});

describe("hourly work", () => {
  it("shows this month's hours and billable amount with no cap", () => {
    const entries = [
      entry({ date: "2026-09-30", durationHours: 4 }),
      entry({ date: "2026-10-01", durationHours: 2.25 }),
      entry({ date: "2026-10-31", durationHours: 1 }),
    ];
    expect(hourlyWorkForMonth(entries, "2026-10-01", 16500)).toEqual({
      hours: 3.25,
      amountCents: 53625,
    });
  });
});

describe("§7.4 month boundaries in America/Chicago", () => {
  it("an instant just after midnight UTC on Nov 1 is still Oct 31 in Chicago", () => {
    expect(todayInChicago(new Date("2026-11-01T03:30:00Z"))).toBe("2026-10-31");
    expect(todayInChicago(new Date("2026-11-01T05:30:00Z"))).toBe("2026-11-01");
  });
  it("handles the DST change (CST, UTC−6)", () => {
    expect(todayInChicago(new Date("2026-12-01T05:59:00Z"))).toBe("2026-11-30");
    expect(todayInChicago(new Date("2026-12-01T06:00:00Z"))).toBe("2026-12-01");
  });
  it("counts an entry dated the last day of the month in that month", () => {
    const entries = [
      entry({ date: "2026-10-31", durationHours: 2 }),
      entry({ date: "2026-11-01", durationHours: 5 }),
    ];
    expect(
      summarizeUsage(entries, { from: "2026-10-01", to: monthEnd("2026-10-01") }).billableHours,
    ).toBe(2);
    expect(isInMonth("2026-10-31", "2026-10-01")).toBe(true);
    expect(isInMonth("2026-11-01", "2026-10-01")).toBe(false);
  });
  it("computes month ends, including leap years", () => {
    expect(monthEnd("2026-02-10")).toBe("2026-02-28");
    expect(monthEnd("2028-02-10")).toBe("2028-02-29");
    expect(monthEnd("2026-12-05")).toBe("2026-12-31");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-01");
    expect(addMonths("2026-01-31", -1)).toBe("2025-12-01");
  });
});

describe("business-day helpers", () => {
  it("moves weekend checkpoints to the next business day", () => {
    expect(onOrNextBusinessDay("2026-10-10")).toBe("2026-10-12"); // Sat → Mon
    expect(onOrNextBusinessDay("2026-10-15")).toBe("2026-10-15");
  });
  it("finds the first business day of the month", () => {
    expect(firstBusinessDay("2026-11-15")).toBe("2026-11-02"); // Nov 1 2026 is a Sunday
    expect(firstBusinessDay("2027-01-01", new Set(["2027-01-01"]))).toBe("2027-01-04");
  });
  it("counts zero elapsed days for a future month", () => {
    expect(businessDaysElapsed("2026-12-01", "2026-10-20")).toBe(0);
  });
});

describe("firm-wide goal and revenue", () => {
  const month = [
    {
      type: "MONTHLY_RETAINER" as const,
      budgetOrPlannedHours: 10.15,
      usedHours: 6,
      rateCents: 16500,
      monthlyAmountCents: 167500,
    },
    {
      type: "MONTHLY_RETAINER" as const,
      budgetOrPlannedHours: 4.85,
      usedHours: 6,
      rateCents: 16500,
      monthlyAmountCents: 80000,
    },
    { type: "ONE_TIME_HOURLY" as const, budgetOrPlannedHours: 5, usedHours: 3, rateCents: 16500 },
  ];
  it("defaults the firm target to retainer + planned one-off hours", () => {
    expect(firmMonthlyTarget(month)).toBe(20);
  });
  it("lets an admin override the target", () => {
    expect(firmMonthlyTarget(month, 300)).toBe(300);
  });
  it("computes billable $, retainer $, and unrealized retainer $", () => {
    expect(revenueView(month)).toEqual({
      billableAmountCents: hoursToCents(15, 16500),
      retainerAmountCents: 247500,
      // Only the first retainer has unused hours: 4.15 × $165 = $684.75
      unrealizedRetainerCents: 68475,
    });
  });
  it("treats a retainer with no dollar amount as $0", () => {
    expect(
      revenueView([
        { type: "MONTHLY_RETAINER", budgetOrPlannedHours: 1, usedHours: 1, rateCents: 16500 },
      ]).retainerAmountCents,
    ).toBe(0);
  });
});
