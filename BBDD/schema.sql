--
-- PostgreSQL database dump
--


\restrict odSuSNg2cykfcMLKLB0aV7T1zd3GfJXQeDHghgYU4m5I6PQll1bqk8hXClSOtfD


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--


CREATE SCHEMA public;




--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--


COMMENT ON SCHEMA public IS 'standard public schema';




--
-- Name: enterprise_type; Type: TYPE; Schema: public; Owner: -
--


CREATE TYPE public.enterprise_type AS ENUM (
   'company',
   'public',
   'other'
);




--
-- Name: family_status; Type: TYPE; Schema: public; Owner: -
--


CREATE TYPE public.family_status AS ENUM (
   'unknown',
   'contacted',
   'interested',
   'not_interested',
   'agreement_reached',
   'hired',
   'do_not_contact'
);




--
-- Name: interaction_type; Type: TYPE; Schema: public; Owner: -
--


CREATE TYPE public.interaction_type AS ENUM (
   'call',
   'visit',
   'email',
   'meeting',
   'other'
);




--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--


CREATE TYPE public.user_role AS ENUM (
   'admin',
   'prospector',
   'tutor'
);




--
-- Name: enforce_contact_enterprise_organization_consistency(); Type: FUNCTION; Schema: public; Owner: -
--


CREATE FUNCTION public.enforce_contact_enterprise_organization_consistency() RETURNS trigger
   LANGUAGE plpgsql
   AS $$
declare
 enterprise_org_id uuid;
begin
 if new.enterprise_id is not null then
   select e.organization_id
     into enterprise_org_id
   from public.enterprises e
   where e.id = new.enterprise_id
     and coalesce(e.is_deleted, false) = false
   limit 1;


   if not found then
     raise exception 'Selected enterprise does not exist or is deleted.';
   end if;


   if new.organization_id is distinct from enterprise_org_id then
     raise exception 'organization_id must match the parent organization of the selected enterprise.';
   end if;
 end if;


 return new;
end;
$$;




--
-- Name: enforce_interaction_scope_consistency(); Type: FUNCTION; Schema: public; Owner: -
--


CREATE FUNCTION public.enforce_interaction_scope_consistency() RETURNS trigger
   LANGUAGE plpgsql
   AS $$
declare
 enterprise_org_id uuid;
 enterprise_is_deleted boolean;
 contact_org_id uuid;
 contact_enterprise_id uuid;
begin
 if new.enterprise_id is not null then
   select e.organization_id, coalesce(e.is_deleted, false)
     into enterprise_org_id, enterprise_is_deleted
   from public.enterprises e
   where e.id = new.enterprise_id
   limit 1;


   if not found or enterprise_is_deleted then
     raise exception 'Selected enterprise does not exist or is deleted.';
   end if;


   if new.organization_id is distinct from enterprise_org_id then
     raise exception 'organization_id must match the parent organization of the selected enterprise.';
   end if;
 end if;


 if new.contact_id is not null then
   select c.organization_id, c.enterprise_id
     into contact_org_id, contact_enterprise_id
   from public.contacts c
   where c.id = new.contact_id
     and coalesce(c.is_deleted, false) = false
   limit 1;


   if not found then
     raise exception 'Selected contact does not exist or is deleted.';
   end if;


   if new.organization_id is distinct from contact_org_id then
     raise exception 'interaction organization_id must match contact organization_id.';
   end if;


   if new.enterprise_id is distinct from contact_enterprise_id then
     raise exception 'interaction enterprise_id must match contact enterprise_id.';
   end if;
 end if;


 return new;
end;
$$;




--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--


CREATE FUNCTION public.handle_new_user() RETURNS trigger
   LANGUAGE plpgsql SECURITY DEFINER
   AS $$
begin
 insert into public.profiles (user_id, full_name, role)
 values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'prospector')
 on conflict (user_id) do nothing;
 return new;
end;
$$;




--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--


CREATE FUNCTION public.is_admin() RETURNS boolean
   LANGUAGE sql STABLE
   AS $$
 select exists (
   select 1
   from public.profiles p
   where p.user_id = auth.uid()
     and p.role = 'admin'
 );
$$;




