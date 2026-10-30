-- CreateEnum
CREATE TYPE "ConnectionProvider" AS ENUM ('GARMIN');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('ACTIVE', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalConnection" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "ConnectionProvider" NOT NULL,
    "externalAccountId" TEXT,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "connectedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ExternalConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "externalConnectionId" UUID NOT NULL,
    "externalActivityId" TEXT NOT NULL,
    "name" TEXT,
    "sportType" TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "sourceStartTimeLocal" TEXT,
    "distanceM" DOUBLE PRECISION,
    "durationSeconds" DOUBLE PRECISION,
    "movingDurationSeconds" DOUBLE PRECISION,
    "averageHr" DOUBLE PRECISION,
    "maxHr" INTEGER,
    "averageCadence" DOUBLE PRECISION,
    "elevationGainM" DOUBLE PRECISION,
    "calories" INTEGER,
    "sourceLastSeenAt" TIMESTAMPTZ(3),
    "importedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRun" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "externalConnectionId" UUID NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),
    "activitiesFetched" INTEGER NOT NULL DEFAULT 0,
    "activitiesCreated" INTEGER NOT NULL DEFAULT 0,
    "activitiesUpdated" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalConnection_userId_status_idx" ON "ExternalConnection"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalConnection_id_userId_key" ON "ExternalConnection"("id", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalConnection_userId_provider_key" ON "ExternalConnection"("userId", "provider");

-- CreateIndex
CREATE INDEX "Activity_userId_startedAt_idx" ON "Activity"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "Activity_sportType_startedAt_idx" ON "Activity"("sportType", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_externalConnectionId_externalActivityId_key" ON "Activity"("externalConnectionId", "externalActivityId");

-- CreateIndex
CREATE INDEX "SyncRun_userId_startedAt_idx" ON "SyncRun"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "SyncRun_externalConnectionId_startedAt_idx" ON "SyncRun"("externalConnectionId", "startedAt");

-- AddForeignKey
ALTER TABLE "ExternalConnection" ADD CONSTRAINT "ExternalConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_externalConnectionId_userId_fkey" FOREIGN KEY ("externalConnectionId", "userId") REFERENCES "ExternalConnection"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRun" ADD CONSTRAINT "SyncRun_externalConnectionId_userId_fkey" FOREIGN KEY ("externalConnectionId", "userId") REFERENCES "ExternalConnection"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
