-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "office_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "split_rule_applied" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pendiente',
    "operation_type" TEXT NOT NULL DEFAULT 'Venta',
    "contract_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rate_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agent_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "office_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "central_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agent_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "office_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "central_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agreement_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_agreements" (
    "id" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "rate_percent" DOUBLE PRECISION NOT NULL,
    "agent_pct" DOUBLE PRECISION NOT NULL,
    "office_pct" DOUBLE PRECISION NOT NULL,
    "central_pct" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_commission_rules" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL,
    "rate_percent" DOUBLE PRECISION NOT NULL,
    "agent_pct" DOUBLE PRECISION NOT NULL,
    "office_pct" DOUBLE PRECISION NOT NULL,
    "central_pct" DOUBLE PRECISION NOT NULL,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_commission_rules_agent_id_operation_type_key" ON "agent_commission_rules"("agent_id", "operation_type");

