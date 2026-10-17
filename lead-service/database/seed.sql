-- Datos de ejemplo (agent_id referencia usuarios del seed de user-service). Ejecutar DESPUÉS de schema.sql.
INSERT INTO "leads" ("id","name","email","phone","property_id","source","status","agent_id") VALUES
  ('c0000000-0000-4000-8000-000000000001','Camilo Torres','camilo@example.com','3001234567','b0000000-0000-4000-8000-000000000001','Web','Cerrado','a0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000002','Laura Mendoza','laura@example.com','3109876543','b0000000-0000-4000-8000-000000000002','Referido','Visita','a0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000003','Carlos Pérez','carlos@example.com','3205551234','b0000000-0000-4000-8000-000000000003','Redes Sociales','Nuevo','a0000000-0000-4000-8000-000000000003')
ON CONFLICT DO NOTHING;
