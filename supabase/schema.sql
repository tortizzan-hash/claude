-- Vector Mode Legal — Supabase schema
-- Run this in the Supabase SQL editor to initialize the database.
-- All tables use RLS disabled (service key only, no client-side access).

-- ---- Firms ----
create table if not exists firms (
  slug          text primary key,
  name          text not null,
  "practiceAreas" text[] default '{}',
  jurisdiction  text default '',
  "alertWebhook" text default null,
  "notifyEmail"       text default null,
  "pushSubscriptions" jsonb default '[]', -- browser push subscription objects
  crm                 jsonb default null, -- { provider, webhook, apiKey }
  created_at    timestamptz default now()
);

-- ---- Users ----
create table if not exists users (
  id            text primary key,
  email         text unique not null,
  name          text default '',
  "firmSlug"    text not null references firms(slug) on delete cascade,
  "passwordHash" text not null,
  "createdAt"   timestamptz default now()
);

create index if not exists users_firm_idx on users("firmSlug");

-- ---- Leads ----
create table if not exists leads (
  id            text primary key,
  "firmSlug"    text not null references firms(slug) on delete cascade,
  contact       jsonb default '{}',   -- { name, email, phone }
  "practiceArea" text default '',
  location      text default '',
  message       text not null,
  -- LQS scoring
  lqs           numeric(5,1) default 0,
  band          text default 'low',
  label         text default '',
  action        text default '',
  color         text default 'red',
  subscores     jsonb default '{}',   -- { iss, cfs, bis, frs, crs }
  overrides     text[] default '{}',
  "forceReview" boolean default false,
  reasoning     text default '',
  notes         jsonb default '[]',   -- [{ text, createdAt }]
  -- Proof engine
  disposition   text default 'new',   -- new|contacted|booked|signed|dead
  "dispositionAt" timestamptz default null,
  -- Meta
  "createdAt"   timestamptz default now()
);

create index if not exists leads_firm_idx  on leads("firmSlug");
create index if not exists leads_lqs_idx   on leads(lqs desc);
create index if not exists leads_band_idx  on leads(band);
create index if not exists leads_disp_idx  on leads(disposition);

-- ---- RLS: disabled (all access through service key in API routes) ----
alter table firms  disable row level security;
alter table users  disable row level security;
alter table leads  disable row level security;