--
-- Name: normalize_text(text); Type: FUNCTION; Schema: public; Owner: -
--


CREATE FUNCTION public.normalize_text(input text) RETURNS text
   LANGUAGE plpgsql IMMUTABLE
   AS $$
begin
 if input is null then return '';
 end if;
 return trim(regexp_replace(lower(input), '\s+', ' ', 'g'));
end;
$$;




--
-- Name: prevent_soft_delete_by_non_admin(); Type: FUNCTION; Schema: public; Owner: -
--


CREATE FUNCTION public.prevent_soft_delete_by_non_admin() RETURNS trigger
   LANGUAGE plpgsql
   AS $$
begin
 if new.is_deleted is distinct from old.is_deleted then
   if not public.is_admin() then
     raise exception 'Only admins can change is_deleted';
   end if;
 end if;
 return new;
end;
$$;




--
-- Name: seed_enterprise_family_status(); Type: FUNCTION; Schema: public; Owner: -
--


CREATE FUNCTION public.seed_enterprise_family_status() RETURNS trigger
   LANGUAGE plpgsql
   AS $$
begin
 insert into public.enterprise_professional_family_status (
   enterprise_id,
   professional_family_id,
   quantity_needed,
   quantity_hired,
   notes,
   last_updated_at,
   last_updated_by
 )
 select
   new.id,
   pf.id,
   null,
   null,
   null,
   now(),
   new.created_by
 from public.professional_family pf
 on conflict (enterprise_id, professional_family_id) do nothing;


 return new;
end;
$$;




--
-- Name: set_enterprise_normalized_name(); Type: FUNCTION; Schema: public; Owner: -
--


CREATE FUNCTION public.set_enterprise_normalized_name() RETURNS trigger
   LANGUAGE plpgsql
   AS $$
begin
 new.normalized_name = public.normalize_text(new.name);
 return new;
end;
$$;




--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--


CREATE FUNCTION public.set_updated_at() RETURNS trigger
   LANGUAGE plpgsql
   AS $$
begin
 new.updated_at = now();
 return new;
end;
$$;




--
-- Name: update_enterprise_on_interaction_insert(); Type: FUNCTION; Schema: public; Owner: -
--


CREATE FUNCTION public.update_enterprise_on_interaction_insert() RETURNS trigger
   LANGUAGE plpgsql
   AS $$
declare
 should_update_last boolean;
begin
 should_update_last := (
   select (e.last_interaction_at is null or new.occurred_at >= e.last_interaction_at)
   from public.enterprises e
   where e.id = new.enterprise_id
 );


 if should_update_last then
   update public.enterprises
   set
     last_interaction_at = new.occurred_at,
     last_interaction_type = new.type,
     last_interaction_by = new.user_id
   where id = new.enterprise_id;
 end if;


 if new.type = 'call' then
   update public.enterprises
   set called_at = coalesce(called_at, new.occurred_at)
   where id = new.enterprise_id;
 elsif new.type = 'visit' then
   update public.enterprises
   set visited_at = coalesce(visited_at, new.occurred_at)
   where id = new.enterprise_id;
 end if;


 return new;
end;
$$;




SET default_tablespace = '';


SET default_table_access_method = heap;


