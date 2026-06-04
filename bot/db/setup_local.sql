-- One-time local Postgres setup. Run as the postgres superuser:
--   sudo -u postgres psql -f bot/db/setup_local.sql
--
-- Creates the role + database the bot connects to. Safe to re-run:
-- it skips creation if they already exist.

SELECT 'CREATE ROLE drsaab LOGIN PASSWORD ''drsaab_local_pw'''
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'drsaab')\gexec

SELECT 'CREATE DATABASE drsaab OWNER drsaab'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'drsaab')\gexec
