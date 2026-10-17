-- Datos de ejemplo. Ejecutar DESPUÉS de schema.sql.
-- E1: compraventa firmada; E2: arriendo pendiente de firma (con sus enlaces de firma).
INSERT INTO "contracts" ("id","property_id","lead_id","agent_id","price","type","operation_type","status","signed_at","city","payment_method","deposit","duration_months","start_date","special_clauses") VALUES
  ('e0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003',320000000,'Venta','Venta','Firmado',NOW() - INTERVAL '8 days','Montería','Transferencia bancaria',20000000,NULL,NULL,NULL),
  ('e0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000004',2500000,'Alquiler','Alquiler','Pendiente',NULL,'Montería','Transferencia bancaria',2500000,12,NOW() + INTERVAL '15 days','Se permite una mascota pequeña.')
ON CONFLICT DO NOTHING;

-- Firmas del contrato pendiente (sin firmar). Los tokens son sólo de ejemplo.
INSERT INTO "contract_signatures" ("id","contract_id","role","party_label","token") VALUES
  ('f0000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000002','PARTE_A','EL ARRENDADOR','demo-token-parte-a-0000000000000000000000'),
  ('f0000000-0000-4000-8000-000000000002','e0000000-0000-4000-8000-000000000002','PARTE_B','EL ARRENDATARIO','demo-token-parte-b-0000000000000000000000')
ON CONFLICT DO NOTHING;