--
-- Name: autonomous_communities; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.autonomous_communities (
   id uuid DEFAULT gen_random_uuid() NOT NULL,
   code text NOT NULL,
   name text NOT NULL,
   created_at timestamp with time zone DEFAULT now() NOT NULL,
   updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: ciclo_formativo; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.ciclo_formativo (
   id uuid DEFAULT gen_random_uuid() NOT NULL,
   professional_family_id uuid NOT NULL,
   name text NOT NULL,
   source_url text,
   is_active boolean DEFAULT true NOT NULL,
   created_at timestamp with time zone DEFAULT now() NOT NULL,
   updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.contacts (
   id uuid DEFAULT gen_random_uuid() NOT NULL,
   enterprise_id uuid,
   is_deleted boolean DEFAULT false NOT NULL,
   name text NOT NULL,
   "position" text,
   phone text,
   email text,
   created_by uuid,
   updated_by uuid,
   created_at timestamp with time zone DEFAULT now() NOT NULL,
   updated_at timestamp with time zone DEFAULT now() NOT NULL,
   organization_id uuid,
   second_phone text
);




--
-- Name: contacts_professional_families; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.contacts_professional_families (
   contact_id uuid NOT NULL,
   professional_family_id uuid NOT NULL,
   is_primary boolean DEFAULT false NOT NULL,
   notes text,
   created_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: enterprise_professional_family_status; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.enterprise_professional_family_status (
   enterprise_id uuid NOT NULL,
   professional_family_id uuid NOT NULL,
   quantity_needed integer,
   quantity_hired integer,
   notes text,
   last_updated_at timestamp with time zone DEFAULT now() NOT NULL,
   last_updated_by uuid,
   CONSTRAINT qty_hired_nonnegative CHECK (((quantity_hired IS NULL) OR (quantity_hired >= 0))),
   CONSTRAINT qty_needed_nonnegative CHECK (((quantity_needed IS NULL) OR (quantity_needed >= 0)))
);




--
-- Name: enterprises; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.enterprises (
   id uuid DEFAULT gen_random_uuid() NOT NULL,
   organization_id uuid,
   type public.enterprise_type DEFAULT 'company'::public.enterprise_type NOT NULL,
   name text NOT NULL,
   normalized_name text NOT NULL,
   address text,
   city text,
   province text,
   tax_id text,
   is_deleted boolean DEFAULT false NOT NULL,
   called_at timestamp with time zone,
   visited_at timestamp with time zone,
   last_interaction_at timestamp with time zone,
   last_interaction_type public.interaction_type,
   last_interaction_by uuid,
   created_by uuid,
   updated_by uuid,
   created_at timestamp with time zone DEFAULT now() NOT NULL,
   updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: fp_center_professional_families; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.fp_center_professional_families (
   fp_center_id uuid NOT NULL,
   professional_family_id uuid NOT NULL,
   created_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: fp_centers; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.fp_centers (
   id uuid DEFAULT gen_random_uuid() NOT NULL,
   code text NOT NULL,
   name text NOT NULL,
   short_type text,
   center_type text,
   ownership text,
   concert_status text,
   municipality text,
   locality text,
   island text,
   address text,
   postal_code text,
   province_id uuid NOT NULL,
   website text,
   phones jsonb DEFAULT '[]'::jsonb NOT NULL,
   emails jsonb DEFAULT '[]'::jsonb NOT NULL,
   fp_program_count integer,
   fp_studies_count integer,
   is_active boolean DEFAULT true NOT NULL,
   created_at timestamp with time zone DEFAULT now() NOT NULL,
   updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: interaction_targets; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.interaction_targets (
   id uuid DEFAULT gen_random_uuid() NOT NULL,
   interaction_id uuid NOT NULL,
   professional_family_id uuid,
   ciclo_formativo_id uuid,
   created_at timestamp with time zone DEFAULT now() NOT NULL,
   autonomous_community_id uuid,
   province_id uuid,
   fp_center_id uuid
);




--
-- Name: interactions; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.interactions (
   id uuid DEFAULT gen_random_uuid() NOT NULL,
   enterprise_id uuid,
   contact_id uuid,
   type public.interaction_type NOT NULL,
   notes text,
   occurred_at timestamp with time zone DEFAULT now() NOT NULL,
   user_id uuid,
   created_at timestamp with time zone DEFAULT now() NOT NULL,
   ciclo_formativo_id uuid,
   status public.family_status DEFAULT 'unknown'::public.family_status NOT NULL,
   requested_students integer,
   organization_id uuid,
   CONSTRAINT interactions_requested_students_non_negative CHECK (((requested_students IS NULL) OR (requested_students >= 0)))
);




--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.organizations (
   id uuid DEFAULT gen_random_uuid() NOT NULL,
   name text NOT NULL,
   address text,
   city text,
   province text,
   phone text,
   email text,
   is_deleted boolean DEFAULT false NOT NULL,
   created_by uuid,
   updated_by uuid,
   created_at timestamp with time zone DEFAULT now() NOT NULL,
   updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: professional_family; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.professional_family (
   id uuid DEFAULT gen_random_uuid() NOT NULL,
   code text NOT NULL,
   name text NOT NULL
);




--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.profiles (
   user_id uuid NOT NULL,
   full_name text,
   role public.user_role DEFAULT 'prospector'::public.user_role NOT NULL,
   created_at timestamp with time zone DEFAULT now() NOT NULL,
   updated_at timestamp with time zone DEFAULT now() NOT NULL,
   professional_family_id uuid
);




--
-- Name: provinces; Type: TABLE; Schema: public; Owner: -
--


CREATE TABLE public.provinces (
   id uuid DEFAULT gen_random_uuid() NOT NULL,
   autonomous_community_id uuid NOT NULL,
   code text,
   name text NOT NULL,
   created_at timestamp with time zone DEFAULT now() NOT NULL,
   updated_at timestamp with time zone DEFAULT now() NOT NULL
);




--
-- Name: autonomous_communities autonomous_communities_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.autonomous_communities
   ADD CONSTRAINT autonomous_communities_code_key UNIQUE (code);




--
-- Name: autonomous_communities autonomous_communities_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.autonomous_communities
   ADD CONSTRAINT autonomous_communities_name_key UNIQUE (name);




--
-- Name: autonomous_communities autonomous_communities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.autonomous_communities
   ADD CONSTRAINT autonomous_communities_pkey PRIMARY KEY (id);




--
-- Name: ciclo_formativo ciclo_formativo_family_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.ciclo_formativo
   ADD CONSTRAINT ciclo_formativo_family_name_key UNIQUE (professional_family_id, name);




--
-- Name: ciclo_formativo ciclo_formativo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.ciclo_formativo
   ADD CONSTRAINT ciclo_formativo_pkey PRIMARY KEY (id);




--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.contacts
   ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);




--
-- Name: contacts_professional_families contacts_professional_families_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.contacts_professional_families
   ADD CONSTRAINT contacts_professional_families_pkey PRIMARY KEY (contact_id, professional_family_id);




--
-- Name: enterprise_professional_family_status enterprise_professional_family_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.enterprise_professional_family_status
   ADD CONSTRAINT enterprise_professional_family_status_pkey PRIMARY KEY (enterprise_id, professional_family_id);




--
-- Name: enterprises enterprises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.enterprises
   ADD CONSTRAINT enterprises_pkey PRIMARY KEY (id);




--
-- Name: fp_center_professional_families fp_center_professional_families_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.fp_center_professional_families
   ADD CONSTRAINT fp_center_professional_families_pkey PRIMARY KEY (fp_center_id, professional_family_id);




--
-- Name: fp_centers fp_centers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.fp_centers
   ADD CONSTRAINT fp_centers_code_key UNIQUE (code);




--
-- Name: fp_centers fp_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.fp_centers
   ADD CONSTRAINT fp_centers_pkey PRIMARY KEY (id);




--
-- Name: interaction_targets interaction_targets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interaction_targets
   ADD CONSTRAINT interaction_targets_pkey PRIMARY KEY (id);




--
-- Name: interaction_targets interaction_targets_unique_row; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interaction_targets
   ADD CONSTRAINT interaction_targets_unique_row UNIQUE (interaction_id, professional_family_id, ciclo_formativo_id, autonomous_community_id, province_id, fp_center_id);




--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interactions
   ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);




--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.organizations
   ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);




--
-- Name: professional_family professional_family_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.professional_family
   ADD CONSTRAINT professional_family_code_key UNIQUE (code);




--
-- Name: professional_family professional_family_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.professional_family
   ADD CONSTRAINT professional_family_pkey PRIMARY KEY (id);




--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.profiles
   ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);




--
-- Name: provinces provinces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.provinces
   ADD CONSTRAINT provinces_pkey PRIMARY KEY (id);




--
-- Name: provinces provinces_unique_name_per_community; Type: CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.provinces
   ADD CONSTRAINT provinces_unique_name_per_community UNIQUE (autonomous_community_id, name);




--
-- Name: ciclo_formativo_family_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX ciclo_formativo_family_idx ON public.ciclo_formativo USING btree (professional_family_id);




--
-- Name: ciclo_formativo_professional_family_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX ciclo_formativo_professional_family_id_idx ON public.ciclo_formativo USING btree (professional_family_id);




--
-- Name: contacts_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX contacts_organization_id_idx ON public.contacts USING btree (organization_id);




--
-- Name: fp_center_professional_families_family_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX fp_center_professional_families_family_id_idx ON public.fp_center_professional_families USING btree (professional_family_id);




--
-- Name: fp_centers_island_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX fp_centers_island_idx ON public.fp_centers USING btree (island);




--
-- Name: fp_centers_municipality_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX fp_centers_municipality_idx ON public.fp_centers USING btree (municipality);




--
-- Name: fp_centers_province_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX fp_centers_province_id_idx ON public.fp_centers USING btree (province_id);




--
-- Name: idx_cpf_family; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX idx_cpf_family ON public.contacts_professional_families USING btree (professional_family_id);




--
-- Name: idx_enterprises_city; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX idx_enterprises_city ON public.enterprises USING btree (city);




--
-- Name: idx_enterprises_last_interaction_at; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX idx_enterprises_last_interaction_at ON public.enterprises USING btree (last_interaction_at DESC);




--
-- Name: idx_enterprises_normalized_name; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX idx_enterprises_normalized_name ON public.enterprises USING btree (normalized_name);




--
-- Name: idx_epfs_enterprise; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX idx_epfs_enterprise ON public.enterprise_professional_family_status USING btree (enterprise_id);




--
-- Name: idx_interactions_enterprise_time; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX idx_interactions_enterprise_time ON public.interactions USING btree (enterprise_id, occurred_at DESC);




--
-- Name: interaction_targets_autonomous_community_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX interaction_targets_autonomous_community_id_idx ON public.interaction_targets USING btree (autonomous_community_id);




--
-- Name: interaction_targets_ciclo_formativo_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX interaction_targets_ciclo_formativo_id_idx ON public.interaction_targets USING btree (ciclo_formativo_id);




--
-- Name: interaction_targets_fp_center_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX interaction_targets_fp_center_id_idx ON public.interaction_targets USING btree (fp_center_id);




--
-- Name: interaction_targets_interaction_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX interaction_targets_interaction_id_idx ON public.interaction_targets USING btree (interaction_id);




--
-- Name: interaction_targets_professional_family_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX interaction_targets_professional_family_id_idx ON public.interaction_targets USING btree (professional_family_id);




--
-- Name: interaction_targets_province_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX interaction_targets_province_id_idx ON public.interaction_targets USING btree (province_id);




--
-- Name: interactions_ciclo_formativo_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX interactions_ciclo_formativo_id_idx ON public.interactions USING btree (ciclo_formativo_id);




--
-- Name: interactions_contact_id_occurred_at_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX interactions_contact_id_occurred_at_idx ON public.interactions USING btree (contact_id, occurred_at DESC);




--
-- Name: interactions_contact_status_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX interactions_contact_status_idx ON public.interactions USING btree (contact_id, status);




--
-- Name: interactions_organization_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX interactions_organization_id_idx ON public.interactions USING btree (organization_id);




--
-- Name: profiles_professional_family_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX profiles_professional_family_id_idx ON public.profiles USING btree (professional_family_id);




--
-- Name: provinces_autonomous_community_id_idx; Type: INDEX; Schema: public; Owner: -
--


CREATE INDEX provinces_autonomous_community_id_idx ON public.provinces USING btree (autonomous_community_id);




--
-- Name: uq_enterprises_tax_id_active; Type: INDEX; Schema: public; Owner: -
--


CREATE UNIQUE INDEX uq_enterprises_tax_id_active ON public.enterprises USING btree (tax_id) WHERE ((tax_id IS NOT NULL) AND (is_deleted = false));




--
-- Name: contacts contacts_consistency_trg; Type: TRIGGER; Schema: public; Owner: -
--


CREATE TRIGGER contacts_consistency_trg BEFORE INSERT OR UPDATE OF organization_id, enterprise_id ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.enforce_contact_enterprise_organization_consistency();




--
-- Name: interactions interactions_scope_consistency_trg; Type: TRIGGER; Schema: public; Owner: -
--


CREATE TRIGGER interactions_scope_consistency_trg BEFORE INSERT OR UPDATE OF organization_id, enterprise_id, contact_id ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.enforce_interaction_scope_consistency();




--
-- Name: contacts trg_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--


CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();




--
-- Name: enterprises trg_enterprises_normalize_name; Type: TRIGGER; Schema: public; Owner: -
--


CREATE TRIGGER trg_enterprises_normalize_name BEFORE INSERT OR UPDATE OF name ON public.enterprises FOR EACH ROW EXECUTE FUNCTION public.set_enterprise_normalized_name();




--
-- Name: enterprises trg_enterprises_soft_delete_guard; Type: TRIGGER; Schema: public; Owner: -
--


CREATE TRIGGER trg_enterprises_soft_delete_guard BEFORE UPDATE ON public.enterprises FOR EACH ROW EXECUTE FUNCTION public.prevent_soft_delete_by_non_admin();




--
-- Name: enterprises trg_enterprises_updated_at; Type: TRIGGER; Schema: public; Owner: -
--


CREATE TRIGGER trg_enterprises_updated_at BEFORE UPDATE ON public.enterprises FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();




--
-- Name: organizations trg_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--


CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();




--
-- Name: profiles trg_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--


CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();




--
-- Name: enterprises trg_seed_enterprise_family_status; Type: TRIGGER; Schema: public; Owner: -
--


CREATE TRIGGER trg_seed_enterprise_family_status AFTER INSERT ON public.enterprises FOR EACH ROW EXECUTE FUNCTION public.seed_enterprise_family_status();




--
-- Name: interactions trg_update_enterprise_on_interaction_insert; Type: TRIGGER; Schema: public; Owner: -
--


CREATE TRIGGER trg_update_enterprise_on_interaction_insert AFTER INSERT ON public.interactions FOR EACH ROW EXECUTE FUNCTION public.update_enterprise_on_interaction_insert();




--
-- Name: ciclo_formativo ciclo_formativo_professional_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.ciclo_formativo
   ADD CONSTRAINT ciclo_formativo_professional_family_id_fkey FOREIGN KEY (professional_family_id) REFERENCES public.professional_family(id) ON DELETE CASCADE;




--
-- Name: contacts contacts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.contacts
   ADD CONSTRAINT contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;




--
-- Name: contacts contacts_enterprise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.contacts
   ADD CONSTRAINT contacts_enterprise_id_fkey FOREIGN KEY (enterprise_id) REFERENCES public.enterprises(id) ON DELETE CASCADE;




--
-- Name: contacts contacts_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.contacts
   ADD CONSTRAINT contacts_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;




--
-- Name: contacts_professional_families contacts_professional_families_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.contacts_professional_families
   ADD CONSTRAINT contacts_professional_families_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;




--
-- Name: contacts_professional_families contacts_professional_families_professional_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.contacts_professional_families
   ADD CONSTRAINT contacts_professional_families_professional_family_id_fkey FOREIGN KEY (professional_family_id) REFERENCES public.professional_family(id) ON DELETE RESTRICT;




--
-- Name: contacts contacts_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.contacts
   ADD CONSTRAINT contacts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;




--
-- Name: enterprise_professional_family_status enterprise_professional_family_stat_professional_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.enterprise_professional_family_status
   ADD CONSTRAINT enterprise_professional_family_stat_professional_family_id_fkey FOREIGN KEY (professional_family_id) REFERENCES public.professional_family(id) ON DELETE RESTRICT;




--
-- Name: enterprise_professional_family_status enterprise_professional_family_status_enterprise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.enterprise_professional_family_status
   ADD CONSTRAINT enterprise_professional_family_status_enterprise_id_fkey FOREIGN KEY (enterprise_id) REFERENCES public.enterprises(id) ON DELETE CASCADE;




--
-- Name: enterprise_professional_family_status enterprise_professional_family_status_last_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.enterprise_professional_family_status
   ADD CONSTRAINT enterprise_professional_family_status_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;




--
-- Name: enterprises enterprises_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.enterprises
   ADD CONSTRAINT enterprises_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;




--
-- Name: enterprises enterprises_last_interaction_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.enterprises
   ADD CONSTRAINT enterprises_last_interaction_by_fkey FOREIGN KEY (last_interaction_by) REFERENCES auth.users(id) ON DELETE SET NULL;




--
-- Name: enterprises enterprises_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.enterprises
   ADD CONSTRAINT enterprises_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;




--
-- Name: enterprises enterprises_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.enterprises
   ADD CONSTRAINT enterprises_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;




--
-- Name: fp_center_professional_families fp_center_professional_families_fp_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.fp_center_professional_families
   ADD CONSTRAINT fp_center_professional_families_fp_center_id_fkey FOREIGN KEY (fp_center_id) REFERENCES public.fp_centers(id) ON DELETE CASCADE;




--
-- Name: fp_center_professional_families fp_center_professional_families_professional_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.fp_center_professional_families
   ADD CONSTRAINT fp_center_professional_families_professional_family_id_fkey FOREIGN KEY (professional_family_id) REFERENCES public.professional_family(id) ON DELETE CASCADE;




--
-- Name: fp_centers fp_centers_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.fp_centers
   ADD CONSTRAINT fp_centers_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE RESTRICT;




--
-- Name: interaction_targets interaction_targets_autonomous_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interaction_targets
   ADD CONSTRAINT interaction_targets_autonomous_community_id_fkey FOREIGN KEY (autonomous_community_id) REFERENCES public.autonomous_communities(id) ON DELETE SET NULL;




--
-- Name: interaction_targets interaction_targets_ciclo_formativo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interaction_targets
   ADD CONSTRAINT interaction_targets_ciclo_formativo_id_fkey FOREIGN KEY (ciclo_formativo_id) REFERENCES public.ciclo_formativo(id) ON DELETE SET NULL;




--
-- Name: interaction_targets interaction_targets_fp_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interaction_targets
   ADD CONSTRAINT interaction_targets_fp_center_id_fkey FOREIGN KEY (fp_center_id) REFERENCES public.fp_centers(id) ON DELETE SET NULL;




--
-- Name: interaction_targets interaction_targets_interaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interaction_targets
   ADD CONSTRAINT interaction_targets_interaction_id_fkey FOREIGN KEY (interaction_id) REFERENCES public.interactions(id) ON DELETE CASCADE;




--
-- Name: interaction_targets interaction_targets_professional_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interaction_targets
   ADD CONSTRAINT interaction_targets_professional_family_id_fkey FOREIGN KEY (professional_family_id) REFERENCES public.professional_family(id) ON DELETE SET NULL;




--
-- Name: interaction_targets interaction_targets_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interaction_targets
   ADD CONSTRAINT interaction_targets_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id) ON DELETE SET NULL;




--
-- Name: interactions interactions_ciclo_formativo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interactions
   ADD CONSTRAINT interactions_ciclo_formativo_id_fkey FOREIGN KEY (ciclo_formativo_id) REFERENCES public.ciclo_formativo(id) ON DELETE SET NULL;




--
-- Name: interactions interactions_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interactions
   ADD CONSTRAINT interactions_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;




--
-- Name: interactions interactions_enterprise_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interactions
   ADD CONSTRAINT interactions_enterprise_id_fkey FOREIGN KEY (enterprise_id) REFERENCES public.enterprises(id) ON DELETE CASCADE;




--
-- Name: interactions interactions_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.interactions
   ADD CONSTRAINT interactions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE SET NULL;




--
-- Name: organizations organizations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.organizations
   ADD CONSTRAINT organizations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;




--
-- Name: organizations organizations_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.organizations
   ADD CONSTRAINT organizations_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;




--
-- Name: profiles profiles_professional_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.profiles
   ADD CONSTRAINT profiles_professional_family_id_fkey FOREIGN KEY (professional_family_id) REFERENCES public.professional_family(id) ON DELETE SET NULL;




--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.profiles
   ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;




--
-- Name: provinces provinces_autonomous_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--


ALTER TABLE ONLY public.provinces
   ADD CONSTRAINT provinces_autonomous_community_id_fkey FOREIGN KEY (autonomous_community_id) REFERENCES public.autonomous_communities(id) ON DELETE CASCADE;




--
-- PostgreSQL database dump complete
--


\unrestrict odSuSNg2cykfcMLKLB0aV7T1zd3GfJXQeDHghgYU4m5I6PQll1bqk8hXClSOtfD
