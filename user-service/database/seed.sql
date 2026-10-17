-- Datos de ejemplo (contraseña de las cuentas demo: 123456). Ejecutar DESPUÉS de schema.sql.
INSERT INTO "offices" ("id","name","region") VALUES
  ('oficina-central','Sede Principal','Montería'),
  ('oficina-cerete','Sede Cereté','Cereté')
ON CONFLICT DO NOTHING;

INSERT INTO "users" ("id","office_id","name","email","password","role","active") VALUES
  ('a0000000-0000-4000-8000-000000000001','oficina-central','Administrador Sistema','admin@realtyhub.com','123456','ADMIN',true),
  ('a0000000-0000-4000-8000-000000000002','oficina-central','Gerente Comercial','gerente@realtyhub.com','123456','GERENTE',true),
  ('a0000000-0000-4000-8000-000000000003','oficina-central','Ana Gómez','ana@realtyhub.com','123456','AGENTE',true),
  ('a0000000-0000-4000-8000-000000000004','oficina-cerete','Beto Ruiz','beto@realtyhub.com','123456','AGENTE',true)
ON CONFLICT DO NOTHING;
