-- Datos de ejemplo. Ejecutar DESPUÉS de schema.sql.
INSERT INTO "notifications" ("id","title","message","type","is_read","category","recipient_type","recipient_id","recipient_name","link") VALUES
  ('dd000000-0000-4000-8000-000000000001','🎯 Nuevo lead asignado','Se te asignó un nuevo lead: Carlos Pérez (3205551234) se interesó en "Lote La Guarida". Canal: Redes Sociales.','info',false,'lead','USER','a0000000-0000-4000-8000-000000000003','Ana Gómez','/leads'),
  ('dd000000-0000-4000-8000-000000000002','⏰ Recordatorio de visita','Tienes una visita en las próximas 24 horas: "Apartamento Vista Río" con Laura Mendoza.','warning',false,'visit','USER','a0000000-0000-4000-8000-000000000004','Beto Ruiz','/viewings'),
  ('dd000000-0000-4000-8000-000000000003','¡Nuevo Contrato Cerrado! 🎉','Se firmó el contrato de venta de "Casa Blanca" por $320.000.000.','success',true,'contract','USER','a0000000-0000-4000-8000-000000000002','Gerente Comercial','/contracts'),
  ('dd000000-0000-4000-8000-000000000004','Tu contrato fue firmado 🎉','Se firmó el contrato de venta de "Casa Blanca". Tu asesora Ana Gómez te contactará.','success',true,'contract','CLIENT','c0000000-0000-4000-8000-000000000001','Camilo Torres',NULL)
ON CONFLICT DO NOTHING;
