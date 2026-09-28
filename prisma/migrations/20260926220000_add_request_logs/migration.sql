CREATE TABLE "RequestLog" (
    "id" UUID NOT NULL,
    "timestamp" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "requestId" TEXT,
    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RequestLog_timestamp_id_idx" ON "RequestLog"("timestamp", "id");
