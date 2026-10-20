-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EngagementType" AS ENUM ('MONTHLY_RETAINER', 'ONE_TIME_FIXED', 'ONE_TIME_HOURLY', 'AD_HOC_HOURLY');

-- CreateEnum
CREATE TYPE "EngagementStatus" AS ENUM ('ACTIVE', 'COMPLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OveragePolicy" AS ENUM ('BILL_AT_RATE', 'ABSORB', 'REVIEW');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('MATCHED', 'UNMATCHED_CLIENT', 'UNMATCHED_USER', 'IGNORED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minute7EmployeeNames" TEXT[],
    "monthlyBillableTarget" DECIMAL(8,2),
    "weeklyCapacityHours" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultHourlyRateCents" INTEGER NOT NULL DEFAULT 16500,
    "primaryContactUserId" TEXT,
    "natureOfWork" TEXT[],
    "notes" TEXT,
    "zohoProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientMinute7Alias" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "minute7Customer" TEXT NOT NULL,
    "engagementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientMinute7Alias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Engagement" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "EngagementType" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EngagementStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "totalBudgetCents" INTEGER,
    "totalBudgetHours" DECIMAL(8,2),
    "hourlyRateCents" INTEGER,
    "overagePolicy" "OveragePolicy" NOT NULL DEFAULT 'REVIEW',
    "countsTowardRetainer" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetainerTerm" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "monthlyAmountCents" INTEGER NOT NULL,
    "hourlyRateCents" INTEGER NOT NULL,
    "monthlyHoursOverride" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetainerTerm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "userIds" TEXT[],
    "plannedHours" DECIMAL(8,2) NOT NULL,
    "natureOfWork" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "minute7Uuid" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "durationHours" DECIMAL(8,2) NOT NULL,
    "minute7Customer" TEXT NOT NULL,
    "minute7Employee" TEXT NOT NULL,
    "minute7Service" TEXT,
    "minute7Class" TEXT,
    "description" TEXT,
    "note" TEXT,
    "billable" BOOLEAN NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "exported" BOOLEAN NOT NULL,
    "locked" BOOLEAN NOT NULL,
    "userId" TEXT,
    "clientId" TEXT,
    "engagementId" TEXT,
    "matchStatus" "MatchStatus" NOT NULL,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "isDeletedInSource" BOOLEAN NOT NULL DEFAULT false,
    "rawJson" JSONB NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" TEXT,
    "defaultAssigneeIds" TEXT[],
    "estimatedHours" DECIMAL(8,2),
    "natureOfWork" TEXT,
    "dueDayOfMonth" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "engagementId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" TEXT,
    "assigneeIds" TEXT[],
    "estimatedHours" DECIMAL(8,2),
    "dueDate" DATE,
    "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "isOutOfScope" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "zohoTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthSnapshot" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "budgetHours" DECIMAL(8,2) NOT NULL,
    "usedHours" DECIMAL(8,2) NOT NULL,
    "nonBillableHours" DECIMAL(8,2) NOT NULL,
    "overageHours" DECIMAL(8,2) NOT NULL,
    "overageAmountCents" INTEGER NOT NULL,
    "remainingHours" DECIMAL(8,2) NOT NULL,
    "tasksTotal" INTEGER NOT NULL,
    "tasksDone" INTEGER NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL,
    "closedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "SyncStatus" NOT NULL DEFAULT 'RUNNING',
    "windowStart" DATE NOT NULL,
    "windowEnd" DATE NOT NULL,
    "fetched" INTEGER NOT NULL DEFAULT 0,
    "inserted" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "markedDeleted" INTEGER NOT NULL DEFAULT 0,
    "unmatched" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "engagementId" TEXT,
    "userId" TEXT,
    "month" DATE NOT NULL,
    "checkpointDay" INTEGER,
    "dedupeKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "recipients" TEXT[],
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ClientMinute7Alias_minute7Customer_key" ON "ClientMinute7Alias"("minute7Customer");

-- CreateIndex
CREATE INDEX "Engagement_clientId_status_idx" ON "Engagement"("clientId", "status");

-- CreateIndex
CREATE INDEX "RetainerTerm_engagementId_effectiveFrom_idx" ON "RetainerTerm"("engagementId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "Allocation_engagementId_month_idx" ON "Allocation"("engagementId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "TimeEntry_minute7Uuid_key" ON "TimeEntry"("minute7Uuid");

-- CreateIndex
CREATE INDEX "TimeEntry_date_idx" ON "TimeEntry"("date");

-- CreateIndex
CREATE INDEX "TimeEntry_engagementId_date_idx" ON "TimeEntry"("engagementId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_clientId_date_idx" ON "TimeEntry"("clientId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_userId_date_idx" ON "TimeEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_matchStatus_idx" ON "TimeEntry"("matchStatus");

-- CreateIndex
CREATE INDEX "Task_engagementId_month_idx" ON "Task"("engagementId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Task_templateId_month_key" ON "Task"("templateId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthSnapshot_engagementId_month_key" ON "MonthSnapshot"("engagementId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "AlertLog_dedupeKey_key" ON "AlertLog"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_primaryContactUserId_fkey" FOREIGN KEY ("primaryContactUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMinute7Alias" ADD CONSTRAINT "ClientMinute7Alias_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMinute7Alias" ADD CONSTRAINT "ClientMinute7Alias_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Engagement" ADD CONSTRAINT "Engagement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetainerTerm" ADD CONSTRAINT "RetainerTerm_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthSnapshot" ADD CONSTRAINT "MonthSnapshot_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthSnapshot" ADD CONSTRAINT "MonthSnapshot_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertLog" ADD CONSTRAINT "AlertLog_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "Engagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
