-- Datos de ejemplo. Ejecutar DESPUÉS de schema.sql.
-- Acuerdos generales vigentes (el servicio también los crea solo al arrancar si faltan).
INSERT INTO "commission_agreements" ("id","operation_type","rate_percent","agent_pct","office_pct","central_pct","active") VALUES
  ('aa000000-0000-4000-8000-000000000001','Venta',3,50,30,20,true),
  ('aa000000-0000-4000-8000-000000000002','Alquiler',100,40,35,25,true)
ON CONFLICT DO NOTHING;

-- Comisión individual asignada por el administrador a Ana para ventas
INSERT INTO "agent_commission_rules" ("id","agent_id","operation_type","rate_percent","agent_pct","office_pct","central_pct","updated_by") VALUES
  ('bb000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','Venta',3,55,25,20,'a0000000-0000-4000-8000-000000000001')
ON CONFLICT DO NOTHING;

-- Comisión del contrato firmado E1: 3 % de $320.000.000 = $9.600.000 (55/25/20)
INSERT INTO "commissions" ("id","contract_id","agent_id","office_id","amount","split_rule_applied","status","operation_type","contract_price","rate_percent","agent_pct","office_pct","central_pct","agent_amount","office_amount","central_amount","agreement_id") VALUES
  ('cc000000-0000-4000-8000-000000000001','e0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','oficina-central',9600000,'Acuerdo individual Venta: 3% · agente 55% / oficina 25% / central 20%','Pendiente','Venta',320000000,3,55,25,20,5280000,2400000,1920000,'aa000000-0000-4000-8000-000000000001')
ON CONFLICT DO NOTHING;
