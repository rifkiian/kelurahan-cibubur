DO $do$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app') THEN
    CREATE ROLE app LOGIN PASSWORD 'app';
  END IF;

  ALTER ROLE app CREATEDB;
END
$do$;

SELECT format('CREATE DATABASE %I OWNER %I', 'cibubur_connect', 'app')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cibubur_connect');
\gexec
