import { hoursToCents, roundHours } from "./hours";

export type OveragePolicy = "BILL_AT_RATE" | "ABSORB" | "REVIEW";

export interface Overage {
  overageHours: number;
  /** ABSORB → 0. BILL_AT_RATE and REVIEW → hours × rate. */
  overageAmountCents: number;
  /** REVIEW: the amount is shown but must be checked before invoicing. */
  needsReview: boolean;
}

export function computeOverage(
  budgetHours: number,
  usedHours: number,
  rateCents: number,
  policy: OveragePolicy,
): Overage {
  const overageHours = roundHours(Math.max(0, usedHours - budgetHours));
  return {
    overageHours,
    overageAmountCents: policy === "ABSORB" ? 0 : hoursToCents(overageHours, rateCents),
    needsReview: policy === "REVIEW" && overageHours > 0,
  };
}
