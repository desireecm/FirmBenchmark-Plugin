import type { Pace } from "./pace";

export type PaceStatus =
  "BEHIND" | "SLIGHTLY_BEHIND" | "ON_PACE" | "AHEAD" | "OVER_BUDGET" | "NO_PACE";

/** Admin-editable thresholds (PLAN.md §7.2 defaults). */
export interface StatusThresholds {
  behindBelow: number;
  slightlyBehindBelow: number;
  aheadAbove: number;
}

export const DEFAULT_THRESHOLDS: StatusThresholds = {
  behindBelow: 0.7,
  slightlyBehindBelow: 0.9,
  aheadAbove: 1.15,
};

/** Labels always accompany the color, so status never relies on color alone. */
export const STATUS_LABELS: Record<PaceStatus, string> = {
  BEHIND: "Behind",
  SLIGHTLY_BEHIND: "Slightly behind",
  ON_PACE: "On pace",
  AHEAD: "Ahead",
  OVER_BUDGET: "Over budget",
  NO_PACE: "Too early",
};

export function paceStatus(
  pace: Pick<Pace, "usedPct" | "paceRatio">,
  usedHours: number,
  t: StatusThresholds = DEFAULT_THRESHOLDS,
): PaceStatus {
  if (pace.usedPct == null) return usedHours > 0 ? "OVER_BUDGET" : "NO_PACE";
  if (pace.usedPct > 1) return "OVER_BUDGET";
  if (pace.paceRatio == null) return "NO_PACE";
  if (pace.paceRatio < t.behindBelow) return "BEHIND";
  if (pace.paceRatio < t.slightlyBehindBelow) return "SLIGHTLY_BEHIND";
  if (pace.paceRatio <= t.aheadAbove) return "ON_PACE";
  return "AHEAD";
}
