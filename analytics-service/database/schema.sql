-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "revenue_value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_by_agent" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "conversion_rate" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_by_agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avg_closing_time" (
    "id" TEXT NOT NULL,
    "office_id" TEXT NOT NULL,
    "avg_time_days" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avg_closing_time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads_by_source" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "lead_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_by_source_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversion_by_agent_agent_id_key" ON "conversion_by_agent"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "avg_closing_time_office_id_key" ON "avg_closing_time"("office_id");

-- CreateIndex
CREATE UNIQUE INDEX "leads_by_source_source_key" ON "leads_by_source"("source");

