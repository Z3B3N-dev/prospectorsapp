# Database Shape Instructions (Supabase)

Last checked: 2026-03-25
Project ref: ydulnbalwhnnyflmrycr
Schema scope: public

Use this file as the default schema context when working on app features, SQL, or migrations.

## 1) Core domain model

- organizations: top-level owner entity.
- enterprises: company/public/other records; belongs to organizations.
- contacts: people linked to enterprises.
- professional_family: catalog of job/professional families.
- contacts_professional_families: contact <-> professional_family bridge (many-to-many).
- ciclo_formativo: catalog of Ciclos Formativos; each ciclo belongs to one professional family.
- enterprise_professional_family_status: enterprise <-> professional_family bridge with hiring metadata.
- interactions: timeline entries (call/visit/email/etc.) linked to organization and/or enterprise, optional contact, and optional ciclo formativo.
- profiles: app user profile keyed by auth user id.

## 2) Table summaries

### organizations
PK:
- id (uuid, default gen_random_uuid())

Main fields:
- name (text, required)
- address, city, province, phone, email (nullable)
- is_deleted (boolean, default false)
- created_by, updated_by (uuid, nullable)
- created_at, updated_at (timestamptz, default now())

### enterprises
PK:
- id (uuid, default gen_random_uuid())

FK:
- organization_id -> organizations.id

Main fields:
- type (enterprise_type, default company)
- name (text, required)
- normalized_name (text, required)
- address, city, province, tax_id (nullable)
- is_deleted (boolean, default false)
- called_at, visited_at, last_interaction_at (nullable timestamptz)
- last_interaction_type (interaction_type, nullable)
- last_interaction_by, created_by, updated_by (uuid, nullable)
- created_at, updated_at (timestamptz, default now())

### contacts
PK:
- id (uuid, default gen_random_uuid())

FK:
- organization_id -> organizations.id (nullable)
- enterprise_id -> enterprises.id (nullable)

Main fields:
- is_deleted (boolean, default false)
- name (text, required)
- position, phone, email (nullable)
- organization_id, enterprise_id (nullable)
- created_by, updated_by (uuid, nullable)
- created_at, updated_at (timestamptz, default now())

### interactions
PK:
- id (uuid, default gen_random_uuid())

FK:
- organization_id -> organizations.id (nullable)
- enterprise_id -> enterprises.id (nullable)
- contact_id -> contacts.id (nullable)
- ciclo_formativo_id -> ciclo_formativo.id (nullable)

Main fields:
- type (interaction_type, required)
- status (family_status, default unknown)
- requested_students (integer, nullable)
- organization_id, enterprise_id (nullable)
- notes (text, nullable)
- occurred_at (timestamptz, default now())
- user_id (uuid, required)
- created_at (timestamptz, default now())

### ciclo_formativo
PK:
- id (uuid, default gen_random_uuid())

FK:
- professional_family_id -> professional_family.id

Unique:
- (professional_family_id, name)

Main fields:
- name (text, required)
- source_url (text, nullable)
- is_active (boolean, default true)
- created_at, updated_at (timestamptz, default now())

### professional_family
PK:
- id (uuid, default gen_random_uuid())

Unique:
- code

Main fields:
- code (text, required)
- name (text, required)

### contacts_professional_families
PK (composite):
- contact_id
- professional_family_id

FK:
- contact_id -> contacts.id
- professional_family_id -> professional_family.id

Main fields:
- is_primary (boolean, default false)
- notes (text, nullable)
- created_at (timestamptz, default now())

### enterprise_professional_family_status
PK (composite):
- enterprise_id
- professional_family_id

FK:
- enterprise_id -> enterprises.id
- professional_family_id -> professional_family.id

Main fields:
- quantity_needed, quantity_hired (integer, nullable)
- notes (text, nullable)
- last_updated_at (timestamptz, default now())
- last_updated_by (uuid, nullable)

### profiles
PK:
- user_id (uuid)

Main fields:
- full_name (text, nullable)
- role (user_role, default prospector)
- professional_family_id (uuid, nullable, fk -> professional_family.id)
- created_at, updated_at (timestamptz, default now())

## 3) Enum values

- enterprise_type: company, public, other
- family_status: unknown, contacted, interested, not_interested, agreement_reached, hired, do_not_contact
- interaction_type: call, visit, email, meeting, other
- user_role: admin, prospector, tutor

## 4) Relationship map

- organizations 1 -> N enterprises
- organizations 1 -> N contacts (optional direct link)
- enterprises 0..1 -> N contacts
- organizations 0..1 -> N interactions
- enterprises 0..1 -> N interactions
- contacts 0..1 -> N interactions (via nullable interactions.contact_id)
- contacts N <-> N professional_family (contacts_professional_families)
- professional_family 1 -> N ciclo_formativo
- enterprises N <-> N professional_family (enterprise_professional_family_status)
- profiles 1 -> 1 auth user (profiles.user_id)

## 5) Query defaults for app work

When writing feature queries, assume:
- Soft-delete filtering is required where is_deleted exists.
- Time columns are UTC timestamptz.
- Prefer joining through bridge tables instead of duplicating family/status fields.

Recommended baseline filters:
- organizations.is_deleted = false
- enterprises.is_deleted = false
- contacts.is_deleted = false

## 6) Security snapshot

- RLS policies found in public schema: none (as of snapshot date).
- Re-check before shipping auth-sensitive features.

## 7) How to keep this file current

Run these checks against Supabase and update this file when schema changes:
- information_schema.tables (public base tables)
- information_schema.columns
- information_schema.table_constraints + key_column_usage + constraint_column_usage
- pg_type/pg_enum for enums
- pg_policies for RLS status
