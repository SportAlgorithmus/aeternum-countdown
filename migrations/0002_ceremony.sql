create table if not exists ceremony_settings (
  id integer primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
