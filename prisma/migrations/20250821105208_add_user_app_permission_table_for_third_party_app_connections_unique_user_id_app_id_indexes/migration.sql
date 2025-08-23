-- CreateTable
CREATE TABLE "public"."UserAppPermission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "scopes" TEXT[],
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isConnected" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAppPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAppPermission_userId_idx" ON "public"."UserAppPermission"("userId");

-- CreateIndex
CREATE INDEX "UserAppPermission_appId_idx" ON "public"."UserAppPermission"("appId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAppPermission_userId_appId_key" ON "public"."UserAppPermission"("userId", "appId");

-- AddForeignKey
ALTER TABLE "public"."UserAppPermission" ADD CONSTRAINT "UserAppPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
