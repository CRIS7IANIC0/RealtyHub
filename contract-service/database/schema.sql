-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "operation_type" TEXT NOT NULL DEFAULT 'Venta',
    "status" TEXT NOT NULL,
    "signed_at" TIMESTAMP(3),
    "city" TEXT,
    "payment_method" TEXT,
    "deposit" DOUBLE PRECISION,
    "duration_months" INTEGER,
    "start_date" TIMESTAMP(3),
    "special_clauses" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_signatures" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "party_label" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "signer_name" TEXT,
    "signer_document" TEXT,
    "signer_email" TEXT,
    "signature_image" TEXT,
    "document_hash" TEXT,
    "signature_hash" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contract_signatures_token_key" ON "contract_signatures"("token");

-- CreateIndex
CREATE UNIQUE INDEX "contract_signatures_contract_id_role_key" ON "contract_signatures"("contract_id", "role");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_signatures" ADD CONSTRAINT "contract_signatures_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

