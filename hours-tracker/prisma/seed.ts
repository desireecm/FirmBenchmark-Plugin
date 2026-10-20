// Seeds the team, a few sample clients, and default settings. Safe to re-run.
// The real client list comes from the Google Sheet import (Phase 2).
import { PrismaClient, type EngagementType } from "@prisma/client";

const prisma = new PrismaClient();

const RATE_CENTS = 16500; // $165/hr for every client (docs/decisions.md Q1)
const TERM_START = new Date("2026-10-01");

// Only Desire'e's email is known. Others get a placeholder that can't sign in
// until an admin sets their real M365 address (docs/decisions.md).
const TEAM = [
  { name: "Desire'e", email: "desiree@esquireinteractive.com", isAdmin: true },
  ...["Jeff", "Kelly", "Randi", "Brittany", "Hazar", "Chris", "Bren", "Karlyn", "Jeremy"].map(
    (name) => ({ name, email: `${name.toLowerCase()}@placeholder.invalid`, isAdmin: false }),
  ),
];

interface SampleClient {
  name: string;
  type: EngagementType;
  engagementName: string;
  amountCents: number | null;
  notes?: string;
}

// Amounts from the Client Budgets tab. Tuckner, Shapiro, and Holleman are placeholders
// pending confirmation (decisions.md Q2).
const CLIENTS: SampleClient[] = [
  {
    name: "BKBH",
    type: "MONTHLY_RETAINER",
    engagementName: "Monthly Retainer",
    amountCents: 160000,
  },
  {
    name: "RNH",
    type: "MONTHLY_RETAINER",
    engagementName: "Monthly Retainer",
    amountCents: 50000,
    notes: "Review: sheet shows 10 hrs for $500.",
  },
  {
    name: "Flammia",
    type: "MONTHLY_RETAINER",
    engagementName: "Monthly Retainer",
    amountCents: 94500,
    notes: "Review: sheet shows 10 hrs; 9 social media posts, 1 review.",
  },
  {
    name: "Tuckner Sipser",
    type: "MONTHLY_RETAINER",
    engagementName: "Monthly Retainer",
    amountCents: 160000,
    notes: "Placeholder budget. Sheet tabs show $1,600 / $2,000 / $3,000.",
  },
  {
    name: "Shapiro",
    type: "MONTHLY_RETAINER",
    engagementName: "Monthly Retainer",
    amountCents: 375000,
    notes: "Placeholder budget. Sheet tabs show $3,750 / $3,000.",
  },
  {
    name: "Holleman",
    type: "MONTHLY_RETAINER",
    engagementName: "Monthly Retainer",
    amountCents: 167500,
    notes: "Placeholder budget ($1,675 vs $1,600). Ad spend is not billable hours.",
  },
  {
    name: "Johnson Pope",
    type: "ONE_TIME_HOURLY",
    engagementName: "Hourly Project",
    amountCents: null,
  },
];

const SETTINGS: Record<string, unknown> = {
  "rate.defaultCents": RATE_CENTS,
  "usage.approvedOnly": false,
  "pace.includeToday": false,
  "pace.thresholds": { behindBelow: 0.7, slightlyBehindBelow: 0.9, aheadAbove: 1.15 },
  "alerts.checkpointDays": [10, 15, 20, 25],
  "alerts.checkpointThreshold": 0.7,
  "alerts.budgetReached": true,
  "email.dryRun": true,
  "firm.targetOverrideHours": null,
  "sync.intraday": true,
  "zoho.enabled": false,
};

async function main() {
  for (const u of TEAM) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, minute7EmployeeNames: [] },
    });
  }

  for (const c of CLIENTS) {
    const client = await prisma.client.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, defaultHourlyRateCents: RATE_CENTS, notes: c.notes },
    });
    const existing = await prisma.engagement.findFirst({
      where: { clientId: client.id, name: c.engagementName },
    });
    if (existing) continue;
    await prisma.engagement.create({
      data: {
        clientId: client.id,
        type: c.type,
        name: c.engagementName,
        startDate: TERM_START,
        terms:
          c.type === "MONTHLY_RETAINER" && c.amountCents != null
            ? {
                create: {
                  effectiveFrom: TERM_START,
                  monthlyAmountCents: c.amountCents,
                  hourlyRateCents: RATE_CENTS,
                },
              }
            : undefined,
      },
    });
  }

  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.appSetting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as never },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    clients: await prisma.client.count(),
    engagements: await prisma.engagement.count(),
    retainerTerms: await prisma.retainerTerm.count(),
    settings: await prisma.appSetting.count(),
  };
  console.log("Seeded:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
