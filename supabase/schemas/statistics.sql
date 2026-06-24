-- Statistics table for aggregated metrics.
-- Schema derived from the ThreatXtension SQLite schema (MIT per upstream README; no LICENSE file published upstream).

create table "public"."statistics" (
  "id" bigserial primary key,
  "metric_name" text unique not null,
  "metric_value" integer default 0,
  "updated_at" timestamptz default now()
);

-- Initialize default statistics (matching SQLite defaults)
insert into "public"."statistics" ("metric_name", "metric_value")
values 
  ('total_scans', 0),
  ('high_risk_extensions', 0),
  ('total_files_analyzed', 0),
  ('total_vulnerabilities', 0)
on conflict ("metric_name") do nothing;

