create extension if not exists pgcrypto;

create type enterprise_type as enum ('company', 'public', 'other');
create type family_status as enum (
  'unknown',
  'contacted',
  'interested',
  'not_interested',
  'agreement_reached',
  'hired',
  'do_not_contact'
);
create type interaction_type as enum ('call', 'visit', 'email', 'meeting', 'other');
create type user_role as enum ('admin', 'prospector', 'tutor');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  province text,
  phone text,
  email text,
  is_deleted boolean not null default false,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table enterprises (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  type enterprise_type not null default 'company',
  name text not null,
  normalized_name text not null,
  address text,
  city text,
  province text,
  tax_id text,
  is_deleted boolean not null default false,
  called_at timestamptz,
  visited_at timestamptz,
  last_interaction_at timestamptz,
  last_interaction_type interaction_type,
  last_interaction_by uuid,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  enterprise_id uuid references enterprises(id) on delete set null,
  is_deleted boolean not null default false,
  name text not null,
  position text,
  phone text,
  second_phone text,
  email text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table professional_family (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table ciclo_formativo (
  id uuid primary key default gen_random_uuid(),
  professional_family_id uuid not null references professional_family(id) on delete cascade,
  name text not null,
  source_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_family_id, name)
);

create table autonomous_communities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table provinces (
  id uuid primary key default gen_random_uuid(),
  autonomous_community_id uuid not null references autonomous_communities(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (autonomous_community_id, name)
);

create table fp_centers (
  id uuid primary key default gen_random_uuid(),
  province_id uuid not null references provinces(id) on delete cascade,
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table fp_center_professional_families (
  fp_center_id uuid not null references fp_centers(id) on delete cascade,
  professional_family_id uuid not null references professional_family(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (fp_center_id, professional_family_id)
);

create table interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  enterprise_id uuid references enterprises(id) on delete set null,
  contact_id uuid references contacts(id) on delete cascade,
  ciclo_formativo_id uuid references ciclo_formativo(id) on delete set null,
  type interaction_type not null,
  status family_status not null default 'unknown',
  requested_students integer,
  notes text,
  occurred_at timestamptz not null default now(),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint interactions_requested_students_nonnegative
    check (requested_students is null or requested_students >= 0)
);

create table interaction_targets (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references interactions(id) on delete cascade,
  autonomous_community_id uuid references autonomous_communities(id) on delete set null,
  province_id uuid references provinces(id) on delete set null,
  fp_center_id uuid references fp_centers(id) on delete set null,
  professional_family_id uuid references professional_family(id) on delete set null,
  ciclo_formativo_id uuid references ciclo_formativo(id) on delete set null,
  created_at timestamptz not null default now()
);

create table contacts_professional_families (
  contact_id uuid not null references contacts(id) on delete cascade,
  professional_family_id uuid not null references professional_family(id) on delete cascade,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  primary key (contact_id, professional_family_id)
);

create table enterprise_professional_family_status (
  enterprise_id uuid not null references enterprises(id) on delete cascade,
  professional_family_id uuid not null references professional_family(id) on delete cascade,
  quantity_needed integer,
  quantity_hired integer,
  notes text,
  last_updated_at timestamptz not null default now(),
  last_updated_by uuid,
  primary key (enterprise_id, professional_family_id)
);

create table profiles (
  user_id uuid primary key,
  full_name text,
  role user_role not null default 'prospector',
  professional_family_id uuid references professional_family(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_organizations_not_deleted on organizations (is_deleted);
create index idx_enterprises_not_deleted on enterprises (is_deleted);
create index idx_contacts_not_deleted on contacts (is_deleted);
create index idx_contacts_organization_id on contacts (organization_id);
create index idx_contacts_enterprise_id on contacts (enterprise_id);
create index idx_interactions_contact_id on interactions (contact_id);
create index idx_interactions_status on interactions (status);
create index idx_interactions_occurred_at on interactions (occurred_at desc);
create index idx_interaction_targets_interaction_id on interaction_targets (interaction_id);
create index idx_interaction_targets_family_id on interaction_targets (professional_family_id);
create index idx_interaction_targets_ciclo_id on interaction_targets (ciclo_formativo_id);