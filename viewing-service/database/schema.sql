-- CreateTable
CREATE TABLE "viewings" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendiente',

    CONSTRAINT "viewings_pkey" PRIMARY KEY ("id")
);

