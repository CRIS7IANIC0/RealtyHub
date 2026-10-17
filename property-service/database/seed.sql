-- Datos de ejemplo. Ejecutar DESPUÉS de schema.sql.
INSERT INTO "properties" ("id","title","description","address","price","status","images","operation","property_type","city") VALUES
  ('b0000000-0000-4000-8000-000000000001','Casa Blanca','Casa de dos plantas con patio y garaje para dos vehículos.','Cra 5 # 20-31, Barrio La Castellana',320000000,'Vendida',ARRAY[]::TEXT[],'Venta','Casa','Montería'),
  ('b0000000-0000-4000-8000-000000000002','Apartamento Vista Río','Apartamento de 3 alcobas con balcón y vista al río.','Cl 28 # 4-12, Edificio Marea',2500000,'Reservada',ARRAY[]::TEXT[],'Alquiler','Apartamento','Montería'),
  ('b0000000-0000-4000-8000-000000000003','Lote La Guarida','Lote plano de 600 m² listo para construir.','Vía Cereté km 3',100000000,'Disponible',ARRAY[]::TEXT[],'Venta','Lote','Cereté')
ON CONFLICT DO NOTHING;
