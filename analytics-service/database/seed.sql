-- Datos de ejemplo. Ejecutar DESPUÉS de schema.sql.
-- Respaldo auditable de cierres recibidos por RabbitMQ (los KPIs del panel se calculan en vivo).
INSERT INTO "metrics" ("id","event_type","revenue_value") VALUES
  ('ee000000-0000-4000-8000-000000000001','contract_signed',320000000)
ON CONFLICT DO NOTHING;
